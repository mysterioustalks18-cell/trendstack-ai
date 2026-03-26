import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, TrendingUp, ExternalLink, Bookmark, ShieldCheck, Zap, ArrowUpRight, Play, AlertTriangle } from 'lucide-react';
import { Tool } from '../types';
import { cn } from '../lib/utils';

interface ToolCardProps {
  tool: Tool;
  isBookmarked?: boolean;
  onBookmark?: (e: React.MouseEvent) => void;
}

export default function ToolCard({ tool, isBookmarked, onBookmark }: ToolCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative glass rounded-[32px] p-5 hover:border-primary/50 transition-all duration-500 overflow-hidden"
    >
      {/* Micro Video Preview Overlay */}
      <AnimatePresence>
        {isHovered && tool.videoPreviewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm"
          >
            <video
              ref={videoRef}
              src={tool.videoPreviewUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            
            {/* Hover Info Overlay */}
            <div className="absolute bottom-6 left-6 right-6 z-20">
              <div className="flex items-center text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">
                <Play className="w-3 h-3 mr-2 fill-primary" />
                Live Preview
              </div>
              <p className="text-xs text-white/70 line-clamp-2 font-medium italic">
                {tool.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link to={`/tool/${tool.id}`} className="block relative z-20">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border border-white/10 group-hover:border-primary/30 transition-all duration-500 transform group-hover:scale-110">
            <img
              src={tool.logoUrl || `https://ui-avatars.com/api/?name=${tool.name}&background=random`}
              alt={tool.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex space-x-2">
              {tool.verified && (
                <span className="p-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20" title="Verified Tool">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              )}
              {tool.earlySignal && (
                <span className="flex items-center px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[9px] font-black uppercase tracking-widest border border-purple-500/20">
                  <Zap className="w-2.5 h-2.5 mr-1" />
                  Early Signal
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              {tool.growthIndicator === 'rising' && (
                <span className="flex items-center px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-[9px] font-black uppercase tracking-widest border border-green-500/20">
                  <ArrowUpRight className="w-2.5 h-2.5 mr-1" />
                  Rising
                </span>
              )}
              {tool.trendingScore && tool.trendingScore > 80 && (
                <span className="flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/20">
                  <TrendingUp className="w-2.5 h-2.5 mr-1" />
                  {tool.trendingScore}% Trend
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors">{tool.name}</h3>
            {tool.launchStage === 'beta' && (
              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-tighter">BETA</span>
            )}
          </div>
          <p className={cn(
            "text-sm line-clamp-2 mt-1 leading-relaxed transition-colors duration-500",
            isHovered ? "text-white" : "text-muted-foreground"
          )}>
            {tool.tagline || tool.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-white/5 group-hover:border-primary/20 transition-colors">
            {tool.category}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-white/5 group-hover:border-primary/20 transition-colors">
            {tool.pricing}
          </span>
          {tool.qualityScore && (
            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/10">
              QS: {tool.qualityScore}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-black">{(tool.rating || 0).toFixed(1)}</span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">({tool.reviewsCount || 0})</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onBookmark?.(e);
              }}
              className={cn(
                "p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300",
                isBookmarked ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
            >
              <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-primary")} />
            </button>
            <div className="p-2.5 rounded-xl hover:bg-primary hover:text-black transition-all duration-300 text-muted-foreground">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
