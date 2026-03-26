import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth, logout } from '../firebase';
import { UserProfile, Tool, Review, Workflow } from '../types';
import { User, Bookmark, Settings, LogOut, Grid, List as ListIcon, Shield, Zap, MessageSquare, Star, LayoutGrid, Plus, Share2, Award, Sparkles, Clock, ArrowRight, X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

import { toggleBookmark } from '../lib/bookmarks';

interface ProfileProps {
  user: UserProfile | null;
}

export default function Profile({ user }: ProfileProps) {
  const [bookmarks, setBookmarks] = useState<Tool[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [recommendations, setRecommendations] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'reviews' | 'collections' | 'workflows' | 'settings'>('bookmarks');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhoto, setEditPhoto] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setEditName(user.displayName);
      setEditPhoto(user.photoURL);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editName,
        photoURL: editPhoto,
      });
      toast.success('Profile updated successfully!');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBookmarkToggle = async (toolId: string) => {
    if (!user) return;

    const isBookmarked = user.bookmarks.includes(toolId);
    const success = await toggleBookmark(user.uid, toolId, isBookmarked);
    
    if (success) {
      if (isBookmarked) {
        setBookmarks(prev => prev.filter(t => t.id !== toolId));
      } else {
        const toolDoc = await getDoc(doc(db, 'tools', toolId));
        if (toolDoc.exists()) {
          setBookmarks(prev => [...prev, { id: toolDoc.id, ...toolDoc.data() } as Tool]);
        }
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch Bookmarks in chunks of 10
        if (user.bookmarks && user.bookmarks.length > 0) {
          const bookmarkedTools: Tool[] = [];
          const chunks = [];
          for (let i = 0; i < user.bookmarks.length; i += 10) {
            chunks.push(user.bookmarks.slice(i, i + 10));
          }

          for (const chunk of chunks) {
            const toolsRef = collection(db, 'tools');
            const q = query(toolsRef, where('__name__', 'in', chunk));
            const snap = await getDocs(q);
            bookmarkedTools.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool)));
          }
          setBookmarks(bookmarkedTools);

          // Fetch Recommendations based on bookmarks
          if (bookmarkedTools.length > 0) {
            const categories = Array.from(new Set(bookmarkedTools.map(t => t.category)));
            const recQuery = query(collection(db, 'tools'), where('category', 'in', categories), limit(6));
            const recSnap = await getDocs(recQuery);
            setRecommendations(recSnap.docs
              .map(doc => ({ id: doc.id, ...doc.data() } as Tool))
              .filter(t => !user.bookmarks.includes(t.id))
              .slice(0, 3)
            );
          }
        } else {
          setBookmarks([]);
        }

        // Fetch Reviews
        const reviewsRef = collection(db, 'reviews');
        const rq = query(reviewsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const rSnap = await getDocs(rq);
        setReviews(rSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));

        // Fetch Workflows
        const workflowsRef = collection(db, 'workflows');
        const wq = query(workflowsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const wSnap = await getDocs(wq);
        setWorkflows(wSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workflow)));

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.bookmarks]); // Re-fetch only if bookmarks array reference changes

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Sign in to view your profile</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          Keep track of your favorite AI tools and manage your account settings.
        </p>
        <Link to="/auth" className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all">
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="glass rounded-[40px] p-8 md:p-12 mb-12 border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative">
          <div className="w-32 h-32 rounded-full border-4 border-primary/20 p-1 overflow-hidden">
            <img src={user.photoURL} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
          </div>
          <div className="text-center md:text-left flex-grow">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-4xl font-black tracking-tight">{user.displayName}</h1>
              {user.role === 'admin' && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20 flex items-center">
                  <Shield className="w-3 h-3 mr-1" /> Admin
                </span>
              )}
              {user.isCreator && (
                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider border border-secondary/20 flex items-center">
                  <Award className="w-3 h-3 mr-1" /> Verified Creator
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-lg mb-6">{user.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="glass px-6 py-3 rounded-2xl border-white/10">
                <div className="text-2xl font-bold text-primary">{user.bookmarks.length}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Bookmarks</div>
              </div>
              <div className="glass px-6 py-3 rounded-2xl border-white/10">
                <div className="text-2xl font-bold text-secondary">{reviews.length}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Reviews</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-3 glass border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center"
            >
              <Settings className="w-4 h-4 mr-2" /> Edit Profile
            </button>
            <button onClick={() => { logout(); navigate('/'); }} className="px-6 py-3 glass border border-red-500/20 text-red-500 rounded-2xl font-bold hover:bg-red-500/10 transition-all flex items-center justify-center">
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass rounded-[40px] p-8 border-white/10 overflow-hidden"
            >
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black tracking-tight mb-2">Edit Profile</h2>
                <p className="text-muted-foreground text-sm">Update your public information.</p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20">
                      <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Profile Photo URL</label>
                  <input
                    type="url"
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                    placeholder="https://example.com/photo.jpg"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-primary text-black font-black rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex items-center space-x-8 border-b border-white/10 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={cn(
            "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
            activeTab === 'bookmarks' ? "text-primary" : "text-muted-foreground hover:text-white"
          )}
        >
          <Bookmark className="w-4 h-4 inline mr-2" />
          Bookmarks
          {activeTab === 'bookmarks' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={cn(
            "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
            activeTab === 'workflows' ? "text-primary" : "text-muted-foreground hover:text-white"
          )}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Workflows
          {activeTab === 'workflows' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={cn(
            "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
            activeTab === 'reviews' ? "text-primary" : "text-muted-foreground hover:text-white"
          )}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          My Reviews
          {activeTab === 'reviews' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={cn(
            "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
            activeTab === 'collections' ? "text-primary" : "text-muted-foreground hover:text-white"
          )}
        >
          <LayoutGrid className="w-4 h-4 inline mr-2" />
          Collections
          {activeTab === 'collections' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "pb-4 text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
            activeTab === 'settings' ? "text-primary" : "text-muted-foreground hover:text-white"
          )}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Settings
          {activeTab === 'settings' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'bookmarks' && (
          <div className="space-y-12">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="glass rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            ) : bookmarks.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookmarks.map(tool => (
                    <ToolCard key={tool.id} tool={tool} isBookmarked={true} />
                  ))}
                </div>

                {/* Personalized Recommendations */}
                {recommendations.length > 0 && (
                  <div className="pt-12 border-t border-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight flex items-center">
                          <Sparkles className="w-6 h-6 mr-2 text-primary" />
                          Recommended for You
                        </h3>
                        <p className="text-muted-foreground text-sm">Based on your interests and bookmarks.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendations.map(tool => (
                        <ToolCard key={tool.id} tool={tool} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
                <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">No bookmarks yet</h3>
                <p className="text-muted-foreground mb-8">Start exploring the directory to save your favorite tools.</p>
                <Link to="/directory" className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all">
                  Browse Directory
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight">Your AI Workflows</h2>
              <Link to="/workflow-generator" className="px-6 py-3 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all flex items-center text-sm">
                <Plus className="w-4 h-4 mr-2" /> New Workflow
              </Link>
            </div>

            {workflows.length > 0 ? (
              <div className="grid gap-6">
                {workflows.map(workflow => (
                  <div key={workflow.id} className="glass rounded-3xl p-6 border-white/5 hover:border-primary/20 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{workflow.goal}</h3>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(workflow.createdAt?.toDate?.() || workflow.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button className="p-2 glass rounded-lg hover:bg-white/10 transition-all">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(workflow.steps || []).slice(0, 3).map((step, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {step.step}
                        </span>
                      ))}
                      {workflow.steps && workflow.steps.length > 3 && (
                        <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          +{workflow.steps.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
                <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">No workflows generated</h3>
                <p className="text-muted-foreground mb-8">Use the AI Workflow Architect to build your first execution plan.</p>
                <Link to="/workflow-generator" className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all">
                  Generate Workflow
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review.id} className="glass rounded-3xl p-6 border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <Link to={`/tool/${review.toolId}`} className="font-bold hover:text-primary transition-colors">
                          Tool ID: {review.toolId}
                        </Link>
                        <div className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold">{review.rating}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed italic">"{review.comment}"</p>
                </div>
              ))
            ) : (
              <div className="text-center py-20 glass rounded-3xl border-dashed border-white/10">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground">Share your thoughts on the tools you've used.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">Your Tool Collections</h2>
              <button className="px-6 py-3 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all flex items-center text-sm">
                <Plus className="w-4 h-4 mr-2" /> Create Collection
              </button>
            </div>
            
            {user.collections && user.collections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.collections.map(collection => (
                  <div key={collection.id} className="glass rounded-[32px] p-8 border-white/5 group hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-black mb-2 group-hover:text-primary transition-colors">{collection.title}</h3>
                        <p className="text-muted-foreground text-sm">{collection.description}</p>
                      </div>
                      <button className="p-3 glass rounded-xl hover:bg-white/10 transition-all">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      <Grid className="w-3 h-3 mr-2" />
                      {collection.toolIds.length} Tools in this stack
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 glass rounded-[40px] border-dashed border-white/10">
                <LayoutGrid className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
                <h3 className="text-2xl font-black mb-2">No collections yet</h3>
                <p className="text-muted-foreground mb-10 max-w-md mx-auto">Create curated lists of AI tools for specific workflows and share them with the community.</p>
                <button className="px-10 py-4 bg-primary text-black font-black rounded-full hover:bg-primary/90 transition-all uppercase tracking-widest text-xs">
                  Build Your First Stack
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl glass rounded-3xl p-8 border-white/5">
            <h3 className="text-xl font-bold mb-8">Account Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-bold">Creator Mode</div>
                  <div className="text-xs text-muted-foreground">Enable public profile and tool collections</div>
                </div>
                <div className={cn(
                  "w-12 h-6 rounded-full relative cursor-pointer transition-all",
                  user.isCreator ? "bg-primary" : "bg-muted"
                )}>
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white/20 rounded-full transition-all",
                    user.isCreator ? "right-1 bg-black" : "left-1"
                  )} />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-bold">Email Notifications</div>
                  <div className="text-xs text-muted-foreground">Receive daily AI tool digests</div>
                </div>
                <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-black rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-bold">Public Profile</div>
                  <div className="text-xs text-muted-foreground">Allow others to see your bookmarks</div>
                </div>
                <div className="w-12 h-6 bg-muted rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full" />
                </div>
              </div>
              <div className="pt-8">
                <button className="text-red-500 font-bold hover:underline text-sm">Delete Account</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
