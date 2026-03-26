import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, Bot, BrainCircuit, Target, Rocket, Briefcase, Wand2, Loader2, Zap } from 'lucide-react';
import { matchTools } from '../services/geminiService';
import { Tool, UserProfile } from '../types';

interface SmartQuizProps {
  user: UserProfile | null;
}
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ToolCard from '../components/ToolCard';
import { toast } from 'sonner';

const STEPS = [
  {
    id: 'role',
    question: "What's your primary role?",
    options: [
      { label: 'Content Creator', icon: Wand2, value: 'creator' },
      { label: 'Founder / Entrepreneur', icon: Rocket, value: 'founder' },
      { label: 'Professional / Employee', icon: Briefcase, value: 'professional' },
      { label: 'Freelancer', icon: Target, value: 'freelancer' },
    ]
  },
  {
    id: 'goal',
    question: "What's your main goal right now?",
    options: [
      { label: 'Save Time / Automate', icon: BrainCircuit, value: 'automation' },
      { label: 'Make More Money', icon: Sparkles, value: 'monetization' },
      { label: 'Improve Quality', icon: CheckCircle2, value: 'quality' },
      { label: 'Learn AI Skills', icon: Bot, value: 'learning' },
    ]
  }
];

export default function SmartQuiz({ user }: SmartQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ tools: Tool[]; reasoning: string } | null>(null);

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [STEPS[currentStep].id]: value };
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish(newAnswers);
    }
  };

  const handleFinish = async (finalAnswers: Record<string, string>) => {
    if (!user) {
      toast.error('Please sign in to get recommendations.');
      return;
    }

    if (user.plan !== 'Premium' && user.credits <= 0) {
      toast.error('You have run out of daily AI credits. Upgrade to Featured or Premium for more!');
      return;
    }

    setLoading(true);
    try {
      const query = `I am a ${finalAnswers.role} looking to ${finalAnswers.goal}. Recommend the best AI tools for me.`;
      const querySnapshot = await getDocs(collection(db, 'tools'));
      const allTools = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));
      
      const matched = await matchTools(query, allTools);
      setResults(matched);

      // Deduct credit if not premium
      if (user.plan !== 'Premium') {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          credits: Math.max(0, user.credits - 1)
        });
      }
    } catch (error) {
      console.error('Error finishing quiz:', error);
      toast.error('Failed to get recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter mb-4">AI <span className="text-primary">Smart Quiz</span></h1>
          <p className="text-muted-foreground mb-6">Answer 2 quick questions to get your personalized AI tool stack.</p>
          
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

        <div className="relative">
          <AnimatePresence mode="wait">
            {!results && !loading && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-8">{STEPS[currentStep].question}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {STEPS[currentStep].options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className="group glass p-8 rounded-3xl border-white/5 hover:border-primary/30 transition-all text-left flex items-center gap-6"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                          <option.icon className="w-7 h-7" />
                        </div>
                        <span className="text-xl font-bold group-hover:text-primary transition-colors">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground">Analyzing your needs...</h2>
                <p className="text-muted-foreground">Matching you with the best AI tools from our directory.</p>
              </motion.div>
            )}

            {results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 text-center">
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Your Personalized Stack
                  </div>
                  <p className="text-xl text-foreground italic leading-relaxed">"{results.reasoning}"</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setResults(null);
                      setCurrentStep(0);
                      setAnswers({});
                    }}
                    className="px-8 py-4 glass border border-white/10 font-bold rounded-full hover:bg-white/10 transition-all"
                  >
                    Retake Quiz
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
