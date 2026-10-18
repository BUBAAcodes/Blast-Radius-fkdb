'use client';
// Hero background: a shockwave drawn with text characters. Soft ripples spread from the centre and
// every few seconds a brighter ring blasts outwards. It is one <pre> whose text is rewritten about
// 20 times a second: no canvas, no libraries. It pauses when scrolled out of view, and shows a
// single still frame for people who prefer reduced motion.
import { useEffect, useRef } from 'react';

const RAMP = ' .:-=+xX#@'; // dim -> bright
const FPS = 20;
const FONT_PX = 13;

function frame(cols, rows, t) {
  const cx = cols / 2;
  const cy = rows / 2;
  const maxR = Math.hypot(cx, cy * 2);
  const period = 4.5; // seconds between blasts
  const ringR = ((t % period) / period) * maxR * 1.1;
  const ringFade = 1 - ringR / (maxR * 1.1);
  let out = '';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Characters are about twice as tall as they are wide, so stretch y to keep circles round.
      const d = Math.hypot(x - cx, (y - cy) * 2);
      const ripple = (Math.sin(d * 0.32 - t * 2.4) + 1) / 2 * Math.exp(-d * 0.018) * 0.55;
      const ring = Math.exp(-((d - ringR) ** 2) / 18) * ringFade;
      const core = Math.exp(-d * 0.35);
      const v = Math.min(1, ripple + ring + core);
      out += RAMP[Math.floor(v * (RAMP.length - 1))];
    }
    out += '\n';
  }
  return out;
}

export default function AsciiShockwave({ className = 'text-teal-400/40' }) {
  const preRef = useRef(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    // Measure one character so the grid exactly fills the box.
    const probe = document.createElement('span');
    probe.textContent = 'X'.repeat(50);
    pre.appendChild(probe);
    const charW = probe.getBoundingClientRect().width / 50;
    pre.removeChild(probe);

    let cols = 0;
    let rows = 0;
    const resize = () => {
      cols = Math.ceil(pre.clientWidth / charW);
      rows = Math.ceil(pre.clientHeight / FONT_PX);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(pre);

    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(pre);

    let raf = 0;
    let last = 0;
    const start = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < 1000 / FPS) return;
      last = now;
      pre.textContent = frame(cols, rows, (now - start) / 1000);
    };

    const run = () => {
      cancelAnimationFrame(raf);
      if (still.matches) pre.textContent = frame(cols, rows, 1.6); // one frame with the ring mid-way
      else raf = requestAnimationFrame(tick);
    };
    run();
    still.addEventListener('change', run);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      still.removeEventListener('change', run);
    };
  }, []);

  return (
    <pre
      ref={preRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 m-0 select-none overflow-hidden font-mono ${className}`}
      style={{
        fontSize: FONT_PX,
        lineHeight: `${FONT_PX}px`,
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      }}
    />
  );
}
