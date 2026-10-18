'use client';
// A light, illustrative copy of the /agent screen: the chat with its tool steps, the graph with the
// blast radius lit up, and the evidence panel. It plays one real answer (computed from the seed
// data by lib/landing-data.js) when scrolled into view. With reduced motion it shows the end state.
import { useEffect, useState } from 'react';
import { useInView } from './motion';

const W = 480;
const H = 330;
const CX = W / 2;
const CY = H / 2;
const RADII = [0, 78, 140, 190];

// Math.cos/sin can differ in the last digits between Node and the browser, which breaks hydration,
// so every coordinate is rounded to 2 decimals before it reaches the SVG.
const round = (n) => Math.round(n * 100) / 100;

// Places the root in the middle, 1-hop services on the first ring, deeper ones near the service
// they reach the root through.
function layout(root, impacted) {
  const pos = { [root]: { x: CX, y: CY } };
  const hop1 = impacted.filter((s) => s.hops === 1);
  const angle = {};
  hop1.forEach((s, i) => {
    angle[s.service] = Math.PI + i * ((2 * Math.PI) / hop1.length); // first one on the left
  });
  const siblings = {};
  for (const s of impacted.filter((x) => x.hops > 1)) {
    const k = (siblings[s.via] = (siblings[s.via] ?? -1) + 1);
    angle[s.service] = angle[s.via] + (k % 2 ? 1 : -1) * (0.32 + Math.floor(k / 2) * 0.4);
  }
  for (const s of impacted) {
    pos[s.service] = {
      x: round(CX + Math.cos(angle[s.service]) * RADII[s.hops] * 1.15),
      y: round(CY + Math.sin(angle[s.service]) * RADII[s.hops] * 0.8),
    };
  }
  return pos;
}

// Faint dots for the rest of the graph, spread on a golden-angle spiral so they look organic.
const BACKGROUND = Array.from({ length: 24 }, (_, i) => {
  const r = 60 + Math.sqrt(i / 24) * 170;
  const a = i * 2.399963;
  return { x: round(CX + Math.cos(a) * r * 1.2), y: round(CY + Math.sin(a) * r * 0.75) };
}).filter((p) => p.x > 12 && p.x < W - 12 && p.y > 12 && p.y < H - 12);

