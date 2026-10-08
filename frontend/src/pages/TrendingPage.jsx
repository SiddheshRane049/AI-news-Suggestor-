import React, { useState, useEffect } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { feedApi } from '../api/client';
import { ArticleCard } from '../components/ArticleCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useNavigate } from 'react-router-dom';

export const TrendingPage = ({ onSelectArticle, onOpenChat }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const res = await feedApi.getTrending(24);
        setArticles(res.data || []);
      } catch (err) {
        console.error('Failed to load trending', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/40 border border-amber-500/20 flex items-center space-x-4">
        <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Flame className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            High-Impact Trending Stories
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Ranked by AI importance scoring, viral momentum, and cross-source coverage.
          </p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((art) => (
            <ArticleCard
              key={art.id}
              article={art}
              onSelectArticle={onSelectArticle}
              onOpenChat={onOpenChat}
              onTagClick={(tag) => navigate(`/search?q=${encodeURIComponent(tag)}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
