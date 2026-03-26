import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Youtube, Sparkles, Send, Loader2, Brain, Wand2, ArrowRight, Lightbulb, Video, Target } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { Link } from 'react-router-dom';

import { UserProfile } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Zap } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface YouTubeNicheMasterProps {
  user: UserProfile | null;
}

export default function YouTubeNicheMaster({ user }: YouTubeNicheMasterProps) {
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) return;

    if (!user) {
      toast.error('Please sign in to analyze niches.');
      return;
    }

    if (user.plan !== 'Premium' && user.credits <= 0) {
      toast.error('You have run out of daily AI credits. Upgrade to Featured or Premium for more!');
      return;
    }

    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the YouTube niche: "${niche}". 
        Provide:
        1. Market Analysis (Competition, Demand, Profitability)
        2. Top 10 Viral Script Ideas (with catchy titles and brief hooks)
        3. Recommended Tool Stack
        4. Monetization Strategy
        Format the response as JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              marketAnalysis: {
                type: Type.OBJECT,
                properties: {
                  competition: { type: Type.STRING },
                  demand: { type: Type.STRING },
                  profitability: { type: Type.STRING }
                },
                required: ['competition', 'demand', 'profitability']
              },
              scriptIdeas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    hook: { type: Type.STRING }
                  },
                  required: ['title', 'hook']
                }
              },
              toolStack: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              monetization: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['marketAnalysis', 'scriptIdeas', 'toolStack', 'monetization']
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResults(data);

      // Deduct credit if not premium
      if (user.plan !== 'Premium') {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          credits: Math.max(0, user.credits - 1)
        });
      }
    } catch (error) {
      console.error('YouTube Niche error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-500/10 text-red-500 text-xs font-black uppercase tracking-widest mb-6">
          <Youtube className="w-4 h-4 mr-2" />
          YouTube Niche Master
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-6 leading-none">
          FIND YOUR <span className="text-red-500">VIRAL NICHE</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          Enter a niche or topic, and our AI will analyze the market and give you 10 viral script ideas to start your channel.
        </p>
        
        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center space-x-2 px-4 py-2 glass rounded-full border-white/5"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold uppercase tracking-widest">
              {user.plan === 'Premium' ? 'Unlimited Credits' : `${user.credits} Credits Remaining`}
            </span>
          </motion.div>
        )}
      </div>

      <div className="max-w-3xl mx-auto mb-20">
        <form onSubmit={handleGenerate} className="relative">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-card border border-border rounded-2xl p-2">
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., 'AI News for Developers' or 'Minimalist Travel'"
                className="flex-grow bg-transparent border-none focus:ring-0 text-foreground px-6 py-4 text-lg"
              />
              <button
                type="submit"
                disabled={loading || !niche.trim()}
                className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold flex items-center hover:bg-red-500 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </form>
      </div>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Market Analysis */}
            <div className="lg:col-span-1 space-y-8">
              <div className="glass p-8 rounded-[32px] border-red-500/20">
                <h3 className="text-xl font-black mb-6 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-red-500" />
                  Market Analysis
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Competition</div>
                    <div className="text-sm font-bold">{results.marketAnalysis.competition}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Demand</div>
                    <div className="text-sm font-bold">{results.marketAnalysis.demand}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Profitability</div>
                    <div className="text-sm font-bold">{results.marketAnalysis.profitability}</div>
                  </div>
                </div>
              </div>

              <div className="glass p-8 rounded-[32px] border-red-500/20">
                <h3 className="text-xl font-black mb-6 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-red-500" />
                  Monetization
                </h3>
                <div className="space-y-3">
                  {results.monetization.map((item: string, i: number) => (
                    <div key={i} className="flex items-center text-sm font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-3" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Script Ideas */}
            <div className="lg:col-span-2 space-y-8">
              <div className="glass p-8 rounded-[40px] border-red-500/20">
                <h3 className="text-2xl font-black mb-8 flex items-center">
                  <Lightbulb className="w-6 h-6 mr-3 text-red-500" />
                  Top 10 Script Ideas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.scriptIdeas.map((idea: any, i: number) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-red-500/30 transition-all group">
                      <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Idea #{i + 1}</div>
                      <h4 className="text-lg font-black mb-3 group-hover:text-red-500 transition-colors">{idea.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">"{idea.hook}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-8 rounded-[32px] border-red-500/20">
                <h3 className="text-xl font-black mb-6 flex items-center">
                  <Video className="w-5 h-5 mr-2 text-red-500" />
                  Recommended Tool Stack
                </h3>
                <div className="flex flex-wrap gap-3">
                  {results.toolStack.map((tool: string, i: number) => (
                    <Link
                      key={i}
                      to={`/directory?search=${tool}`}
                      className="px-4 py-2 bg-white/5 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10"
                    >
                      {tool}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