export default function AgentPreview({ question, root, owner, impacted, notify, cypher }) {
  const [ref, inView] = useInView(0.35);
  const [step, setStep] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setStep(4); return; }
    setStep(0);
    const timers = [300, 1300, 2200, 3000].map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, [inView, run]);

  const pos = layout(root, impacted);
  const lit = step >= 2;
  const tier1 = impacted.filter((s) => s.tier === 1);
  const rest = impacted.filter((s) => s.tier !== 1);
  const hopsLabel = (s) => (s.hops === 1 ? '1 hop' : `${s.hops} hops via ${s.via}`);

  return (
    <div ref={ref} className="rounded-[40px] border border-white bg-white/60 p-2 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.35)] backdrop-blur-xl sm:rounded-[56px] sm:p-3">
      <div className="overflow-hidden rounded-[32px] border border-line bg-white sm:rounded-[44px]">
        {/* Window bar */}
        <div className="flex items-center gap-2 border-b border-line px-5 py-3.5 sm:px-7">
          <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2dd4bf]" />
          <span className="ml-2 font-mono text-xs text-faint">blast-radius / agent</span>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full bg-cloud px-2.5 py-1 font-mono text-[11px] text-muted sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" /> connected to FalkorDB
          </span>
          {step === 4 && (
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              className="ml-auto rounded-full px-2 py-1 font-mono text-[11px] text-faint transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-[#8399ff] sm:ml-2"
            >
              ↻ replay
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_230px]">
          {/* Chat */}
          <div className="space-y-3 border-line p-5 text-sm md:min-h-[420px] md:border-r sm:p-6" aria-live="polite">
            <div className={`ml-6 rounded-2xl rounded-tr-md bg-ink px-4 py-3 text-white transition-all duration-500 ${step >= 1 ? 'opacity-100' : 'translate-y-2 opacity-0'}`}>
              {question}
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-muted">
              <p className={`transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-[#14b8a6]">✓</span> blastRadius · {impacted.length} services within 3 hops
              </p>
              <p className={`transition-opacity duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-[#14b8a6]">✓</span> serviceContacts · owned by {owner.team}
              </p>
            </div>
            <div className={`space-y-2 leading-relaxed text-ink-soft transition-all duration-700 ${step >= 4 ? 'opacity-100' : 'translate-y-2 opacity-0'}`}>
              <p className="font-medium text-ink">If {root} goes down, {impacted.length} services break.</p>
              <p className="text-xs font-medium uppercase tracking-wide text-[#e11d48]">Tier 1</p>
              <ul className="space-y-1">
                {tier1.map((s) => (
                  <li key={s.service} className="flex gap-2"><span className="text-faint">•</span><span><b className="font-medium">{s.service}</b> <span className="text-muted">· {hopsLabel(s)}</span></span></li>
                ))}
              </ul>
              {rest.length > 0 && (
                <>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#d97706]">Tier 2–3</p>
                  <ul className="space-y-1">
                    {rest.map((s) => (
                      <li key={s.service} className="flex gap-2"><span className="text-faint">•</span><span><b className="font-medium">{s.service}</b> <span className="text-muted">· {hopsLabel(s)}</span></span></li>
                    ))}
                  </ul>
                </>
              )}
              <p className="rounded-xl bg-violet-50 px-3 py-2 text-[13px] text-violet-900">
                Notify <b className="font-medium">{owner.slack}</b> first, then {notify.join(' and ')}.
              </p>
            </div>
          </div>

          {/* Graph */}
          <div className="relative min-h-[300px] bg-[radial-gradient(circle_at_center,#fafafa,#f2f2f2)]">
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`Graph with ${root} and the ${impacted.length} services that depend on it highlighted`}>
              {[1, 2, 3].map((r) => (
                <ellipse key={r} cx={CX} cy={CY} rx={RADII[r] * 1.15} ry={RADII[r] * 0.8} fill="none" stroke="#fb7185" strokeOpacity={lit ? 0.18 / r : 0} strokeDasharray="3 5" className="transition-[stroke-opacity] duration-700" />
              ))}
              {BACKGROUND.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#a5a5a5" opacity={lit ? 0.18 : 0.45} className="transition-opacity duration-700" />)}
              {impacted.map((s) => {
                const a = pos[s.service];
                const b = pos[s.via ?? root];
                return (
                  <line key={s.service} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#14b8a6" strokeWidth="1.6" strokeDasharray="4 4"
                    className="animate-dash transition-opacity duration-700" opacity={lit ? 0.9 : 0} />
                );
              })}
              {impacted.map((s, i) => (
                <g key={s.service} className="transition-opacity duration-700" style={{ transitionDelay: `${i * 90}ms` }} opacity={lit ? 1 : 0}>
                  <circle cx={pos[s.service].x} cy={pos[s.service].y} r={s.tier === 1 ? 9 : 7} fill="#2dd4bf" stroke="#fff" strokeWidth="2.5" />
                  <text x={pos[s.service].x} y={pos[s.service].y + 21} textAnchor="middle" fontSize="11" fill="#282828" fontFamily="inherit">{s.service}</text>
                </g>
              ))}
              <circle cx={CX} cy={CY} r="22" fill="#fb7185" opacity={lit ? 0.18 : 0} className="transition-opacity duration-700" />
              <circle cx={CX} cy={CY} r="11" fill="#fb7185" stroke="#fff" strokeWidth="3" />
              <text x={CX} y={CY + 30} textAnchor="middle" fontSize="12" fontWeight="600" fill="#1a1a1a" fontFamily="inherit">{root}</text>
            </svg>
            <p className={`absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 font-mono text-[11px] text-muted backdrop-blur transition-opacity duration-500 ${lit ? 'opacity-100' : 'opacity-0'}`}>
              showing {impacted.length + 1} nodes used in this answer
            </p>
          </div>

          {/* Evidence */}
          <div className="hidden space-y-3 border-l border-line p-5 lg:block">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Evidence</p>
            {cypher.map(([tool, input, rows, q], i) => (
              <div key={tool} className={`rounded-2xl border border-line bg-cloud/60 p-3 transition-all duration-500 ${step >= i + 2 ? 'opacity-100' : 'translate-y-2 opacity-0'}`}>
                <div className="flex items-baseline justify-between font-mono text-[11px]">
                  <span className="text-ink">{i + 1}. {tool}</span>
                  <span className="text-faint">{rows} rows</span>
                </div>
                <p className="mt-1 truncate font-mono text-[10px] text-faint">{input}</p>
                <pre className="mt-2 line-clamp-4 whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-muted">{q}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
