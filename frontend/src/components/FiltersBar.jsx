import React from 'react';
import { SlidersHorizontal, ArrowUpDown, Filter, RotateCcw } from 'lucide-react';

export const FiltersBar = ({
  sortBy,
  setSortBy,
  sentiment,
  setSentiment,
  days,
  setDays,
  onReset
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl glass-panel border border-white/5 mb-6 text-xs text-slate-300">
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort selector */}
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-semibold text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
          >
            <option value="latest">Latest First</option>
            <option value="importance">Highest Impact Score</option>
            <option value="reading_time">Quickest Reads</option>
          </select>
        </div>

        {/* Sentiment selector */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-400">Sentiment:</span>
          <select
            value={sentiment || ''}
            onChange={(e) => setSentiment(e.target.value || null)}
            className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-400">Timeframe:</span>
          <select
            value={days || ''}
            onChange={(e) => setDays(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
          >
            <option value="">Anytime</option>
            <option value="1">Past 24 Hours</option>
            <option value="3">Past 3 Days</option>
            <option value="7">Past Week</option>
          </select>
        </div>
      </div>

      {(sortBy !== 'latest' || sentiment || days) && (
        <button
          onClick={onReset}
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};
