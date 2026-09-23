import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutGrid,
  Users,
  QrCode,
  CreditCard,
  BarChart2,
  Settings,
} from 'lucide-react';

export interface MobileBottomNavProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  onOpenQRScan?: () => void;
  onDataModified?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentSection,
  onSelectSection,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutGrid },
    { id: 'members', label: 'الأعضاء', icon: Users },
    { id: 'attendance', label: 'الحضور', icon: QrCode },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CreditCard },
    { id: 'reports', label: 'التقارير', icon: BarChart2 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/80 shadow-lg dark:bg-[#060c18]/95 dark:border-[#1b2b4d] backdrop-blur-xl pb-safe transition-colors duration-200"
      dir="rtl"
      aria-label="شريط التنقل السفلي"
    >
      <div className="flex items-center justify-around px-1 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors select-none group"
            >
              {/* Active Top Line Indicator */}
              {isActive && (
                <motion.div
                  layoutId="mobileBottomNavActiveLine"
                  className="absolute -top-2 left-3 right-3 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_8px_rgba(37,99,235,0.5)] dark:from-blue-400 dark:to-cyan-400 dark:shadow-[0_0_10px_rgba(56,189,248,0.8)] rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-transform duration-150 ${
                  isActive
                    ? 'text-blue-600 dark:text-cyan-400 scale-110'
                    : 'text-slate-400 group-hover:text-slate-600 dark:text-zinc-400 dark:group-hover:text-zinc-200 group-active:scale-95'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-cyan-400 font-black'
                    : 'text-slate-400 font-medium group-hover:text-slate-600 dark:text-zinc-400 dark:group-hover:text-zinc-300'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
