import {
  SaaSUser,
  Member,
  AttendanceRecord,
  SubscriptionPayment,
  Expense,
  AppNotification,
  BusinessSettings,
  PaymentStatus,
} from '../types';
import { firebaseService } from './firebase';

const STORAGE_KEYS = {
  USERS: 'pulsesync_saas_users_v1',
  CURRENT_USER: 'pulsesync_current_user_v1',
  IS_SUPERADMIN: 'pulsesync_is_superadmin_v1',
  MEMBERS: 'pulsesync_members_v1',
  ATTENDANCE: 'pulsesync_attendance_v1',
  PAYMENTS: 'pulsesync_payments_v1',
  EXPENSES: 'pulsesync_expenses_v1',
  NOTIFICATIONS: 'pulsesync_notifications_v1',
  SETTINGS: 'pulsesync_settings_v1',
  THEME: 'pulsesync_theme_v1',
};

// Helper date functions
export const getTodayDateString = (): string => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const getDaysRemaining = (expirationDateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatCurrency = (amount: number, symbol = 'ج.م'): string => {
  return `${amount.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${symbol}`;
};

// Public member IDs are exactly 7 numeric digits.
// Internal member.id remains stable so existing attendance/payment records keep working.
const normalizePublicMemberId = (value: string): string => {
  const raw = String(value || '').trim();
  const legacy = raw.match(/^PS-MEM-(\d{1,7})$/i);
  const plain = raw.match(/^\d{1,7}$/);
  const digits = legacy ? legacy[1] : plain ? plain[0] : '';
  if (!digits) return '';
  return digits.padStart(7, '0');
};

const nextPublicMemberId = (members: Member[]): string => {
  const used = new Set(
    members
      .map((m) => normalizePublicMemberId(m.qrCodeValue))
      .filter(Boolean)
  );
  const numbers = [...used].map((id) => Number(id)).filter(Number.isFinite);
  let candidate = numbers.length ? Math.max(...numbers) + 1 : 1;
  while (used.has(String(candidate).padStart(7, '0'))) candidate += 1;
  if (candidate > 9999999) throw new Error('لا توجد أرقام أعضاء متاحة');
  return String(candidate).padStart(7, '0');
};

// Initial Seed Users for Super Admin
const INITIAL_USERS: SaaSUser[] = [
  {
    id: 'user-owner-1',
    fullName: 'كابتن أحمد سامي',
    username: 'alex_fitness',
    password: 'password123',
    phoneNumber: '01012345678',
    businessName: 'نادي أليكس فيتنس الرياضي',
    businessType: 'gym',
    startDate: '2026-01-01',
    expirationDate: addDays(getTodayDateString(), 180),
    status: 'active',
    notes: 'اشتراك باقة المحترفين السنوية - فرع الدقي.',
    createdAt: '2026-01-01T08:00:00Z',
    role: 'business_owner',
  },
  {
    id: 'user-owner-2',
    fullName: 'كابتن إيلينا رستم',
    username: 'elena_martial',
    password: 'password123',
    phoneNumber: '01123456789',
    businessName: 'أكاديمية الفنون القتالية والملاكمة',
    businessType: 'academy',
    startDate: '2026-02-15',
    expirationDate: addDays(getTodayDateString(), 4), // Expiring soon!
    status: 'active',
    notes: 'الاشتراك ينتهي خلال 4 أيام. بانتظار التجديد.',
    createdAt: '2026-02-15T09:30:00Z',
    role: 'business_owner',
  },
  {
    id: 'user-owner-3',
    fullName: 'أ. طارق الشريف',
    username: 'marcus_course',
    password: 'password123',
    phoneNumber: '01234567890',
    businessName: 'مركز تدريب القادة والأعمال',
    businessType: 'training_center',
    startDate: '2025-09-01',
    expirationDate: addDays(getTodayDateString(), -10), // Expired!
    status: 'expired',
    notes: 'انتهى الاشتراك منذ 10 أيام وتم تجميد الحساب مؤقتاً.',
    createdAt: '2025-09-01T10:00:00Z',
    role: 'business_owner',
  },
  {
    id: 'user-owner-4',
    fullName: 'د. سارة خليل',
    username: 'sophia_tennis',
    password: 'password123',
    phoneNumber: '01567890123',
    businessName: 'نادي التنس والاسكواش المتميز',
    businessType: 'club',
    startDate: '2026-03-01',
    expirationDate: addDays(getTodayDateString(), 90),
    status: 'active',
    notes: 'اشتراك ربع سنوي مع نظام حجز الملاعب الذكي.',
    createdAt: '2026-03-01T12:00:00Z',
    role: 'business_owner',
  },
];

// Initial Members for default tenant (Apex / Alex Fitness: 'user-owner-1')
const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-101',
    tenantId: 'user-owner-1',
    fullName: 'يوسف عبد الرحمن',
    phoneNumber: '01099887766',
    email: 'youssef@example.com',
    membershipPlan: 'اشتراك شهري شامل (VIP)',
    qrCodeValue: '0000101',
    startDate: '2026-02-01',
    expirationDate: addDays(getTodayDateString(), 35),
    status: 'active',
    emergencyContact: '01099887760',
    gender: 'male',
    notes: 'يفضل التدريب الصباحي ولديه مدرب خاص.',
    avatarColor: 'bg-emerald-500',
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'mem-102',
    tenantId: 'user-owner-1',
    fullName: 'مريم الشاذلي',
    phoneNumber: '01155443322',
    email: 'mariam@example.com',
    membershipPlan: 'اشتراك سنوي ذهبي',
    qrCodeValue: '0000102',
    startDate: '2026-01-10',
    expirationDate: addDays(getTodayDateString(), 290),
    status: 'active',
    emergencyContact: '01155443300',
    gender: 'female',
    notes: 'تم تخصيص خزانة رقم 42.',
    avatarColor: 'bg-indigo-500',
    createdAt: '2026-01-10T14:15:00Z',
  },
  {
    id: 'mem-103',
    tenantId: 'user-owner-1',
    fullName: 'كريم عز الدين',
    phoneNumber: '01233445566',
    email: 'karim@example.com',
    membershipPlan: 'اشتراك حديد ولياقة قياسي',
    qrCodeValue: '0000103',
    startDate: '2026-02-15',
    expirationDate: addDays(getTodayDateString(), 3), // Expiring soon!
    status: 'active',
    emergencyContact: '01233445500',
    gender: 'male',
    notes: 'تجديد الاشتراك مستحق خلال 3 أيام.',
    avatarColor: 'bg-amber-500',
    createdAt: '2026-02-15T11:20:00Z',
  },
  {
    id: 'mem-104',
    tenantId: 'user-owner-1',
    fullName: 'أميرة حسام',
    phoneNumber: '01511223344',
    email: 'amira@example.com',
    membershipPlan: 'اشتراك كروس فيت وتمارين حركية',
    qrCodeValue: '0000104',
    startDate: '2026-01-05',
    expirationDate: addDays(getTodayDateString(), 75),
    status: 'active',
    emergencyContact: '01511223300',
    gender: 'female',
    notes: 'ملتزمة بجدول التغذية والتمارين الرياضية.',
    avatarColor: 'bg-violet-500',
    createdAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'mem-105',
    tenantId: 'user-owner-1',
    fullName: 'عمر النجار',
    phoneNumber: '01066778899',
    email: 'omar@example.com',
    membershipPlan: 'باقة 10 حصص تدريبية',
    qrCodeValue: '0000105',
    startDate: '2026-01-20',
    expirationDate: addDays(getTodayDateString(), -5), // Expired!
    status: 'expired',
    emergencyContact: '01066778800',
    gender: 'male',
    notes: 'انتهت الصلاحية منذ 5 أيام ويحتاج إلى تجديد.',
    avatarColor: 'bg-rose-500',
    createdAt: '2026-01-20T16:45:00Z',
  },
  {
    id: 'mem-106',
    tenantId: 'user-owner-1',
    fullName: 'نور الهدى إبراهيم',
    phoneNumber: '01188990011',
    email: 'nour@example.com',
    membershipPlan: 'اشتراك تجريبي مجاني',
    qrCodeValue: '0000106',
    startDate: addDays(getTodayDateString(), -10),
    expirationDate: addDays(getTodayDateString(), 4),
    status: 'trial',
    emergencyContact: '01188990000',
    gender: 'female',
    notes: 'مهتمة بالتحويل للاشتراك السنوي.',
    avatarColor: 'bg-teal-500',
    createdAt: '2026-03-01T15:30:00Z',
  },
  {
    id: 'mem-107',
    tenantId: 'user-owner-1',
    fullName: 'طارق منصور',
    phoneNumber: '01277889900',
    email: 'tarek@example.com',
    membershipPlan: 'اشتراك شهري شامل (VIP)',
    qrCodeValue: '0000107',
    startDate: '2026-02-10',
    expirationDate: addDays(getTodayDateString(), 45),
    status: 'active',
    emergencyContact: '01277889911',
    gender: 'male',
    notes: 'حضور منتظم في الفترة المسائية.',
    avatarColor: 'bg-blue-500',
    createdAt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'mem-108',
    tenantId: 'user-owner-1',
    fullName: 'هند الصاوي',
    phoneNumber: '01044556677',
    email: 'hend@example.com',
    membershipPlan: 'اشتراك حديد ولياقة قياسي',
    qrCodeValue: '0000108',
    startDate: '2026-01-15',
    expirationDate: addDays(getTodayDateString(), -2),
    status: 'suspended',
    emergencyContact: '01044556600',
    gender: 'female',
    notes: 'حساب معلق بانتظار سداد رسوم التجديد.',
    avatarColor: 'bg-amber-600',
    createdAt: '2026-01-15T08:30:00Z',
  },
];

