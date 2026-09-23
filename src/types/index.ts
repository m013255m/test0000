export type Role = 'superadmin' | 'business_owner';

export type UserStatus = 'active' | 'disabled' | 'expired';

export interface SaaSUser {
  id: string;
  fullName: string;
  username: string;
  password?: string; // stored for demo authentication
  phoneNumber: string;
  businessName: string;
  businessType: 'gym' | 'academy' | 'training_center' | 'club' | 'studio' | 'other';
  planType?: string;
  subscriptionPrice?: number;
  startDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  status: UserStatus;
  notes: string;
  createdAt: string;
  role: Role;
  avatarUrl?: string;
}

export type MembershipStatus = 'active' | 'expired' | 'suspended' | 'trial';

export interface Member {
  id: string;
  tenantId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  membershipPlan: string;
  qrCodeValue: string; // Unique QR identifier e.g., "PS-MEM-8492"
  startDate: string;
  expirationDate: string;
  status: MembershipStatus;
  emergencyContact?: string;
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  avatarColor?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  memberId: string;
  memberName: string;
  membershipPlan: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  checkInTimestamp: number;
  checkOutTimestamp?: number;
  status: 'present' | 'late' | 'excused';
  verifiedBy: 'qr_scanner' | 'manual';
  notes?: string;
}

export type PaymentStatus = 'paid' | 'partially_paid' | 'unpaid' | 'overdue' | 'expiring_soon';

export interface SubscriptionPayment {
  id: string;
  tenantId: string;
  memberId: string;
  memberName: string;
  subscriptionType: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentDate: string; // YYYY-MM-DD
  nextPaymentDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  paymentMethod: 'cash' | 'credit_card' | 'bank_transfer' | 'digital_wallet';
  status: PaymentStatus;
  notes?: string;
  invoiceNumber: string;
}

export type ExpenseType = 'business' | 'personal';

export type BusinessExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Internet'
  | 'Salaries'
  | 'Equipment'
  | 'Maintenance'
  | 'Marketing'
  | 'Software'
  | 'Insurance'
  | 'Supplies'
  | 'Other';

export type PersonalExpenseCategory =
  | 'Owner Draw / Salary'
  | 'Personal Meals'
  | 'Personal Travel'
  | 'Personal Savings'
  | 'Family'
  | 'Healthcare'
  | 'Other';

export interface Expense {
  id: string;
  tenantId: string;
  title: string;
  type: ExpenseType; // Strictly separated: business vs personal
  category: BusinessExpenseCategory | PersonalExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  notes?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  tenantId: string;
  title: string;
  message: string;
  type: 'subscription_expiring' | 'payment_overdue' | 'member_absence' | 'expense_due' | 'system';
  severity: 'info' | 'warning' | 'critical' | 'success';
  date: string;
  read: boolean;
  linkSection?: string;
  targetId?: string;
}

export interface BusinessSettings {
  tenantId: string;
  businessName: string;
  businessType?: string;
  currency?: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currencySymbol: string;
  currencyCode: string;
  taxRate: number; // percentage
  qrScanSound: boolean;
  preventDuplicateAttendanceWithinHours: number;
  lowSubscriptionWarningDays: number;
}
