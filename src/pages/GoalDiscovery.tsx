import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Tool, Goal } from '../types';
import { GOALS, SAMPLE_TOOLS } from '../constants';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Zap, Rocket, CheckCircle2, ChevronRight, Youtube, ArrowRight } from 'lucide-react';
import ToolCard from '../components/ToolCard';
import { cn } from '../lib/utils';

export default function GoalDiscovery() {
  const { goalId } = useParams();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoalData = async () => {
      const currentGoal = GOALS.find(g => g.id === goalId);
      if (!currentGoal) return;
      setGoal(currentGoal);

      try {
        const categories = getCategoriesForGoal(goalId!);
        const q = query(collection(db, 'tools'), where('category', 'in', categories));
        const snap = await getDocs(q);
        const firestoreTools = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));
        
        // Merge with SAMPLE_TOOLS, avoiding duplicates by ID
        const merged = [...firestoreTools];
        const ids = new Set(firestoreTools.map(t => t.id));
        SAMPLE_TOOLS.filter(t => categories.includes(t.category)).forEach(sample => {
          if (!ids.has(sample.id)) {
            merged.push(sample);
          }
        });
        
        setTools(merged);
      } catch (error) {
        console.error('Error fetching goal tools:', error);
        const categories = getCategoriesForGoal(goalId!);
        setTools(SAMPLE_TOOLS.filter(t => categories.includes(t.category)));
      } finally {
        setLoading(false);
      }
    };

    fetchGoalData();
  }, [goalId]);

  const getCategoriesForGoal = (id: string) => {
    switch (id) {
      case 'make-money': return ['Marketing', 'Business', 'Automation'];
      case 'youtube-videos': return ['Video', 'Image', 'Writing'];
      case 'get-job': return ['Writing', 'Productivity', 'Business'];
      case 'automate-business': return ['Automation', 'Coding', 'Productivity'];
      case 'content-creation': return ['Writing', 'Image', 'Marketing'];
      default: return [];
    }
  };

  if (!goal) return <div>Goal not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
        <div className="lg:col-span-2">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-6">
            <Rocket className="w-4 h-4 mr-2" />
            Goal-Based Discovery
          </div>
          <h1 className="text-6xl font-black tracking-tighter mb-6 leading-none">
            {goal.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            {goal.description}
          </p>
        </div>

        <div className="lg:col-span-1">
          <div className="glass rounded-[40px] p-8 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] -mr-16 -mt-16" />
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-primary" />
              The Workflow
            </h3>
            <div className="space-y-6">
              {goal.workflowSteps.map((step, i) => (
                <div key={step} className="flex items-start space-x-4">
                  <div className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                    0{i + 1}
                  </div>
                  <div className="text-sm font-bold text-white/80">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12 flex items-center justify-between">
        <h2 className="text-2xl font-black tracking-tight">Recommended Tools</h2>
        <div className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
          {tools.length} Tools Found
        </div>
      </div>

      {goalId === 'youtube-videos' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 p-8 glass rounded-[40px] border-red-500/20 bg-red-500/5 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-3xl bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/20">
              <Youtube className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2">YouTube Niche Master</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Struggling to find a niche? Use our AI to analyze the market and get 10 viral script ideas instantly.
              </p>
            </div>
          </div>
          <Link
            to="/youtube-niche-master"
            className="px-8 py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-full hover:bg-red-500 transition-all whitespace-nowrap"
          >
            Launch Tool <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-[32px] h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      <div className="mt-20 p-12 glass rounded-[60px] border-primary/20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
        <h2 className="text-4xl font-black tracking-tighter mb-4">Need a Custom Stack?</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          Let our AI build you a personalized stack of tools tailored exactly to your unique project requirements.
        </p>
        <Link
          to={`/stack-builder?goal=${goal.id}`}
          className="inline-flex items-center px-10 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-full hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20"
        >
          Generate My Stack <ChevronRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
    </div>
  );
}
