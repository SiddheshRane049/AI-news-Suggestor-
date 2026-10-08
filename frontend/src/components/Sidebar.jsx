import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass, Flame, Bookmark, History, Sparkles, MessageSquare,
  Settings, ShieldAlert, Cpu, HeartPulse, Trophy, Film, Globe,
  Rocket, Briefcase, GraduationCap, Gamepad2, Landmark, Atom
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ onOpenDailyDigest, onOpenNewsChat }) => {
  const { user } = useAuth();

  const navItems = [
    { label: 'For You', path: '/', icon: Sparkles, badge: 'AI' },
    { label: 'Trending', path: '/trending', icon: Flame },
    { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { label: 'History', path: '/history', icon: History },
  ];

  const categoryShortcuts = [
    { name: 'Technology', path: '/category/Technology', icon: Cpu },
    { name: 'AI & ML', path: '/category/AI & ML', icon: Sparkles },
    { name: 'Startups', path: '/category/Startups', icon: Rocket },
    { name: 'Cybersecurity', path: '/category/Cybersecurity', icon: ShieldAlert },
    { name: 'Business & Finance', path: '/category/Business & Finance', icon: Briefcase },
    { name: 'Science', path: '/category/Science', icon: Atom },
    { name: 'Health', path: '/category/Health', icon: HeartPulse },
    { name: 'World', path: '/category/World', icon: Globe },
    { name: 'Gaming', path: '/category/Gaming', icon: Gamepad2 },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 border-r border-white/10 p-4 space-y-6 overflow-y-auto">
      {/* Main Navigation */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Feeds & Insights
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/20 text-white border border-violet-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 text-violet-400" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* AI Features */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          AI Assistants
        </p>
        <button
          onClick={onOpenDailyDigest}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all text-left"
        >
          <div className="flex items-center space-x-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Daily Briefing</span>
          </div>
          <span className="text-[10px] bg-violet-900/60 text-violet-300 px-1.5 py-0.5 rounded">10 stories</span>
        </button>

        <button
          onClick={onOpenNewsChat}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition-all text-left"
        >
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Ask News AI</span>
        </button>
      </div>

      {/* Discover Topics */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Categories
        </p>
        <div className="space-y-0.5">
          {categoryShortcuts.map((cat) => {
            const Icon = cat.icon;
            return (
              <NavLink
                key={cat.path}
                to={cat.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 opacity-70" />
                <span className="truncate">{cat.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Admin / Settings link at bottom */}
      <div className="pt-4 border-t border-white/10 space-y-1">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isActive ? 'bg-white/10 text-emerald-300' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`
          }
        >
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>Admin & System Health</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isActive ? 'bg-white/10 text-violet-300' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`
          }
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Preferences</span>
        </NavLink>
      </div>
    </aside>
  );
};
