import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Tool, Goal, ToolStack, UserProfile } from '../types';
import { GOALS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, Zap, Rocket, CheckCircle2, ChevronRight, Loader2, Bot, Share2, Download, Plus } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function StackBuilder({ user }: { user: UserProfile | null }) {
  const [searchParams] = useSearchParams();
  const goalId = searchParams.get('goal');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [stack, setStack] = useState<ToolStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    const fetchTools = async () => {
      const snap = await getDocs(collection(db, 'tools'));
      setTools(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool)));
    };
    fetchTools();

    if (goalId) {
      setGoal(GOALS.find(g => g.id === goalId) || null);
    }
  }, [goalId]);

  const generateStack = async () => {
    if (!user) {
      toast.error('Please sign in to architect stacks.');
      return;
    }

    if (user.plan !== 'Premium' && user.credits <= 0) {
      toast.error('You have run out of daily AI credits. Upgrade to Featured or Premium for more!');
      return;
    }

    setLoading(true);
    try {
      const toolNames = tools.map(t => t.name).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Build a "Tool Stack" for the goal: ${goal?.title || customInput}. 
        Available tools: ${toolNames}. 
        Provide a detailed stack in JSON format with:
        - title: string (catchy name for the stack)
        - tools: string[] (IDs or names of 3-5 tools)
        - workflow: { step: string, toolId: string, description: string }[] (how they connect)
        Only return the JSON.`,
        config: { responseMimeType: 'application/json' }
      });

      const data = JSON.parse(response.text || '{}');
      setStack(data);

      // Deduct credit if not premium
      if (user.plan !== 'Premium') {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          credits: Math.max(0, user.credits - 1)
        });
      }
    } catch (error) {
      console.error('Stack generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="text-center mb-16">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Stack Builder
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-4 leading-none">
          Build Your <span className="text-primary">Perfect Stack</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-6">
          Tell us your goal, and our AI will architect a complete ecosystem of tools that work together seamlessly.
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
        <div className="glass rounded-[40px] p-8 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] -mr-16 -mt-16" />
          <div className="relative z-10">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center">
              <Bot className="w-4 h-4 mr-2 text-primary" />
              What are you building?
            </h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder={goal?.title || "e.g. A faceless YouTube channel about finance"}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-primary transition-colors"
              />
              <button
                onClick={generateStack}
                disabled={loading || (!goalId && !customInput)}
                className="px-10 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/10"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Architect Stack'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {stack ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-black tracking-tighter">{stack.title}</h2>
              <div className="flex space-x-4">
                <button className="p-3 glass border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-muted-foreground">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-3 glass border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-muted-foreground">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center">
                  <Plus className="w-4 h-4 mr-2 text-primary" />
                  The Stack
                </h3>
                {stack.tools.map((toolName, i) => (
                  <div key={toolName} className="glass rounded-3xl p-6 border-white/5 hover:border-primary/30 transition-all group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-primary group-hover:bg-primary group-hover:text-black transition-all">
                        0{i + 1}
                      </div>
                      <div>
                        <div className="font-black text-lg">{toolName}</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Primary Tool</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-secondary" />
                  The Workflow
                </h3>
                <div className="space-y-8 relative">
                  <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-white/5" />
                  {stack.workflow.map((step, i) => (
                    <div key={i} className="relative pl-16">
                      <div className="absolute left-4 top-0 w-4 h-4 rounded-full bg-primary border-4 border-black" />
                      <div className="glass rounded-[32px] p-8 border-white/5 hover:border-white/10 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div className="text-xs font-black uppercase tracking-widest text-primary">Step 0{i + 1}: {step.step}</div>
                          <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-secondary">
                            Using {step.toolId}
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : loading && (
          <div className="h-[400px] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2">Architecting Your Stack...</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Gemini is analyzing tool capabilities and workflow synergies to build your custom ecosystem.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
