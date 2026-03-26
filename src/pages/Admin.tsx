import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, TrendingUp, MousePointer2, DollarSign, Newspaper, Users, ArrowUpRight, ArrowDownRight, Plus, Search, Filter, MoreVertical, ShieldCheck } from 'lucide-react';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Analytics, Tool as ITool, UserProfile } from '../types';
import { cn } from '../lib/utils';

interface AdminProps {
  user: UserProfile | null;
}

export default function Admin({ user }: AdminProps) {
  const [stats, setStats] = useState({
    totalViews: 0,
    totalClicks: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  const [trendingTools, setTrendingTools] = useState<ITool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // Fetch Analytics
        const analyticsSnap = await getDocs(collection(db, 'analytics'));
        const analyticsData = analyticsSnap.docs.map(doc => doc.data() as Analytics);
        
        const totalViews = analyticsData.reduce((acc, curr) => acc + curr.views, 0);
        const totalClicks = analyticsData.reduce((acc, curr) => acc + curr.clicks, 0);
        const totalRevenue = analyticsData.reduce((acc, curr) => acc + curr.revenue, 0);

        // Fetch Users
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;

        setStats({
          totalViews,
          totalClicks,
          totalRevenue,
          totalUsers
        });

        // Fetch Trending Tools
        const toolsQuery = query(collection(db, 'tools'), orderBy('trendingScore', 'desc'), limit(5));
        const toolsSnap = await getDocs(toolsQuery);
        setTrendingTools(toolsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ITool)));

      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'admin_data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center glass p-12 rounded-[40px] border-red-500/20 max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">You do not have administrative privileges to access this area.</p>
          <button onClick={() => window.history.back()} className="px-8 py-3 bg-primary text-black font-bold rounded-full">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter flex items-center">
              <LayoutDashboard className="w-8 h-8 mr-3 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Real-time platform performance and management.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 glass border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center text-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Tool
            </button>
            <button className="px-6 py-3 bg-primary text-black font-bold rounded-2xl hover:bg-primary/90 transition-all flex items-center text-sm">
              Export Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: TrendingUp, trend: '+12.5%', isUp: true },
            { label: 'Total Clicks', value: stats.totalClicks.toLocaleString(), icon: MousePointer2, trend: '+8.2%', isUp: true },
            { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, trend: '+15.3%', isUp: true },
            { label: 'Active Users', value: stats.totalUsers.toLocaleString(), icon: Users, trend: '-2.1%', isUp: false },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-3xl border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                  stat.isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {stat.isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.trend}
                </div>
              </div>
              <div className="text-3xl font-black text-foreground mb-1">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trending Tools Table */}
          <div className="lg:col-span-2 glass rounded-[40px] p-8 border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight">Trending Tools</h2>
              <button className="text-primary text-sm font-bold hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-white/5">
                    <th className="pb-4">Tool</th>
                    <th className="pb-4">Category</th>
                    <th className="pb-4">Score</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trendingTools.map((tool) => (
                    <tr key={tool.id} className="group hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden glass border-white/10">
                            <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{tool.name}</div>
                            <div className="text-xs text-muted-foreground">{tool.pricing}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {tool.category}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-primary">
                        {tool.trendingScore || 0}
                      </td>
                      <td className="py-4 text-right">
                        <button className="p-2 hover:text-primary transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-[40px] p-8 border-white/5">
            <h2 className="text-2xl font-black tracking-tight mb-8">Recent Activity</h2>
            <div className="space-y-6">
              {[
                { user: 'John Doe', action: 'submitted a new tool', time: '2m ago', icon: Plus },
                { user: 'Sarah Smith', action: 'upvoted Jasper', time: '15m ago', icon: TrendingUp },
                { user: 'Mike Ross', action: 'left a review on Midjourney', time: '1h ago', icon: Newspaper },
                { user: 'Emily Blunt', action: 'joined as a creator', time: '3h ago', icon: Users },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground shrink-0">
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm">
                      <span className="font-bold text-foreground">{activity.user}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-4 glass border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
