'use client';
// Floating navigation: a round logo button and a frosted pill with a Menu toggle and the main call
// to action. "Menu" drops a frosted panel of section links (same on desktop and mobile). It closes
// on link click, Escape, or a click outside.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { GITHUB_URL } from './ui';

const LINKS = [
  ['What it is', '#about'],
  ['Why a graph', '#value'],
  ['Capabilities', '#capabilities'],
  ['How it works', '#process'],
  ['In action', '#examples'],
  ['Built with', '#stack'],
  ['FAQs', '#faq'],
];

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onClick = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onClick);
    };
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5 sm:pt-8">
      <nav ref={boxRef} aria-label="Main" className="pointer-events-auto relative flex items-center gap-1">
        <Link
          href="/"
          aria-label="Blast Radius home"
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-2xl transition-colors hover:bg-black/65 ${FOCUS}`}
        >
          <Logo className="h-7 w-7" />
        </Link>

        <div className="flex items-center gap-4 rounded-full bg-black/50 p-1 pl-5 backdrop-blur-xl sm:gap-6 sm:pl-6">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            className={`flex items-center gap-2 rounded-full text-base tracking-[-0.03em] text-white ${FOCUS}`}
          >
            <span className="relative block h-6 w-6" aria-hidden="true">
              <span className={`absolute left-[3px] h-0.5 w-[18px] rounded-full bg-white transition-all duration-300 ${open ? 'top-[11px] rotate-45' : 'top-[7px]'}`} />
              <span className={`absolute left-[3px] h-0.5 w-[18px] rounded-full bg-white transition-all duration-300 ${open ? 'top-[11px] -rotate-45' : 'top-[14px]'}`} />
            </span>
            {open ? 'Close' : 'Menu'}
          </button>
          <Link
            href="/agent"
            className={`flex h-12 items-center rounded-full border border-white bg-white/80 px-5 text-base font-medium tracking-[-0.03em] text-ink transition-colors hover:bg-white ${FOCUS}`}
          >
            Open the agent
          </Link>
        </div>

        <div
          id="site-menu"
          className={`absolute inset-x-0 top-full mt-2 origin-top rounded-[32px] bg-black/55 p-3 backdrop-blur-2xl transition-all duration-300 motion-reduce:transition-none ${
            open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-2 scale-95 opacity-0'
          }`}
        >
          <ul className="grid grid-cols-2 gap-1">
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-full px-4 py-2.5 text-sm tracking-[-0.03em] text-white/80 transition-colors hover:bg-white/10 hover:text-white ${FOCUS}`}
                >
                  {label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`block rounded-full px-4 py-2.5 text-sm tracking-[-0.03em] text-white/80 transition-colors hover:bg-white/10 hover:text-white ${FOCUS}`}
              >
                GitHub ↗
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