// Initial Attendance Records
const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    tenantId: 'user-owner-1',
    memberId: 'mem-101',
    memberName: 'يوسف عبد الرحمن',
    membershipPlan: 'اشتراك شهري شامل (VIP)',
    date: getTodayDateString(),
    time: '08:14:22',
    checkInTimestamp: Date.now() - 1000 * 60 * 180,
    status: 'present',
    verifiedBy: 'qr_scanner',
  },
  {
    id: 'att-2',
    tenantId: 'user-owner-1',
    memberId: 'mem-102',
    memberName: 'مريم الشاذلي',
    membershipPlan: 'اشتراك سنوي ذهبي',
    date: getTodayDateString(),
    time: '09:05:10',
    checkInTimestamp: Date.now() - 1000 * 60 * 120,
    status: 'present',
    verifiedBy: 'qr_scanner',
  },
  {
    id: 'att-3',
    tenantId: 'user-owner-1',
    memberId: 'mem-104',
    memberName: 'أميرة حسام',
    membershipPlan: 'اشتراك كروس فيت وتمارين حركية',
    date: getTodayDateString(),
    time: '10:30:45',
    checkInTimestamp: Date.now() - 1000 * 60 * 45,
    status: 'present',
    verifiedBy: 'qr_scanner',
  },
  {
    id: 'att-4',
    tenantId: 'user-owner-1',
    memberId: 'mem-107',
    memberName: 'طارق منصور',
    membershipPlan: 'اشتراك شهري شامل (VIP)',
    date: addDays(getTodayDateString(), -1),
    time: '18:15:00',
    checkInTimestamp: Date.now() - 1000 * 60 * 60 * 24,
    status: 'present',
    verifiedBy: 'qr_scanner',
  },
  {
    id: 'att-5',
    tenantId: 'user-owner-1',
    memberId: 'mem-101',
    memberName: 'يوسف عبد الرحمن',
    membershipPlan: 'اشتراك شهري شامل (VIP)',
    date: addDays(getTodayDateString(), -1),
    time: '08:20:11',
    checkInTimestamp: Date.now() - 1000 * 60 * 60 * 25,
    status: 'present',
    verifiedBy: 'qr_scanner',
  },
  {
    id: 'att-6',
    tenantId: 'user-owner-1',
    memberId: 'mem-103',
    memberName: 'كريم عز الدين',
    membershipPlan: 'اشتراك حديد ولياقة قياسي',
    date: addDays(getTodayDateString(), -2),
    time: '14:40:02',
    checkInTimestamp: Date.now() - 1000 * 60 * 60 * 48,
    status: 'present',
    verifiedBy: 'manual',
  },
];

