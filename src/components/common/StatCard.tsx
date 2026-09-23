import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'emerald' | 'indigo' | 'amber' | 'rose' | 'violet' | 'blue' | 'cyan';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accentColor = 'indigo',
  onClick,
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20',
      gradient: 'from-emerald-500/5 to-transparent',
      hoverBorder: 'hover:border-emerald-500/30',
    },
    indigo: {
      bg: 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20',
      gradient: 'from-indigo-500/5 to-transparent',
      hoverBorder: 'hover:border-indigo-500/30',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
      gradient: 'from-amber-500/5 to-transparent',
      hoverBorder: 'hover:border-amber-500/30',
    },
    rose: {
      bg: 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20',
      gradient: 'from-rose-500/5 to-transparent',
      hoverBorder: 'hover:border-rose-500/30',
    },
    violet: {
      bg: 'bg-violet-500/10 text-violet-500 dark:text-violet-400 border-violet-500/20',
      gradient: 'from-violet-500/5 to-transparent',
      hoverBorder: 'hover:border-violet-500/30',
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20',
      gradient: 'from-blue-500/5 to-transparent',
      hoverBorder: 'hover:border-blue-500/30',
    },
    cyan: {
      bg: 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border-cyan-500/20',
      gradient: 'from-cyan-500/5 to-transparent',
      hoverBorder: 'hover:border-cyan-500/30',
    },
  };

  const style = colorMap[accentColor];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl border border-gray-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 p-5 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md ' + style.hoverBorder : ''
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-zinc-400">
            {title}
          </p>
          <p className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-2xl border p-2.5 ${style.bg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="relative mt-3 flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-gray-500 dark:text-zinc-400">{subtitle}</span>
          )}
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                trend.isPositive === false
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <span>{trend.value}</span>
              {trend.label && (
                <span className="font-normal text-gray-400 dark:text-zinc-500">
                  {trend.label}
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
