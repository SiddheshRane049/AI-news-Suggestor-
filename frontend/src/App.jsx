import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { CommandPalette } from './components/CommandPalette';
import { ArticleModal } from './components/ArticleModal';
import { NewsChatModal } from './components/NewsChatModal';
import { DailyDigestModal } from './components/DailyDigestModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';

import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { TrendingPage } from './pages/TrendingPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { HistoryPage } from './pages/HistoryPage';
import { SearchPage } from './pages/SearchPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';

import { useAuth } from './context/AuthContext';

export const App = () => {
  const { showOnboarding, setShowOnboarding } = useAuth();

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articleChatOpen, setArticleChatOpen] = useState(false);
  const [isNewsChatOpen, setIsNewsChatOpen] = useState(false);
  const [isDailyDigestOpen, setIsDailyDigestOpen] = useState(false);

  const handleOpenArticle = (article, chat = false) => {
    setSelectedArticle(article);
    setArticleChatOpen(chat);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-violet-500 selection:text-white pb-16 lg:pb-0">
      {/* Top Navigation */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDailyDigest={() => setIsDailyDigestOpen(true)}
        onOpenNewsChat={() => setIsNewsChatOpen(true)}
      />

      {/* Main Body Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex">
        {/* Desktop Sidebar */}
        <Sidebar
          onOpenDailyDigest={() => setIsDailyDigestOpen(true)}
          onOpenNewsChat={() => setIsNewsChatOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 py-6 lg:pl-8 overflow-hidden min-w-0">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  onSelectArticle={(art) => handleOpenArticle(art, false)}
                  onOpenChat={(art) => handleOpenArticle(art, true)}
                />
              }
            />
            <Route
              path="/category/:categoryName"
              element={
                <CategoryPage
                  onSelectArticle={(art) => handleOpenArticle(art, false)}
                  onOpenChat={(art) => handleOpenArticle(art, true)}
                />
              }
            />
            <Route
              path="/trending"
              element={
                <TrendingPage
                  onSelectArticle={(art) => handleOpenArticle(art, false)}
                  onOpenChat={(art) => handleOpenArticle(art, true)}
                />
              }
            />
            <Route
              path="/bookmarks"
              element={
                <BookmarksPage
                  onSelectArticle={(art) => handleOpenArticle(art, false)}
                  onOpenChat={(art) => handleOpenArticle(art, true)}
                />
              }
            />
            <Route
              path="/history"
              element={
                <HistoryPage
                  onSelectArticle={(art) => handleOpenArticle(art, false)}
                  onOpenChat={(art) => handleOpenArticle(art, true)}
                />
              }
            />
            <Route
              path="/search"
              element={
                <SearchPage
                  onSelectArticle={(art) => handleOpenArticle(art, false)}
                  onOpenChat={(art) => handleOpenArticle(art, true)}
                />
              }
            />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        onOpenDailyDigest={() => setIsDailyDigestOpen(true)}
        onOpenNewsChat={() => setIsNewsChatOpen(true)}
      />

      {/* Global Modals */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectArticle={(art) => handleOpenArticle(art, false)}
        onOpenNewsChat={() => setIsNewsChatOpen(true)}
      />

      <ArticleModal
        article={selectedArticle}
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        initialChatOpen={articleChatOpen}
      />

      <NewsChatModal
        isOpen={isNewsChatOpen}
        onClose={() => setIsNewsChatOpen(false)}
        onSelectArticle={(art) => handleOpenArticle(art, false)}
      />

      <DailyDigestModal
        isOpen={isDailyDigestOpen}
        onClose={() => setIsDailyDigestOpen(false)}
        onSelectArticle={(art) => handleOpenArticle(art, false)}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <AuthModal />
    </div>
  );
};
