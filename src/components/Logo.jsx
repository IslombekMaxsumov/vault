// The VAULT mark: an archive bracket (one connected stroke, like the corner of
// a filing tab) holding three session marks of rising height. The last mark is
// the burnt-orange "Session Trace". The wordmark is set in Golos Text 800.
export function Mark({ size = 24, className = "" }) {
  return (
    <svg className={`mark ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3.5 3v17.5H21" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
      <path d="M8.5 16.5v-4M12.75 16.5v-7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
      <path d="M17 16.5V5" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="square" />
    </svg>
  );
}

export function Logo({ size = 22 }) {
  return (
    <span className="logo">
      <Mark size={size} />
      <span className="logo-word">VAULT</span>
    </span>
  );
}
