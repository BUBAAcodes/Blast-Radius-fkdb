// The Blast Radius mark: a failing node (pink) with its blast radius rippling out (teal).
export default function Logo({ className }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="#2dd4bf" strokeOpacity="0.25" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="#2dd4bf" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="4" fill="#fb7185" />
    </svg>
  );
}
