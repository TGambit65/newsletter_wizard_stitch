import { Link } from 'react-router-dom'
import { Zap, Twitter, Linkedin, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface-dark/50 mt-24">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-white">Newsletter Wizard</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              AI-powered newsletters that sound like you. Your knowledge base. Your voice. At scale.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="text-white/40 hover:text-white/80 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="text-white/40 hover:text-white/80 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="text-white/40 hover:text-white/80 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Free Guides */}
          <div>
            <h4 className="font-display font-semibold text-white/80 text-sm mb-3">Free Guides</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/newsletter-guide" className="text-white/50 hover:text-white/80 transition-colors">Newsletter Best Practices</Link></li>
              <li><Link to="/social-media-guide" className="text-white/50 hover:text-white/80 transition-colors">Social Media by Platform</Link></li>
              <li><Link to="/free-tools" className="text-white/50 hover:text-white/80 transition-colors">Free Writing Tools</Link></li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-white/80 text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-white/50 hover:text-white/80 transition-colors">Features</a></li>
              <li><a href="#" className="text-white/50 hover:text-white/80 transition-colors">Pricing</a></li>
              <li><a href="#" className="text-white/50 hover:text-white/80 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white/50 hover:text-white/80 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/30">
          <span>© 2026 Newsletter Wizard. All rights reserved.</span>
          <span>Built for creators who take publishing seriously.</span>
        </div>
      </div>
    </footer>
  )
}
