'use client';
// A fake terminal that types a question and then prints the agent's answer line by line.
// The answer matches what the real tools return for payments-service on the seeded data.
// It starts when scrolled into view; with reduced motion it shows everything at once.
import { useEffect, useRef, useState } from 'react';

const QUESTION = 'What breaks if payments-service goes down?';

// Each line: [text, tailwind classes]
const ANSWER = [
  ['✓ blastRadius      5 services depend on payments-service within 3 hops', 'text-teal-400'],
  ['✓ serviceContacts  payments-service is owned by Payments', 'text-teal-400'],
  ['', ''],
  ['If payments-service goes down, 5 services break.', 'text-slate-100'],
  ['', ''],
  ['Tier 1', 'text-rose-400'],
  ['  • checkout-service   1 hop                       Commerce', 'text-slate-300'],
  ['  • web-app            2 hops via checkout-service  Growth', 'text-slate-300'],
  ['  • mobile-bff         2 hops via checkout-service  Growth', 'text-slate-300'],
  ['Tier 2-3', 'text-amber-400'],
  ['  • billing-service    1 hop                       Payments', 'text-slate-300'],
  ['  • invoice-service    2 hops via billing-service   Payments', 'text-slate-300'],
  ['', ''],
  ['Notify #team-payments first (Asha Verma, Tech Lead), then #team-commerce and #team-growth.', 'text-violet-300'],
];

export default function TerminalDemo() {
  const boxRef = useRef(null);
  const [typed, setTyped] = useState(0); // characters of the question shown
  const [lines, setLines] = useState(0); // answer lines shown
  const [run, setRun] = useState(0); // bump to replay
  const [started, setStarted] = useState(false);

  // Start the first time the terminal scrolls into view.
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.4 });
    io.observe(boxRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTyped(QUESTION.length);
      setLines(ANSWER.length);
      return;
    }
    setTyped(0);
    setLines(0);
    const timers = [];
    let at = 400;
    for (let i = 1; i <= QUESTION.length; i++) {
      timers.push(setTimeout(() => setTyped(i), at));
      at += 28 + Math.random() * 40;
    }
    at += 700; // the agent "thinks"
    for (let i = 1; i <= ANSWER.length; i++) {
      timers.push(setTimeout(() => setLines(i), at));
      at += i <= 2 ? 650 : 170;
    }
    return () => timers.forEach(clearTimeout);
  }, [started, run]);

  const typing = typed < QUESTION.length;
  const thinking = !typing && lines === 0 && started;
  const done = lines === ANSWER.length;

  return (
    <div
      ref={boxRef}
      className="overflow-hidden rounded-xl border border-slate-800 bg-[#05070d] shadow-2xl shadow-teal-950/40"
    >
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-rose-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-teal-400/80" />
        <span className="ml-3 font-mono text-xs text-slate-500">blast-radius — agent</span>
        {done && (
          <button
            onClick={() => setRun((r) => r + 1)}
            className="ml-auto font-mono text-xs text-slate-500 transition-colors hover:text-teal-300"
          >
            ↻ replay
          </button>
        )}
      </div>
      <div className="min-h-[22rem] overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed sm:p-5 sm:text-[13px]">
        <p className="whitespace-pre text-slate-100">
          <span className="text-teal-400">❯ </span>
          {QUESTION.slice(0, typed)}
          {typing && <span className="ml-px inline-block h-[1.1em] w-2 translate-y-[0.2em] animate-pulse bg-slate-300" />}
        </p>
        {thinking && <p className="mt-2 animate-pulse text-slate-500">thinking…</p>}
        <div className="mt-2">
          {ANSWER.slice(0, lines).map(([text, cls], i) => (
            <p key={i} className={`whitespace-pre ${cls}`}>{text || ' '}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
