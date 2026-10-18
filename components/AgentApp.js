'use client';
// The whole app: chat on the left, graph in the middle, details + evidence on the right.
// Flow: you ask -> useChat POSTs to /api/chat -> the agent calls tools -> each tool result arrives
// as a "tool-<name>" part on the message -> we collect those parts to light up the graph and fill
// the evidence panel. Each question starts a fresh chat (no earlier context), and every finished
// question is saved to this browser's history so it can be opened again from the history panel.
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import DetailsPanel from '@/components/DetailsPanel';
import Logo from '@/components/Logo';
import { COLORS } from '@/lib/colors';
import { loadHistory, newEntryId, questionOf, saveHistory } from '@/lib/chat-history';

// Link shown when the AI quota runs out. Set NEXT_PUBLIC_DEMO_VIDEO_URL on the deployment.
const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL;

// The canvas library needs the browser's window, so never render it on the server.
const GraphView = dynamic(() => import('@/components/GraphView'), { ssr: false });

const EXAMPLES = [
  'What breaks if payments-service goes down?',
  'Who should I contact about checkout-service?',
  'Which services are our biggest single points of failure?',
  'How does web-app depend on user-db?',
  'Has api-gateway had incidents before?',
  'ledger-db is out of disk. Open a SEV1 incident and tell me who to notify.',
];

const MAX_QUESTION_LENGTH = 500; // same limit as app/api/chat/route.js, which enforces it

const EMPTY_HIGHLIGHT = { nodes: new Set(), links: new Set(), focus: null };
const linkKey = (l) => `${l.source}|${l.type}|${l.target}`;

// Tool parts of one message, turned into evidence entries.
function toolCalls(message) {
  return message.parts
    .filter((p) => p.type.startsWith('tool-'))
    .map((p) => ({
      key: p.toolCallId,
      tool: p.type.slice(5),
      state: p.state,
      input: p.input,
      output: p.state === 'output-available' ? p.output : undefined,
      error: p.state === 'output-error' ? p.errorText : undefined,
    }));
}

// Very small formatter for the agent's answers: "- " bullets and **bold**.
function Formatted({ text }) {
  const bold = (line) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
      chunk.startsWith('**') && chunk.endsWith('**') ? <strong key={i}>{chunk.slice(2, -2)}</strong> : chunk,
    );
  return (
    <div className="space-y-1">
      {text.split('\n').filter((l) => l.trim()).map((line, i) => {
        const bullet = line.match(/^\s*[-*]\s+(.*)/);
        return bullet
          ? <div key={i} className="flex gap-2 pl-1"><span className="text-slate-500">•</span><span>{bold(bullet[1])}</span></div>
          : <p key={i}>{bold(line)}</p>;
      })}
    </div>
  );
}

