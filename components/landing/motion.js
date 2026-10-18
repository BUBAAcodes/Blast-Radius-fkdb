'use client';
// Scroll-driven effects for the landing page. All of them settle into their final, fully readable
// state straight away when the visitor prefers reduced motion.
import { Fragment, useEffect, useRef, useState } from 'react';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// True once the element has scrolled into view (and stays true).
export function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// Calls onProgress(p) on scroll, p going 0 -> 1 while the element moves from `start` to `end`
// (fractions of the viewport height, measured at the element's top).
function useScrollProgress(ref, onProgress, start = 0.9, end = 0.3) {
  useEffect(() => {
    if (reducedMotion()) { onProgress(1); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top / window.innerHeight;
      onProgress(Math.min(1, Math.max(0, (start - top) / (start - end))));
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// Heading whose words rise into place one after another when it scrolls into view.
export function RiseWords({ text, as: Tag = 'h2', className = '' }) {
  const [ref, inView] = useInView(0.4);
  const words = text.split(' ');
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <span
              className={`inline-block transition-all duration-700 ease-out motion-reduce:transition-none ${
                inView ? 'translate-y-0 opacity-100' : 'translate-y-[60%] opacity-0'
              }`}
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              {w}
            </span>
          </span>
          {i < words.length - 1 && ' '}
        </Fragment>
      ))}
    </Tag>
  );
}

// Paragraph whose words turn from faint to solid as you scroll through it.
export function ScrollRevealText({ text, className = '' }) {
  const ref = useRef(null);
  const [p, setP] = useState(0);
  useScrollProgress(ref, setP, 0.85, 0.35);
  const words = text.split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span
          key={i}
          className="transition-colors duration-200"
          style={{ color: i / words.length < p ? '#1a1a1a' : 'rgb(0 0 0 / 0.12)' }}
        >
          {w}{' '}
        </span>
      ))}
    </p>
  );
}

// Tilts its child back in 3D and straightens it as it scrolls up the screen.
export function ScrollTilt({ children, className = '' }) {
  const ref = useRef(null);
  const [p, setP] = useState(0);
  useScrollProgress(ref, setP, 1, 0.35);
  return (
    <div ref={ref} className={className} style={{ perspective: '2000px' }}>
      <div
        style={{
          transform: `rotateX(${(1 - p) * 50}deg) scale(${0.8 + p * 0.2})`,
          transformOrigin: '50% 100%',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
