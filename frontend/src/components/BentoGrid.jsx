import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, ArrowUpRight, Flame, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const BentoGrid = ({ articles = [], onSelectArticle }) => {
  if (!articles || articles.length === 0) return null;

  const featured = articles[0];
  const sideArticles = articles.slice(1, 4);

  const getSentimentBadge = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'negative':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-4 h-4 text-cyan-400" />
        <h2 className="font-display text-lg font-bold tracking-tight text-white">
          Spotlight Intelligence
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Large Featured Card (8 columns on lg) */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelectArticle(featured)}
            className="lg:col-span-7 relative group rounded-2xl overflow-hidden glass-card cursor-pointer border border-white/10 hover:border-violet-500/50 min-h-[380px] flex flex-col justify-end p-6"
          >
            {/* Background Image & Gradient */}
            {featured.image_url ? (
              <img
                src={featured.image_url}
                alt={featured.title}
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-75"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-950/40 via-transparent to-cyan-950/30" />

            {/* Content */}
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-violet-600 text-white shadow-md">
                  {featured.category}
                </span>
                <span className="text-xs text-slate-300 font-medium bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                  {featured.source}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getSentimentBadge(featured.sentiment)}`}>
                  {featured.sentiment}
                </span>
                {featured.importance_score >= 8.0 && (
                  <span className="flex items-center text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                    <Flame className="w-3 h-3 mr-1" /> High Impact
                  </span>
                )}
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                {featured.title}
              </h3>

              <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {featured.summary || featured.title}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-white/10">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {featured.reading_time} min read
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(featured.published_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center text-cyan-400 font-medium group-hover:translate-x-1 transition-transform">
                  <span>AI Breakdown</span>
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Side Stacked Bento Cards (5 columns on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {sideArticles.map((art, idx) => (
            <motion.div
              key={art.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (idx + 1) }}
              onClick={() => onSelectArticle(art)}
              className="relative group rounded-2xl glass-card p-4 sm:p-5 flex-1 cursor-pointer border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-violet-400">{art.category}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{art.source}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getSentimentBadge(art.sentiment)}`}>
                    {art.sentiment}
                  </span>
                </div>

                <h4 className="font-display text-sm sm:text-base font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {art.title}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {art.summary}
                </p>
              </div>

              <div className="pt-2 mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5">
                <span>{art.reading_time}m read</span>
                <span className="text-violet-400 group-hover:underline flex items-center">
                  Read Summary <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
