'use client';
// "In action": real questions with the answers the tools give on the seeded demo graph, shown as
// large cards in a snap-scrolling carousel with previous / next buttons.
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui';

const SEV = { SEV1: 'bg-rose-400/20 text-rose-200', SEV2: 'bg-amber-300/20 text-amber-100', SEV3: 'bg-white/10 text-white/70' };

function Visual({ item }) {
  if (item.kind === 'blast') {
    return (
      <div className="w-full max-w-[340px] space-y-2">
        <p className="mb-4 flex items-center gap-2 font-mono text-xs text-white/60">
          <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185] shadow-[0_0_10px_#fb7185]" /> {item.root} is down
        </p>
        {item.impacted.map((s) => (
          <div key={s.service} className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4 py-2.5 text-sm text-white" style={{ marginLeft: (s.hops - 1) * 24 }}>
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#2dd4bf]" />
            <span className="truncate">{s.service}</span>
            <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ${s.tier === 1 ? 'bg-rose-400/20 text-rose-200' : 'bg-white/10 text-white/70'}`}>T{s.tier}</span>
          </div>
        ))}
      </div>
    );
  }
  if (item.kind === 'history') {
    return (
      <ol className="relative w-full max-w-[340px] space-y-3 border-l border-white/15 pl-6">
        {item.incidents.map((i) => (
          <li key={i.id} className="relative">
            <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#3a3a3a] bg-[#fbbf24]" />
            <p className="flex items-center gap-2 font-mono text-[11px] text-white/50">
              {i.date} <span className={`rounded-full px-2 py-0.5 ${SEV[i.severity]}`}>{i.severity}</span>
            </p>
            <p className="text-sm text-white">started in <b className="font-medium">{i.root}</b> <span className="text-white/50">· {i.minutes} min</span></p>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="flex w-full max-w-[300px] flex-col items-center">
      {item.path.map((name, i) => (
        <li key={name} className="flex flex-col items-center">
          {i > 0 && (
            <span className="flex flex-col items-center py-1 font-mono text-[10px] text-white/40" aria-hidden="true">
              <span className="h-3 w-px bg-white/25" />DEPENDS_ON<span className="h-3 w-px bg-white/25" />↓
            </span>
          )}
          <span className={`rounded-full px-5 py-2 text-sm ${i === 0 || i === item.path.length - 1 ? 'bg-white text-ink' : 'bg-white/[0.08] text-white'}`}>{name}</span>
        </li>
      ))}
    </ol>
  );
}

function Card({ item, index, total }) {
  return (
    <article
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      className="flex w-full shrink-0 snap-center flex-col gap-2 rounded-[48px] bg-cloud p-2 md:flex-row md:rounded-[64px]"
    >
      <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[40px] bg-ink-soft p-8 shadow-[inset_0_0_40px_rgb(255_255_255/0.25),inset_0_0_12px_#fff] md:min-h-[460px] md:flex-1 md:rounded-[56px]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />
        <div className="relative flex w-full justify-center"><Visual item={item} /></div>
      </div>
      <div className="flex flex-col justify-between gap-10 p-6 md:flex-1 md:p-10">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-1.5">
            {item.tools.map((t) => (
              <span key={t} className="rounded-full border border-line bg-white px-3 py-1 font-mono text-xs text-muted">{t}</span>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-medium leading-[1.2] tracking-[-0.03em] text-ink md:text-[32px]">“{item.question}”</h3>
            <p className="text-base leading-[1.35] tracking-[-0.03em] text-ink-soft">{item.blurb}</p>
          </div>
          <Button href="/agent" variant="ghost">Ask it yourself</Button>
        </div>
        <dl className="grid grid-cols-3 gap-4">
          {item.metrics.map(([value, label]) => (
            <div key={label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm leading-tight tracking-[-0.03em] text-muted">{label}</dt>
              <dd className="text-[28px] font-medium leading-none tracking-[-0.03em] text-ink md:text-[32px]">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

function NavButton({ dir, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir < 0 ? 'Previous example' : 'Next example'}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-[inset_0_0_8px_rgb(255_255_255/0.8)] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8399ff] disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" className={`h-6 w-6 ${dir > 0 ? 'rotate-180' : ''}`} fill="currentColor" aria-hidden="true">
        <path d="M14.29 5.29 8.29 11.3a1 1 0 0 0 0 1.41l6 6a1 1 0 0 0 1.42-1.41L10.41 12l5.3-5.29a1 1 0 0 0-1.42-1.42Z" />
      </svg>
    </button>
  );
}

export default function ExampleCarousel({ items }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const onScroll = () => setIndex(Math.round(track.scrollLeft / track.clientWidth));
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  const go = (i) => {
    const track = trackRef.current;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  };

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label="Example questions">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <div key={item.question} className="w-full shrink-0 snap-center px-0.5">
            <Card item={item} index={i} total={items.length} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-3 lg:absolute lg:-inset-x-16 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2 lg:justify-between lg:pointer-events-none [&>button]:pointer-events-auto">
        <NavButton dir={-1} onClick={() => go(index - 1)} disabled={index === 0} />
        <span className="font-mono text-xs text-muted lg:hidden" aria-live="polite">{index + 1} / {items.length}</span>
        <NavButton dir={1} onClick={() => go(index + 1)} disabled={index === items.length - 1} />
      </div>
    </div>
  );
}
