import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'

const links = [
  { to: '/newsletter-guide', label: 'Newsletter Guide' },
  { to: '/social-media-guide', label: 'Social Media' },
  { to: '/free-tools', label: 'Free Tools' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-glow-sm">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-white text-lg">Newsletter Wizard</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === l.to
                  ? 'bg-primary/15 text-primary'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://app.newsletterwizard.io"
            className="btn-primary text-sm px-4 py-2"
          >
            Try for Free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white/60 hover:text-white p-1"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/5 bg-surface-dark px-4 py-4 space-y-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                pathname === l.to
                  ? 'bg-primary/15 text-primary'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2">
            <a
              href="https://app.newsletterwizard.io"
              className="btn-primary text-sm w-full text-center block"
            >
              Try Newsletter Wizard Free
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
