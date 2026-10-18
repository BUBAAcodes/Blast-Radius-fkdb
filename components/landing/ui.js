// Small building blocks shared by the landing page sections: section tags, pill buttons and the
// marquee. Server components (no hooks), so any section can use them.
import Link from 'next/link';

export const GITHUB_URL = 'https://github.com/BUBAAcodes/Blast-Radius-fkdb';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8399ff]';

export function Arrow({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.33 8h9.33M10 10.67 12.67 8M10 5.33 12.67 8" />
    </svg>
  );
}

// Label that rolls up to a copy of itself on hover, like the reference's buttons.
function RollText({ children }) {
  return (
    <span className="relative block h-[1.35em] overflow-hidden leading-[1.35]">
      <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-1/2 motion-reduce:transition-none">
        <span className="block">{children}</span>
        <span className="block" aria-hidden="true">{children}</span>
      </span>
    </span>
  );
}

// Arrow in a circle that slides out to the right while a second arrow slides in.
function ArrowBadge({ className }) {
  return (
    <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}>
      <span className="absolute transition-transform duration-300 group-hover:translate-x-6 motion-reduce:transition-none"><Arrow /></span>
      <span className="absolute -translate-x-6 transition-transform duration-300 group-hover:translate-x-0 motion-reduce:transition-none"><Arrow /></span>
    </span>
  );
}

function Anchor({ href, className, children, ...rest }) {
  if (href.startsWith('http')) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>{children}</a>;
  }
  return <Link href={href} className={className} {...rest}>{children}</Link>;
}

// variant: "primary" (black pill with an iridescent rim), "glass" (frosted, for dark backgrounds),
// "ghost" (text + arrow, for light backgrounds).
export function Button({ href, children, variant = 'primary', className = '', ...rest }) {
  if (variant === 'primary') {
    return (
      <Anchor href={href} className={`group inline-flex rounded-full bg-iridescent p-[2px] ${FOCUS} ${className}`} {...rest}>
        <span className="flex items-center gap-2.5 rounded-full bg-black py-3.5 pl-6 pr-4 text-base font-semibold tracking-[-0.03em] text-white shadow-[inset_0_0_16px_rgb(255_255_255/0.5)]">
          <RollText>{children}</RollText>
          <ArrowBadge className="bg-white/20" />
        </span>
      </Anchor>
    );
  }
  if (variant === 'glass') {
    return (
      <Anchor
        href={href}
        className={`group inline-flex items-center gap-2.5 rounded-full bg-white/25 py-3.5 pl-6 pr-4 text-base font-semibold tracking-[-0.03em] text-white shadow-[inset_0_0_16px_#fff] backdrop-blur-md transition-colors hover:bg-white/35 ${FOCUS} ${className}`}
        {...rest}
      >
        <RollText>{children}</RollText>
        <ArrowBadge className="bg-white/25" />
      </Anchor>
    );
  }
  return (
    <Anchor href={href} className={`group inline-flex items-center gap-2.5 text-base font-semibold tracking-[-0.03em] text-ink ${FOCUS} ${className}`} {...rest}>
      <RollText>{children}</RollText>
      <ArrowBadge className="bg-faint text-white" />
    </Anchor>
  );
}

// "001 • who we are" pill above each section heading.
export function SectionTag({ num, children, dark = false }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[-0.03em] ${dark ? 'bg-white/10' : 'bg-black/[0.03]'}`}>
      <span className={dark ? 'text-white/50' : 'text-black/40'}>{num}</span>
      <span className={`h-2 w-2 rounded-full ${dark ? 'bg-white' : 'bg-ink'}`} />
      <span className={dark ? 'text-white' : 'text-ink'}>{children}</span>
    </span>
  );
}

// Endless horizontal scroll. The children are rendered twice and the track moves by half its width,
// so the loop is seamless. Pauses on hover and stops for reduced motion.
// `gap` is in pixels; each copy also ends with that much padding so the two copies are exactly
// half the track each.
export function Marquee({ children, duration = 40, reverse = false, className = '', gap = 80 }) {
  const track = { gap, paddingRight: gap };
  return (
    <div
      className={`group/marquee flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] ${className}`}
    >
      <div
        className={`motion-safe-marquee flex w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} group-hover/marquee:[animation-play-state:paused]`}
        style={{ '--marquee-duration': `${duration}s` }}
      >
        <div className="flex shrink-0 items-center" style={track}>{children}</div>
        <div className="flex shrink-0 items-center" style={track} aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
