import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Sparkles, ArrowLeft } from 'lucide-react';
import { articlesApi } from '../api/client';
import { ArticleCard } from '../components/ArticleCard';
import { SkeletonCard } from '../components/SkeletonCard';

export const SearchPage = ({ onSelectArticle, onOpenChat }) => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setArticles([]);
      setLoading(false);
    }
  }, [query]);

  const performSearch = async (q) => {
    setLoading(true);
    try {
      const res = await articlesApi.list({ search: q, page_size: 30 });
      setArticles(res.data.items || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center space-x-2">
            <span>Results for "{query}"</span>
          </h1>
          <p className="text-xs text-slate-400">
            {articles.length} stories matched
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

      {!loading && articles.length === 0 && (
        <div className="py-20 text-center glass-panel rounded-3xl p-8 space-y-3 border border-white/10">
          <Search className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="font-display text-lg font-bold text-white">No results found</h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Try searching for other keywords like "LLM", "Quantum", "Funding", or category names.
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
