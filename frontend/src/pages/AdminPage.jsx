import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, RefreshCw, Cpu, Database, Users, Activity,
  CheckCircle2, AlertTriangle, Play, Sparkles
} from 'lucide-react';
import { adminApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import { formatDistanceToNow } from 'date-fns';

export const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringFetch, setTriggeringFetch] = useState(false);
  const [triggeringAI, setTriggeringAI] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getLogs(15),
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data || []);
    } catch (err) {
      toastError('Failed to load system diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNow = async () => {
    setTriggeringFetch(true);
    try {
      await adminApi.fetchNow();
      success('RSS Ingestion job triggered in background!');
      setTimeout(loadData, 2000);
    } catch (err) {
      toastError('Failed to trigger RSS ingestion');
    } finally {
      setTriggeringFetch(false);
    }
  };

  const handleProcessAINow = async () => {
    setTriggeringAI(true);
    try {
      await adminApi.processAiNow();
      success('AI Processing batch triggered in background!');
      setTimeout(loadData, 2000);
    } catch (err) {
      toastError('Failed to trigger AI processing');
    } finally {
      setTriggeringAI(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/20">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Admin & System Health
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Live telemetry, RSS feed health, LLM rate limits, and ingestion logs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleFetchNow}
            disabled={triggeringFetch}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{triggeringFetch ? 'Dispatching...' : 'Fetch Feeds Now'}</span>
          </button>

          <button
            onClick={handleProcessAINow}
            disabled={triggeringAI}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{triggeringAI ? 'Dispatching...' : 'Process AI Batch'}</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Ingested Articles</span>
              <Database className="w-4 h-4 text-violet-400" />
            </div>
            <p className="font-display text-2xl font-bold text-white">
              {stats.total_articles}
            </p>
            <div className="text-[11px] text-slate-400">
              {stats.ai_processed_count} enriched with AI
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>NVIDIA NIM Status</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-display text-lg font-bold text-white">
                {stats.is_nvidia_key_set ? 'Connected' : 'Placeholder Mode'}
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  stats.is_nvidia_key_set ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Model: {stats.nvidia_model}
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Last Ingestion Run</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="font-display text-lg font-bold text-white">
              {stats.last_fetch_time
                ? formatDistanceToNow(new Date(stats.last_fetch_time), { addSuffix: true })
                : 'Pending'}
            </p>
            <div className="text-[11px] text-emerald-400 capitalize">
              Status: {stats.fetch_status}
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>User Engagement</span>
              <Users className="w-4 h-4 text-pink-400" />
            </div>
            <p className="font-display text-2xl font-bold text-white">
              {stats.total_interactions}
            </p>
            <div className="text-[11px] text-slate-400">
              {stats.total_users} registered users
            </div>
          </div>
        </div>
      )}

      {/* Category Feed Distribution */}
      {stats && stats.categories && (
        <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4">
          <h3 className="font-display text-base font-bold text-white">
            Category Breakdown & Source Coverage
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {stats.categories.map((cat) => (
              <div
                key={cat.name}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1"
              >
                <p className="text-xs font-semibold text-white truncate">{cat.name}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{cat.count} stories</span>
                  <span className="text-violet-400">{cat.feed_count} feeds</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingestion Logs Table */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-4 overflow-hidden">
        <h3 className="font-display text-base font-bold text-white">
          Recent Ingestion Logs
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/5 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Started</th>
                <th className="p-3">Fetched</th>
                <th className="p-3">Added</th>
                <th className="p-3">AI Processed</th>
                <th className="p-3">Status</th>
                <th className="p-3">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-mono font-medium">{log.id}</td>
                  <td className="p-3">
                    {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                  </td>
                  <td className="p-3 font-semibold text-cyan-300">{log.articles_fetched}</td>
                  <td className="p-3 font-semibold text-emerald-300">+{log.articles_added}</td>
                  <td className="p-3 font-semibold text-violet-300">{log.llm_processed_count}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : log.status === 'running'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 max-w-xs truncate">
                    {log.log_message || 'Completed'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
