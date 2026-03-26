import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { UserProfile } from './types';
import { Toaster, toast } from 'sonner';
import { Menu, X, Search, Zap, TrendingUp, Newspaper, User, Bookmark, Plus, Sparkles, LogOut, AlertCircle, RefreshCcw } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try refreshing the page.";
      
      try {
        // Check if it's a Firestore error JSON
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Database Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path || 'unknown path'}`;
        }
      } catch (e) {
        // Not a JSON error
        if (this.state.error?.message) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="glass p-8 rounded-3xl border-white/10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-black mb-4">Application Error</h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center px-6 py-3 bg-primary text-black rounded-xl font-bold hover:scale-105 transition-all"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Pages
import Home from './pages/Home';
import Directory from './pages/Directory';
import ToolDetail from './pages/ToolDetail';
import News from './pages/News';
import Profile from './pages/Profile';
import SubmitTool from './pages/SubmitTool';
import Auth from './pages/Auth';
import Compare from './pages/Compare';
import GoalDiscovery from './pages/GoalDiscovery';
import StackBuilder from './pages/StackBuilder';
import PredictionHub from './pages/PredictionHub';
import Pricing from './pages/Pricing';
import AIWorkflowGenerator from './pages/AIWorkflowGenerator';
import SmartQuiz from './pages/SmartQuiz';
import Admin from './pages/Admin';
import ToolMatcher from './pages/ToolMatcher';
import YouTubeNicheMaster from './pages/YouTubeNicheMaster';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIChatbot from './components/AIChatbot';

// Route Protection Components
const ProtectedRoute = ({ user, children }: { user: UserProfile | null, children: React.ReactNode }) => {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const AdminRoute = ({ user, children }: { user: UserProfile | null, children: React.ReactNode }) => {
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
            setLoading(false);
          } else {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'}&background=random`,
              bookmarks: [],
              role: 'user',
              plan: 'Starter',
              credits: 10,
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          }
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar user={user} />
          <main className="flex-grow">
            {user && auth.currentUser && !auth.currentUser.emailVerified && (
              <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-2 px-4 text-center">
                <p className="text-xs font-bold text-yellow-500 flex items-center justify-center">
                  <AlertCircle className="w-3 h-3 mr-2" />
                  Please verify your email to unlock all features. 
                  <button 
                    onClick={async () => {
                      try {
                        if (auth.currentUser) {
                          await sendEmailVerification(auth.currentUser);
                          toast.success('Verification email sent!');
                        }
                      } catch (e) {
                        toast.error('Failed to send verification email.');
                      }
                    }}
                    className="ml-2 underline hover:text-yellow-400"
                  >
                    Resend Email
                  </button>
                </p>
              </div>
            )}
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/directory" element={<Directory user={user} />} />
              <Route path="/tool/:id" element={<ToolDetail user={user} />} />
              <Route path="/news" element={<News user={user} />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute user={user}>
                    <Profile user={user} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/submit" 
                element={
                  <ProtectedRoute user={user}>
                    <SubmitTool user={user} />
                  </ProtectedRoute>
                } 
              />
              <Route path="/auth" element={<Auth />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/goal/:goalId" element={<GoalDiscovery />} />
              <Route path="/stack-builder" element={<StackBuilder user={user} />} />
              <Route path="/predictions" element={<PredictionHub />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/workflow-generator" element={<AIWorkflowGenerator user={user} />} />
              <Route path="/quiz" element={<SmartQuiz user={user} />} />
              <Route path="/matcher" element={<ToolMatcher user={user} />} />
              <Route path="/youtube-niche-master" element={<YouTubeNicheMaster user={user} />} />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute user={user}>
                    <Admin user={user} />
                  </AdminRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
          <AIChatbot user={user} />
          <Toaster position="bottom-right" theme="dark" />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
