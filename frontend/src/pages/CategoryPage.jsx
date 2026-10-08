import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articlesApi } from '../api/client';
import { ArticleCard } from '../components/ArticleCard';
import { FiltersBar } from '../components/FiltersBar';
import { SkeletonCard } from '../components/SkeletonCard';
import { TrendingSidebar } from '../components/TrendingSidebar';
import { ChevronDown, RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';

export const CategoryPage = ({ onSelectArticle, onOpenChat }) => {
  const { categoryName } = useParams();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [sortBy, setSortBy] = useState('latest');
  const [sentiment, setSentiment] = useState(null);
  const [days, setDays] = useState(null);

  useEffect(() => {
    setPage(1);
    loadCategoryArticles(1, true);
  }, [categoryName, sortBy, sentiment, days]);

  const loadCategoryArticles = async (pageNum, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await articlesApi.list({
        category: categoryName,
        sentiment: sentiment || undefined,
        days: days || undefined,
        sort_by: sortBy,
        page: pageNum,
        page_size: 16,
      });

      const items = res.data.items || [];
      if (reset) {
        setArticles(items);
      } else {
        setArticles((prev) => [...prev, ...items]);
      }
      setHasMore(res.data.has_more);
    } catch (err) {
      console.error('Failed to load category feed', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadCategoryArticles(nextPage, false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center space-x-2">
            <span>{categoryName}</span>
            <span className="text-xs font-normal text-violet-400 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
              Live Stream
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time multi-source coverage and AI summaries in {categoryName}
          </p>
        </div>
      </div>

      <FiltersBar
        sortBy={sortBy}
        setSortBy={setSortBy}
        sentiment={sentiment}
        setSentiment={setSentiment}
        days={days}
        setDays={setDays}
        onReset={() => {
          setSortBy('latest');
          setSentiment(null);
          setDays(null);
        }}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!loading && articles.length === 0 && (
            <div className="py-16 text-center glass-panel rounded-2xl p-8 space-y-3 border border-white/10">
              <Sparkles className="w-8 h-8 text-violet-400 mx-auto opacity-70" />
              <p className="text-sm text-slate-300">No articles available for this category yet.</p>
            </div>
          )}

          {!loading && articles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {!loading && hasMore && (
            <div className="pt-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold shadow transition-all flex items-center justify-center space-x-2 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Load More</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <TrendingSidebar
              onSelectArticle={onSelectArticle}
              onSelectTag={(tag) => navigate(`/search?q=${encodeURIComponent(tag)}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
