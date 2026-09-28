import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/login', { username, password });
      login(res.data.access_token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string, pwd: string) => {
    setUsername(uname);
    setPassword(pwd);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 text-slate-800 p-4 relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Language selector toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-xs transition-all"
          >
            {language === 'en' ? 'ភាសាខ្មែរ (Khmer)' : 'English'}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
          {/* Logo & Header */}
          <div className="text-center mb-6 flex flex-col items-center">
            <div className="relative group mb-3">
              <div className="absolute -inset-2 bg-linear-to-r from-blue-500/20 to-indigo-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-3 sm:p-4 rounded-3xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-blue-500/5 flex items-center justify-center">
                <img
                  src="/inventory.png"
                  alt="SME Inventory System Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
                />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {t('app_name')}
            </h2>
            <p className="text-xs sm:text-sm text-blue-600 font-semibold tracking-wider uppercase mt-1">
              Khmer Style Fashion • {t('edition')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="admin or user@khmerstyle.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Signing in...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Quick Demo Logins</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'Admin123!')}
                className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-left transition-all group cursor-pointer"
              >
                <div className="font-semibold text-slate-800 group-hover:text-blue-700">Super Admin</div>
                <div className="text-[10px] text-slate-500 group-hover:text-blue-600/80">admin / Admin123!</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('manager', 'Manager123!')}
                className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-left transition-all group cursor-pointer"
              >
                <div className="font-semibold text-slate-800 group-hover:text-blue-700">Store Manager</div>
                <div className="text-[10px] text-slate-500 group-hover:text-blue-600/80">manager / Manager123!</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff', 'Staff123!')}
                className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-left transition-all group cursor-pointer"
              >
                <div className="font-semibold text-slate-800 group-hover:text-blue-700">Sales Staff</div>
                <div className="text-[10px] text-slate-500 group-hover:text-blue-600/80">staff / Staff123!</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('accountant', 'Account123!')}
                className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 text-left transition-all group cursor-pointer"
              >
                <div className="font-semibold text-slate-800 group-hover:text-blue-700">Accountant</div>
                <div className="text-[10px] text-slate-500 group-hover:text-blue-600/80">accountant / Account123!</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <p>© 2026 Khmer Style Fashion • SME Inventory Management System</p>
        </div>
      </div>
    </div>
  );
};
