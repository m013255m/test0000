import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  User,
  Calendar,
  Download,
  PieChart,
} from 'lucide-react';
import { storageService, formatCurrency } from '../../services/storage';

interface ReportsViewProps {
  tenantId: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ tenantId }) => {
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'this_year' | 'all'>('this_month');

  const members = useMemo(() => storageService.getMembers(tenantId), [tenantId]);
  const attendance = useMemo(() => storageService.getAttendance(tenantId), [tenantId]);
  const payments = useMemo(() => storageService.getPayments(tenantId), [tenantId]);
  const expenses = useMemo(() => storageService.getExpenses(tenantId), [tenantId]);

  // Compute Financials
  const reportData = useMemo(() => {
    // Total Revenue collected
    const totalRevenue = payments.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
    const outstandingDebts = payments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);

    // Business operational expenses
    const businessExpenses = expenses
      .filter((e) => e.type === 'business')
      .reduce((sum, e) => sum + e.amount, 0);

    // Personal drawings
    const personalDrawings = expenses
      .filter((e) => e.type === 'personal')
      .reduce((sum, e) => sum + e.amount, 0);

    // Net Operational Profit = Revenue - Business Expenses
    const netProfit = totalRevenue - businessExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // Plans Breakdown
    const planCounts: Record<string, number> = {};
    members.forEach((m) => {
      planCounts[m.membershipPlan] = (planCounts[m.membershipPlan] || 0) + 1;
    });

    // Expenses Category Breakdown
    const expenseCategoryCounts: Record<string, number> = {};
    expenses
      .filter((e) => e.type === 'business')
      .forEach((e) => {
        expenseCategoryCounts[e.category] = (expenseCategoryCounts[e.category] || 0) + e.amount;
      });

    return {
      totalRevenue,
      outstandingDebts,
      businessExpenses,
      personalDrawings,
      netProfit,
      profitMargin,
      planCounts,
      expenseCategoryCounts,
    };
  }, [members, payments, expenses]);

  const exportFinancialReport = () => {
    const reportText = `
تقرير الأداء المالي والتشغيلي
تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}
-----------------------------------------
إجمالي الإيرادات المحصلة: ${reportData.totalRevenue} ج.م
إجمالي المصروفات التشغيلية: ${reportData.businessExpenses} ج.م
صافي الأرباح التشغيلية: ${reportData.netProfit} ج.م
هامش الربح التشغيلي: ${reportData.profitMargin}%
المسحوبات الشخصية للمالك: ${reportData.personalDrawings} ج.م
الديون والاشتراكات المتبقية: ${reportData.outstandingDebts} ج.م
إجمالي عدد المشتركين: ${members.length}
إجمالي مرات تسجيل الحضور: ${attendance.length}
-----------------------------------------
    `;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_الأداء_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">التقارير المالية والتشغيلية</h2>
            <span className="rounded-full bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 text-xs font-bold text-teal-600 dark:text-teal-400">
              تحليل شامل
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            مؤشرات الربحية، الأداء، تفصيل التكاليف وتوزيع الباقات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-gray-200 dark:border-zinc-800 text-xs">
            {[
              { id: 'this_month', label: 'الشهر الحالي' },
              { id: 'this_year', label: 'العام الحالي' },
              { id: 'all', label: 'الكل' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setPeriod(t.id as any)}
                className={`rounded-xl px-3 py-1.5 font-bold transition-all ${
                  period === t.id
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={exportFinancialReport}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>تصدير تقرير</span>
          </button>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">إجمالي الإيرادات المحصلة</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-700 dark:text-emerald-300">
            {formatCurrency(reportData.totalRevenue, 'ج.م')}
          </div>
          <span className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400 block">
            اشتراكات وباقات الأعضاء
          </span>
        </div>

        {/* Business Operating Expenses */}
        <div className="rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">تكاليف التشغيل (Business)</span>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-rose-700 dark:text-rose-300">
            {formatCurrency(reportData.businessExpenses, 'ج.م')}
          </div>
          <span className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400 block">
            إيجار، كهرباء، رواتب، صيانة
          </span>
        </div>

        {/* Net Operating Profit */}
        <div className="rounded-3xl border border-teal-200 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400">صافي الأرباح التشغيلية</span>
            <BarChart3 className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-teal-700 dark:text-teal-300">
            {formatCurrency(reportData.netProfit, 'ج.م')}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-teal-600 dark:text-teal-400 font-bold">
            <span>هامش ربح تشغيلي: {reportData.profitMargin}%</span>
          </div>
        </div>

        {/* Owner Personal Drawings */}
        <div className="rounded-3xl border border-violet-200 dark:border-violet-900/40 bg-violet-50/50 dark:bg-violet-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-700 dark:text-violet-400">مسحوبات المالك (Personal)</span>
            <User className="h-4 w-4 text-violet-600" />
          </div>
          <div className="mt-3 text-2xl font-black text-violet-700 dark:text-violet-300">
            {formatCurrency(reportData.personalDrawings, 'ج.م')}
          </div>
          <span className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400 block">
            أرباح شخصية ومسحوبات منفصلة
          </span>
        </div>
      </div>

      {/* Middle Section: Plans Distribution & Expense Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Plans Distribution */}
        <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                توزيع المشتركين حسب الباقات
              </h3>
            </div>
            <span className="text-xs font-bold text-gray-400">
              إجمالي {members.length} عضو
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {Object.keys(reportData.planCounts).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">لا توجد بيانات باقات مسجلة</p>
            ) : (
              Object.entries(reportData.planCounts).map(([plan, count]) => {
                const pct = members.length > 0 ? Math.round((count / members.length) * 100) : 0;
                return (
                  <div key={plan} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800 dark:text-zinc-200">{plan}</span>
                      <span className="font-mono text-gray-500 dark:text-zinc-400">
                        {count} مشترك ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-rose-500" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                توزيع مصاريف تشغيل المنشأة
              </h3>
            </div>
            <span className="text-xs font-bold text-gray-400">
              {formatCurrency(reportData.businessExpenses, 'ج.م')}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {Object.keys(reportData.expenseCategoryCounts).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">لا توجد بنود مصاريف مسجلة</p>
            ) : (
              Object.entries(reportData.expenseCategoryCounts).map(([category, amount]) => {
                const pct =
                  reportData.businessExpenses > 0
                    ? Math.round((amount / reportData.businessExpenses) * 100)
                    : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800 dark:text-zinc-200">{category}</span>
                      <span className="font-mono text-gray-500 dark:text-zinc-400">
                        {formatCurrency(amount, 'ج.م')} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
