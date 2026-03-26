import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Mail, Lock, User, ArrowRight, Loader2, Github, Chrome, AlertCircle, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { auth, signInWithGoogle, signInWithGithub, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, sendPasswordResetEmail, sendEmailVerification, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const navigate = useNavigate();

  const createUserProfile = async (user: any, displayName?: string) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      try {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: displayName || user.displayName || 'Anonymous User',
          photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${displayName || user.displayName || 'User'}&background=random`,
          bookmarks: [],
          role: 'user',
          plan: 'Starter',
          credits: 10,
          createdAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success('Welcome back!');
        navigate('/');
      } else if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await updateProfile(userCredential.user, {
          displayName: formData.displayName
        });
        await sendEmailVerification(userCredential.user);
        await createUserProfile(userCredential.user, formData.displayName);
        toast.success('Account created! Please check your email for verification.');
        navigate('/');
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, formData.email);
        toast.success('Password reset email sent!');
        setMode('login');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = 'Authentication failed';
      if (error.code === 'auth/user-not-found') message = 'No user found with this email';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password';
      if (error.code === 'auth/email-already-in-use') message = 'Email already in use';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    try {
      const result = provider === 'google' ? await signInWithGoogle() : await signInWithGithub();
      await createUserProfile(result.user);
      toast.success(`Signed in with ${provider === 'google' ? 'Google' : 'GitHub'}`);
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Social sign in failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full glass rounded-[40px] p-8 md:p-12 border-white/5"
        >
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center space-x-2 group mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-black fill-black" />
              </div>
            </Link>
            <h1 className="text-3xl font-black tracking-tighter mb-2">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join TrendStack AI' : 'Reset Password'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'login' 
                ? 'Enter your details to access your account' 
                : mode === 'signup' 
                  ? 'Start discovering the future of AI today'
                  : 'Enter your email to receive a reset link'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center shadow-xl shadow-primary/10 mt-6"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          {mode !== 'forgot-password' && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-4 text-muted-foreground font-bold tracking-widest">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleSocialSignIn('google')}
                  className="flex items-center justify-center space-x-2 py-3 glass border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-bold text-sm"
                >
                  <Chrome className="w-4 h-4" />
                  <span>Google</span>
                </button>
                <button
                  onClick={() => handleSocialSignIn('github')}
                  className="flex items-center justify-center space-x-2 py-3 glass border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-bold text-sm"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </button>
              </div>
            </>
          )}

          <div className="mt-10 text-center space-y-2">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium block w-full"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
            {mode === 'forgot-password' && (
              <button
                onClick={() => setMode('login')}
                className="text-sm text-primary hover:underline transition-colors font-bold uppercase tracking-widest"
              >
                Back to Login
              </button>
            )}
          </div>
        </motion.div>

        {/* Right Side: Pricing Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block space-y-8"
        >
          <div className="glass p-10 rounded-[40px] border-primary/20 bg-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
            <h2 className="text-4xl font-black tracking-tighter mb-6">START FOR <span className="text-primary">FREE</span></h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join our community of 50,000+ AI enthusiasts and start listing your tools today at no cost.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Basic tool listing in directory',
                'Access to AI Workflow Architect',
                'Personalized tool recommendations',
                'Bookmark and save your favorites',
                'Join the creator community'
              ].map(feature => (
                <li key={feature} className="flex items-center text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 mr-3 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Lowest Plan</span>
                <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest">Active</span>
              </div>
              <div className="text-2xl font-black">Starter Plan — ₹0</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="glass p-6 rounded-3xl border-white/5">
              <TrendingUp className="w-6 h-6 text-primary mb-4" />
              <h3 className="font-bold mb-1">Growth</h3>
              <p className="text-xs text-muted-foreground">Scale your tool's visibility with featured placements.</p>
            </div>
            <div className="glass p-6 rounded-3xl border-white/5">
              <Sparkles className="w-6 h-6 text-primary mb-4" />
              <h3 className="font-bold mb-1">Insights</h3>
              <p className="text-xs text-muted-foreground">Get advanced analytics and user behavior data.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
