import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 group mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-black fill-black" />
              </div>
              <span className="text-xl font-bold tracking-tighter">
                TrendStack<span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Curating the future of AI. Discover trending tools, hidden gems, and upcoming startups before everyone else.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">Platform</h3>
            <ul className="space-y-4">
              <li><Link to="/directory" className="text-muted-foreground hover:text-primary text-sm transition-colors">AI Directory</Link></li>
              <li><Link to="/directory?filter=trending" className="text-muted-foreground hover:text-primary text-sm transition-colors">Trending Tools</Link></li>
              <li><Link to="/directory?filter=hidden" className="text-muted-foreground hover:text-primary text-sm transition-colors">Hidden Gems</Link></li>
              <li><Link to="/directory?filter=upcoming" className="text-muted-foreground hover:text-primary text-sm transition-colors">Upcoming Tools</Link></li>
              <li><Link to="/matcher" className="text-muted-foreground hover:text-primary text-sm transition-colors">AI Tool Matcher</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">Resources</h3>
            <ul className="space-y-4">
              <li><Link to="/news" className="text-muted-foreground hover:text-primary text-sm transition-colors">Tech News</Link></li>
              <li><Link to="/submit" className="text-muted-foreground hover:text-primary text-sm transition-colors">Submit a Tool</Link></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">API Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Affiliate Program</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">Newsletter</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Get the top 5 AI tools in 60 seconds. Every single day.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button className="w-full bg-primary text-black font-medium py-2 rounded-full hover:bg-primary/90 transition-colors text-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>© 2026 TrendStack AI. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
