import React, { useState } from 'react';
import { Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface UserLoginProps {
  onGoToSuperAdmin: () => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({ onGoToSuperAdmin }) => {
  const { loginAsUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await loginAsUser(username.trim(), password);
      if (!res.success) {
        setError(res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بقاعدة البيانات المركزية. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 dark:bg-[#060b13] dark:text-zinc-100 px-4 py-6 sm:px-6 lg:px-8 text-right font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200" dir="rtl">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-80 w-80 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-80 w-80 rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Top Header bar with Theme switcher & Admin portal link */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">إدارة</span>
              <span className="text-base font-black bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">RCN</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400">نظام إدارة المشتركين والأنشطة</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="تبديل المظهر"
            title={theme === 'dark' ? 'الوضع النهاري (أبيض)' : 'الوضع الليلي'}
            className="rounded-2xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0c1424] p-2 text-amber-500 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#14213d] transition-colors shadow-xs"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-600" />}
          </button>
          <button
            onClick={onGoToSuperAdmin}
            aria-label="لوحة الإدارة"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white dark:border-[#1b2b4d] dark:bg-[#0c1424] px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#14213d] transition-colors shadow-xs"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">لوحة الإدارة</span>
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto my-auto">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 dark:border-[#1b2b4d] dark:bg-[#0d1627]/95 p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">إدارة</h2>
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:via-cyan-300 dark:to-blue-400 bg-clip-text text-transparent">RCN</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              تسجيل الدخول إلى حساب المنشأة
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
                اسم المستخدم
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
                  placeholder="أدخل اسم المستخدم..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-slate-50 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 dark:border-[#1b2b4d] dark:bg-[#060c18] dark:text-white dark:placeholder-zinc-500 dark:focus:bg-[#060c18] dark:focus:border-blue-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                كلمة المرور
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
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-cyan-500 focus:outline-none transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
              <ArrowLeft className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-md mx-auto pt-6 text-center text-xs text-slate-400 dark:text-zinc-500">
        <p>نظام إدارة المشتركين والأنشطة • إدارة RCN</p>
      </footer>
    </div>
  );
};
