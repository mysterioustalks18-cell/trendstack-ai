import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, Clock, Target, Save, Share2, Download, Loader2, Zap } from 'lucide-react';
import { generateWorkflow } from '../services/geminiService';
import { AIWorkflow, UserProfile } from '../types';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface AIWorkflowGeneratorProps {
  user: UserProfile | null;
}

export default function AIWorkflowGenerator({ user }: AIWorkflowGeneratorProps) {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [workflow, setWorkflow] = useState<AIWorkflow | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    if (!user) {
      toast.error('Please sign in to generate workflows.');
      return;
    }

    if (user.plan !== 'Premium' && user.credits <= 0) {
      toast.error('You have run out of daily AI credits. Upgrade to Featured or Premium for more!');
      return;
    }

    setLoading(true);
    try {
      const result = await generateWorkflow(goal);
      setWorkflow(result);
      
      // Deduct credit if not premium
      if (user.plan !== 'Premium') {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          credits: Math.max(0, user.credits - 1)
        });
      }
    } catch (error) {
      console.error('Error generating workflow:', error);
      toast.error('Failed to generate workflow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !workflow) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'workflows'), {
        ...workflow,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success('Workflow saved to your profile!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Execution Engine
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight"
          >
            Generate Your <span className="text-primary">AI Workflow</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Turn any goal into a step-by-step execution plan using the best AI tools on the market.
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

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleGenerate}
          className="relative mb-12"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-card border border-border rounded-2xl p-2">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., 'Create a viral YouTube channel for AI news'"
                className="flex-grow bg-transparent border-none focus:ring-0 text-foreground px-4 py-3 text-lg placeholder:text-muted-foreground/50"
              />
              <button
                type="submit"
                disabled={loading || !goal.trim()}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold flex items-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.form>

        <AnimatePresence>
          {workflow && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground flex items-center">
                  <Zap className="w-6 h-6 mr-2 text-primary" />
                  Execution Plan
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !user}
                    className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors disabled:opacity-50"
                    title={user ? "Save to Profile" : "Login to save"}
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  </button>
                  <button className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="grid gap-6">
                {workflow.workflow.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50"></div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="space-y-4 flex-grow">
                        <div>
                          <h3 className="text-xl font-bold text-foreground mb-1">{step.step}</h3>
                          <p className="text-muted-foreground">{step.description}</p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {step.tools.map((tool, tIdx) => (
                            <div key={tIdx} className="bg-accent/50 rounded-xl p-4 border border-border/50">
                              <div className="font-semibold text-primary mb-1">{tool.name}</div>
                              <div className="text-sm text-muted-foreground">{tool.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Execution Plan & Metrics */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-primary" />
                    Timeline: {workflow.executionPlan.timeline}
                  </h3>
                  <div className="space-y-4">
                    {workflow.executionPlan.phases.map((phase, idx) => (
                      <div key={idx} className="relative pl-6 border-l border-border pb-4 last:pb-0">
                        <div className="absolute top-0 -left-1.5 w-3 h-3 rounded-full bg-primary"></div>
                        <div className="font-semibold text-foreground">{phase.name}</div>
                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                          {phase.tasks.map((task, tIdx) => (
                            <li key={tIdx}>{task}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-primary" />
                    Success Metrics
                  </h3>
                  <div className="space-y-3">
                    {workflow.successMetrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                        {metric}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
