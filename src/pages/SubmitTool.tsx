import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { Rocket, Send, Info, CheckCircle2, Loader2, Globe, Tag, DollarSign, Image as ImageIcon, Star, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { cn } from '../lib/utils';

interface SubmitToolProps {
  user: UserProfile | null;
}

export default function SubmitTool({ user }: SubmitToolProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    websiteUrl: '',
    logoUrl: '',
    category: 'Writing',
    pricing: 'Free',
    listingType: 'standard',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to submit a tool');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'tools'), {
        ...formData,
        rating: 0,
        reviewsCount: 0,
        trending: false,
        hidden: false,
        upcoming: true,
        useCases: [],
        pros: [],
        cons: [],
        alternatives: [],
        createdAt: new Date().toISOString(),
        submittedBy: user.uid
      });
      toast.success('Tool submitted successfully! Our team will review it shortly.');
      navigate('/directory');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tools');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold mb-2">Sign in to submit a tool</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          Join our community and share the best AI tools with the world.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
          <Rocket className="w-4 h-4 mr-2" />
          Grow Your Product
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-4">Submit Your AI Tool</h1>
        <p className="text-muted-foreground text-lg">
          Get your tool in front of 50,000+ AI enthusiasts, founders, and creators.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-[40px] p-8 md:p-12 border-white/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center">
              <Tag className="w-4 h-4 mr-2" /> Tool Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Synthia"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center">
              <Globe className="w-4 h-4 mr-2" /> Website URL
            </label>
            <input
              type="url"
              required
              value={formData.websiteUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
              placeholder="https://example.com"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center">
            <Info className="w-4 h-4 mr-2" /> Short Tagline
          </label>
          <input
            type="text"
            required
            value={formData.tagline}
            onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
            placeholder="The ultimate AI agent for SaaS teams"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center">
            <Info className="w-4 h-4 mr-2" /> Full Description
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what your tool does, who it's for, and why it's unique..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 min-h-[150px] focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center">
              <Tag className="w-4 h-4 mr-2" /> Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-colors appearance-none"
            >
              {["Writing", "Video", "Image", "Automation", "Coding", "Marketing", "Business"].map(cat => (
                <option key={cat} value={cat} className="bg-background">{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center">
              <DollarSign className="w-4 h-4 mr-2" /> Pricing Model
            </label>
            <select
              value={formData.pricing}
              onChange={(e) => setFormData(prev => ({ ...prev, pricing: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-colors appearance-none"
            >
              {["Free", "Paid", "Freemium"].map(p => (
                <option key={p} value={p} className="bg-background">{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" /> Logo URL (Optional)
          </label>
          <input
            type="url"
            value={formData.logoUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
            placeholder="https://example.com/logo.png"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <div className="space-y-4">
          <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center">
            <Sparkles className="w-4 h-4 mr-2" /> Listing Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, listingType: 'standard' }))}
              className={cn(
                "p-6 rounded-3xl border-2 transition-all text-left group",
                formData.listingType === 'standard' 
                  ? "bg-white/10 border-primary" 
                  : "bg-white/5 border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-black uppercase tracking-widest text-xs">Standard</span>
                {formData.listingType === 'standard' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
              <div className="text-2xl font-black mb-1">FREE</div>
              <p className="text-xs text-muted-foreground">Basic directory listing with standard review time (48h).</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, listingType: 'featured' }))}
              className={cn(
                "p-6 rounded-3xl border-2 transition-all text-left group relative overflow-hidden",
                formData.listingType === 'featured' 
                  ? "bg-primary/10 border-primary" 
                  : "bg-white/5 border-white/10 hover:border-primary/30"
              )}
            >
              <div className="absolute top-0 right-0 bg-primary text-black text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-bl-xl">
                Recommended
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-black uppercase tracking-widest text-xs text-primary">Featured</span>
                {formData.listingType === 'featured' && <Star className="w-5 h-5 text-primary fill-primary" />}
              </div>
              <div className="text-2xl font-black mb-1">₹1,499</div>
              <p className="text-xs text-muted-foreground">Homepage placement, Featured badge, and Priority review (4h).</p>
            </button>
          </div>
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center justify-center shadow-2xl shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Send className="w-6 h-6 mr-2" /> Submit Tool for Review
              </>
            )}
          </button>
          <p className="text-center text-xs text-muted-foreground mt-6">
            By submitting, you agree to our <a href="#" className="underline">Terms of Service</a>.
          </p>
        </div>
      </form>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'Huge Reach', desc: 'Get your tool in front of thousands of active AI users.' },
          { title: 'SEO Boost', desc: 'High-quality backlink to improve your domain authority.' },
          { title: 'Fast Review', desc: 'Our team reviews all submissions within 48 hours.' },
        ].map(benefit => (
          <div key={benefit.title} className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-bold mb-2">{benefit.title}</h4>
            <p className="text-sm text-muted-foreground">{benefit.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