export default function AgentApp() {
  const { messages, setMessages, sendMessage, status, error, clearError } = useChat();
  const [input, setInput] = useState('');
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [graphError, setGraphError] = useState(null);
  const [graphLoaded, setGraphLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pinnedMessageId, setPinnedMessageId] = useState(null);
  const [viewReset, setViewReset] = useState(false); // true: show the plain full graph, no highlight
  const [fitKey, setFitKey] = useState(0);
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(null); // { id, createdAt } of the question on screen
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const busy = status === 'submitted' || status === 'streaming';

  // History lives in localStorage, which only exists in the browser: read it after mount, then
  // write it back on every change (never before the read, or the empty initial list would win).
  useEffect(() => {
    setHistory(loadHistory());
    setHistoryLoaded(true);
  }, []);
  useEffect(() => { if (historyLoaded) saveHistory(history); }, [history, historyLoaded]);

  // Once an answer has finished (or failed), store it under the current entry. New entries go first.
  useEffect(() => {
    if (busy || !current || !messages.length) return;
    setHistory((prev) =>
      prev.some((e) => e.id === current.id)
        ? prev.map((e) => (e.id === current.id ? { ...e, messages } : e))
        : [{ ...current, question: questionOf(messages), messages }, ...prev],
    );
  }, [busy, messages, current]);

  async function loadGraph() {
    try {
      const res = await fetch('/api/graph', { cache: 'no-store' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setGraph(json);
      setGraphError(null);
      setGraphLoaded(true);
    } catch (err) {
      setGraphError(err.message);
    }
  }
  useEffect(() => { loadGraph(); }, []);

  // Which answer the graph shows: the one you clicked, otherwise the latest answer.
  const assistantMessages = messages.filter((m) => m.role === 'assistant');
  const shown =
    assistantMessages.find((m) => m.id === pinnedMessageId) ?? assistantMessages.at(-1);
  const evidence = useMemo(() => (shown ? toolCalls(shown) : []), [shown]);

  // Merge every finished tool result of that answer into one highlight. The signature string keeps
  // the highlight stable while the answer text streams in, so the graph doesn't re-zoom every token.
  const done = evidence.filter((e) => e.output?.highlight);
  const signature = done.map((e) => e.key).join(',');
  const highlight = useMemo(() => {
    if (viewReset || !done.length) return EMPTY_HIGHLIGHT;
    return {
      nodes: new Set(done.flatMap((e) => e.output.highlight.nodes)),
      links: new Set(done.flatMap((e) => e.output.highlight.links.map(linkKey))),
      focus: done[0].output.focus,
    };
  }, [signature, viewReset]); // eslint-disable-line react-hooks/exhaustive-deps

  // After the agent creates an incident, reload the graph so the new node appears.
  const graphChanges = evidence.filter((e) => e.output?.graphChanged).length;
  useEffect(() => { if (graphChanges) loadGraph(); }, [graphChanges]);

  // Put a chat on screen: a fresh one for a new question, or a saved one from the history.
  function show(entry, msgs) {
    clearError();
    setMessages(msgs);
    setCurrent(entry);
    setPinnedMessageId(null);
    setSelected(null);
    setViewReset(false);
    setShowHistory(false);
  }

  function ask(text) {
    const q = text.trim();
    if (!q || busy) return;
    show({ id: newEntryId(), createdAt: Date.now() }, []); // start fresh: no context from earlier questions
    sendMessage({ text: q });
    setInput('');
  }

  function openEntry(entry) {
    if (!busy) show({ id: entry.id, createdAt: entry.createdAt }, entry.messages);
  }

  function deleteEntry(id) {
    setHistory((prev) => prev.filter((e) => e.id !== id));
    if (current?.id === id && !busy) show(null, []);
  }

  function clearHistory() {
    setHistory([]);
    if (!busy) show(null, []);
  }

  // Back to the whole graph: it is already in client state, so this only drops the highlight and
  // re-fits the camera. Clicking an answer in the chat lights it up again.
  function resetView() {
    setViewReset(true);
    setSelected(null);
    setFitKey((k) => k + 1);
  }

  return (
    <div className="flex h-dvh flex-col bg-[#05070d] font-sans text-slate-300 antialiased">
      {/* Header: same look as the landing page nav */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-medium text-slate-100 transition-colors hover:text-teal-300">
            <Logo className="h-6 w-6" /> blast-radius
          </Link>
          <span className="flex items-center gap-2 rounded-full border border-slate-800 px-2.5 py-0.5 font-mono text-[11px] text-slate-400">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                graphError ? 'bg-rose-400 shadow-[0_0_8px_#fb7185]'
                  : graphLoaded ? 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]'
                    : 'animate-pulse bg-amber-400'
              }`}
            />
            {graphError ? 'FalkorDB unreachable' : graphLoaded ? 'connected to FalkorDB' : 'connecting…'}
          </span>
        </div>
        <div className="hidden items-center gap-4 font-mono text-[11px] text-slate-400 md:flex">
          {Object.entries(COLORS).map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)_300px] lg:grid-rows-1">
        {/* Chat */}
        <section className="flex min-h-0 flex-col border-b border-slate-800 lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-800 px-3 py-2 font-mono text-[11px]">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`rounded-md border px-2.5 py-1 transition-colors ${
                showHistory ? 'border-teal-400/40 text-teal-300' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {showHistory ? '← back to chat' : `history (${history.length})`}
            </button>
            <button
              onClick={() => show(null, [])}
              disabled={busy || (!messages.length && !showHistory)}
              className="rounded-md border border-slate-800 px-2.5 py-1 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 disabled:opacity-40"
            >
              + new question
            </button>
          </div>

          {showHistory ? (
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-teal-400">// past questions</p>
              {history.length === 0 && (
                <p className="font-mono text-xs text-slate-500">Nothing yet. Questions you ask are saved here, in this browser only.</p>
              )}
              {history.map((e) => (
                <div
                  key={e.id}
                  className={`group flex items-start gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                    current?.id === e.id ? 'border-teal-400/30 bg-teal-400/[0.03]' : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                  }`}
                >
                  <button onClick={() => openEntry(e)} disabled={busy} className="min-w-0 flex-1 text-left disabled:opacity-60">
                    <span className="line-clamp-2 text-xs text-slate-200">{e.question || '(empty question)'}</span>
                    <span className="mt-1 block font-mono text-[10px] text-slate-500">
                      {new Date(e.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteEntry(e.id)}
                    aria-label="Delete from history"
                    className="font-mono text-xs text-slate-600 transition-colors hover:text-rose-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {history.length > 0 && (
                <button onClick={clearHistory} className="pt-2 font-mono text-[11px] text-slate-500 transition-colors hover:text-rose-400">
                  clear all history
                </button>
              )}
            </div>
          ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-teal-400">// try asking</p>
                {EXAMPLES.map((q) => (
                  <button
                    key={q}
                    onClick={() => ask(q)}
                    className="group flex w-full gap-2 rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2.5 text-left text-xs text-slate-300 transition-all hover:-translate-y-px hover:border-slate-700 hover:bg-slate-900/60 hover:text-slate-100"
                  >
                    <span className="font-mono text-teal-400/60 transition-colors group-hover:text-teal-400">❯</span>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="ml-8 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100">
                  {m.parts.filter((p) => p.type === 'text').map((p) => p.text).join('')}
                </div>
              ) : (
                <div
                  key={m.id}
                  onClick={() => { setPinnedMessageId(m.id); setViewReset(false); }}
                  className={`cursor-pointer space-y-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    shown?.id === m.id ? 'border-teal-400/30 bg-teal-400/[0.03]' : 'border-transparent hover:border-slate-800'
                  }`}
                >
                  {m.parts.map((p, i) => {
                    if (p.type === 'text') return <Formatted key={i} text={p.text} />;
                    if (p.type.startsWith('tool-')) {
                      const done = p.state === 'output-available';
                      const failed = p.state === 'output-error';
                      return (
                        <div key={i} className="font-mono text-[11px] text-slate-500">
                          <span className={failed ? 'text-rose-400' : done ? 'text-teal-400' : 'text-amber-400'}>
                            {failed ? '✕' : done ? '✓' : '…'}
                          </span>{' '}
                          {p.type.slice(5)}
                          {done && p.output?.summary ? ` · ${p.output.summary}` : ''}
                          {done && p.output?.error ? ` · ${p.output.error}` : ''}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              ),
            )}

            {status === 'submitted' && <p className="animate-pulse font-mono text-xs text-slate-500">thinking…</p>}
            {error && (error.message.startsWith('QUOTA_EXCEEDED') ? (
              <div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 font-mono text-xs text-amber-300">
                <p className="font-semibold">Demo limit reached</p>
                <p className="mt-1 text-amber-200/80">
                  This demo runs on a free AI quota and it has been used up for today. It is a usage limit,
                  not a bug: the graph and tools still work. Please{' '}
                  {DEMO_VIDEO_URL ? (
                    <a href={DEMO_VIDEO_URL} target="_blank" rel="noreferrer" className="underline hover:text-amber-100">watch the demo video</a>
                  ) : 'watch the demo video'}{' '}
                  or try again later.
                </p>
              </div>
            ) : (
              <p className="font-mono text-xs text-rose-400">Something went wrong: {error.message}</p>
            ))}
          </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="flex gap-2 border-t border-slate-800 p-3"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-800 bg-slate-900/40 px-3 transition-colors focus-within:border-teal-400/60">
              <span className="font-mono text-sm text-teal-400">❯</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_QUESTION_LENGTH}
                placeholder="Ask about a service, outage or incident…"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-md bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_0_24px_-6px_#2dd4bf] transition-all hover:bg-teal-300 hover:shadow-[0_0_32px_-4px_#2dd4bf] disabled:opacity-40 disabled:shadow-none"
            >
              Ask
            </button>
          </form>
        </section>

        {/* Graph */}
        <section className="relative min-h-0">
          {graphError ? (
            <div className="p-6 font-mono text-sm text-rose-400">
              {graphError}
              <p className="mt-2 text-xs text-slate-500">Is FalkorDB running, and did you run npm run seed?</p>
            </div>
          ) : (
            <GraphView
              graph={graph}
              highlight={highlight}
              selectedId={selected?.id}
              onSelect={setSelected}
              fitKey={fitKey}
            />
          )}

          {highlight.nodes.size > 0 && (
            <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-slate-800 bg-[#05070d]/80 px-2.5 py-1 font-mono text-[11px] text-slate-400 backdrop-blur">
              showing {highlight.nodes.size} nodes and {highlight.links.size} links used in this answer
            </div>
          )}

          {!graphError && graphLoaded && (
            <button
              onClick={resetView}
              title="Show the full graph again (click an answer to highlight it again)"
              className="absolute right-3 top-3 rounded-md border border-slate-800 bg-[#05070d]/80 px-2.5 py-1 font-mono text-[11px] text-slate-400 backdrop-blur transition-colors hover:border-teal-400/40 hover:text-teal-300"
            >
              ⟲ reset view
            </button>
          )}
        </section>

        {/* Details + evidence (hidden on small screens to keep the graph usable) */}
        <div className="hidden min-h-0 lg:block">
          <DetailsPanel selected={selected} graph={graph} evidence={evidence} />
        </div>
      </div>
    </div>
  );
}
