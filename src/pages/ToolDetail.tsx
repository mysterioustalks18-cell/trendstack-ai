import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, limit, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Tool, Review, UserProfile } from '../types';
import { SAMPLE_TOOLS } from '../constants';
import { Star, ExternalLink, Bookmark, Share2, ChevronLeft, CheckCircle2, AlertCircle, MessageSquare, Sparkles, Loader2, Bot, Clock, DollarSign, TrendingUp, ArrowRight, Scale, Search, Users, Info, AlertTriangle, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';
import ToolCard from '../components/ToolCard';
import ROICalculator from '../components/ROICalculator';

import { toggleBookmark } from '../lib/bookmarks';

const CATEGORIES = ["All", "Writing", "Video", "Image", "Automation", "Coding", "Marketing", "Business"];

interface ToolDetailProps {
  user: UserProfile | null;
}

export default function ToolDetail({ user }: ToolDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<string | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<Tool[]>([]);
  const [youtubeNiche, setYoutubeNiche] = useState('');
  const [youtubeIdeas, setYoutubeIdeas] = useState<string[]>([]);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);

  const generateYoutubeIdeas = async () => {
    if (!youtubeNiche.trim()) {
      toast.error('Please enter a YouTube niche');
      return;
    }

    setGeneratingIdeas(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        toast.error('AI service is currently unavailable');
        return;
      }

      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate exactly 10 high-potential, viral YouTube video script ideas for the niche: "${youtubeNiche}". 
        For each idea, provide a catchy title and a 1-sentence hook. 
        Format the output as a simple list of 10 items, each starting with a number.`,
      });

      const text = response.text || '';
      const ideas = text.split('\n').filter(line => /^\d+\./.test(line.trim())).map(line => line.trim());
      setYoutubeIdeas(ideas.slice(0, 10));
    } catch (error) {
      console.error('Error generating YouTube ideas:', error);
      toast.error('Failed to generate ideas. Please try again.');
    } finally {
      setGeneratingIdeas(false);
    }
  };

  useEffect(() => {
    const fetchToolData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const toolDoc = await getDoc(doc(db, 'tools', id));
        if (toolDoc.exists()) {
          const toolData = { id: toolDoc.id, ...toolDoc.data() } as Tool;
          setTool(toolData);
          generateAiVerdict(toolData);
          fetchAlternatives(toolData);
        } else {
          const sample = SAMPLE_TOOLS.find(t => t.id === id);
          if (sample) {
            setTool(sample);
            generateAiVerdict(sample);
          }
        }

        const reviewsQuery = query(collection(db, 'reviews'), where('toolId', '==', id));
        const reviewsSnap = await getDocs(reviewsQuery);
        setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `tools/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchToolData();
  }, [id]);

  const generateAiVerdict = async (toolData: Tool) => {
    setVerdictLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setAiVerdict("AI Verdict is currently unavailable.");
        return;
      }
      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a concise, 2-sentence "AI Verdict" for the tool ${toolData.name}. 
        Description: ${toolData.description}. 
        Pros: ${(toolData.pros || []).join(', ')}. 
        Cons: ${(toolData.cons || []).join(', ')}. 
        Be objective and helpful.`,
      });
      setAiVerdict(response.text || null);
    } catch (error) {
      console.error('AI Verdict error:', error);
      setAiVerdict("Unable to generate AI verdict.");
    } finally {
      setVerdictLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user || !id) {
      toast.error('Please sign in to bookmark tools');
      navigate('/auth');
      return;
    }

    const isBookmarked = user.bookmarks.includes(id);
    await toggleBookmark(user.uid, id, isBookmarked);
  };

  const fetchAlternatives = async (toolData: Tool) => {
    try {
      const q = query(
        collection(db, 'tools'),
        where('category', '==', toolData.category),
        limit(5)
      );
      const snap = await getDocs(q);
      const alts = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Tool))
        .filter(t => t.id !== toolData.id)
        .slice(0, 4);
      setAlternatives(alts);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tools_alternatives');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) {
      toast.error('Please sign in to leave a review');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        toolId: id,
        userId: user.uid,
        userName: user.displayName,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'reviews'), reviewData);
      setReviews(prev => [...prev, { id: 'temp', ...reviewData }]);
      setNewReview({ rating: 5, comment: '' });
      toast.success('Review submitted successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!tool) return <div className="min-h-screen flex items-center justify-center">Tool not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link to="/directory" className="inline-flex items-center text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-12">
          <section className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 rounded-3xl glass border border-white/10 overflow-hidden neon-glow flex-shrink-0">
              <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-5xl font-black tracking-tighter">{tool.name}</h1>
                {tool.trending && <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">Trending</span>}
                {tool.hidden && <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider">Hidden Gem</span>}
              </div>
              <p className="text-2xl text-muted-foreground font-medium mb-6">{tool.tagline}</p>
              <div className="flex flex-wrap gap-4">
                <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all flex items-center">
                  Visit Website <ExternalLink className="w-4 h-4 ml-2" />
                </a>
                <button 
                  onClick={handleBookmarkToggle}
                  className={cn(
                    "px-8 py-3 glass border border-white/10 font-bold rounded-full transition-all flex items-center",
                    user?.bookmarks.includes(id || '') ? "text-primary bg-primary/10 border-primary/30" : "hover:bg-white/10"
                  )}
                >
                  <Bookmark className={cn("w-4 h-4 mr-2", user?.bookmarks.includes(id || '') && "fill-primary")} /> 
                  {user?.bookmarks.includes(id || '') ? 'Bookmarked' : 'Bookmark'}
                </button>
                <button className="p-3 glass border border-white/10 rounded-full hover:bg-white/10 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          <section className="glass rounded-3xl p-8 border-white/5">
            <h2 className="text-2xl font-bold mb-6">About {tool.name}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg mb-8">
              {tool.description}
            </p>

            {/* AI Quick Verdict */}
            <div className="mb-12 p-6 rounded-3xl bg-primary/5 border border-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
              <div className="relative z-10">
                <div className="flex items-center text-primary font-bold uppercase tracking-widest text-[10px] mb-3">
                  <Sparkles className="w-3 h-3 mr-2" />
                  AI Quick Verdict
                </div>
                {verdictLoading ? (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Analyzing tool data...
                  </div>
                ) : aiVerdict ? (
                  <p className="text-sm leading-relaxed italic text-white/90">
                    "{aiVerdict}"
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Verdict unavailable.</p>
                )}
              </div>
            </div>

            {/* YouTube Niche Ideas (Special Feature) */}
            {(tool.category === 'Video' || tool.name.toLowerCase().includes('youtube')) && (
              <div className="glass rounded-3xl p-8 border-primary/20 mb-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-red-500/20 transition-all" />
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="bg-red-500/20 p-2 rounded-xl">
                      <Youtube className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-red-500">YouTube Niche Master</span>
                  </div>
                  
                  <div className="mb-8">
                    <h3 className="text-2xl font-black mb-2">Generate Viral Script Ideas</h3>
                    <p className="text-muted-foreground">Enter a niche to get 10 AI-generated video ideas with hooks.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <input
                      type="text"
                      value={youtubeNiche}
                      onChange={(e) => setYoutubeNiche(e.target.value)}
                      placeholder="e.g., AI productivity, Minimalist living, Faceless news..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      onClick={generateYoutubeIdeas}
                      disabled={generatingIdeas}
                      className="bg-primary text-black font-black px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center"
                    >
                      {generatingIdeas ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Generate Ideas
                          <Sparkles className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {youtubeIdeas.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {youtubeIdeas.map((idea, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all"
                          >
                            <p className="font-medium text-lg">{idea}</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" /> Key Use Cases
                </h3>
                <ul className="space-y-3">
                  {(tool.useCases || []).map(useCase => (
                    <li key={useCase} className="flex items-center text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Pricing Model</h3>
                <div className="inline-flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-primary font-bold">
                  {tool.pricing}
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass rounded-3xl p-8 border-green-500/20">
              <h3 className="text-xl font-bold mb-6 text-green-500">Pros</h3>
              <ul className="space-y-4">
                {(tool.pros || []).map(pro => (
                  <li key={pro} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 mr-3 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-3xl p-8 border-red-500/20">
              <h3 className="text-xl font-bold mb-6 text-red-500">Cons</h3>
              <ul className="space-y-4">
                {(tool.cons || []).map(con => (
                  <li key={con} className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-3 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <ROICalculator toolName={tool.name} monthlyCost={tool.pricing === 'Paid' ? 29 : 0} />

          {/* Smart Comparison Section */}
          <section className="mb-24">
            <div className="glass rounded-[40px] p-10 md:p-16 border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32" />
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter flex items-center">
                      <Scale className="w-8 h-8 mr-3 text-primary" />
                      SMART COMPARISON
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-xl">How {tool.name} stacks up against the industry leaders.</p>
                  </div>
                  <Link to="/compare" className="px-8 py-4 glass border border-white/10 font-black rounded-full hover:bg-white/10 transition-all uppercase tracking-widest text-xs">
                    Open Full Comparison
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="glass p-8 rounded-3xl border-primary/20 bg-primary/5">
                    <div className="text-xs font-black text-primary uppercase tracking-widest mb-4">Current Tool</div>
                    <h3 className="text-2xl font-black mb-4">{tool.name}</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Best for {tool.category}
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> {tool.pricing} Model
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> {tool.rating} Rating
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-black text-muted-foreground">VS</div>
                  </div>

                  <div className="glass p-8 rounded-3xl border-white/5">
                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Top Alternative</div>
                    <h3 className="text-2xl font-black mb-4">{(tool.alternatives || [])[0] || 'Competitor A'}</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> More features
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <AlertTriangle className="w-4 h-4 mr-2 text-red-500" /> Higher price
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" /> Better support
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Alternative Finder */}
          <section className="mb-24">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-black tracking-tighter flex items-center">
                  <Search className="w-8 h-8 mr-3 text-secondary" />
                  ALTERNATIVE FINDER
                </h2>
                <p className="text-muted-foreground mt-2">Not convinced? Try these similar AI tools.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {alternatives.map((alt) => (
                <ToolCard key={alt.id} tool={alt} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-primary" />
                User Reviews ({reviews.length})
              </h2>
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-xl font-bold">{(tool.rating || 0).toFixed(1)}</span>
              </div>
            </div>

            <div className="space-y-6">
              {user ? (
                <form onSubmit={handleReviewSubmit} className="glass rounded-3xl p-6 border-primary/20">
                  <h3 className="font-bold mb-4">Leave a Review</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className={cn(
                          "p-1 transition-colors",
                          star <= newReview.rating ? "text-yellow-500" : "text-muted-foreground"
                        )}
                      >
                        <Star className={cn("w-6 h-6", star <= newReview.rating && "fill-yellow-500")} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Share your experience with this tool..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 min-h-[100px] focus:outline-none focus:border-primary transition-colors mb-4"
                    required
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Post Review'}
                  </button>
                </form>
              ) : (
                <div className="glass rounded-3xl p-8 text-center border-white/5">
                  <p className="text-muted-foreground mb-4">You must be signed in to leave a review.</p>
                  <button onClick={() => toast.info('Please sign in via the navbar')} className="text-primary font-bold hover:underline">Sign In Now</button>
                </div>
              )}

              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="glass rounded-2xl p-6 border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-primary">
                          {review.userName[0]}
                        </div>
                        <div>
                          <div className="font-bold">{review.userName}</div>
                          <div className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold">{review.rating}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          <div className="glass rounded-3xl p-8 border-white/5 sticky top-24">
            <h3 className="text-xl font-bold mb-6">Alternatives</h3>
            <div className="space-y-4">
              {(tool.alternatives || []).map(alt => (
                <Link
                  key={alt}
                  to={`/directory?search=${alt}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group"
                >
                  <span className="font-medium group-hover:text-primary transition-colors">{alt}</span>
                  <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </div>

            <div className="mt-12 p-6 rounded-3xl bg-primary/5 border border-primary/20">
              <h4 className="font-bold mb-2">Want to list your tool?</h4>
              <p className="text-sm text-muted-foreground mb-4">Reach 50,000+ AI enthusiasts and professionals.</p>
              <Link to="/submit" className="text-primary font-bold hover:underline text-sm">Submit your tool →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
