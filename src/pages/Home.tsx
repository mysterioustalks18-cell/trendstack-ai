import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, Zap, ArrowRight, Shield, Rocket, Newspaper, Globe, Target, ChevronRight, Bot, Wand2, Search, BrainCircuit, Eye, Clock, Brain, DollarSign, CheckCircle2 } from 'lucide-react';
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Tool, News, UserProfile } from '../types';
import { GOALS, SAMPLE_TOOLS, SAMPLE_NEWS } from '../constants';
import { toggleBookmark } from '../lib/bookmarks';
import { getTrendingTools, getLiveTechNews } from '../lib/gemini';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// Components
import ToolCard from '../components/ToolCard';
import RecommendationEngine from '../components/RecommendationEngine';
import AIToolMatcher from '../components/AIToolMatcher';
import DailyDiscovery from '../components/DailyDiscovery';

interface HomeProps {
  user: UserProfile | null;
}

export default function Home({ user }: HomeProps) {
  const navigate = useNavigate();
  const [trendingTools, setTrendingTools] = useState<Tool[]>([]);
  const [hiddenGems, setHiddenGems] = useState<Tool[]>([]);
  const [upcomingTools, setUpcomingTools] = useState<Tool[]>([]);
  const [toolOfTheDay, setToolOfTheDay] = useState<Tool | null>(null);
  const [latestNews, setLatestNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

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
    const fetchData = async () => {
      try {
        const toolsRef = collection(db, 'tools');
        
        const trendingQuery = query(toolsRef, where('trending', '==', true), limit(4));
        const trendingSnap = await getDocs(trendingQuery);
        const trending = trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));
        
        const hiddenQuery = query(toolsRef, where('hidden', '==', true), limit(4));
        const hiddenSnap = await getDocs(hiddenQuery);
        const hidden = hiddenSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));

        const upcomingQuery = query(toolsRef, where('upcoming', '==', true), limit(4));
        const upcomingSnap = await getDocs(upcomingQuery);
        const upcoming = upcomingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));

        const totdQuery = query(toolsRef, where('isToolOfTheDay', '==', true), limit(1));
        const totdSnap = await getDocs(totdQuery);
        const totd = totdSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool))[0];

        // Merge with SAMPLE_TOOLS, avoiding duplicates by ID
        const mergeTools = (firestoreTools: Tool[], filterFn: (t: Tool) => boolean, limitCount: number) => {
          const all = [...firestoreTools];
          const ids = new Set(firestoreTools.map(t => t.id));
          SAMPLE_TOOLS.filter(filterFn).forEach(sample => {
            if (!ids.has(sample.id) && all.length < limitCount) {
              all.push(sample);
            }
          });
          return all;
        };

        setTrendingTools(mergeTools(trending, t => !!t.trending, 4));
        setHiddenGems(mergeTools(hidden, t => !!t.hidden, 4));
        setUpcomingTools(mergeTools(upcoming, t => !!t.upcoming, 4));

        if (totd) {
          setToolOfTheDay(totd);
        } else {
          setToolOfTheDay(SAMPLE_TOOLS.find(t => t.isToolOfTheDay) || SAMPLE_TOOLS[0]);
        }

        // Fetch AI-curated trendy tools and news
        try {
          const aiTrendy = await getTrendingTools();
          if (aiTrendy && aiTrendy.length > 0) {
            setTrendingTools(prev => {
              const existingIds = new Set(prev.map(t => t.id));
              const combined = [...prev];
              aiTrendy.forEach(t => {
                if (!existingIds.has(t.id)) combined.push(t);
              });
              return combined.slice(0, 4);
            });
          }

          const aiNews = await getLiveTechNews();
          if (aiNews && aiNews.length > 0) {
            setLatestNews(aiNews);
          } else {
            setLatestNews(SAMPLE_NEWS);
          }
        } catch (aiError) {
          console.error('Error fetching AI content:', aiError);
          setLatestNews(SAMPLE_NEWS);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'home_data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-8 glass"
          >
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            Discover the next generation of AI
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
          >
            STOP MISSING <br />
            <span className="text-gradient">POWERFUL AI TOOLS</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-muted-foreground text-xl mb-12 leading-relaxed"
          >
            The world's most curated directory of trending AI tools, hidden gems, and upcoming startups. Used by 50,000+ professionals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/directory" className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all neon-glow flex items-center justify-center">
              Explore Tools <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link to="/workflow-generator" className="w-full sm:w-auto px-8 py-4 glass border border-white/10 font-bold rounded-full hover:bg-white/10 transition-all flex items-center justify-center group">
              <Wand2 className="w-5 h-5 mr-2 text-primary group-hover:rotate-12 transition-transform" />
              AI Workflow Architect
            </Link>
            <Link to="/matcher" className="w-full sm:w-auto px-8 py-4 glass border border-white/10 font-bold rounded-full hover:bg-white/10 transition-all flex items-center justify-center group">
              <BrainCircuit className="w-5 h-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
              AI Tool Matcher
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 glass p-8 rounded-3xl border-white/5">
          {[
            { label: 'Curated Tools', value: '2,500+' },
            { label: 'Daily Users', value: '15k+' },
            { label: 'Hidden Gems', value: '450+' },
            { label: 'Weekly Updates', value: '50+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-primary mb-1">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Goal-Based Discovery */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
            <Target className="w-4 h-4 mr-2" />
            Goal-Based Discovery
          </div>
          <h2 className="text-5xl font-black tracking-tighter mb-4">What's your <span className="text-primary">Mission</span> today?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Forget categories. Tell us what you want to achieve, and we'll show you the path.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(GOALS || []).slice(0, 4).map((goal) => (
            <Link
              key={goal.id}
              to={`/goal/${goal.id}`}
              className="group relative glass p-8 rounded-[40px] border-white/5 hover:border-primary/30 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-black transition-all">
                  <goal.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black mb-2 group-hover:text-primary transition-colors">{goal.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-2">
                  {goal.description}
                </p>
                <div className="flex items-center text-xs font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                  Start Mission <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Tool Matcher Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
            <Bot className="w-4 h-4 mr-2" />
            AI Discovery Engine
          </div>
          <h2 className="text-5xl font-black tracking-tighter mb-4">Can't find the <span className="text-primary">Right Tool?</span></h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Describe your problem in plain English, and our AI will match you with the perfect tool stack.
          </p>
        </div>
        <AIToolMatcher />
      </section>

      {/* Daily Discovery Section */}
      <section className="max-w-7xl mx-auto px-4">
        <DailyDiscovery />
      </section>

      {/* Trending Section - Exploding Now */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-3">
              <TrendingUp className="w-3 h-3 mr-2 animate-bounce" />
              Live Trend Intelligence
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-none">EXPLODING <span className="text-primary">NOW</span></h2>
            <p className="text-muted-foreground mt-4 max-w-md">AI tools gaining massive traction in the last 24 hours based on social signals and usage data.</p>
          </div>
          <Link to="/directory?filter=trending" className="glass px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all flex items-center">
            View Live Feed <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(trendingTools || []).map((tool) => (
            <ToolCard 
              key={tool.id} 
              tool={tool} 
              isBookmarked={user?.bookmarks.includes(tool.id)}
              onBookmark={(e) => handleBookmark(e, tool.id)}
            />
          ))}
        </div>
      </section>

      {/* Recommendation Engine */}
      <RecommendationEngine />

      {/* Daily Hidden Tools - Top 5 Hidden Gems */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="glass rounded-[40px] p-10 md:p-16 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -mr-48 -mt-48" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest border border-secondary/20 mb-4">
                  <Eye className="w-3 h-3 mr-2" />
                  Daily Discovery
                </div>
                <h2 className="text-5xl font-black tracking-tighter">TOP 5 <span className="text-secondary">HIDDEN GEMS</span></h2>
                <p className="text-muted-foreground mt-4 max-w-xl text-lg">Powerful AI tools you've probably never heard of, but should be using today. Hand-picked by our research team.</p>
              </div>
              <button className="px-10 py-5 bg-secondary text-black font-black rounded-full hover:scale-105 transition-all uppercase tracking-widest text-xs shadow-2xl shadow-secondary/20">
                Unlock Full List
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(hiddenGems || []).slice(0, 4).map((tool) => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                  isBookmarked={user?.bookmarks.includes(tool.id)}
                  onBookmark={(e) => handleBookmark(e, tool.id)}
                />
              ))}
              <Link to="/directory?filter=hidden" className="glass rounded-3xl p-8 flex flex-col items-center justify-center text-center group border-white/5 hover:border-secondary/30 transition-all">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-black transition-all">
                  <ArrowRight className="w-8 h-8" />
                </div>
                <h3 className="font-black text-xl mb-2">View All Gems</h3>
                <p className="text-xs text-muted-foreground">Discover 50+ more hidden AI tools</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Tools Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center text-primary font-bold uppercase tracking-widest text-xs mb-2">
              <Rocket className="w-4 h-4 mr-2" />
              Coming Soon
            </div>
            <h2 className="text-4xl font-bold tracking-tight">Upcoming AI Projects</h2>
          </div>
          <Link to="/directory?filter=upcoming" className="text-primary hover:underline flex items-center font-medium">
            View Waitlist <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(upcomingTools || []).map((tool) => (
            <ToolCard 
              key={tool.id} 
              tool={tool} 
              isBookmarked={user?.bookmarks.includes(tool.id)}
              onBookmark={(e) => handleBookmark(e, tool.id)}
            />
          ))}
        </div>
      </section>

      {/* News Section - The AI Pulse */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-3">
              <Sparkles className="w-3 h-3 mr-2 animate-pulse" />
              The AI Pulse
            </div>
            <h2 className="text-5xl font-black tracking-tighter leading-none">TECH TRENDS <span className="text-primary">& INSIGHTS</span></h2>
            <p className="text-muted-foreground mt-4 max-w-md">Short, powerful updates on what's trending and what's coming next in the world of AI.</p>
          </div>
          <Link to="/news" className="glass px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all flex items-center">
            Open News Feed <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(latestNews || []).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group glass rounded-[32px] overflow-hidden border-white/5 hover:border-primary/20 transition-all relative"
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {(item.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center space-x-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                  <Clock className="w-3 h-3" /> 2h ago
                </div>
                <h3 className="text-2xl font-black mb-4 group-hover:text-primary transition-colors line-clamp-2 leading-tight">{item.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-6 leading-relaxed">
                  {item.summary}
                </p>
                
                {/* Insight Teaser */}
                <div className="bg-primary/5 rounded-2xl p-4 border-l-2 border-primary">
                  <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                    <Brain className="w-3 h-3 mr-1.5" /> Insight
                  </div>
                  <p className="text-xs font-medium italic text-white/70 line-clamp-1">
                    {item.insight || "This signals a major shift in AI infrastructure and accessibility."}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
            <DollarSign className="w-4 h-4 mr-2" />
            Simple Pricing
          </div>
          <h2 className="text-5xl font-black tracking-tighter mb-6">CHOOSE YOUR <span className="text-primary">GROWTH PATH</span></h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're just starting out or ready to scale, we have a plan to help your AI tool get discovered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Starter', price: 'Free', description: 'For basic listing', features: ['Basic tool listing', 'Limited visibility (Top 3 news)', '10 Daily AI Credits'], color: 'green' },
            { name: 'Featured', price: '₹499', description: 'Maximize your reach', features: ['Homepage placement', 'Full News Access', '50 Daily AI Credits'], color: 'blue', popular: true },
            { name: 'Premium', price: '₹999', description: 'Ultimate growth engine', features: ['Top placement', 'Unlimited News Access', 'Unlimited AI Credits'], color: 'purple' },
          ].map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "glass p-8 rounded-[40px] border transition-all relative overflow-hidden group",
                plan.popular ? "border-primary/50 bg-white/[0.03] scale-105 z-10" : "border-white/5 hover:border-white/10"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-4 py-1 rounded-bl-2xl uppercase tracking-widest">
                  Popular
                </div>
              )}
              <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-black">{plan.price}</span>
                {plan.price !== 'Free' && <span className="text-muted-foreground text-sm ml-2">/ month</span>}
              </div>
              <p className="text-muted-foreground text-sm mb-8">{plan.description}</p>
              <ul className="space-y-4 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center text-sm text-muted-foreground group-hover:text-white transition-colors">
                    <CheckCircle2 className="w-4 h-4 mr-3 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className={cn(
                "w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center transition-all",
                plan.popular ? "bg-primary text-black hover:shadow-[0_0_20px_rgba(0,255,255,0.4)]" : "glass border border-white/10 hover:bg-white/10"
              )}>
                View Details <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tool of the Day */}
      {toolOfTheDay && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="glass rounded-[40px] p-8 md:p-16 relative overflow-hidden border-primary/20">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative">
              <div>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6">
                  <Rocket className="w-4 h-4 mr-2" />
                  Tool of the Day
                </div>
                <h2 className="text-5xl font-black tracking-tighter mb-6 uppercase leading-none">
                  MEET <span className="text-primary">{toolOfTheDay.name}</span>: {toolOfTheDay.tagline}
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  {toolOfTheDay.description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to={`/tool/${toolOfTheDay.id}`} className="px-8 py-4 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all">
                    Try {toolOfTheDay.name} Now
                  </Link>
                  <a href={toolOfTheDay.websiteUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-4 glass border border-white/10 font-bold rounded-full hover:bg-white/10 transition-all">
                    Visit Website
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-3xl overflow-hidden glass border-primary/30 shadow-2xl neon-glow rotate-3">
                  <img src={toolOfTheDay.logoUrl || `https://picsum.photos/seed/${toolOfTheDay.id}/800/800`} alt={toolOfTheDay.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-6 -left-6 glass p-6 rounded-2xl border-primary/30 shadow-2xl -rotate-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Growth</div>
                      <div className="text-xl font-bold">+{toolOfTheDay.trendingScore || 450}% this week</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
