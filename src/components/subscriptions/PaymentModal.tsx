import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SubscriptionPayment, PaymentStatus, Member } from '../../types';
import { getTodayDateString, addDays } from '../../services/storage';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Omit<SubscriptionPayment, 'id' | 'invoiceNumber'> | SubscriptionPayment) => void;
  initialPayment?: SubscriptionPayment | null;
  members: Member[];
  tenantId: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPayment,
  members,
  tenantId,
}) => {
  const [memberId, setMemberId] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('اشتراك شهري شامل (VIP)');
  const [amount, setAmount] = useState<number>(1000);
  const [paidAmount, setPaidAmount] = useState<number>(1000);
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());
  const [nextPaymentDate, setNextPaymentDate] = useState(addDays(getTodayDateString(), 30));
  const [expirationDate, setExpirationDate] = useState(addDays(getTodayDateString(), 30));
  const [paymentMethod, setPaymentMethod] = useState<SubscriptionPayment['paymentMethod']>('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialPayment) {
      setMemberId(initialPayment.memberId);
      setSubscriptionType(initialPayment.subscriptionType);
      setAmount(initialPayment.amount);
      setPaidAmount(initialPayment.paidAmount);
      setPaymentDate(initialPayment.paymentDate);
      setNextPaymentDate(initialPayment.nextPaymentDate);
      setExpirationDate(initialPayment.expirationDate);
      setPaymentMethod(initialPayment.paymentMethod);
      setNotes(initialPayment.notes || '');
    } else {
      const defaultMember = members[0];
      setMemberId(defaultMember ? defaultMember.id : '');
      setSubscriptionType(defaultMember ? defaultMember.membershipPlan : 'اشتراك شهري شامل (VIP)');
      setAmount(1000);
      setPaidAmount(1000);
      setPaymentDate(getTodayDateString());
      setNextPaymentDate(addDays(getTodayDateString(), 30));
      setExpirationDate(addDays(getTodayDateString(), 30));
      setPaymentMethod('cash');
      setNotes('');
    }
  }, [initialPayment, isOpen, members]);

  // When member changes, autofill plan
  const handleMemberChange = (id: string) => {
    setMemberId(id);
    const m = members.find((mem) => mem.id === id);
    if (m) {
      setSubscriptionType(m.membershipPlan);
      setExpirationDate(m.expirationDate);
    }
  };

  const remainingAmount = Math.max(0, amount - paidAmount);

  const calculateStatus = (): PaymentStatus => {
    if (paidAmount >= amount) return 'paid';
    if (paidAmount > 0 && paidAmount < amount) return 'partially_paid';
    return 'unpaid';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMember = members.find((m) => m.id === memberId);
    const memberName = selectedMember ? selectedMember.fullName : 'عضو غير محدد';
    const status = calculateStatus();

    if (initialPayment) {
      onSave({
        ...initialPayment,
        memberId,
        memberName,
        subscriptionType,
        amount,
        paidAmount,
        remainingAmount,
        paymentDate,
        nextPaymentDate,
        expirationDate,
        paymentMethod,
        status,
        notes,
      });
    } else {
      onSave({
        tenantId,
        memberId,
        memberName,
        subscriptionType,
        amount,
        paidAmount,
        remainingAmount,
        paymentDate,
        nextPaymentDate,
        expirationDate,
        paymentMethod,
        status,
        notes,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialPayment ? 'تعديل سند القبض' : 'تسجيل سداد أو تجديد اشتراك'}
      subtitle="إصدار فاتورة وسند استلام مالي للمشترك"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-right" dir="rtl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              اختر المشترك
            </label>
            <select
              value={memberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600"
            >
              <option value="">-- اختر المشترك من القائمة --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.membershipPlan}) - {m.phoneNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              نوع أو مسمى الاشتراك
            </label>
            <input
              type="text"
              required
              value={subscriptionType}
              onChange={(e) => setSubscriptionType(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              طريقة الدفع
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="cash">نقداً (كاش)</option>
              <option value="credit_card">بطاقة بنكية / فيزا</option>
              <option value="bank_transfer">تحويل بنكي / محفظة إلكترونية</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              إجمالي قيمة الباقة (المستحق)
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
              المبلغ المدفوع (المحصّل)
            </label>
            <input
              type="number"
              min="0"
              required
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              المبلغ المتبقي (الآجل)
            </label>
            <div className="w-full rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 px-3.5 py-2.5 text-xs font-black text-rose-600 dark:text-rose-400">
              {remainingAmount} ج.م
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              تاريخ السداد
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              تاريخ انتهاء الاشتراك
            </label>
            <input
              type="date"
              required
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
            ملاحظات الفاتورة
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات حول طريقة الدفع، الخصم الممنوح..."
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
            {initialPayment ? 'تحديث السند' : 'حفظ وسداد الفاتورة'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
