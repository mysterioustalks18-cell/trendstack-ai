import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Target, 
  Rocket, 
  ChevronRight, 
  Loader2,
  Lightbulb,
  BrainCircuit,
  Trophy,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface ToolMatcherProps {
  user: UserProfile | null;
}

interface MatchedTool {
  name: string;
  reason: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  bestFor: string;
  link?: string;
}

export default function ToolMatcher({ user }: ToolMatcherProps) {
  const [query, setQuery] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matches, setMatches] = useState<MatchedTool[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const findMatches = async (input: string) => {
    if (!input.trim()) return;
    
    if (!user) {
      toast.error('Please sign in to find matches.');
      return;
    }

    if (user.plan !== 'Premium' && user.credits <= 0) {
      toast.error('You have run out of daily AI credits. Upgrade to Featured or Premium for more!');
      return;
    }

    setIsMatching(true);
    setError(null);
    setMatches(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Act as an AI Tool Matcher. User wants to: "${input}". 
        Find 3-5 best AI tools for this task. 
        For each tool, provide:
        - name
        - reason (why it fits)
        - difficulty (Beginner, Intermediate, or Advanced)
        - bestFor (specific use case)
        Return the response in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
                    bestFor: { type: Type.STRING }
                  },
                  required: ["name", "reason", "difficulty", "bestFor"]
                }
              }
            },
            required: ["matches"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      setMatches(result.matches);

      // Deduct credit if not premium
      if (user.plan !== 'Premium') {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          credits: Math.max(0, user.credits - 1)
        });
      }
    } catch (err) {
      console.error('Matching error:', err);
      setError('Failed to find matches. Please try again.');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pt-24 pb-20 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />

      <div className="max-w-4xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6"
          >
            <BrainCircuit className="w-4 h-4 mr-2" />
            Intelligent Tool Matcher
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-none"
          >
            FIND YOUR PERFECT <br />
            <span className="text-primary">AI STACK.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            Tell us what you want to achieve, and our AI will match you with the best tools for your specific needs.
          </motion.p>

          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 inline-flex items-center space-x-2 px-4 py-2 glass rounded-full border-white/5"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold uppercase tracking-widest">
                {user.plan === 'Premium' ? 'Unlimited Credits' : `${user.credits} Credits Remaining`}
              </span>
            </motion.div>
          )}
        </div>

        {/* Input Section */}
        <div className="mb-12">
          <div className="relative glass rounded-[32px] p-2 border-white/10 focus-within:border-primary/50 transition-all duration-500">
            <div className="flex items-center">
              <div className="pl-6 pr-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <input
                type="text"
                placeholder="e.g., I want to create high-quality social media videos"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && findMatches(query)}
                className="flex-grow bg-transparent border-none focus:ring-0 text-lg font-medium py-6 placeholder:text-white/20"
              />
              <button
                onClick={() => findMatches(query)}
                disabled={isMatching || !query.trim()}
                className={cn(
                  "mr-2 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center",
                  query.trim() ? "bg-primary text-black hover:scale-105" : "bg-white/5 text-white/20 cursor-not-allowed"
                )}
              >
                {isMatching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Match
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {isMatching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="w-full h-full rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              </div>
              <h3 className="text-xl font-bold">Scanning the AI universe...</h3>
              <p className="text-muted-foreground mt-2">Finding the best matches for your goal.</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 text-center"
            >
              {error}
            </motion.div>
          )}

          {matches && !isMatching && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black tracking-tight flex items-center">
                  <Trophy className="w-6 h-6 mr-3 text-yellow-500" />
                  Top Recommendations
                </h2>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {matches.length} Matches Found
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {matches.map((tool, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass rounded-[32px] p-8 border-white/10 hover:border-primary/30 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-6">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        tool.difficulty === 'Beginner' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        tool.difficulty === 'Intermediate' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        "bg-purple-500/10 text-purple-400 border-purple-500/20"
                      )}>
                        {tool.difficulty}
                      </div>
                    </div>

                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shrink-0 group-hover:scale-110 transition-transform">
                        {tool.name[0]}
                      </div>
                      <div className="flex-grow pr-20">
                        <h3 className="text-2xl font-black mb-2 group-hover:text-primary transition-colors">{tool.name}</h3>
                        <p className="text-muted-foreground leading-relaxed mb-4">{tool.reason}</p>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-xs font-bold text-primary uppercase tracking-widest">
                            <Target className="w-3 h-3 mr-1.5" />
                            Best For: {tool.bestFor}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        High matching score for your goal
                      </div>
                      <Link 
                        to={`/directory?search=${tool.name}`}
                        className="flex items-center text-sm font-black text-primary hover:underline"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-12 p-10 rounded-[40px] bg-primary/10 border border-primary/20 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <h3 className="text-2xl font-black mb-4">Want a full execution plan?</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Our AI Workflow Architect can build a complete step-by-step strategy with these tools.
                </p>
                <Link
                  to="/workflow-generator"
                  className="inline-flex items-center px-8 py-4 bg-primary text-black font-black rounded-full hover:bg-primary/90 transition-all hover:scale-105"
                >
                  Architect My Workflow
                  <Rocket className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
