import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { News as NewsType, TrendingTrend, Prediction, UserProfile } from '../types';
import { SAMPLE_NEWS, SAMPLE_TRENDING, SAMPLE_PREDICTIONS } from '../constants';
import { getLiveTechNews, getDailyAISummary } from '../lib/gemini';
import { 
  Newspaper, 
  Calendar, 
  User, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Globe, 
  Zap, 
  Rocket, 
  Brain, 
  Clock, 
  Flame, 
  ChevronRight,
  Mail,
  Share2,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
  Quote,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const LockedContent = ({ minPlan, featureName }: { minPlan: string, featureName: string }) => (
  <div className="glass rounded-[40px] p-12 md:p-20 text-center border-primary/20 bg-primary/5 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
    <div className="relative z-10 max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20">
        <Lock className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-4xl font-black tracking-tighter mb-6 uppercase">
        Unlock {featureName}
      </h2>
      <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
        This exclusive feature is available for <span className="text-primary font-black">{minPlan}</span> members and above. 
        Upgrade your plan to get real-time AI intelligence and hidden tool discoveries.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link 
          to="/pricing"
          className="w-full sm:w-auto px-10 py-5 bg-primary text-black font-black rounded-full hover:bg-primary/90 transition-all hover:scale-105 shadow-xl shadow-primary/20 text-sm uppercase tracking-widest"
        >
          View Pricing Plans
        </Link>
        <Link 
          to="/auth"
          className="w-full sm:w-auto px-10 py-5 glass border-white/10 text-white font-black rounded-full hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
        >
          Sign In
        </Link>
      </div>
    </div>
  </div>
);

export default function News({ user }: { user: UserProfile | null }) {
  const [news, setNews] = useState<NewsType[]>([]);
  const [liveNews, setLiveNews] = useState<any[]>([]);
  const [hiddenGems, setHiddenGems] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [trending, setTrending] = useState<TrendingTrend[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [gemsLoading, setGemsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'live' | 'gems' | 'trending' | 'predictions'>('feed');
  const [selectedLiveNews, setSelectedLiveNews] = useState<any | null>(null);

  const fetchDailySummary = async () => {
    setSummaryLoading(true);
    try {
      const summary = await getDailyAISummary();
      setDailySummary(summary);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchLiveNews = async () => {
    setLiveLoading(true);
    try {
      const data = await getLiveTechNews();
      setLiveNews(data);
    } catch (error) {
      console.error('Error fetching live news:', error);
    } finally {
      setLiveLoading(false);
    }
  };

  const fetchHiddenGems = async () => {
    setGemsLoading(true);
    try {
      const { discoverHiddenGems } = await import('../lib/gemini');
      const data = await discoverHiddenGems();
      setHiddenGems(data);
    } catch (error) {
      console.error('Error fetching hidden gems:', error);
    } finally {
      setGemsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'live' && liveNews.length === 0) {
      fetchLiveNews();
    }
    if (activeTab === 'gems' && hiddenGems.length === 0) {
      fetchHiddenGems();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // In a real app, these would be separate collections or filtered queries
        const newsRef = collection(db, 'news');
        const q = query(newsRef, orderBy('publishedAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsType));
        
        if (results.length === 0) {
          setNews(SAMPLE_NEWS);
          setTrending(SAMPLE_TRENDING);
          setPredictions(SAMPLE_PREDICTIONS);
        } else {
          setNews(results);
          // For demo, we still use samples if firestore doesn't have these specific types
          setTrending(SAMPLE_TRENDING);
          setPredictions(SAMPLE_PREDICTIONS);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchDailySummary();
  }, []);

  const isFree = !user || user.plan === 'Starter';
  const displayNews = isFree ? (news || []).slice(0, 3) : (news || []);
  const dailyDigest = (displayNews || []).slice(0, 5);

  const planHierarchy = ['Starter', 'Featured', 'Premium'];
  const hasAccess = (minPlan: string) => {
    if (!user) return minPlan === 'Starter';
    return planHierarchy.indexOf(user.plan) >= planHierarchy.indexOf(minPlan);
  };

  const tabs = [
    { id: 'feed', label: 'Curated', icon: Globe, minPlan: 'Starter' },
    { id: 'live', label: 'Live AI Feed', icon: Zap, minPlan: 'Featured' },
    { id: 'gems', label: 'Hidden Gems', icon: Sparkles, minPlan: 'Featured' },
    { id: 'trending', label: 'Trending', icon: Flame, minPlan: 'Starter' },
    { id: 'predictions', label: 'Predictions', icon: Rocket, minPlan: 'Premium' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">
      {/* Header & Daily Digest */}
      <section className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-3">
              <Sparkles className="w-3 h-3 mr-2 animate-pulse" />
              The AI Pulse
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none">TECH TRENDS <br /> & <span className="text-primary">AI NEWS</span></h1>
          </div>
          <div className="glass p-6 rounded-3xl border-primary/20 max-w-sm">
            <div className="flex items-center text-xs font-bold text-primary uppercase tracking-widest mb-3">
              <Zap className="w-4 h-4 mr-2" />
              Top 5 Updates Today
            </div>
            <div className="space-y-3">
              {dailyDigest.map((item, i) => (
                <div key={item.id} className="flex items-start space-x-3 group cursor-pointer">
                  <span className="text-primary font-black text-lg leading-none mt-1">0{i+1}</span>
                  <p className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Daily AI Summary */}
        <AnimatePresence>
          {(dailySummary || summaryLoading) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-[40px] p-8 md:p-12 border-primary/30 bg-primary/5 mb-12 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center text-primary font-black uppercase tracking-widest text-xs">
                    <Brain className="w-5 h-5 mr-3" />
                    AI-Generated Daily Intelligence
                  </div>
                  <button 
                    onClick={fetchDailySummary}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <RefreshCw className={cn("w-4 h-4 text-primary", summaryLoading && "animate-spin")} />
                  </button>
                </div>
                {summaryLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
                    <div className="h-4 bg-white/10 rounded-full w-full animate-pulse" />
                    <div className="h-4 bg-white/10 rounded-full w-2/3 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex gap-6">
                    <Quote className="w-12 h-12 text-primary/20 shrink-0" />
                    <p className="text-xl md:text-2xl font-bold leading-relaxed tracking-tight text-white/90 italic">
                      {dailySummary}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-4 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const locked = !hasAccess(tab.minPlan);
          return (
            <button
              key={tab.id}
              onClick={() => locked ? toast.error(`Upgrade to ${tab.minPlan} to access ${tab.label}`) : setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all whitespace-nowrap relative",
                activeTab === tab.id 
                  ? "bg-primary text-black shadow-lg shadow-primary/20" 
                  : "glass border-white/5 text-muted-foreground hover:text-white",
                locked && "opacity-60"
              )}
            >
              {tab.id === 'live' && !locked && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              )}
              {locked ? <Lock className="w-3 h-3 mr-2 text-primary" /> : <tab.icon className="w-4 h-4 mr-2" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
          <AnimatePresence mode="wait">
            {activeTab === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black tracking-tighter flex items-center">
                    <Globe className="w-6 h-6 mr-3 text-primary" />
                    WHAT'S COOKING <span className="text-primary ml-2">WORLDWIDE</span>
                  </h2>
                </div>
                
                <div className="space-y-6">
                  {displayNews.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group glass rounded-[32px] p-6 md:p-8 border-white/5 hover:border-primary/20 transition-all relative overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="md:w-1/3 aspect-video md:aspect-square rounded-2xl overflow-hidden">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="md:w-2/3 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                item.type === 'Launch' ? "bg-green-500/10 text-green-500" :
                                item.type === 'Funding' ? "bg-blue-500/10 text-blue-500" :
                                "bg-primary/10 text-primary"
                              )}>
                                {item.type || 'AI'}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> {item.timeAgo || '2h ago'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><Share2 className="w-4 h-4" /></button>
                              <button className="p-2 hover:bg-white/5 rounded-full transition-colors"><ExternalLink className="w-4 h-4" /></button>
                            </div>
                          </div>
                          
                          <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                            {item.summary}
                          </p>

                          {item.insight && (
                            <div className="bg-white/5 rounded-2xl p-4 border-l-4 border-primary">
                              <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                                <Brain className="w-3 h-3 mr-1.5" /> What This Means
                              </div>
                              <p className="text-xs font-medium italic text-white/80">{item.insight}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {isFree && news.length > 3 && (
                    <div className="glass rounded-[32px] p-12 text-center border-primary/20 bg-primary/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                      <div className="relative z-10">
                        <Lock className="w-12 h-12 text-primary mx-auto mb-6" />
                        <h3 className="text-2xl font-black mb-4">Unlock Full News Feed</h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                          You're currently on the Starter plan. Upgrade to Featured or Premium to unlock the full curated news feed and daily AI insights.
                        </p>
                        <Link 
                          to="/pricing"
                          className="inline-flex items-center px-8 py-4 bg-primary text-black font-black rounded-full hover:bg-primary/90 transition-all hover:scale-105"
                        >
                          Upgrade Now <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {!hasAccess('Featured') ? (
                  <LockedContent minPlan="Featured" featureName="Live AI Feed" />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-black tracking-tighter flex items-center">
                        <Zap className="w-6 h-6 mr-3 text-primary animate-pulse" />
                        LIVE TECH <span className="text-primary ml-2">INTELLIGENCE</span>
                      </h2>
                      <button 
                        onClick={fetchLiveNews}
                        disabled={liveLoading}
                        className="p-2 glass rounded-full hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={cn("w-4 h-4", liveLoading && "animate-spin")} />
                      </button>
                    </div>

                    {liveLoading ? (
                      <div className="h-[400px] flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-xs">Scanning Global Tech Networks...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {liveNews.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedLiveNews(item)}
                            className="group glass rounded-[32px] p-8 border-white/5 hover:border-primary/20 transition-all relative overflow-hidden cursor-pointer"
                          >
                            <div className="flex flex-col space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                    {item.source}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center">
                                    <Clock className="w-3 h-3 mr-1" /> Just Now
                                  </span>
                                </div>
                                <div className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground group-hover:text-primary">
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                              </div>
                              
                              <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors">
                                {item.title}
                              </h3>
                              
                              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                                {item.summary}
                              </p>

                              <div className="bg-primary/5 rounded-2xl p-6 border-l-4 border-primary">
                                <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                                  <Brain className="w-3 h-3 mr-1.5" /> Tech Insight
                                </div>
                                <p className="text-xs font-medium italic text-white/80 leading-relaxed">{item.insight}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'gems' && (
              <motion.div
                key="gems"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {!hasAccess('Featured') ? (
                  <LockedContent minPlan="Featured" featureName="Hidden Gems" />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-black tracking-tighter flex items-center">
                        <Sparkles className="w-6 h-6 mr-3 text-primary animate-pulse" />
                        UNIQUE <span className="text-primary ml-2">HIDDEN GEMS</span>
                      </h2>
                      <button 
                        onClick={fetchHiddenGems}
                        disabled={gemsLoading}
                        className="p-2 glass rounded-full hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={cn("w-4 h-4", gemsLoading && "animate-spin")} />
                      </button>
                    </div>

                    {gemsLoading ? (
                      <div className="h-[400px] flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest text-xs">Unearthing Niche AI Tools...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {hiddenGems.map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group glass rounded-[32px] p-8 border-white/5 hover:border-primary/20 transition-all relative overflow-hidden"
                          >
                            <div className="flex flex-col space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                                  Hidden Gem
                                </span>
                                <div className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground group-hover:text-primary">
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                              </div>
                              
                              <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                              <p className="text-sm font-bold text-primary italic">{item.tagline}</p>
                              
                              <p className="text-muted-foreground text-sm leading-relaxed">
                                {item.description}
                              </p>

                              <div className="bg-primary/5 rounded-2xl p-6 border-l-4 border-primary">
                                <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                                  <Brain className="w-3 h-3 mr-1.5" /> Why it's unique
                                </div>
                                <p className="text-xs font-medium italic text-white/80 leading-relaxed">{item.uniqueFactor}</p>
                              </div>

                              <a 
                                href={item.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs font-black uppercase tracking-widest text-primary hover:translate-x-1 transition-transform"
                              >
                                Visit Tool <ExternalLink className="w-3 h-3 ml-2" />
                              </a>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'trending' && (
              <motion.div
                key="trending"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black tracking-tighter flex items-center">
                    <Flame className="w-6 h-6 mr-3 text-primary" />
                    TRENDING <span className="text-primary ml-2">NOW</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trending.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-3xl p-6 border-white/5 hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl">
                          {i + 1}
                        </div>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center",
                          item.indicator === 'Exploding' ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                        )}>
                          <TrendingUp className="w-3 h-3 mr-1" /> {item.indicator}
                        </div>
                      </div>
                      <h3 className="text-xl font-black mb-2 group-hover:text-primary transition-colors">{item.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.reason}</p>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'predictions' && (
              <motion.div
                key="predictions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {!hasAccess('Premium') ? (
                  <LockedContent minPlan="Premium" featureName="Predictions" />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-black tracking-tighter flex items-center">
                        <Rocket className="w-6 h-6 mr-3 text-primary" />
                        NEXT BIG <span className="text-primary ml-2">TOOLS</span>
                      </h2>
                    </div>

                    <div className="space-y-8">
                      {predictions.map((item, i) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="glass rounded-[40px] p-8 md:p-12 border-white/5 relative overflow-hidden group"
                        >
                          <div className="absolute top-0 right-0 p-8">
                            <div className="px-4 py-2 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                              Next Big Thing
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                              <div>
                                <span className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2 block">
                                  {item.stage}
                                </span>
                                <h3 className="text-4xl font-black tracking-tighter group-hover:text-primary transition-colors">
                                  {item.name}
                                </h3>
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">The Prediction</div>
                                  <p className="text-lg font-bold leading-tight">{item.prediction}</p>
                                </div>
                                <div>
                                  <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Why this could go viral</div>
                                  <p className="text-sm text-muted-foreground leading-relaxed italic">{item.whyViral}</p>
                                </div>
                              </div>

                              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-black hover:border-primary transition-all flex items-center">
                                Get Early Access <ChevronRight className="w-4 h-4 ml-2" />
                              </button>
                            </div>
                            
                            <div className="aspect-video rounded-3xl overflow-hidden glass border-white/10 shadow-2xl">
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-12">
          {/* Newsletter Section */}
          <div className="glass rounded-[40px] p-8 border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter mb-4 uppercase">5 AI Trends in <span className="text-primary">60 Seconds</span></h3>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">
                Join 50,000+ founders and creators getting the best AI news delivered to their inbox every single day.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary transition-colors font-bold"
                />
                <button className="w-full bg-primary text-black font-black uppercase tracking-widest py-4 rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 text-xs">
                  Subscribe Now
                </button>
              </form>
              <p className="text-[10px] text-center text-muted-foreground mt-4 font-bold uppercase tracking-widest">
                No Spam. Just Insights.
              </p>
            </div>
          </div>

          {/* Trend Tags */}
          <div className="glass rounded-[40px] p-8 border-white/5">
            <h3 className="text-xl font-black mb-6 uppercase tracking-tighter flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Trend Tag System
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '🔥 Exploding', color: 'text-red-500 bg-red-500/10' },
                { label: '🧠 Hidden Gem', color: 'text-purple-500 bg-purple-500/10' },
                { label: '🚀 New Launch', color: 'text-green-500 bg-green-500/10' },
                { label: '💰 Business Tool', color: 'text-blue-500 bg-blue-500/10' },
                { label: '⚡ Automation', color: 'text-yellow-500 bg-yellow-500/10' },
                { label: '🎨 Creative', color: 'text-pink-500 bg-pink-500/10' },
              ].map(tag => (
                <button key={tag.label} className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-white/20 transition-all",
                  tag.color
                )}>
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ad/Featured Section */}
          <div className="glass rounded-[40px] p-8 border-white/5 group cursor-pointer overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Featured Resource</div>
              <h4 className="text-xl font-black mb-2 group-hover:text-primary transition-colors">The 2026 AI Strategy Guide</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">How to implement AI in your business without breaking the bank.</p>
              <div className="flex items-center text-xs font-black uppercase tracking-widest text-primary">
                Download Now <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </aside>
      </div>
      {/* Live News Detail Modal */}
      <AnimatePresence>
        {selectedLiveNews && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLiveNews(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-[40px] p-8 md:p-12 border-primary/20 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedLiveNews(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20 mb-6">
                {selectedLiveNews.source}
              </div>

              <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-tight mb-6">
                {selectedLiveNews.title}
              </h2>

              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <div className="bg-primary/5 rounded-3xl p-6 border-l-4 border-primary">
                  <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                    <Brain className="w-3 h-3 mr-1.5" /> Tech Insight
                  </div>
                  <p className="text-sm font-bold italic text-white/80">
                    {selectedLiveNews.insight}
                  </p>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-lg font-medium text-white/90 mb-4">
                    {selectedLiveNews.summary}
                  </p>
                  <div className="h-px bg-white/10 my-8" />
                  <div className="text-base space-y-4 whitespace-pre-wrap">
                    {selectedLiveNews.detailedExplanation}
                  </div>
                </div>

                <div className="pt-8 flex items-center justify-between">
                  <a 
                    href={selectedLiveNews.url} 
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
