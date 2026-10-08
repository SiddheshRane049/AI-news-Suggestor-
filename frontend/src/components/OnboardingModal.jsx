import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  'Technology', 'AI & ML', 'Cybersecurity', 'Business & Finance',
  'Startups', 'Science', 'Health', 'Sports', 'Entertainment',
  'World', 'India', 'Politics', 'Gaming', 'Education'
];

export const OnboardingModal = ({ isOpen, onClose }) => {
  const { user, updatePreferences } = useAuth();
  const { success } = useToast();
  const [selected, setSelected] = useState(user?.preferred_categories || ['Technology', 'AI & ML', 'Startups']);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const toggleCategory = (cat) => {
    if (selected.includes(cat)) {
      setSelected(selected.filter((c) => c !== cat));
    } else {
      setSelected([...selected, cat]);
    }
  };

  const handleSave = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await updatePreferences(selected);
      success('Personalized preferences updated!');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl glass-panel shadow-2xl border border-white/10 p-6 sm:p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 mx-auto flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              Tailor Your News Stream
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Select 3 or more topics you care about. Our AI uses this to rank your "For You" intelligence feed.
            </p>
          </div>

          {/* Category Selectors Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto p-1">
            {CATEGORIES.map((cat) => {
              const isChecked = selected.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all border ${
                    isChecked
                      ? 'bg-violet-600/30 text-white border-violet-500 shadow-md shadow-violet-500/20'
                      : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {isChecked && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {selected.length} topics selected
            </span>
            <button
              onClick={handleSave}
              disabled={saving || selected.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-violet-600/30 disabled:opacity-50 flex items-center space-x-2 transition-all"
            >
              <span>{saving ? 'Personalizing...' : 'Launch Feed'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
