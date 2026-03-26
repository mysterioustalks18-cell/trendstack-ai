import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Newspaper, Globe, ArrowRight, Loader2, Brain, Zap, ExternalLink, RefreshCw, X } from 'lucide-react';
import { getLiveTechNews, discoverHiddenGems } from '../lib/gemini';
import { cn } from '../lib/utils';

export default function DailyDiscovery() {
  const [activeTab, setActiveTab] = useState<'news' | 'gems'>('news');
  const [news, setNews] = useState<any[]>([]);
  const [gems, setGems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'news') {
        const data = await getLiveTechNews();
        setNews(data);
      } else {
        const data = await discoverHiddenGems();
        setGems(data);
      }
    } catch (error) {
      console.error("Error in DailyDiscovery:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  return (
    <div className="glass rounded-[40px] p-8 md:p-12 border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 mb-4">
              <Sparkles className="w-3 h-3 mr-2 animate-pulse" />
              AI Discovery Engine
            </div>
            <h2 className="text-4xl font-black tracking-tighter leading-none">
              LIVE <span className="text-primary">INTELLIGENCE</span>
            </h2>
          </div>

          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('news')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center",
                activeTab === 'news' ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
              )}
            >
              <Newspaper className="w-4 h-4 mr-2" />
              Daily News
            </button>
            <button
              onClick={() => setActiveTab('gems')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center",
                activeTab === 'gems' ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
              )}
            >
              <Zap className="w-4 h-4 mr-2" />
              Hidden Gems
            </button>
          </div>
        </div>

        <div className="min-h-[400px]">
          {loading ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground font-bold animate-pulse">Consulting the AI Oracle...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {activeTab === 'news' ? (
                news.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedNews(item)}
                    className="group glass p-6 rounded-3xl border-white/5 hover:border-primary/30 transition-all flex flex-col cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest px-2 py-1 bg-primary/10 rounded-lg">
                        {item.source}
                      </span>
                      <div className="text-muted-foreground group-hover:text-primary transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-lg font-black mb-3 group-hover:text-primary transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-grow">
                      {item.summary}
                    </p>
                    <div className="mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                        <Brain className="w-3 h-3 mr-1.5" /> Why it matters
                      </div>
                      <p className="text-xs italic text-white/60 leading-relaxed">
                        {item.insight}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                gems.map((gem, i) => (
                  <div key={i} className="group glass p-6 rounded-3xl border-white/5 hover:border-primary/30 transition-all flex flex-col">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-all">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black mb-1 group-hover:text-primary transition-colors">
                      {gem.name}
                    </h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">
                      {gem.tagline}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-grow">
                      {gem.description}
                    </p>
                    <div className="mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center text-[10px] font-black text-secondary uppercase tracking-widest mb-2">
                        <Sparkles className="w-3 h-3 mr-1.5" /> Unique Factor
                      </div>
                      <p className="text-xs italic text-white/60 leading-relaxed mb-4">
                        {gem.uniqueFactor}
                      </p>
                      <a 
                        href={gem.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs font-black uppercase tracking-widest text-primary hover:underline"
                      >
                        Visit Tool <ArrowRight className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </div>

        {!loading && (
          <div className="mt-12 flex justify-center">
            <button 
              onClick={fetchData}
              className="flex items-center px-6 py-3 glass border border-white/10 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Discovery
            </button>
          </div>
        )}
      </div>

      {/* News Detail Modal */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNews(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-[40px] p-8 md:p-12 border-primary/20 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedNews(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 mb-6">
                {selectedNews.source}
              </div>

              <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-tight mb-6">
                {selectedNews.title}
              </h2>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <div className="bg-primary/5 rounded-3xl p-6 border-l-4 border-primary">
                  <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                    <Brain className="w-3 h-3 mr-1.5" /> AI Insight
                  </div>
                  <p className="text-sm font-bold italic text-white/80">
                    {selectedNews.insight}
                  </p>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-lg font-medium text-white/90 mb-4">
                    {selectedNews.summary}
                  </p>
                  <div className="h-px bg-white/10 my-8" />
                  <div className="text-base space-y-4 whitespace-pre-wrap">
                    {selectedNews.detailedExplanation}
                  </div>
                </div>

                <div className="pt-8 flex items-center justify-between">
                  <a 
                    href={selectedNews.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
                  >
                    Read Full Article <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
