import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, KeyRound, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface SuperAdminLoginProps {
  onBackToUserLogin: () => void;
}

export const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onBackToUserLogin }) => {
  const { loginAsSuperAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const res = loginAsSuperAdmin(username.trim(), password);
      if (!res.success) {
        setError('بيانات الدخول غير صحيحة.');
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 dark:bg-[#060b13] dark:text-zinc-100 px-4 py-6 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white text-right font-sans transition-colors duration-200" dir="rtl">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pb-4">
        <button
          onClick={onBackToUserLogin}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0c1424] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-[#14213d] hover:text-slate-900 dark:hover:text-white transition-colors shadow-xs"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          <span>العودة لدخول المنشأة</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="تبديل المظهر"
            title={theme === 'dark' ? 'الوضع النهاري (أبيض)' : 'الوضع الليلي'}
            className="rounded-2xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0c1424] p-2 text-amber-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#14213d] transition-colors shadow-xs"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span>بوابة الإدارة المركزية</span>
          </div>
        </div>
      </header>

      {/* Super Admin Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 dark:border-[#1b2b4d] dark:bg-[#0d1627]/95 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-gradient-to-br dark:from-blue-950 dark:to-zinc-900 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              لوحة الإدارة العليا (Super Admin)
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              التحكم المركزي في المنشآت والحسابات والاشتراكات
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                اسم المستخدم للمشرف العام
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 dark:text-zinc-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="اسم المستخدم..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-[#1b2b4d] dark:bg-[#060c18] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-[#060c18] dark:focus:border-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                كلمة المرور المشفرة
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 dark:text-zinc-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-[#1b2b4d] dark:bg-[#060c18] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-[#060c18] dark:focus:border-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 focus:outline-none transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'جاري التحقق...' : 'دخول المشرف العام'}</span>
              <KeyRound className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-md mx-auto pt-6 text-center text-xs text-slate-400 dark:text-zinc-600">
        <p>نظام Super Admin الآمن لمنظومة إدارة RCN</p>
      </footer>
    </div>
  );
};
