'use client';
// Right-hand panel: properties of whatever you clicked on the graph, plus the "evidence" for the
// current answer: which tools ran, with what input, what they found, and the exact Cypher used.
import { COLORS } from '@/lib/colors';

const shortName = (id) => id.split(':').slice(1).join(':');

function PropsTable({ props }) {
  const entries = Object.entries(props ?? {});
  if (!entries.length) return <p className="text-xs text-slate-500">No properties.</p>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-mono text-slate-500">{k}</dt>
          <dd className="break-words text-slate-200">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Selected({ selected, graph }) {
  if (!selected) {
    return <p className="text-xs text-slate-500">Click a node or a link on the graph to see its properties.</p>;
  }

  if (selected.kind === 'node') {
    const node = graph.nodes.find((n) => n.id === selected.id);
    if (!node) return null;
    const links = graph.links.filter((l) => l.source === node.id || l.target === node.id);
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[node.label] }} />
          <span className="font-mono text-xs uppercase tracking-wide text-slate-400">{node.label}</span>
        </div>
        <h3 className="text-sm font-semibold text-slate-100">{node.name}</h3>
        <PropsTable props={node.props} />
        <div>
          <h4 className="mb-1 text-xs font-medium text-slate-400">Connections ({links.length})</h4>
          <ul className="max-h-40 space-y-0.5 overflow-auto text-xs text-slate-300">
            {links.map((l) => (
              <li key={l.id}>
                {l.source === node.id
                  ? <>→ <span className="text-slate-500">{l.type}</span> {shortName(l.target)}</>
                  : <>← <span className="text-slate-500">{l.type}</span> {shortName(l.source)}</>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const link = graph.links.find((l) => l.id === selected.id);
  if (!link) return null;
  return (
    <div className="space-y-3">
      <span className="font-mono text-xs uppercase tracking-wide text-slate-400">Relationship</span>
      <h3 className="text-sm font-semibold text-slate-100">{link.type}</h3>
      <p className="text-xs text-slate-300">
        {shortName(link.source)} <span className="text-slate-500">→</span> {shortName(link.target)}
      </p>
      <PropsTable props={link.props} />
    </div>
  );
}

function Evidence({ evidence }) {
  if (!evidence.length) {
    return <p className="text-xs text-slate-500">Ask a question to see which graph queries the agent ran.</p>;
  }
  return (
    <ol className="space-y-3">
      {evidence.map((e, i) => (
        <li key={e.key} className="rounded-lg border border-slate-800 bg-slate-900/30 p-3 transition-colors hover:border-slate-700">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-xs text-teal-300">{i + 1}. {e.tool}</span>
            <span className="font-mono text-[10px] text-slate-500">{e.output?.rows?.length ?? 0} rows</span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-slate-500">{JSON.stringify(e.input)}</p>
          <p className="mt-1.5 text-xs text-slate-200">{e.output?.summary ?? e.output?.error ?? e.error}</p>
          {e.output?.cypher && (
            <details className="mt-1.5">
              <summary className="cursor-pointer font-mono text-[11px] text-slate-400 transition-colors hover:text-teal-300">cypher</summary>
              <pre className="mt-1 whitespace-pre-wrap break-words rounded-md border border-slate-800 bg-[#05070d] p-2 font-mono text-[10.5px] leading-relaxed text-slate-300">
                {e.output.cypher}
              </pre>
            </details>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function DetailsPanel({ selected, graph, evidence }) {
  return (
    <aside className="flex h-full flex-col gap-6 overflow-y-auto border-l border-slate-800 p-4">
      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-teal-400">// details</h2>
        <Selected selected={selected} graph={graph} />
      </section>
      <section>
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-teal-400">// evidence</h2>
        <Evidence evidence={evidence} />
      </section>
    </aside>
  );
}
