import React, { useState, useEffect } from 'react';
import { Settings, User, Sparkles, Check, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CATEGORIES = [
  'Technology', 'AI & ML', 'Cybersecurity', 'Business & Finance',
  'Startups', 'Science', 'Health', 'Sports', 'Entertainment',
  'World', 'India', 'Politics', 'Gaming', 'Education'
];

export const SettingsPage = () => {
  const { user, openLogin, updatePreferences } = useAuth();
  const { success, error: toastError } = useToast();

  const [selectedCats, setSelectedCats] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.preferred_categories) {
      setSelectedCats(user.preferred_categories);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="py-20 text-center glass-panel rounded-3xl p-8 max-w-lg mx-auto space-y-4 border border-white/10">
        <User className="w-12 h-12 text-violet-400 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-white">Sign In for Settings</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage your account and personalization preferences by signing in.
        </p>
        <button
          onClick={openLogin}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30"
        >
          Sign In
        </button>
      </div>
    );
  }

  const toggleCategory = (cat) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter((c) => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(selectedCats);
      success('Preferences saved successfully!');
    } catch (err) {
      toastError('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/40 via-slate-900 to-cyan-950/40 border border-white/10 flex items-center space-x-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-2xl text-white uppercase shadow-lg shadow-violet-500/30">
          {user.name ? user.name.charAt(0) : user.email.charAt(0)}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {user.name || 'Personal Account'}
          </h1>
          <p className="text-xs text-slate-400">{user.email}</p>
        </div>
      </div>

      {/* Preferred Categories */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 space-y-6">
        <div>
          <h3 className="font-display text-lg font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Feed Interest Calibration</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Selected categories are weighted heavily in your "For You" algorithmic stream.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const isChecked = selectedCats.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold border transition-all ${
                  isChecked
                    ? 'bg-violet-600/30 text-white border-violet-500 shadow-md shadow-violet-500/20'
                    : 'bg-slate-900/60 text-slate-400 border-white/5 hover:bg-slate-800'
                }`}
              >
                <span>{cat}</span>
                {isChecked && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
