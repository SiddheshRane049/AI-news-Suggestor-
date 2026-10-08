import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Cpu, ShieldAlert, TrendingUp, Rocket, Atom, HeartPulse,
  Trophy, Film, Globe, Compass, Landmark, Gamepad2, GraduationCap, LayoutGrid
} from 'lucide-react';

const ICON_MAP = {
  Technology: Cpu,
  'AI & ML': Sparkles,
  Cybersecurity: ShieldAlert,
  'Business & Finance': TrendingUp,
  Startups: Rocket,
  Science: Atom,
  Health: HeartPulse,
  Sports: Trophy,
  Entertainment: Film,
  World: Globe,
  India: Compass,
  Politics: Landmark,
  Gaming: Gamepad2,
  Education: GraduationCap,
};

export const CategoryPillBar = ({ selectedCategory, onSelectCategory, categories = [] }) => {
  const allCategories = [
    { name: 'All', icon: LayoutGrid },
    ...(categories.length > 0
      ? categories
      : Object.keys(ICON_MAP).map((c) => ({ name: c, icon: ICON_MAP[c] }))),
  ];

  return (
    <div className="relative w-full overflow-x-auto no-scrollbar py-3 px-1">
      <div className="flex items-center space-x-2 min-w-max">
        {allCategories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const Icon = ICON_MAP[cat.name] || cat.icon || LayoutGrid;

          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`relative flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                isSelected
                  ? 'text-white shadow-lg shadow-violet-600/30'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-white/5'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-violet-400'}`} />
              <span>{cat.name}</span>
              {cat.article_count !== undefined && cat.article_count > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {cat.article_count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
