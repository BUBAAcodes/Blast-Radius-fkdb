'use client';
// The whole app: chat on the left, graph in the middle, details + evidence on the right.
// Flow: you ask -> useChat POSTs to /api/chat -> the agent calls tools -> each tool result arrives
// as a "tool-<name>" part on the message -> we collect those parts to light up the graph and fill
// the evidence panel.
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import DetailsPanel from '@/components/DetailsPanel';
import Logo from '@/components/Logo';
import { COLORS } from '@/lib/colors';

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
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState('');
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [graphError, setGraphError] = useState(null);
  const [graphLoaded, setGraphLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pinnedMessageId, setPinnedMessageId] = useState(null);

  const busy = status === 'submitted' || status === 'streaming';

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
    if (!done.length) return EMPTY_HIGHLIGHT;
    return {
      nodes: new Set(done.flatMap((e) => e.output.highlight.nodes)),
      links: new Set(done.flatMap((e) => e.output.highlight.links.map(linkKey))),
      focus: done[0].output.focus,
    };
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  // After the agent creates an incident, reload the graph so the new node appears.
  const graphChanges = evidence.filter((e) => e.output?.graphChanged).length;
  useEffect(() => { if (graphChanges) loadGraph(); }, [graphChanges]);

  function ask(text) {
    const q = text.trim();
    if (!q || busy) return;
    setPinnedMessageId(null);
    setSelected(null);
    sendMessage({ text: q });
    setInput('');
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
                  onClick={() => setPinnedMessageId(m.id)}
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
            {error && <p className="font-mono text-xs text-rose-400">Something went wrong: {error.message}</p>}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="flex gap-2 border-t border-slate-800 p-3"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-800 bg-slate-900/40 px-3 transition-colors focus-within:border-teal-400/60">
              <span className="font-mono text-sm text-teal-400">❯</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
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
            />
          )}

          {highlight.nodes.size > 0 && (
            <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-slate-800 bg-[#05070d]/80 px-2.5 py-1 font-mono text-[11px] text-slate-400 backdrop-blur">
              showing {highlight.nodes.size} nodes and {highlight.links.size} links used in this answer
            </div>
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
