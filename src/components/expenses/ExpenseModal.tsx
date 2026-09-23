import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Expense, ExpenseType } from '../../types';
import { getTodayDateString } from '../../services/storage';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt'> | Expense) => void;
  initialExpense?: Expense | null;
  defaultType?: ExpenseType;
  tenantId: string;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExpense,
  defaultType = 'business',
  tenantId,
}) => {
  const [type, setType] = useState<ExpenseType>(defaultType);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('Rent');
  const [amount, setAmount] = useState<number>(500);
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>('cash');
  const [notes, setNotes] = useState('');

  const businessCategories = [
    { id: 'Rent', label: 'إيجار المقر' },
    { id: 'Electricity', label: 'كهرباء وإنارة' },
    { id: 'Internet', label: 'إنترنت واتصالات' },
    { id: 'Salaries', label: 'رواتب مدربين وموظفين' },
    { id: 'Equipment', label: 'أجهزة ومعدات رياضية' },
    { id: 'Maintenance', label: 'صيانة ونظافة' },
    { id: 'Marketing', label: 'تسويق وإعلانات' },
    { id: 'Supplies', label: 'مستلزمات ومطبوعات' },
    { id: 'Other', label: 'مصاريف أخرى' },
  ];

  const personalCategories = [
    { id: 'Owner Draw / Salary', label: 'مسحوبات أرباح المالك' },
    { id: 'Personal Meals', label: 'وجبات وطعام شخصي' },
    { id: 'Personal Travel', label: 'وقود ومواصلات شخصية' },
    { id: 'Family', label: 'التزامات أسرية' },
    { id: 'Healthcare', label: 'رعاية صحية وتأمين' },
    { id: 'Other', label: 'مصاريف شخصية أخرى' },
  ];

  useEffect(() => {
    if (initialExpense) {
      setType(initialExpense.type);
      setTitle(initialExpense.title);
      setCategory(initialExpense.category);
      setAmount(initialExpense.amount);
      setDate(initialExpense.date);
      setPaymentMethod(initialExpense.paymentMethod);
      setNotes(initialExpense.notes || '');
    } else {
      setType(defaultType);
      setTitle('');
      setCategory(defaultType === 'business' ? 'Rent' : 'Owner Draw / Salary');
      setAmount(500);
      setDate(getTodayDateString());
      setPaymentMethod('cash');
      setNotes('');
    }
  }, [initialExpense, isOpen, defaultType]);

  const handleTypeChange = (newType: ExpenseType) => {
    setType(newType);
    setCategory(newType === 'business' ? 'Rent' : 'Owner Draw / Salary');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialExpense) {
      onSave({
        ...initialExpense,
        type,
        title,
        category: category as any,
        amount,
        date,
        paymentMethod,
        notes,
      });
    } else {
      onSave({
        tenantId,
        type,
        title,
        category: category as any,
        amount,
        date,
        paymentMethod,
        notes,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialExpense ? 'تعديل سند المصروف' : 'تسجيل مصروف جديد'}
      subtitle="تسجيل المصروف وفصله مالياً بين نشاط المنشأة والمسحوبات الشخصية"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-right" dir="rtl">
        {/* Type Selector (Crucial Business vs Personal) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1.5">
            تصنيف نوع المصروف (الفصل المالي الدقيق)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('business')}
              className={`p-3 rounded-2xl border text-right transition-all ${
                type === 'business'
                  ? 'border-rose-600 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs font-black'
                  : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
              }`}
            >
              <div className="font-bold text-xs">مصروف تشغيلي للمنشأة (Business)</div>
              <div className="text-[10px] opacity-80 mt-0.5">يُخصم من أرباح النشاط التجاري</div>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('personal')}
              className={`p-3 rounded-2xl border text-right transition-all ${
                type === 'personal'
                  ? 'border-violet-600 bg-violet-50/60 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 shadow-xs font-black'
                  : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
              }`}
            >
              <div className="font-bold text-xs">مصروف أو سحب شخصي (Personal)</div>
              <div className="text-[10px] opacity-80 mt-0.5">مسحوبات خاصة لا تؤثر على ميزانية التشغيل</div>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              بيان أو عنوان المصروف
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: فاتورة صيانة أجهزة السير الكهربائي..."
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              بند التصنيف
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
            >
              {(type === 'business' ? businessCategories : personalCategories).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              المبلغ المدفوع
            </label>
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-black text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              تاريخ الصرف
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              طريقة السداد
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="cash">نقداً (كاش)</option>
              <option value="card">بطاقة بنكية / فيزا</option>
              <option value="bank_transfer">تحويل بنكي / محفظة</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
            ملاحظات إضافية
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات تفصيلية..."
            className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs font-medium text-gray-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold text-gray-600 dark:text-zinc-300"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20"
          >
            {initialExpense ? 'تحديث المصروف' : 'تسجيل المصروف'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
