import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Tool } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, Zap, Rocket, CheckCircle2, ChevronRight, Loader2, Bot, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { cn } from '../lib/utils';

export default function PredictionHub() {
  const [upcomingTools, setUpcomingTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const q = query(collection(db, 'tools'), where('upcoming', '==', true));
        const snap = await getDocs(q);
        setUpcomingTools(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool)));
      } catch (error) {
        console.error('Error fetching upcoming tools:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-bold mb-4">
          <Rocket className="w-4 h-4 mr-2" />
          Upcoming Tools Prediction Hub
        </div>
        <h1 className="text-7xl font-black tracking-tighter mb-4 leading-none">
          The <span className="text-secondary">Next Big Thing</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover the tools that are currently in beta or waitlist, predicted by our AI to disrupt the industry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-black tracking-tight flex items-center">
            <Zap className="w-6 h-6 mr-3 text-secondary" />
            Early Signals
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-[32px] h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {upcomingTools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-8">
          <div className="glass rounded-[40px] p-8 border-secondary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[80px] -mr-16 -mt-16" />
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-secondary" />
              Trend Intelligence
            </h3>
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs font-black uppercase tracking-widest text-secondary mb-1">Rising Star</div>
                <div className="text-lg font-black">Video Generation AI</div>
                <div className="text-xs text-muted-foreground mt-1">Growth: +240% this month</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs font-black uppercase tracking-widest text-primary mb-1">Stable Leader</div>
                <div className="text-lg font-black">LLM Orchestration</div>
                <div className="text-xs text-muted-foreground mt-1">Growth: +12% this month</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">Declining Interest</div>
                <div className="text-lg font-black">Basic Chatbot Wrappers</div>
                <div className="text-xs text-muted-foreground mt-1">Growth: -45% this month</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-[40px] p-8 border-white/10">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-primary" />
              Quality Score (QS)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              Our QS is a proprietary metric based on user engagement, review sentiment, and technical stability.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Innovation</span>
                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-primary" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Usability</span>
                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[92%] h-full bg-primary" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Community</span>
                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[74%] h-full bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-12 glass rounded-[60px] border-secondary/20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent pointer-events-none" />
        <Sparkles className="w-12 h-12 text-secondary mx-auto mb-6" />
        <h2 className="text-4xl font-black tracking-tighter mb-4">Be the First to Know</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          Join our exclusive waitlist for early access to the most promising AI tools before they hit the mainstream.
        </p>
        <div className="flex flex-col md:flex-row max-w-md mx-auto gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-grow bg-white/5 border border-white/10 rounded-full px-6 py-4 text-sm focus:outline-none focus:border-secondary transition-colors"
          />
          <button className="px-10 py-4 bg-secondary text-black font-black uppercase tracking-widest rounded-full hover:bg-secondary/90 transition-all shadow-2xl shadow-secondary/20">
            Join Waitlist
          </button>
        </div>
      </div>
    </div>
  );
}
