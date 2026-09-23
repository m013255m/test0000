import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { UserLogin } from './components/auth/UserLogin';
import { SuperAdminLogin } from './components/auth/SuperAdminLogin';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { BackupModal } from './components/common/BackupModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { MembersView } from './components/members/MembersView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { SubscriptionsView } from './components/subscriptions/SubscriptionsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReportsView } from './components/reports/ReportsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SettingsView } from './components/settings/SettingsView';
import { SelfAttendancePage } from './components/attendance/SelfAttendancePage';

// Quick Modals
import { QRScannerModal } from './components/attendance/QRScannerModal';
import { ScanSuccessModal } from './components/attendance/ScanSuccessModal';
import { MemberModal } from './components/members/MemberModal';
import { PaymentModal } from './components/subscriptions/PaymentModal';
import { ExpenseModal } from './components/expenses/ExpenseModal';

import { storageService, getTodayDateString } from './services/storage';
import { Member, AttendanceRecord } from './types';

export default function App() {
  const { currentUser, isSuperAdmin } = useAuth();

  // Auth toggle between Business login and SuperAdmin login
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);

  // App Navigation & Layout State
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataVersion, setDataVersion] = useState(0);

  // Modals state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // QR Scan result modal
  const [scannedMember, setScannedMember] = useState<Member | null>(null);
  const [newAttendanceRecord, setNewAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [isScanSuccessOpen, setIsScanSuccessOpen] = useState(false);

  const handleDataModified = () => {
    setDataVersion((v) => v + 1);
  };

  const tenantId = currentUser?.id || 'user-owner-1';
  const members = storageService.getMembers(tenantId);

  // Handle direct QR Code scan from top bar / mobile
  const handleQuickScanCode = (code: string) => {
    const member = members.find(
      (m) =>
        m.qrCodeValue.toLowerCase() === code.toLowerCase() ||
        m.id.toLowerCase() === code.toLowerCase() ||
        m.fullName.toLowerCase() === code.toLowerCase()
    );

    if (!member) {
      setScanWarning(`لم يتم العثور على مشترك مسجل برمز أو اسم "${code}".`);
      setScannedMember({
        id: 'unknown',
        tenantId,
        fullName: 'عضو غير مسجل',
        phoneNumber: '',
        email: '',
        membershipPlan: 'غير محدد',
        qrCodeValue: code,
        startDate: '',
        expirationDate: '',
        status: 'expired',
        createdAt: '',
      });
      setIsScanSuccessOpen(true);
      return;
    }

    const todayStr = getTodayDateString();
    const timeStr = new Date().toTimeString().split(' ')[0];

    const res = storageService.recordAttendance({
      tenantId,
      memberId: member.id,
      memberName: member.fullName,
      membershipPlan: member.membershipPlan,
      date: todayStr,
      time: timeStr,
      status: 'present',
      verifiedBy: 'qr_scanner',
    });

    setScannedMember(member);
    if (!res.success) {
      setScanWarning(res.reason || 'تعذر تسجيل الحضور.');
      setNewAttendanceRecord(null);
    } else {
      setScanWarning(null);
      setNewAttendanceRecord(res.record || null);
    }
    setIsScanSuccessOpen(true);
    handleDataModified();
  };

  // Check if self-attendance route was requested (e.g. member scanned QR code over LAN)
  const [isSelfAttendanceRoute, setIsSelfAttendanceRoute] = useState<boolean>(() => {
    const path = window.location.pathname.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    return (
      path.includes('/attendance') ||
      search.has('attendance') ||
      search.get('kiosk') === '1' ||
      search.get('mode') === 'self_attendance' ||
      hash.includes('attendance')
    );
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const search = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      setIsSelfAttendanceRoute(
        path.includes('/attendance') ||
        search.has('attendance') ||
        search.get('kiosk') === '1' ||
        search.get('mode') === 'self_attendance' ||
        hash.includes('attendance')
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Scroll to top on section change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentSection]);

  // Dedicated Mobile Self-Attendance Page (No login required - member enters their own ID)
  if (isSelfAttendanceRoute) {
    return (
      <SelfAttendancePage
        initialTenantId={tenantId}
        onExitToApp={() => {
          window.history.pushState(null, '', '/');
          setIsSelfAttendanceRoute(false);
        }}
      />
    );
  }

  // Not authenticated
  if (!currentUser && !isSuperAdmin) {
    if (showSuperAdminLogin) {
      return (
        <SuperAdminLogin onBackToUserLogin={() => setShowSuperAdminLogin(false)} />
      );
    }
    return (
      <UserLogin onGoToSuperAdmin={() => setShowSuperAdminLogin(true)} />
    );
  }

  // Super Admin view
  if (isSuperAdmin && !currentUser) {
    return (
      <>
        <SuperAdminDashboard
          onSwitchToTenant={() => {
            setCurrentSection('dashboard');
          }}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
        />
        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          tenantId={tenantId}
          currentUser={currentUser}
          onDataRestored={handleDataModified}
        />
      </>
    );
  }

  // Business / SaaS Tenant View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#060b13] dark:text-zinc-100 font-sans flex flex-col selection:bg-blue-600 selection:text-white overflow-x-hidden transition-colors duration-200" dir="rtl">
      {/* Top Navbar */}
      <Navbar
        onOpenQRScan={() => setIsQRScannerOpen(true)}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        onOpenAddPayment={() => setIsAddPaymentOpen(true)}
        onNavigateSection={(sec) => setCurrentSection(sec)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onDataModified={handleDataModified}
      />

      <div className="flex-1 flex w-full">
        {/* Sidebar */}
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => setCurrentSection(sec)}
          collapsed={isDesktopSidebarCollapsed}
          onToggleCollapsed={() => setIsDesktopSidebarCollapsed((prev) => !prev)}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenQRScan={() => setIsQRScannerOpen(true)}
          onOpenBackup={() => setIsBackupModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 pb-24 md:pb-8 min-w-0 transition-all overflow-x-hidden">
          <div key={`${currentSection}-${dataVersion}`}>
            {currentSection === 'dashboard' && (
              <DashboardView
                tenantId={tenantId}
                onNavigate={setCurrentSection}
                onOpenQRScan={() => setIsQRScannerOpen(true)}
                onOpenAddMember={() => setIsAddMemberOpen(true)}
                onOpenAddPayment={() => setIsAddPaymentOpen(true)}
                onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                searchQuery={searchQuery}
              />
            )}

            {currentSection === 'members' && (
              <MembersView
                tenantId={tenantId}
                businessName={currentUser?.businessName || 'النادي الرياضي'}
                onNavigateToSubscriptions={() => setCurrentSection('subscriptions')}
              />
            )}

            {currentSection === 'attendance' && (
              <AttendanceView tenantId={tenantId} />
            )}

            {currentSection === 'subscriptions' && (
              <SubscriptionsView tenantId={tenantId} />
            )}

            {currentSection === 'expenses' && (
              <ExpensesView tenantId={tenantId} />
            )}

            {currentSection === 'reports' && (
              <ReportsView tenantId={tenantId} />
            )}

            {currentSection === 'notifications' && (
              <NotificationsView
                tenantId={tenantId}
                onNavigateToMembers={() => setCurrentSection('members')}
                onNavigateToSubscriptions={() => setCurrentSection('subscriptions')}
              />
            )}

            {currentSection === 'settings' && (
              <SettingsView
                tenantId={tenantId}
                onOpenBackupModal={() => setIsBackupModalOpen(true)}
                onDataModified={handleDataModified}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        onOpenQRScan={() => setIsQRScannerOpen(true)}
      />

      {/* Global Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        tenantId={tenantId}
        currentUser={currentUser}
        onDataRestored={handleDataModified}
      />

      {/* Global QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanCode={handleQuickScanCode}
        members={members}
      />

      {/* QR Scan Success or Duplicate Modal */}
      <ScanSuccessModal
        isOpen={isScanSuccessOpen}
        onClose={() => setIsScanSuccessOpen(false)}
        member={scannedMember}
        attendanceRecord={newAttendanceRecord}
        isDuplicateWarning={!!scanWarning}
        duplicateMessage={scanWarning || undefined}
      />

      {/* Quick Add Member Modal */}
      <MemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSave={(data) => {
          storageService.addMember(data as any);
          handleDataModified();
        }}
        tenantId={tenantId}
      />

      {/* Quick Add Payment Modal */}
      <PaymentModal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        onSave={(data) => {
          storageService.addPayment(data as any);
          handleDataModified();
        }}
        members={members}
        tenantId={tenantId}
      />

      {/* Quick Add Expense Modal */}
      <ExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSave={(data) => {
          storageService.addExpense(data as any);
          handleDataModified();
        }}
        tenantId={tenantId}
      />
    </div>
  );
}
