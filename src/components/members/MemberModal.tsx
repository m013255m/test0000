import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Member, MembershipStatus } from '../../types';
import { getTodayDateString, addDays } from '../../services/storage';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id' | 'createdAt' | 'qrCodeValue'> | Member) => void;
  initialMember?: Member | null;
  tenantId: string;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMember,
  tenantId,
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [membershipPlan, setMembershipPlan] = useState('اشتراك شهري شامل (VIP)');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [expirationDate, setExpirationDate] = useState(addDays(getTodayDateString(), 30));
  const [status, setStatus] = useState<MembershipStatus>('active');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [notes, setNotes] = useState('');

  const membershipPlanPresets = [
    'اشتراك شهري شامل (VIP)',
    'اشتراك 3 أشهر لياقة وحديد',
    'اشتراك سنوي ذهبي',
    'باقة 10 حصص تدريبية',
    'اشتراك كروس فيت وتمارين حركية',
    'اشتراك تجريبي مجاني (Trial)',
    'باقة مخصصة (Custom)',
  ];

  useEffect(() => {
    if (initialMember) {
      setFullName(initialMember.fullName);
      setPhoneNumber(initialMember.phoneNumber);
      setEmail(initialMember.email);
      setMembershipPlan(initialMember.membershipPlan);
      setStartDate(initialMember.startDate);
      setExpirationDate(initialMember.expirationDate);
      setStatus(initialMember.status);
      setEmergencyContact(initialMember.emergencyContact || '');
      setGender(initialMember.gender || 'male');
      setNotes(initialMember.notes || '');
    } else {
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      setMembershipPlan('اشتراك شهري شامل (VIP)');
      setStartDate(getTodayDateString());
      setExpirationDate(addDays(getTodayDateString(), 30));
      setStatus('active');
      setEmergencyContact('');
      setGender('male');
      setNotes('');
    }
  }, [initialMember, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialMember) {
      onSave({
        ...initialMember,
        fullName,
        phoneNumber,
        email,
        membershipPlan,
        startDate,
        expirationDate,
        status,
        emergencyContact,
        gender,
        notes,
      });
    } else {
      onSave({
        tenantId,
        fullName,
        phoneNumber,
        email,
        membershipPlan,
        startDate,
        expirationDate,
        status,
        emergencyContact,
        gender,
        notes,
      });
    }
    onClose();
  };

  const handleQuickDuration = (days: number) => {
    setExpirationDate(addDays(startDate, days));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialMember ? 'تعديل بيانات المشترك' : 'إضافة مشترك جديد'}
      subtitle="إدخال بيانات المشترك وإصدار رمز QR فوري"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-right" dir="rtl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              الاسم الرباعي
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: يوسف أحمد عبد الرحمن"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              رقم الهاتف / الواتساب
            </label>
            <input
              type="text"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              خطة الاشتراك (الباقة)
            </label>
            <select
              value={membershipPlan}
              onChange={(e) => setMembershipPlan(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
            >
              {membershipPlanPresets.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              تاريخ بدء الاشتراك
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
            {/* Quick buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-gray-400">مدة سريعة:</span>
              <button
                type="button"
                onClick={() => handleQuickDuration(30)}
                className="rounded-lg bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-gray-700 dark:text-zinc-300"
              >
                شهر (30 يوم)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDuration(90)}
                className="rounded-lg bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-gray-700 dark:text-zinc-300"
              >
                3 أشهر
              </button>
              <button
                type="button"
                onClick={() => handleQuickDuration(365)}
                className="rounded-lg bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-gray-700 dark:text-zinc-300"
              >
                سنة كاملة
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              حالة الحساب
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="active">نشط (فعّال)</option>
              <option value="trial">تجريبي (Trial)</option>
              <option value="suspended">معلق مؤقتاً</option>
              <option value="expired">منتهي الصلاحية</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
              رقم الطوارئ / ولي الأمر
            </label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="رقم هاتف بديل..."
              className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
            ملاحظات أو توصيات خاصة
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات صحية، رقم الخزانة، أهداف التدريب..."
            className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-indigo-600"
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
            {initialMember ? 'حفظ التعديلات' : 'إضافة المشترك'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
