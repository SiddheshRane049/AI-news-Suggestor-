import React, { useState, useEffect } from 'react';
import { Flame, Hash, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';
import { feedApi } from '../api/client';

export const TrendingSidebar = ({ onSelectArticle, onSelectTag }) => {
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        const [artsRes, tagsRes] = await Promise.all([
          feedApi.getTrending(5),
          feedApi.getTrendingTags(12),
        ]);
        setTrendingArticles(artsRes.data || []);
        setTrendingTags(tagsRes.data || []);
      } catch (err) {
        console.error('Failed to load trending sidebar', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top 5 Stories Today */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <h3 className="font-display text-sm font-bold tracking-tight text-white uppercase">
            Top 5 Impact Stories
          </h3>
        </div>

        <div className="space-y-3">
          {trendingArticles.map((art, idx) => (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group flex items-start space-x-3 cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <span className="font-display text-lg font-bold text-slate-400 group-hover:text-cyan-400 w-5 shrink-0 transition-colors">
                0{idx + 1}
              </span>
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">
                  {art.category}
                </span>
                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-2">
                  {art.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Tag Cloud */}
      <div className="p-5 rounded-2xl glass-panel border border-white/10 space-y-4">
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-cyan-400" />
          <h3 className="font-display text-sm font-bold tracking-tight text-white uppercase">
            Trending Topics (24h)
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {trendingTags.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTag(item.tag)}
              className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-violet-600/30 text-xs text-slate-300 hover:text-white border border-white/5 hover:border-violet-500/40 transition-all"
            >
              <span className="font-medium">#{item.tag}</span>
              <span className="text-[10px] text-slate-400 group-hover:text-cyan-300 font-bold">
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
