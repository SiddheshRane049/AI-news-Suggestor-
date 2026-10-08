import React, { useState, useEffect } from 'react';
import { Bookmark, Download, Sparkles, ArrowRight } from 'lucide-react';
import { meApi, articlesApi } from '../api/client';
import { ArticleCard } from '../components/ArticleCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

export const BookmarksPage = ({ onSelectArticle, onOpenChat }) => {
  const { user, openLogin } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user) {
      loadSavedArticles();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadSavedArticles = async () => {
    setLoading(true);
    try {
      const res = await meApi.getSaved(1, 50);
      setArticles(res.data.items || []);
    } catch (err) {
      console.error('Failed to load bookmarks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (!user || articles.length === 0) return;
    setExporting(true);
    try {
      const res = await articlesApi.exportMarkdown();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `saved_articles_${new Date().toISOString().slice(0, 10)}.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('Exported saved articles to Markdown!');
    } catch (err) {
      toastError('Failed to export markdown');
    } finally {
      setExporting(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center glass-panel rounded-3xl p-8 max-w-lg mx-auto space-y-4 border border-white/10">
        <Bookmark className="w-12 h-12 text-violet-400 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-white">Save Stories for Later</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Sign in to bookmark your favorite intelligence reports, export them to Markdown, and train your AI recommendation profile.
        </p>
        <button
          onClick={openLogin}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-indigo-950/40 border border-violet-500/20">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Bookmark className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Your Bookmarks
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              {articles.length} saved intelligence reports and summaries
            </p>
          </div>
        </div>

        {articles.length > 0 && (
          <button
            onClick={handleExportMarkdown}
            disabled={exporting}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Export to Markdown (.md)'}</span>
          </button>
        )}
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
          <Bookmark className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="font-display text-lg font-bold text-white">No saved articles yet</h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Click the bookmark icon on any article card to save it to your personal library.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white"
          >
            Browse News
          </button>
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
