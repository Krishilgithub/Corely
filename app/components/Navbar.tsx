import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icon">C</div>
          <span className="navbar-logo-text">Corely</span>
        </Link>

        {/* Nav Links */}
        <ul className="navbar-nav">
          <li><a href="#features">Features</a></li>
          <li><a href="#architecture">Architecture</a></li>
          <li><a href="#security">Security</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          <Link href="/dashboard" className="btn-ghost">Login</Link>
          <Link href="/dashboard" className="btn-primary">
            See Corely in Action
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M7.5 1.5L13 7l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
