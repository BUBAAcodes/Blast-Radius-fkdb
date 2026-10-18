'use client';
// "How it works": the five steps from question to answer, alternating sides of a centre line.
// The iridescent line fills as you scroll and the step at the reading position is highlighted.
// On small screens the line moves to the left and every step reads top to bottom.
import { useEffect, useRef, useState } from 'react';

const icon = (d) => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const STEPS = [
  {
    title: 'You ask in plain English',
    text: '“What breaks if payments-service goes down?” No query language, no dashboards to dig through.',
    icon: icon(<><path d="M4 5h16v11H8l-4 4z" /><path d="M8 9.5h8M8 12.5h5" /></>),
  },
  {
    title: 'Gemini picks the tools',
    text: 'The model reads your question and chooses from six tested graph queries. It fills in the inputs; it never writes Cypher.',
    icon: icon(<><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m7 10 3 2-3 2M12 15h5" /></>),
  },
  {
    title: 'FalkorDB walks the graph',
    text: 'Each tool runs a parameterised, read-only query: up to 3 hops of DEPENDS_ON, ownership, commits and incident history.',
    icon: icon(<><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="M8 7.2 15.6 7M7.2 8.2l3.6 7.6M17 9.2l-3.8 6.9" /></>),
  },
  {
    title: 'Results feed the next step',
    text: 'The agent reads what came back and can call more tools, up to 6 steps per question, before it writes the answer.',
    icon: icon(<><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v4.5h-4.5" /></>),
  },
  {
    title: 'You get the answer, with proof',
    text: 'Impact ranked by tier, the teams and Slack channels to notify, the lit-up subgraph and the exact Cypher that ran.',
    icon: icon(<><path d="M5 12.5 9.5 17 19 7.5" /></>),
  },
];

export default function ProcessTimeline() {
  const boxRef = useRef(null);
  const rowRefs = useRef([]);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setProgress(1); setActive(-1); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      // On navigation away, React detaches the refs before this effect's cleanup runs, and a scroll
      // event can land in between: skip that update instead of crashing.
      if (!boxRef.current) return;
      const mark = window.innerHeight * 0.55;
      const box = boxRef.current.getBoundingClientRect();
      setProgress(Math.min(1, Math.max(0, (mark - box.top) / box.height)));
      let a = 0;
      rowRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top + r.height / 2 < mark + 40) a = i;
      });
      setActive(a);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div ref={boxRef} className="relative mx-auto w-full max-w-[1040px]">
      {/* Centre line and its iridescent fill */}
      <div className="absolute bottom-0 left-[35px] top-0 w-px bg-line md:left-1/2" aria-hidden="true">
        <div
          className="absolute left-1/2 top-0 w-[3px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#c9aaff,#fdffbc_25%,#ffccfd_50%,#a7f3e4_75%,#8399ff)]"
          style={{ height: `${progress * 100}%` }}
        />
      </div>

      <ol className="space-y-4">
      {STEPS.map((s, i) => {
        const on = active === -1 || i === active;
        const flip = i % 2 === 1; // text on the left, icon on the right
        const badge = (
          <div className={`flex items-center gap-4 ${flip ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
            <span
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] transition-colors duration-500 ${
                on ? 'bg-muted text-white shadow-[inset_0_0_12px_#fff]' : 'border border-line bg-cloud text-ink shadow-[inset_0_0_12px_rgb(0_0_0/0.12)]'
              }`}
            >
              {s.icon}
            </span>
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-base font-medium transition-colors duration-500 ${on ? 'bg-white' : 'bg-cloud'}`}>
              0{i + 1}
            </span>
          </div>
        );
        const text = (
          <div className={`max-w-[320px] ${flip ? 'md:ml-auto md:text-right' : ''}`}>
            <h3 className="text-xl font-medium tracking-[-0.03em] text-ink">{s.title}</h3>
            <p className="mt-1 text-base leading-[1.35] tracking-[-0.03em] text-muted">{s.text}</p>
          </div>
        );
        return (
          <li
            key={s.title}
            ref={(el) => (rowRefs.current[i] = el)}
            aria-current={i === active ? 'step' : undefined}
            className={`relative grid grid-cols-[72px_minmax(0,1fr)] items-center gap-y-4 rounded-[40px] py-6 pr-4 transition-colors duration-500 md:grid-cols-[minmax(0,1fr)_160px_minmax(0,1fr)] md:rounded-[48px] md:px-10 md:py-10 ${
              on && active !== -1 ? 'bg-cloud' : 'bg-white'
            }`}
          >
            {/* Dot on the line */}
            <span className="col-start-1 row-span-2 flex justify-center self-center md:col-start-2 md:row-span-1 md:row-start-1" aria-hidden="true">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl p-[3px] transition-all duration-500 ${on ? 'bg-iridescent' : 'scale-75 border-[3px] border-line bg-white'}`}>
                <span className={`h-3 w-3 rounded-full bg-ink transition-transform duration-500 ${on ? 'scale-100' : 'scale-0'}`} />
              </span>
            </span>
            <div className={`col-start-2 md:row-start-1 ${flip ? 'md:col-start-3' : 'md:col-start-1 md:flex md:justify-end'}`}>{badge}</div>
            <div className={`col-start-2 md:row-start-1 ${flip ? 'md:col-start-1' : 'md:col-start-3'}`}>{text}</div>
          </li>
        );
      })}
      </ol>
    </div>
  );
}
