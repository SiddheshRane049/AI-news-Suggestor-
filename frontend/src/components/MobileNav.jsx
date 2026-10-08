import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Flame, Bookmark, MessageSquare, Menu, Settings } from 'lucide-react';

export const MobileNav = ({ onOpenDailyDigest, onOpenNewsChat }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-4 py-2 flex items-center justify-around">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-violet-400 font-bold' : 'text-slate-400'
          }`
        }
      >
        <Sparkles className="w-5 h-5" />
        <span>For You</span>
      </NavLink>

      <NavLink
        to="/trending"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`
        }
      >
        <Flame className="w-5 h-5" />
        <span>Trending</span>
      </NavLink>

      <button
        onClick={onOpenNewsChat}
        className="flex flex-col items-center space-y-1 py-1 px-2 rounded-lg text-[10px] font-medium text-cyan-400"
      >
        <MessageSquare className="w-5 h-5" />
        <span>News AI</span>
      </button>

      <NavLink
        to="/bookmarks"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-violet-400 font-bold' : 'text-slate-400'
          }`
        }
      >
        <Bookmark className="w-5 h-5" />
        <span>Saved</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center space-y-1 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            isActive ? 'text-violet-400 font-bold' : 'text-slate-400'
          }`
        }
      >
        <Settings className="w-5 h-5" />
        <span>Profile</span>
      </NavLink>
    </div>
  );
};
