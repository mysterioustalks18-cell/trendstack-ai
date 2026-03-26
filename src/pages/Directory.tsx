import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Tool, UserProfile } from '../types';
import { SAMPLE_TOOLS } from '../constants';
import { Search, Filter, SlidersHorizontal, Grid, List as ListIcon, TrendingUp, Zap, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toggleBookmark } from '../lib/bookmarks';
import { getTrendingTools, searchToolsWithAI } from '../lib/gemini';
import { toast } from 'sonner';

// Components
import ToolCard from '../components/ToolCard';
import { cn } from '../lib/utils';

const CATEGORIES = ["All", "Writing", "Video", "Image", "Automation", "Coding", "Marketing", "Business", "Audio", "Productivity", "Research", "Social Media", "3D", "Design"];
const PRICING_MODELS = ["All", "Free", "Paid", "Freemium"];
const GROWTH_INDICATORS = ["All", "rising", "stable", "declining"];
const LAUNCH_STAGES = ["All", "beta", "waitlist", "live"];
const VERIFIED_STATUS = ["All", "Verified Only"];

interface DirectoryProps {
  user: UserProfile | null;
}

export default function Directory({ user }: DirectoryProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tools, setTools] = useState<Tool[]>([]);
  const [liveTools, setLiveTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<string[] | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleAISearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query first');
      return;
    }

    setAiSearchLoading(true);
    try {
      // We need to pass the current set of tools to Gemini for context
      // But Gemini might already know about some if we provide metadata.
      // For now, we'll pass the tools we have in state (which includes SAMPLE_TOOLS and liveTools)
      const results = await searchToolsWithAI(searchQuery, tools);
      setAiSearchResults(results);
      if (results.length === 0) {
        toast.info('AI couldn\'t find any perfect matches, but here are some related tools.');
      } else {
        toast.success(`AI found ${results.length} highly relevant tools!`);
      }
    } catch (error) {
      console.error('Error in AI search:', error);
      toast.error('AI search failed. Falling back to standard search.');
    } finally {
      setAiSearchLoading(false);
    }
  };

  const handleLiveDiscovery = async () => {
    setLiveLoading(true);
    try {
      const data = await getTrendingTools();
      const formattedTools = data.map((t: any, i: number) => ({
        id: `live-${Date.now()}-${i}`,
        ...t,
        logoUrl: `https://picsum.photos/seed/${t.name}/200/200`,
        verified: false,
        launchStage: 'live',
        rating: 4.5,
        reviewsCount: 0,
        useCases: [],
        pros: [],
        cons: [],
        alternatives: [],
        createdAt: new Date().toISOString()
      }));
      setLiveTools(prev => [...formattedTools, ...prev]);
      toast.success(`Discovered ${formattedTools.length} new trending tools!`);
    } catch (error) {
      console.error('Error in live discovery:', error);
      toast.error('Failed to fetch trending tools');
    } finally {
      setLiveLoading(false);
    }
  };
  
  const currentCategory = searchParams.get('category') || 'All';
  const currentPricing = searchParams.get('pricing') || 'All';
  const currentFilter = searchParams.get('filter') || 'All';
  const currentGrowth = searchParams.get('growth') || 'All';
  const currentStage = searchParams.get('stage') || 'All';
  const currentVerified = searchParams.get('verified') || 'All';
  const searchQuery = searchParams.get('search') || '';

  const handleBookmark = async (e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to bookmark tools');
      navigate('/auth');
      return;
    }

    const isBookmarked = user.bookmarks.includes(toolId);
    await toggleBookmark(user.uid, toolId, isBookmarked);
  };

  useEffect(() => {
    const fetchTools = async () => {
      setLoading(true);
      try {
        const toolsRef = collection(db, 'tools');
        let q = query(toolsRef, orderBy('createdAt', 'desc'));

        if (currentCategory !== 'All') {
          q = query(q, where('category', '==', currentCategory));
        }
        if (currentPricing !== 'All') {
          q = query(q, where('pricing', '==', currentPricing));
        }
        if (currentGrowth !== 'All') {
          q = query(q, where('growthIndicator', '==', currentGrowth));
        }
        if (currentStage !== 'All') {
          q = query(q, where('launchStage', '==', currentStage));
        }
        if (currentVerified === 'Verified Only') {
          q = query(q, where('verified', '==', true));
        }
        if (currentFilter === 'trending') {
          q = query(q, where('trending', '==', true));
        }
        if (currentFilter === 'hidden') {
          q = query(q, where('hidden', '==', true));
        }
        if (currentFilter === 'upcoming') {
          q = query(q, where('upcoming', '==', true));
        }

        const snap = await getDocs(q);
        let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));

        // Merge with SAMPLE_TOOLS and liveTools, avoiding duplicates by ID
        const allTools = [...results, ...liveTools];
        const resultIds = new Set(allTools.map(r => r.id));
        
        SAMPLE_TOOLS.forEach(sample => {
          if (!resultIds.has(sample.id)) {
            // Apply current filters to sample tools
            let matches = true;
            if (currentCategory !== 'All' && sample.category !== currentCategory) matches = false;
            if (currentPricing !== 'All' && sample.pricing !== currentPricing) matches = false;
            if (currentGrowth !== 'All' && sample.growthIndicator !== currentGrowth) matches = false;
            if (currentStage !== 'All' && sample.launchStage !== currentStage) matches = false;
            if (currentVerified === 'Verified Only' && !sample.verified) matches = false;
            if (currentFilter === 'trending' && !sample.trending) matches = false;
            if (currentFilter === 'hidden' && !sample.hidden) matches = false;
            if (currentFilter === 'upcoming' && !sample.upcoming) matches = false;
            
            if (matches) {
              allTools.push(sample);
            }
          }
        });

        let filteredResults = allTools;
        
        // Apply AI search results if they exist
        if (aiSearchResults !== null) {
          filteredResults = filteredResults.filter(t => aiSearchResults.includes(t.id));
        } else if (searchQuery) {
          // Client-side search for demo/simplicity
          filteredResults = filteredResults.filter(t => 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setTools(filteredResults);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'tools');
      } finally {
        setLoading(false);
      }
    };

    fetchTools();
  }, [currentCategory, currentPricing, currentFilter, currentGrowth, currentStage, currentVerified, searchQuery, liveTools, aiSearchResults]);

  const updateParam = (key: string, value: string) => {
    // Clear AI search results when standard filters change
    setAiSearchResults(null);
    const newParams = new URLSearchParams(searchParams);
    if (value === 'All') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiSearchResults(null);
    updateParam('search', e.target.value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">AI Tools Directory</h1>
          <p className="text-muted-foreground">Discover over 2,500+ curated AI tools for every use case.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-[500px] flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tools, categories, use cases..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-3 focus:outline-none focus:border-primary transition-colors glass"
              />
            </div>
            <button
              onClick={handleAISearch}
              disabled={aiSearchLoading || !searchQuery.trim()}
              className={cn(
                "flex items-center px-4 py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 whitespace-nowrap border",
                aiSearchResults !== null 
                  ? "bg-primary text-black border-primary shadow-lg shadow-primary/20" 
                  : "bg-white/5 text-primary border-primary/30 hover:bg-primary/10"
              )}
              title="AI-Powered Search"
            >
              {aiSearchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className={cn("w-4 h-4", aiSearchResults !== null && "fill-black")} />
              )}
              <span className="ml-2 hidden sm:inline">AI Search</span>
            </button>
          </div>
          <button
            onClick={handleLiveDiscovery}
            disabled={liveLoading}
            className="flex items-center px-6 py-3 bg-primary text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all disabled:opacity-50 whitespace-nowrap shadow-lg shadow-primary/20"
          >
            {liveLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Live AI Discover
          </button>
        </div>
      </div>

      <AnimatePresence>
        {aiSearchResults !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 flex items-center justify-between glass p-4 rounded-2xl border-primary/30 bg-primary/5"
          >
            <div className="flex items-center text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary mr-2" />
              <span>AI has filtered the directory to show the most relevant matches for your query.</span>
            </div>
            <button 
              onClick={() => setAiSearchResults(null)}
              className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
            >
              Clear AI Filter
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Categories
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => updateParam('category', cat)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all text-left",
                    currentCategory === cat ? "bg-primary text-black" : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Pricing
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {PRICING_MODELS.map(p => (
                <button
                  key={p}
                  onClick={() => updateParam('pricing', p)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all text-left",
                    currentPricing === p ? "bg-primary text-black" : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Growth
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {GROWTH_INDICATORS.map(g => (
                <button
                  key={g}
                  onClick={() => updateParam('growth', g)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all text-left capitalize",
                    currentGrowth === g ? "bg-primary text-black" : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Launch Stage
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {LAUNCH_STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => updateParam('stage', s)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all text-left capitalize",
                    currentStage === s ? "bg-primary text-black" : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              Status
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {VERIFIED_STATUS.map(v => (
                <button
                  key={v}
                  onClick={() => updateParam('verified', v)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all text-left",
                    currentVerified === v ? "bg-primary text-black" : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground font-medium">
              Showing <span className="text-foreground">{tools.length}</span> tools
            </div>
            <div className="flex items-center space-x-2 glass p-1 rounded-xl border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'grid' ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-white")}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-lg transition-colors", viewMode === 'list' ? "bg-white/10 text-primary" : "text-muted-foreground hover:text-white")}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
                ))}
              </motion.div>
            ) : tools.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "grid gap-6",
                  viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                )}
              >
                {tools.map(tool => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    isBookmarked={user?.bookmarks.includes(tool.id)}
                    onBookmark={(e) => handleBookmark(e, tool.id)}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 glass rounded-3xl"
              >
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">No tools found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                <button
                  onClick={() => setSearchParams({})}
                  className="mt-6 text-primary hover:underline font-medium"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
