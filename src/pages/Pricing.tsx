import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, HelpCircle, Zap, Star, Rocket, TrendingUp, Shield, Globe, Target, ArrowRight, ChevronDown, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  {
    name: 'Starter',
    price: { monthly: 0, yearly: 0 },
    description: 'For basic listing',
    features: [
      'Basic tool listing',
      'Limited visibility (Top 3 news)',
      'Community access',
      'Standard profile page',
      '10 Daily AI Credits',
      '1 category tag'
    ],
    buttonText: 'Get Started',
    color: 'green',
    popular: false
  },
  {
    name: 'Featured',
    price: { monthly: 499, yearly: 399 },
    description: 'Maximize your reach',
    features: [
      'Homepage placement',
      'Featured badge',
      'Higher ranking in listings',
      'Full News Access',
      '50 Daily AI Credits',
      '3 category tags',
      'Social media shoutout'
    ],
    buttonText: 'Get Featured',
    color: 'blue',
    popular: true
  },
  {
    name: 'Premium',
    price: { monthly: 999, yearly: 799 },
    description: 'Ultimate growth engine',
    features: [
      'Top placement across platform',
      'Newsletter feature inclusion',
      'Trending boost badge',
      'Unlimited News Access',
      'Unlimited AI Credits',
      'Advanced analytics dashboard',
      'Unlimited category tags',
      'Dedicated account manager'
    ],
    buttonText: 'Go Premium',
    color: 'purple',
    popular: false
  }
];

const COMPARISON_FEATURES = [
  { name: 'Basic Listing', starter: true, featured: true, premium: true },
  { name: 'Homepage Feature', starter: false, featured: true, premium: true },
  { name: 'Ranking Boost', starter: false, featured: 'High', premium: 'Priority' },
  { name: 'Newsletter Inclusion', starter: false, featured: false, premium: true },
  { name: 'Analytics', starter: 'Basic', featured: 'Standard', premium: 'Advanced' },
  { name: 'Category Tags', starter: '1', featured: '3', premium: 'Unlimited' },
  { name: 'Support', starter: 'Community', featured: 'Email', premium: 'Priority 24/7' },
];

