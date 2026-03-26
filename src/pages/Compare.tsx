import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Tool } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, Loader2, Zap, Shield, Rocket, Bot, Search } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Compare() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTools = async () => {
      const snap = await getDocs(collection(db, 'tools'));
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));
      setTools(results.length > 0 ? results : SAMPLE_TOOLS);
    };
    fetchTools();
  }, []);

  const handleCompare = async () => {
    if (selectedTools.length < 2) return;
    setLoading(true);
    try {
      const toolNames = selectedTools.map(t => t.name).join(' and ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Compare these AI tools: ${toolNames}. 
        Provide a detailed comparison in JSON format with:
        - winner: string (which tool is better overall)
        - keyDifferences: string[]
        - bestFor: { [toolName: string]: string }
        - verdict: string (final recommendation)
        - features: { name: string, scores: { [toolName: string]: number } }[] (scores 1-10)
        Only return the JSON.`,
        config: { responseMimeType: 'application/json' }
      });

      const data = JSON.parse(response.text || '{}');
      setComparison(data);
    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = (tool: Tool) => {
    if (selectedTools.find(t => t.id === tool.id)) {
      setSelectedTools(selectedTools.filter(t => t.id !== tool.id));
    } else if (selectedTools.length < 3) {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
          <Sparkles className="w-4 h-4 mr-2" />
          AI-Powered Comparison
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-4">Compare AI Tools</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select up to 3 tools to see a deep-dive comparison powered by Gemini AI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Tool Selection Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="glass rounded-2xl p-4 border-white/5 max-h-[600px] overflow-y-auto space-y-2 scrollbar-hide">
            {filteredTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => toggleTool(tool)}
                className={cn(
                  "w-full flex items-center p-3 rounded-xl border transition-all text-left group",
                  selectedTools.find(t => t.id === tool.id)
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-white/5 border-white/5 hover:border-white/20 text-muted-foreground"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 mr-3 overflow-hidden">
                  <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <div className="text-sm font-bold group-hover:text-white transition-colors">{tool.name}</div>
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-60">{tool.category}</div>
                </div>
                {selectedTools.find(t => t.id === tool.id) && <CheckCircle2 className="w-4 h-4" />}
              </button>
            ))}
          </div>

          <button
            onClick={handleCompare}
            disabled={selectedTools.length < 2 || loading}
            className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xl shadow-primary/10"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Compare Now'}
          </button>
        </aside>

        {/* Comparison Results */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {comparison ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Winner Card */}
                <div className="glass rounded-[40px] p-8 md:p-12 border-primary/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center text-primary font-bold uppercase tracking-widest text-xs mb-4">
                      <Zap className="w-4 h-4 mr-2" />
                      AI Verdict
                    </div>
                    <h2 className="text-4xl font-black tracking-tight mb-6">
                      THE WINNER IS <span className="text-primary">{comparison.winner.toUpperCase()}</span>
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                      {comparison.verdict}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                          Key Differences
                        </h3>
                        <ul className="space-y-3">
                          {comparison.keyDifferences.map((diff: string) => (
                            <li key={diff} className="text-sm text-muted-foreground flex items-start">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3 mt-1.5 flex-shrink-0" />
                              {diff}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center">
                          <Rocket className="w-4 h-4 mr-2 text-secondary" />
                          Best For
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(comparison.bestFor).map(([name, reason]: [any, any]) => (
                            <div key={name} className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-xs font-bold text-primary mb-1">{name}</div>
                              <div className="text-xs text-muted-foreground">{reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Scores Table */}
                <div className="glass rounded-3xl p-8 border-white/5">
                  <h3 className="text-xl font-bold mb-8">Feature Comparison</h3>
                  <div className="space-y-8">
                    {comparison.features.map((feature: any) => (
                      <div key={feature.name}>
                        <div className="text-sm font-bold mb-4 uppercase tracking-wider">{feature.name}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {selectedTools.map(tool => (
                            <div key={tool.id} className="space-y-2">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-muted-foreground">{tool.name}</span>
                                <span className="text-primary">{feature.scores[tool.name]}/10</span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${feature.scores[tool.name] * 10}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-primary to-secondary"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center text-center glass rounded-[40px] border-dashed border-white/10">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Bot className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready to Compare?</h2>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Select at least two tools from the sidebar and click "Compare Now" to get an AI-powered analysis.
                </p>
                <div className="mt-8 flex items-center space-x-4">
                  {selectedTools.map(t => (
                    <div key={t.id} className="relative group">
                      <div className="w-12 h-12 rounded-xl glass border border-primary/30 overflow-hidden">
                        <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => toggleTool(t)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {selectedTools.length < 2 && (
                    <div className="w-12 h-12 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-muted-foreground">
                      +
                    </div>
                  )}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const SAMPLE_TOOLS: Tool[] = [
  {
    id: '1',
    name: 'Jasper',
    tagline: 'AI Content Platform for Teams',
    description: 'Jasper is an AI content platform that helps teams create high-quality content faster.',
    logoUrl: 'https://picsum.photos/seed/jasper/200/200',
    category: 'Writing',
    pricing: 'Paid',
    trending: true,
    rating: 4.8,
    reviewsCount: 1250,
    websiteUrl: 'https://jasper.ai',
    useCases: ['Blog posts', 'Ad copy', 'Email marketing'],
    pros: ['Fast', 'High quality', 'Team collaboration'],
    cons: ['Expensive'],
    alternatives: ['Copy.ai', 'Writesonic'],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Copy.ai',
    tagline: 'AI Copywriter for Teams',
    description: 'Copy.ai is an AI-powered copywriter that generates high-quality marketing copy for your business.',
    logoUrl: 'https://picsum.photos/seed/copyai/200/200',
    category: 'Writing',
    pricing: 'Freemium',
    trending: true,
    rating: 4.7,
    reviewsCount: 890,
    websiteUrl: 'https://copy.ai',
    useCases: ['Social media', 'Product descriptions', 'Emails'],
    pros: ['Easy to use', 'Generous free tier'],
    cons: ['Less advanced than Jasper'],
    alternatives: ['Jasper', 'Writesonic'],
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Midjourney',
    tagline: 'Generative AI for Stunning Images',
    description: 'Midjourney is an independent research lab exploring new mediums of thought.',
    logoUrl: 'https://picsum.photos/seed/midjourney/200/200',
    category: 'Image',
    pricing: 'Paid',
    trending: true,
    rating: 4.9,
    reviewsCount: 5400,
    websiteUrl: 'https://midjourney.com',
    useCases: ['Digital art', 'Concept design'],
    pros: ['Unmatched quality'],
    cons: ['Discord only'],
    alternatives: ['DALL-E 3', 'Stable Diffusion'],
    createdAt: new Date().toISOString()
  }
];