// Initial Subscriptions & Payments
const INITIAL_PAYMENTS: SubscriptionPayment[] = [
  {
    id: 'pay-1',
    tenantId: 'user-owner-1',
    memberId: 'mem-101',
    memberName: 'يوسف عبد الرحمن',
    subscriptionType: 'اشتراك شهري شامل (VIP)',
    amount: 1200,
    paidAmount: 1200,
    remainingAmount: 0,
    paymentDate: addDays(getTodayDateString(), -5),
    nextPaymentDate: addDays(getTodayDateString(), 25),
    expirationDate: addDays(getTodayDateString(), 35),
    paymentMethod: 'credit_card',
    status: 'paid',
    invoiceNumber: 'INV-2026-081',
    notes: 'تم السداد بالكامل بنجاح.',
  },
  {
    id: 'pay-2',
    tenantId: 'user-owner-1',
    memberId: 'mem-102',
    memberName: 'مريم الشاذلي',
    subscriptionType: 'اشتراك سنوي ذهبي',
    amount: 9500,
    paidAmount: 9500,
    remainingAmount: 0,
    paymentDate: addDays(getTodayDateString(), -30),
    nextPaymentDate: addDays(getTodayDateString(), 335),
    expirationDate: addDays(getTodayDateString(), 290),
    paymentMethod: 'bank_transfer',
    status: 'paid',
    invoiceNumber: 'INV-2026-050',
    notes: 'دفع سنوي كامل مع خصم 15%.',
  },
  {
    id: 'pay-3',
    tenantId: 'user-owner-1',
    memberId: 'mem-103',
    memberName: 'كريم عز الدين',
    subscriptionType: 'اشتراك حديد ولياقة قياسي',
    amount: 800,
    paidAmount: 500,
    remainingAmount: 300,
    paymentDate: addDays(getTodayDateString(), -10),
    nextPaymentDate: addDays(getTodayDateString(), 3),
    expirationDate: addDays(getTodayDateString(), 3),
    paymentMethod: 'cash',
    status: 'partially_paid',
    invoiceNumber: 'INV-2026-092',
    notes: 'سداد جزئي 500 ج.م ومتبقي 300 ج.م عند التجديد.',
  },
  {
    id: 'pay-4',
    tenantId: 'user-owner-1',
    memberId: 'mem-104',
    memberName: 'أميرة حسام',
    subscriptionType: 'اشتراك كروس فيت وتمارين حركية',
    amount: 1500,
    paidAmount: 1500,
    remainingAmount: 0,
    paymentDate: addDays(getTodayDateString(), -15),
    nextPaymentDate: addDays(getTodayDateString(), 75),
    expirationDate: addDays(getTodayDateString(), 75),
    paymentMethod: 'digital_wallet',
    status: 'paid',
    invoiceNumber: 'INV-2026-088',
  },
  {
    id: 'pay-5',
    tenantId: 'user-owner-1',
    memberId: 'mem-105',
    memberName: 'عمر النجار',
    subscriptionType: 'باقة 10 حصص تدريبية',
    amount: 900,
    paidAmount: 0,
    remainingAmount: 900,
    paymentDate: addDays(getTodayDateString(), -5),
    nextPaymentDate: addDays(getTodayDateString(), -5),
    expirationDate: addDays(getTodayDateString(), -5),
    paymentMethod: 'credit_card',
    status: 'overdue',
    invoiceNumber: 'INV-2026-074',
    notes: 'فشل خصم البطاقة البنكية وتم إرسال تنبيه للمشترك.',
  },
  {
    id: 'pay-6',
    tenantId: 'user-owner-1',
    memberId: 'mem-107',
    memberName: 'طارق منصور',
    subscriptionType: 'اشتراك شهري شامل (VIP)',
    amount: 1200,
    paidAmount: 1200,
    remainingAmount: 0,
    paymentDate: addDays(getTodayDateString(), -2),
    nextPaymentDate: addDays(getTodayDateString(), 28),
    expirationDate: addDays(getTodayDateString(), 45),
    paymentMethod: 'credit_card',
    status: 'paid',
    invoiceNumber: 'INV-2026-105',
  },
  {
    id: 'pay-7',
    tenantId: 'user-owner-1',
    memberId: 'mem-108',
    memberName: 'هند الصاوي',
    subscriptionType: 'اشتراك حديد ولياقة قياسي',
    amount: 800,
    paidAmount: 0,
    remainingAmount: 800,
    paymentDate: addDays(getTodayDateString(), -2),
    nextPaymentDate: addDays(getTodayDateString(), -2),
    expirationDate: addDays(getTodayDateString(), -2),
    paymentMethod: 'cash',
    status: 'unpaid',
    invoiceNumber: 'INV-2026-106',
    notes: 'بانتظار السداد للتفعيل.',
  },
];

