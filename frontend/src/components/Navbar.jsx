import React from 'react';
import { Sparkles, Search, Sun, Moon, Bookmark, MessageSquare, Compass, Shield, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onOpenSearch, onOpenDailyDigest, onOpenNewsChat }) => {
  const { user, openLogin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center space-x-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[2px] shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
              AI News Suggestor
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full">
              NVIDIA NIM
            </span>
          </div>
        </div>

        {/* Global Search Bar (Trigger for Command Palette) */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-white/10 hover:border-violet-500/40 transition-all shadow-inner group"
          >
            <div className="flex items-center space-x-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span className="text-sm">Search topics, stories, or ask AI...</span>
            </div>
            <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-400 bg-slate-900/80 rounded border border-white/10">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Search icon for mobile */}
          <button
            onClick={onOpenSearch}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Daily Digest Button */}
          <button
            onClick={onOpenDailyDigest}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-cyan-600/20 hover:from-violet-600/40 hover:to-cyan-600/40 border border-violet-500/30 text-violet-200 text-xs font-medium transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Daily Digest</span>
          </button>

          {/* Chat with News Button */}
          <button
            onClick={onOpenNewsChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-medium transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">News AI</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
              <div
                onClick={() => navigate('/settings')}
                className="flex items-center space-x-2 cursor-pointer p-1.5 rounded-xl hover:bg-white/10 transition-colors"
                title="Account Settings"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-xs text-white uppercase shadow">
                  {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                </div>
                <span className="hidden lg:inline text-xs font-medium text-slate-200 max-w-[100px] truncate">
                  {user.name || user.email.split('@')[0]}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-white/5 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/25 transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
