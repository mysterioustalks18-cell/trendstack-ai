import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, ArrowRight, Loader2, Bot, BrainCircuit, CheckCircle2, Zap } from 'lucide-react';
import { matchTools } from '../services/geminiService';
import { Tool, UserProfile } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { SAMPLE_TOOLS } from '../constants';
import ToolCard from './ToolCard';
import { toast } from 'sonner';

export default function AIToolMatcher() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ tools: Tool[]; reasoning: string } | null>(null);
  const [allTools, setAllTools] = useState<Tool[]>([]);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tools'));
        const firestoreTools = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));
        
        // Merge with SAMPLE_TOOLS, avoiding duplicates by ID
        const merged = [...firestoreTools];
        const ids = new Set(firestoreTools.map(t => t.id));
        SAMPLE_TOOLS.forEach(sample => {
          if (!ids.has(sample.id)) {
            merged.push(sample);
          }
        });
        
        setAllTools(merged);
      } catch (error) {
        console.error('Error fetching tools for matcher:', error);
        setAllTools(SAMPLE_TOOLS);
      }
    };
    fetchTools();
  }, []);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const matched = await matchTools(query, allTools);
      setResults(matched);
    } catch (error) {
      console.error('Error matching tools:', error);
      toast.error('Failed to match tools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleMatch} className="relative mb-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-card border border-border rounded-2xl p-2">
            <div className="pl-4 text-muted-foreground">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your problem (e.g., 'I need to automate my social media posts')"
              className="flex-grow bg-transparent border-none focus:ring-0 text-foreground px-4 py-4 text-lg placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold flex items-center hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Match Tools
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-8"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center text-primary font-bold mb-2">
                <BrainCircuit className="w-5 h-5 mr-2" />
                AI Recommendation
              </div>
              <p className="text-foreground leading-relaxed italic">"{results.reasoning}"</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.tools.map((tool, idx) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <ToolCard tool={tool} />
                </motion.div>
              ))}
            </div>

            {results.tools.length === 0 && (
              <div className="text-center py-12 glass rounded-2xl border-white/5">
                <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No direct matches found</h3>
                <p className="text-muted-foreground">Try rephrasing your query or explore the directory.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