// Initial Expenses (Strictly separated: Business vs Personal)
const INITIAL_EXPENSES: Expense[] = [
  // Business Expenses
  {
    id: 'exp-b-1',
    tenantId: 'user-owner-1',
    title: 'إيجار مقر الصالة الرياضية الرئيسي',
    type: 'business',
    category: 'Rent',
    amount: 15000,
    date: addDays(getTodayDateString(), -2),
    paymentMethod: 'bank_transfer',
    notes: 'إيجار المقر الشهري لفرع الدقي.',
    receiptNumber: 'REC-B-991',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'exp-b-2',
    tenantId: 'user-owner-1',
    title: 'فاتورة الكهرباء والتكييف المركزي',
    type: 'business',
    category: 'Electricity',
    amount: 3200,
    date: addDays(getTodayDateString(), -6),
    paymentMethod: 'card',
    notes: 'استهلاك تشغيل أجهزة التكييف والإنارة.',
    receiptNumber: 'REC-B-992',
    createdAt: '2026-02-28T10:00:00Z',
  },
  {
    id: 'exp-b-3',
    tenantId: 'user-owner-1',
    title: 'اشتراك الإنترنت فائق السرعة',
    type: 'business',
    category: 'Internet',
    amount: 750,
    date: addDays(getTodayDateString(), -8),
    paymentMethod: 'card',
    notes: 'خط فايبر مخصص للمشتركين وأجهزة QR.',
    receiptNumber: 'REC-B-993',
    createdAt: '2026-02-26T11:00:00Z',
  },
  {
    id: 'exp-b-4',
    tenantId: 'user-owner-1',
    title: 'رواتب المدربين وموظفي الاستقبال',
    type: 'business',
    category: 'Salaries',
    amount: 18500,
    date: addDays(getTodayDateString(), -10),
    paymentMethod: 'bank_transfer',
    notes: 'رواتب النصف الأول للمدربين والموظفين.',
    receiptNumber: 'REC-B-994',
    createdAt: '2026-02-24T14:00:00Z',
  },
  {
    id: 'exp-b-5',
    tenantId: 'user-owner-1',
    title: 'صيانة دورية للأجهزة واستبدال وايرات',
    type: 'business',
    category: 'Maintenance',
    amount: 1800,
    date: addDays(getTodayDateString(), -12),
    paymentMethod: 'card',
    notes: 'صيانة وتزييت أجهزة المشي والكابلات.',
    receiptNumber: 'REC-B-995',
    createdAt: '2026-02-22T09:00:00Z',
  },
  {
    id: 'exp-b-6',
    tenantId: 'user-owner-1',
    title: 'حملة إعلانات ممولة على السوشيال ميديا',
    type: 'business',
    category: 'Marketing',
    amount: 2500,
    date: addDays(getTodayDateString(), -14),
    paymentMethod: 'card',
    notes: 'إعلانات استهداف المنطقة المحيطة بالصالة.',
    receiptNumber: 'REC-B-996',
    createdAt: '2026-02-20T16:00:00Z',
  },
  // Personal Expenses (Owner Draw / Separated)
  {
    id: 'exp-p-1',
    tenantId: 'user-owner-1',
    title: 'سحب مالي شخصي لمالك الصالة (مسحوبات)',
    type: 'personal',
    category: 'Owner Draw / Salary',
    amount: 10000,
    date: addDays(getTodayDateString(), -4),
    paymentMethod: 'bank_transfer',
    notes: 'مسحوبات أرباح شخصية لحساب المالك.',
    receiptNumber: 'REC-P-101',
    createdAt: '2026-03-01T12:00:00Z',
  },
  {
    id: 'exp-p-2',
    tenantId: 'user-owner-1',
    title: 'مشتريات واحتياجات أسرية شخصية',
    type: 'personal',
    category: 'Personal Meals',
    amount: 1200,
    date: addDays(getTodayDateString(), -3),
    paymentMethod: 'card',
    notes: 'مصاريف شخصية منفصلة عن الحساب التجاري.',
    receiptNumber: 'REC-P-102',
    createdAt: '2026-03-02T19:00:00Z',
  },
];

