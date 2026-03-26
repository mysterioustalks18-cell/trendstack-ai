import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Bot, ArrowRight, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Tool } from '../types';
import { Link } from 'react-router-dom';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function RecommendationEngine() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an AI tool expert. Based on the user's request: "${query}", suggest 3-5 of the best AI tools. 
        Format the response as a JSON array of objects with: name, reason (short explanation), category, and pricing.
        Only return the JSON array.`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const data = JSON.parse(response.text || '[]');
      setRecommendations(data);
    } catch (error) {
      console.error('Recommendation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Discovery
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-4">What do you want to build today?</h2>
          <p className="text-muted-foreground text-lg">
            Describe your project or problem, and our AI will find the perfect stack for you.
          </p>
        </div>

        <form onSubmit={handleRecommend} className="relative mb-12">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'I want to create viral short-form videos for TikTok'"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 pr-16 text-lg focus:outline-none focus:border-primary/50 transition-all glass shadow-2xl"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-primary text-black rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
          </button>
        </form>

        <AnimatePresence>
          {recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {recommendations.map((rec, i) => (
                <motion.div
                  key={rec.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-6 rounded-2xl border-primary/20 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {rec.pricing}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{rec.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {rec.reason}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10">
                      {rec.category}
                    </span>
                    <Link to={`/directory?search=${rec.name}`} className="text-primary hover:underline text-sm flex items-center">
                      Details <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
