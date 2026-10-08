import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="rounded-2xl glass-card p-5 space-y-4 border border-white/5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-800 rounded w-24" />
        <div className="h-4 bg-slate-800 rounded w-16" />
      </div>
      <div className="h-32 bg-slate-800/60 rounded-xl w-full" />
      <div className="space-y-2">
        <div className="h-5 bg-slate-800 rounded w-5/6" />
        <div className="h-5 bg-slate-800 rounded w-3/4" />
      </div>
      <div className="space-y-1.5 pt-2">
        <div className="h-3 bg-slate-800/70 rounded w-full" />
        <div className="h-3 bg-slate-800/70 rounded w-4/5" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="h-3 bg-slate-800 rounded w-20" />
        <div className="flex space-x-2">
          <div className="w-6 h-6 bg-slate-800 rounded-lg" />
          <div className="w-6 h-6 bg-slate-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