// Initial Business Settings
const INITIAL_SETTINGS: BusinessSettings = {
  tenantId: 'user-owner-1',
  businessName: 'نادي أليكس فيتنس الرياضي',
  tagline: 'منصة التدريب الرياضي واللياقة البدنية المتكاملة',
  contactEmail: 'contact@alexfitness.com',
  contactPhone: '01012345678',
  address: 'شارع التحرير، الدقي، الجيزة، مصر',
  currencySymbol: 'ج.م',
  currencyCode: 'EGP',
  currency: 'ج.م',
  taxRate: 14,
  qrScanSound: true,
  preventDuplicateAttendanceWithinHours: 3,
  lowSubscriptionWarningDays: 7,
};

// Storage Service Wrapper
export const storageService = {
  // SaaS Users (for Super Admin)
  getUsers: (): SaaSUser[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      const users: SaaSUser[] = JSON.parse(raw);
      return users.map((u) => {
        if (u.status !== 'disabled') {
          const remaining = getDaysRemaining(u.expirationDate);
          if (remaining < 0) {
            return { ...u, status: 'expired' };
          }
        }
        return u;
      });
    } catch {
      return INITIAL_USERS;
    }
  },
  saveUsers: (users: SaaSUser[]): void => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  addUser: (user: Omit<SaaSUser, 'id' | 'createdAt'>): SaaSUser => {
    const users = storageService.getUsers();
    const newUser: SaaSUser = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    users.unshift(newUser);
    storageService.saveUsers(users);
    // Persist centrally in Firestore so it's instantly available on all devices
    firebaseService.saveUser(newUser).catch((err) => {
      console.warn('Firebase saveUser error:', err);
    });
    return newUser;
  },
  updateUser: (updatedUser: SaaSUser): void => {
    const users = storageService.getUsers();
    const idx = users.findIndex((u) => u.id === updatedUser.id);
    if (idx !== -1) {
      users[idx] = updatedUser;
      storageService.saveUsers(users);
    }
    // Update centrally in Firestore
    firebaseService.saveUser(updatedUser).catch((err) => {
      console.warn('Firebase updateUser error:', err);
    });
  },
  deleteUser: (id: string): void => {
    const users = storageService.getUsers().filter((u) => u.id !== id);
    storageService.saveUsers(users);
    // Delete centrally in Firestore
    firebaseService.deleteUser(id).catch((err) => {
      console.warn('Firebase deleteUser error:', err);
    });
  },
  resetUserPassword: (userId: string, newPass: string): void => {
    const users = storageService.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx].password = newPass;
      storageService.saveUsers(users);
    }
    // Update password centrally in Firestore
    firebaseService.updateUserFields(userId, { password: newPass }).catch((err) => {
      console.warn('Firebase reset password error:', err);
    });
  },
  syncUsersWithCloud: async (): Promise<SaaSUser[]> => {
    try {
      const cloudUsers = await firebaseService.fetchUsers();
      if (cloudUsers && cloudUsers.length > 0) {
        storageService.saveUsers(cloudUsers);
        return cloudUsers;
      } else {
        const local = storageService.getUsers();
        await firebaseService.seedInitialUsersIfEmpty(local);
        return local;
      }
    } catch (err) {
      console.warn('syncUsersWithCloud error:', err);
      return storageService.getUsers();
    }
  },

  // Members
  getMembers: (tenantId: string): Member[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    let allMembers: Member[] = [];
    if (raw === null) {
      allMembers = INITIAL_MEMBERS;
      // Seed data is normalized below as well.
    } else {
      try {
        allMembers = JSON.parse(raw);
      } catch {
        allMembers = INITIAL_MEMBERS;
      }
    }

    let changed = false;
    const normalized = allMembers.map((m) => {
      const publicId = normalizePublicMemberId(m.qrCodeValue);
      if (publicId && m.qrCodeValue !== publicId) {
        changed = true;
        return { ...m, qrCodeValue: publicId };
      }
      return m;
    });

    if (changed || raw === null) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(normalized));
    }

    return normalized
      .filter((m) => m.tenantId === tenantId)
      .map((m) => {
        if (m.status !== 'suspended') {
          const rem = getDaysRemaining(m.expirationDate);
          if (rem < 0) {
            return { ...m, status: 'expired' };
          }
        }
        return m;
      });
  },
  saveMembers: (members: Member[], specificTenantId?: string): void => {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    let allMembers: Member[] = [];
    try {
      allMembers = raw ? JSON.parse(raw) : [];
    } catch {
      allMembers = [];
    }
    const targetTenantIds = new Set<string>();
    if (specificTenantId) {
      targetTenantIds.add(specificTenantId);
    }
    members.forEach((m) => {
      if (m.tenantId) targetTenantIds.add(m.tenantId);
    });
    const retained = targetTenantIds.size > 0
      ? allMembers.filter((m) => !targetTenantIds.has(m.tenantId))
      : allMembers;
    const combined = [...members, ...retained];
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(combined));
  },
  addMember: (memberData: Omit<Member, 'id' | 'createdAt' | 'qrCodeValue'>): Member => {
    const tenantMembers = storageService.getMembers(memberData.tenantId);
    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}`,
      // Public/member ID: numbers only, exactly 7 digits.
      qrCodeValue: nextPublicMemberId(tenantMembers),
      createdAt: new Date().toISOString(),
    };
    tenantMembers.unshift(newMember);
    storageService.saveMembers(tenantMembers);
    firebaseService.saveMember(newMember).catch(() => {});
    return newMember;
  },
  updateMember: (member: Member): void => {
    const tenantMembers = storageService.getMembers(member.tenantId);
    const idx = tenantMembers.findIndex((m) => m.id === member.id);
    if (idx !== -1) {
      tenantMembers[idx] = member;
      storageService.saveMembers(tenantMembers);
      firebaseService.saveMember(member).catch(() => {});
    }
  },
  deleteMember: (id: string, tenantId: string): void => {
    const tenantMembers = storageService.getMembers(tenantId).filter((m) => m.id !== id);
    storageService.saveMembers(tenantMembers, tenantId);
    firebaseService.deleteMember(id).catch(() => {});
  },

  // Attendance
  getAttendance: (tenantId: string): AttendanceRecord[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let allAttendance: AttendanceRecord[] = [];
    if (raw === null) {
      allAttendance = INITIAL_ATTENDANCE;
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allAttendance));
    } else {
      try {
        allAttendance = JSON.parse(raw);
      } catch {
        allAttendance = INITIAL_ATTENDANCE;
      }
    }
    return allAttendance.filter((a) => a.tenantId === tenantId);
  },
  saveAttendance: (records: AttendanceRecord[], specificTenantId?: string): void => {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let allAttendance: AttendanceRecord[] = [];
    try {
      allAttendance = raw ? JSON.parse(raw) : [];
    } catch {
      allAttendance = [];
    }
    const targetTenantIds = new Set<string>();
    if (specificTenantId) {
      targetTenantIds.add(specificTenantId);
    }
    records.forEach((r) => {
      if (r.tenantId) targetTenantIds.add(r.tenantId);
    });
    const retained = targetTenantIds.size > 0
      ? allAttendance.filter((r) => !targetTenantIds.has(r.tenantId))
      : allAttendance;
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([...records, ...retained]));
  },
  recordAttendance: (
    record: Omit<AttendanceRecord, 'id' | 'checkInTimestamp'>
  ): { success: boolean; record?: AttendanceRecord; reason?: string } => {
    const attendance = storageService.getAttendance(record.tenantId);
    const now = Date.now();
    const settings = storageService.getSettings(record.tenantId);
    const duplicateWindowMs = (settings.preventDuplicateAttendanceWithinHours || 3) * 60 * 60 * 1000;

    // Check duplicate check-in today
    const recentCheckIn = attendance.find(
      (a) => a.memberId === record.memberId && a.date === record.date && now - a.checkInTimestamp < duplicateWindowMs
    );
    if (recentCheckIn) {
      const minutesAgo = Math.round((now - recentCheckIn.checkInTimestamp) / (60 * 1000));
      return {
        success: false,
        reason: `تم تسجيل حضور هذا المشترك اليوم في تمام الساعة ${recentCheckIn.time} (منذ ${minutesAgo} دقيقة). لمنع تكرار التحضير، تم رفض العملية.`,
      };
    }
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}`,
      checkInTimestamp: now,
    };
    attendance.unshift(newRecord);
    storageService.saveAttendance(attendance);
    firebaseService.saveAttendance(newRecord).catch(() => {});
    return { success: true, record: newRecord };
  },
  deleteAttendance: (id: string, tenantId: string): void => {
    const attendance = storageService.getAttendance(tenantId).filter((a) => a.id !== id);
    storageService.saveAttendance(attendance, tenantId);
  },

  // Subscriptions & Payments
  getPayments: (tenantId: string): SubscriptionPayment[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    let allPayments: SubscriptionPayment[] = [];
    if (raw === null) {
      allPayments = INITIAL_PAYMENTS;
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(allPayments));
    } else {
      try {
        allPayments = JSON.parse(raw);
      } catch {
        allPayments = INITIAL_PAYMENTS;
      }
    }
    return allPayments
      .filter((p) => p.tenantId === tenantId)
      .map((p) => {
        if (p.status !== 'paid') {
          const daysRem = getDaysRemaining(p.expirationDate);
          if (daysRem < 0) {
            return { ...p, status: 'overdue' as PaymentStatus };
          } else if (daysRem <= 7 && daysRem >= 0) {
            return { ...p, status: 'expiring_soon' as PaymentStatus };
          }
        }
        return p;
      });
  },
  savePayments: (payments: SubscriptionPayment[], specificTenantId?: string): void => {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    let allPayments: SubscriptionPayment[] = [];
    try {
      allPayments = raw ? JSON.parse(raw) : [];
    } catch {
      allPayments = [];
    }
    const targetTenantIds = new Set<string>();
    if (specificTenantId) {
      targetTenantIds.add(specificTenantId);
    }
    payments.forEach((p) => {
      if (p.tenantId) targetTenantIds.add(p.tenantId);
    });
    const retained = targetTenantIds.size > 0
      ? allPayments.filter((p) => !targetTenantIds.has(p.tenantId))
      : allPayments;
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([...payments, ...retained]));
  },
  addPayment: (payment: Omit<SubscriptionPayment, 'id' | 'invoiceNumber'>): SubscriptionPayment => {
    const payments = storageService.getPayments(payment.tenantId);
    const invoiceNum = `INV-${new Date().getFullYear()}-${String(payments.length + 101).padStart(3, '0')}`;
    const newPayment: SubscriptionPayment = {
      ...payment,
      id: `pay-${Date.now()}`,
      invoiceNumber: invoiceNum,
    };
    payments.unshift(newPayment);
    storageService.savePayments(payments);
    firebaseService.savePayment(newPayment).catch(() => {});
    return newPayment;
  },
  updatePayment: (payment: SubscriptionPayment): void => {
    const payments = storageService.getPayments(payment.tenantId);
    const idx = payments.findIndex((p) => p.id === payment.id);
    if (idx !== -1) {
      payments[idx] = payment;
      storageService.savePayments(payments);
      firebaseService.savePayment(payment).catch(() => {});
    }
  },
  deletePayment: (id: string, tenantId: string): void => {
    const payments = storageService.getPayments(tenantId).filter((p) => p.id !== id);
    storageService.savePayments(payments, tenantId);
  },

  // Expenses (Separated: Business vs Personal)
  getExpenses: (tenantId: string): Expense[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    let allExpenses: Expense[] = [];
    if (raw === null) {
      allExpenses = INITIAL_EXPENSES;
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(allExpenses));
    } else {
      try {
        allExpenses = JSON.parse(raw);
      } catch {
        allExpenses = INITIAL_EXPENSES;
      }
    }
    return allExpenses.filter((e) => e.tenantId === tenantId);
  },
  saveExpenses: (expenses: Expense[], specificTenantId?: string): void => {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    let allExpenses: Expense[] = [];
    try {
      allExpenses = raw ? JSON.parse(raw) : [];
    } catch {
      allExpenses = [];
    }
    const targetTenantIds = new Set<string>();
    if (specificTenantId) {
      targetTenantIds.add(specificTenantId);
    }
    expenses.forEach((e) => {
      if (e.tenantId) targetTenantIds.add(e.tenantId);
    });
    const retained = targetTenantIds.size > 0
      ? allExpenses.filter((e) => !targetTenantIds.has(e.tenantId))
      : allExpenses;
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([...expenses, ...retained]));
  },
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>): Expense => {
    const expenses = storageService.getExpenses(expense.tenantId);
    const receiptNum = `REC-${expense.type === 'business' ? 'B' : 'P'}-${Date.now().toString().slice(-4)}`;
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      receiptNumber: receiptNum,
      createdAt: new Date().toISOString(),
    };
    expenses.unshift(newExpense);
    storageService.saveExpenses(expenses);
    firebaseService.saveExpense(newExpense).catch(() => {});
    return newExpense;
  },
  updateExpense: (expense: Expense): void => {
    const expenses = storageService.getExpenses(expense.tenantId);
    const idx = expenses.findIndex((e) => e.id === expense.id);
    if (idx !== -1) {
      expenses[idx] = expense;
      storageService.saveExpenses(expenses);
      firebaseService.saveExpense(expense).catch(() => {});
    }
  },
  deleteExpense: (id: string, tenantId: string): void => {
    const expenses = storageService.getExpenses(tenantId).filter((e) => e.id !== id);
    storageService.saveExpenses(expenses, tenantId);
    firebaseService.deleteExpense(id).catch(() => {});
  },

  // Business Settings
  getSettings: (tenantId: string): BusinessSettings => {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SETTINGS}_${tenantId}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return { ...INITIAL_SETTINGS, tenantId };
  },
  saveSettings: (settings: BusinessSettings): void => {
    localStorage.setItem(`${STORAGE_KEYS.SETTINGS}_${settings.tenantId}`, JSON.stringify(settings));
    firebaseService.saveSettings(settings).catch(() => {});
  },

  // Notifications (dynamic generator based on live data)
  getNotifications: (tenantId: string): AppNotification[] => {
    const notifications: AppNotification[] = [];
    const members = storageService.getMembers(tenantId);
    const payments = storageService.getPayments(tenantId);
    const today = getTodayDateString();

    // 1. Expiring memberships within 7 days
    members.forEach((m) => {
      const days = getDaysRemaining(m.expirationDate);
      if (days >= 0 && days <= 7 && m.status === 'active') {
        notifications.push({
          id: `notif-exp-${m.id}`,
          tenantId,
          title: `اقتراب انتهاء اشتراك العضو`,
          message: `اشتراك المشترك "${m.fullName}" في (${m.membershipPlan}) سينتهي خلال ${days === 0 ? 'اليوم' : `${days} أيام`}.`,
          type: 'subscription_expiring',
          severity: days <= 2 ? 'warning' : 'info',
          date: today,
          read: false,
          linkSection: 'members',
          targetId: m.id,
        });
      }
    });

    // 2. Overdue or unpaid payments
    payments.forEach((p) => {
      if (p.status === 'overdue' || (p.status === 'unpaid' && getDaysRemaining(p.expirationDate) < 0)) {
        notifications.push({
          id: `notif-pay-${p.id}`,
          tenantId,
          title: `مستحقات اشتراك متأخرة`,
          message: `المشترك "${p.memberName}" لديه رصيد متأخر قدره ${formatCurrency(p.remainingAmount)} عن اشتراك ${p.subscriptionType}.`,
          type: 'payment_overdue',
          severity: 'critical',
          date: today,
          read: false,
          linkSection: 'subscriptions',
          targetId: p.id,
        });
      }
    });

    // 3. Repeated absence alert
    const attendance = storageService.getAttendance(tenantId);
    const attendedMemberIds = new Set(attendance.map((a) => a.memberId));
    members.forEach((m) => {
      if (m.status === 'active' && !attendedMemberIds.has(m.id)) {
        notifications.push({
          id: `notif-abs-${m.id}`,
          tenantId,
          title: `غياب متكرر لمشترك`,
          message: `المشترك "${m.fullName}" لم يسجل أي حضور مؤخراً. يوصى بمتابعته والتواصل معه.`,
          type: 'member_absence',
          severity: 'info',
          date: today,
          read: false,
          linkSection: 'attendance',
          targetId: m.id,
        });
      }
    });

    return notifications;
  },

  // Clear/Bulk Delete specific section datasets for a tenant
  clearAllMembers: (tenantId: string): void => {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    let allMembers: Member[] = [];
    try {
      allMembers = raw !== null ? JSON.parse(raw) : INITIAL_MEMBERS;
    } catch {
      allMembers = [];
    }
    const retained = allMembers.filter((m) => m.tenantId !== tenantId);
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(retained));
  },
  deleteMembersByIds: (ids: string[], tenantId: string): void => {
    const idSet = new Set(ids);
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    let allMembers: Member[] = [];
    try {
      allMembers = raw !== null ? JSON.parse(raw) : INITIAL_MEMBERS;
    } catch {
      allMembers = [];
    }
    const retained = allMembers.filter((m) => !(m.tenantId === tenantId && idSet.has(m.id)));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(retained));
  },
  clearAllAttendance: (tenantId: string): void => {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let allAttendance: AttendanceRecord[] = [];
    try {
      allAttendance = raw !== null ? JSON.parse(raw) : INITIAL_ATTENDANCE;
    } catch {
      allAttendance = [];
    }
    const retained = allAttendance.filter((a) => a.tenantId !== tenantId);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(retained));
  },
  deleteAttendanceByIds: (ids: string[], tenantId: string): void => {
    const idSet = new Set(ids);
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    let allAttendance: AttendanceRecord[] = [];
    try {
      allAttendance = raw !== null ? JSON.parse(raw) : INITIAL_ATTENDANCE;
    } catch {
      allAttendance = [];
    }
    const retained = allAttendance.filter((a) => !(a.tenantId === tenantId && idSet.has(a.id)));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(retained));
  },
  clearAllPayments: (tenantId: string): void => {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    let allPayments: SubscriptionPayment[] = [];
    try {
      allPayments = raw !== null ? JSON.parse(raw) : INITIAL_PAYMENTS;
    } catch {
      allPayments = [];
    }
    const retained = allPayments.filter((p) => p.tenantId !== tenantId);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(retained));
  },
  deletePaymentsByIds: (ids: string[], tenantId: string): void => {
    const idSet = new Set(ids);
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    let allPayments: SubscriptionPayment[] = [];
    try {
      allPayments = raw !== null ? JSON.parse(raw) : INITIAL_PAYMENTS;
    } catch {
      allPayments = [];
    }
    const retained = allPayments.filter((p) => !(p.tenantId === tenantId && idSet.has(p.id)));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(retained));
  },
  clearAllExpenses: (tenantId: string): void => {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    let allExpenses: Expense[] = [];
    try {
      allExpenses = raw !== null ? JSON.parse(raw) : INITIAL_EXPENSES;
    } catch {
      allExpenses = [];
    }
    const retained = allExpenses.filter((e) => e.tenantId !== tenantId);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(retained));
  },
  deleteExpensesByIds: (ids: string[], tenantId: string): void => {
    const idSet = new Set(ids);
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    let allExpenses: Expense[] = [];
    try {
      allExpenses = raw !== null ? JSON.parse(raw) : INITIAL_EXPENSES;
    } catch {
      allExpenses = [];
    }
    const retained = allExpenses.filter((e) => !(e.tenantId === tenantId && idSet.has(e.id)));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(retained));
  },

  // Export full backup for a specific tenant
  exportTenantBackup: (tenantId: string, user?: SaaSUser | null) => {
    const backupData = {
      version: '1.0',
      system: 'PulseSync-Arabic-SaaS',
      tenantId,
      user: user || null,
      exportedAt: new Date().toISOString(),
      members: storageService.getMembers(tenantId),
      attendance: storageService.getAttendance(tenantId),
      payments: storageService.getPayments(tenantId),
      expenses: storageService.getExpenses(tenantId),
      settings: storageService.getSettings(tenantId),
    };
    return backupData;
  },

  // Restore full backup from JSON object
  restoreTenantBackup: (
    tenantId: string,
    data: any
  ): { success: boolean; message: string; counts?: { members: number; attendance: number; payments: number; expenses: number } } => {
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف.' };
    }
    try {
      const members = Array.isArray(data.members)
        ? data.members.map((m: any) => ({ ...m, tenantId }))
        : [];
      const attendance = Array.isArray(data.attendance)
        ? data.attendance.map((a: any) => ({ ...a, tenantId }))
        : [];
      const payments = Array.isArray(data.payments)
        ? data.payments.map((p: any) => ({ ...p, tenantId }))
        : [];
      const expenses = Array.isArray(data.expenses)
        ? data.expenses.map((e: any) => ({ ...e, tenantId }))
        : [];

      storageService.saveMembers(members);
      storageService.saveAttendance(attendance);
      storageService.savePayments(payments);
      storageService.saveExpenses(expenses);
      if (data.settings && typeof data.settings === 'object') {
        storageService.saveSettings({ ...data.settings, tenantId });
      }

      return {
        success: true,
        message: 'تم استعادة البيانات والنسخة الاحتياطية بنجاح!',
        counts: {
          members: members.length,
          attendance: attendance.length,
          payments: payments.length,
          expenses: expenses.length,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `خطأ أثناء استعادة البيانات: ${err?.message || 'تأكد من صيغة الملف'}`,
      };
    }
  },

  // Reset database back to clean demo seed datasets
  resetToSeedData: (): void => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(INITIAL_ATTENDANCE));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  },
};
