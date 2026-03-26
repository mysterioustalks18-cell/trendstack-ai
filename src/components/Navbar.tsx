import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap, User, LogOut, Plus, Search } from 'lucide-react';
import { auth, signInWithGoogle, logout } from '../firebase';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  user: UserProfile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Directory', path: '/directory' },
    { name: 'News', path: '/news' },
    { name: 'Compare', path: '/compare' },
    { name: 'Predictions', path: '/predictions' },
    { name: 'Hidden Gems', path: '/directory?filter=hidden' },
    { name: 'Upcoming', path: '/directory?filter=upcoming' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'AI Workflow', path: '/workflow-generator' },
    { name: 'Smart Quiz', path: '/quiz' },
    { name: 'Tool Matcher', path: '/matcher' },
    { name: 'Niche Master', path: '/youtube-niche-master' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-black fill-black" />
              </div>
              <span className="text-xl font-bold tracking-tighter">
                TrendStack<span className="text-primary">AI</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === link.path ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/directory" className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <Search className="w-5 h-5" />
            </Link>
            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium text-primary hover:underline">
                    Admin
                  </Link>
                )}
                <Link to="/submit" className="text-sm font-medium bg-primary text-black px-4 py-2 rounded-full hover:bg-primary/90 transition-colors">
                  Submit Tool
                </Link>
                <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-primary transition-colors">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt={user.displayName} className="w-full h-full object-cover" />
                </Link>
                <button onClick={logout} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-sm font-medium border border-white/20 px-6 py-2 rounded-full hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-b border-white/10 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-primary hover:bg-white/5"
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-primary"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/submit"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-primary"
                  >
                    Submit Tool
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    signInWithGoogle();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-primary"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
