import React, { useState, useEffect } from 'react';
import { History, Sparkles } from 'lucide-react';
import { meApi } from '../api/client';
import { ArticleCard } from '../components/ArticleCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const HistoryPage = ({ onSelectArticle, onOpenChat }) => {
  const { user, openLogin } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await meApi.getHistory(1, 40);
      setArticles(res.data.items || []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center glass-panel rounded-3xl p-8 max-w-lg mx-auto space-y-4 border border-white/10">
        <History className="w-12 h-12 text-violet-400 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-white">Track Reading History</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Sign in to keep a chronological record of the stories you've explored.
        </p>
        <button
          onClick={openLogin}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-violet-950/40 border border-white/10 flex items-center space-x-4">
        <div className="p-3 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
          <History className="w-8 h-8" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Reading History
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            {articles.length} recently opened intelligence reports
          </p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="py-20 text-center glass-panel rounded-3xl p-8 space-y-3 border border-white/10">
          <History className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="font-display text-lg font-bold text-white">No history yet</h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Articles you inspect will appear here.
          </p>
        </div>
      )}

      {!loading && articles.length > 0 && (
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