const FAQS = [
  {
    question: "How does featured placement work?",
    answer: "Featured tools are displayed prominently on our homepage and at the top of their respective categories. This significantly increases click-through rates and user discovery."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, all our paid plans are subscription-based but you can cancel at any time from your dashboard. Your benefits will continue until the end of your current billing cycle."
  },
  {
    question: "When will my tool go live?",
    answer: "Starter listings are reviewed within 48 hours. Featured and Premium listings receive priority review and typically go live within 4-6 hours."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 7-day money-back guarantee if you're not satisfied with the visibility results of your featured or premium placement."
  }
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const handlePayment = (plan: typeof PLANS[0]) => {
    if (plan.price.monthly === 0) {
      navigate('/auth');
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: (billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly) * 100,
      currency: "INR",
      name: "TrendStack AI",
      description: `${plan.name} Plan - ${billingCycle}`,
      image: "https://ais-dev-fhnqts6ygjddrk3u3zcshf-84342526347.asia-southeast1.run.app/logo.png",
      handler: function (response: any) {
        toast.success(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
        // Here you would typically verify the payment on your backend
        // and update the user's subscription status in Firestore.
      },
      prefill: {
        name: "User Name",
        email: "user@example.com",
        contact: "9999999999"
      },
      theme: {
        color: "#00FFFF"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white pt-24 pb-20 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Pricing Plans
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-7xl font-black tracking-tighter mb-6 leading-none"
          >
            SIMPLE PRICING. <br />
            <span className="text-primary">POWERFUL RESULTS.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-xl max-w-2xl mx-auto mb-10"
          >
            Get your AI tool discovered by thousands of users and grow your visibility in the fastest-growing AI directory.
          </motion.p>

          {/* Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={cn("text-sm font-bold transition-colors", billingCycle === 'monthly' ? "text-white" : "text-muted-foreground")}>Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="w-14 h-7 rounded-full bg-white/10 p-1 relative transition-colors hover:bg-white/20"
            >
              <motion.div
                animate={{ x: billingCycle === 'monthly' ? 0 : 28 }}
                className="w-5 h-5 bg-primary rounded-full shadow-lg shadow-primary/50"
              />
            </button>
            <div className="flex items-center space-x-2">
              <span className={cn("text-sm font-bold transition-colors", billingCycle === 'yearly' ? "text-white" : "text-muted-foreground")}>Yearly</span>
              <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-center">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -10 }}
              className={cn(
                "relative glass rounded-[40px] p-8 md:p-10 border transition-all duration-500 group",
                plan.popular 
                  ? "border-primary/50 shadow-[0_0_50px_-12px_rgba(0,255,255,0.3)] scale-105 z-10 bg-white/[0.03]" 
                  : "border-white/10 hover:border-white/20"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-primary text-black font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,255,0.5)]">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-black tracking-tight mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline">
                  <span className="text-4xl font-black">₹{billingCycle === 'monthly' ? plan.price.monthly.toLocaleString() : plan.price.yearly.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-2">/ month</span>
                </div>
                {billingCycle === 'yearly' && plan.price.yearly > 0 && (
                  <p className="text-green-400 text-xs font-bold mt-2">Billed annually (₹{(plan.price.yearly * 12).toLocaleString()}/yr)</p>
                )}
              </div>

              <div className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 shrink-0",
                      plan.color === 'green' ? "bg-green-500/20 text-green-400" : 
                      plan.color === 'blue' ? "bg-primary/20 text-primary" : 
                      "bg-purple-500/20 text-purple-400"
                    )}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handlePayment(plan)}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/btn",
                  plan.popular 
                    ? "bg-primary text-black hover:shadow-[0_0_30px_rgba(0,255,255,0.4)]" 
                    : "glass border border-white/10 hover:bg-white/10"
                )}
              >
                <span className="relative z-10">{plan.buttonText}</span>
                {plan.popular && (
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                  />
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tight mb-4">Compare Features</h2>
            <p className="text-muted-foreground">Find the perfect plan for your tool's growth stage.</p>
          </div>
          <div className="glass rounded-[40px] overflow-hidden border-white/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-bottom border-white/10">
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-muted-foreground">Feature</th>
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-muted-foreground text-center">Starter</th>
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-primary text-center">Featured</th>
                  <th className="p-8 text-sm font-black uppercase tracking-widest text-muted-foreground text-center">Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, i) => (
                  <tr key={feature.name} className={cn("border-t border-white/5 hover:bg-white/[0.02] transition-colors", i % 2 === 0 ? "bg-white/[0.01]" : "")}>
                    <td className="p-8 font-bold">{feature.name}</td>
                    <td className="p-8 text-center">
                      {typeof feature.starter === 'boolean' ? (
                        feature.starter ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <div className="w-5 h-0.5 bg-white/10 mx-auto" />
                      ) : <span className="text-sm text-muted-foreground">{feature.starter}</span>}
                    </td>
                    <td className="p-8 text-center">
                      {typeof feature.featured === 'boolean' ? (
                        feature.featured ? <Check className="w-5 h-5 text-primary mx-auto" /> : <div className="w-5 h-0.5 bg-white/10 mx-auto" />
                      ) : <span className="text-sm font-bold text-primary">{feature.featured}</span>}
                    </td>
                    <td className="p-8 text-center">
                      {typeof feature.premium === 'boolean' ? (
                        feature.premium ? <Check className="w-5 h-5 text-purple-500 mx-auto" /> : <div className="w-5 h-0.5 bg-white/10 mx-auto" />
                      ) : <span className="text-sm text-muted-foreground">{feature.premium}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Elements */}
        <div className="text-center mb-32">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-10">Trusted by growing AI tools community</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
            {['Jasper', 'Midjourney', 'ElevenLabs', 'Cursor', 'Perplexity', 'Gamma'].map(logo => (
              <div key={logo} className="text-2xl font-black tracking-tighter">{logo}</div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black tracking-tight mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <div key={index} className="glass rounded-3xl border-white/10 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold">{faq.question}</span>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", expandedFaq === index && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10" />
          <div className="glass rounded-[40px] p-12 md:p-20 text-center border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
              READY TO GROW YOUR <br />
              <span className="text-primary">AI TOOL VISIBILITY?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              Join the fastest-growing AI directory and get your product in front of the right audience today.
            </p>
            <Link
              to="/submit"
              className="inline-flex items-center px-10 py-5 bg-primary text-black font-black rounded-full hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,255,0.4)]"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
