import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, ChevronDown, Flame, Search } from 'lucide-react';
import { feedApi, articlesApi, categoriesApi } from '../api/client';
import { BentoGrid } from '../components/BentoGrid';
import { ArticleCard } from '../components/ArticleCard';
import { CategoryPillBar } from '../components/CategoryPillBar';
import { TrendingSidebar } from '../components/TrendingSidebar';
import { FiltersBar } from '../components/FiltersBar';
import { SkeletonCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const HomePage = ({ onSelectArticle, onOpenChat }) => {
  const { user, openLogin } = useAuth();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [sortBy, setSortBy] = useState('latest');
  const [sentiment, setSentiment] = useState(null);
  const [days, setDays] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    loadFeed(1, true);
  }, [selectedCategory, sortBy, sentiment, days]);

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadFeed = async (pageNum, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      let res;
      if (selectedCategory === 'All' && !sentiment && !days && sortBy === 'latest') {
        // Use personalized For You algorithm
        res = await feedApi.getForYou(pageNum, 15);
      } else {
        // Use filtered query
        res = await articlesApi.list({
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          sentiment: sentiment || undefined,
          days: days || undefined,
          sort_by: sortBy,
          page: pageNum,
          page_size: 15,
        });
      }

      const newItems = res.data.items || [];
      if (reset) {
        setArticles(newItems);
      } else {
        setArticles((prev) => [...prev, ...newItems]);
      }
      setHasMore(res.data.has_more);
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFeed(nextPage, false);
    }
  };

  const handleResetFilters = () => {
    setSortBy('latest');
    setSentiment(null);
    setDays(null);
    setSelectedCategory('All');
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome & Category Pills */}
      <div className="space-y-4">
        {/* Animated Gradient Hero Banner */}
        <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-r from-violet-900/60 via-slate-900 to-cyan-950/60 border border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Real-Time Intelligence & Neural Summaries</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Curated for your mind, <br />
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-white bg-clip-text text-transparent">
                powered by NVIDIA NIM.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Live multi-category streams analyzed with Llama 3.3. Key takeaways, sentiment ratings, and personalized exploration.
            </p>
          </div>
        </div>

        {/* Category Pill Bar */}
        <CategoryPillBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      </div>

      {/* Spotlight Bento Grid (for top 4 stories) */}
      {!loading && articles.length > 0 && selectedCategory === 'All' && (
        <BentoGrid
          articles={articles.slice(0, 4)}
          onSelectArticle={onSelectArticle}
        />
      )}

      {/* Main Stream + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <h2 className="font-display text-lg font-bold text-white">
                {selectedCategory === 'All' ? 'For You Feed' : `${selectedCategory} Stream`}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                ({articles.length} stories)
              </span>
            </div>
          </div>

          <FiltersBar
            sortBy={sortBy}
            setSortBy={setSortBy}
            sentiment={sentiment}
            setSentiment={setSentiment}
            days={days}
            setDays={setDays}
            onReset={handleResetFilters}
          />

          {/* Skeletons Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && articles.length === 0 && (
            <div className="py-16 text-center glass-panel rounded-2xl p-8 space-y-4 border border-white/10">
              <Sparkles className="w-10 h-10 text-violet-400 mx-auto opacity-70" />
              <h3 className="font-display text-lg font-bold text-white">No articles found</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
                We couldn't find stories matching these filters. Try resetting filters or triggering a new RSS ingestion.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white shadow"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Articles Grid */}
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

          {/* Load More Button */}
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
                    <span>Fetching more stories...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Stories</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
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
