import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  QrCode,
  Edit2,
  Trash2,
  Download,
} from 'lucide-react';
import { Member } from '../../types';
import { storageService, getDaysRemaining } from '../../services/storage';
import { Badge } from '../common/Badge';
import { MemberModal } from './MemberModal';
import { MemberIdCardModal } from './MemberIdCardModal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { BulkActionBar } from '../common/BulkActionBar';

interface MembersViewProps {
  tenantId: string;
  businessName: string;
  onNavigateToSubscriptions?: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({
  tenantId,
  businessName,
}) => {
  const [members, setMembers] = useState<Member[]>(() => storageService.getMembers(tenantId));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'trial'>('all');

  // Bulk Selection State
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Modals state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [selectedQRMember, setSelectedQRMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const reloadMembers = () => {
    setMembers(storageService.getMembers(tenantId));
    setSelectedMemberIds([]);
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phoneNumber.includes(searchTerm) ||
        member.qrCodeValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.membershipPlan.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return member.status === 'active';
      if (statusFilter === 'suspended') return member.status === 'suspended';
      if (statusFilter === 'trial') return member.status === 'trial';
      if (statusFilter === 'expired') return member.status === 'expired';
      if (statusFilter === 'expiring_soon') {
        const days = getDaysRemaining(member.expirationDate);
        return member.status === 'active' && days >= 0 && days <= 7;
      }
      return true;
    });
  }, [members, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === 'active').length;
    const expired = members.filter((m) => m.status === 'expired').length;
    const expiringSoon = members.filter((m) => {
      if (m.status !== 'active') return false;
      const days = getDaysRemaining(m.expirationDate);
      return days >= 0 && days <= 7;
    }).length;

    return { total, active, expired, expiringSoon };
  }, [members]);

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    setSelectedMemberIds(filteredMembers.map((m) => m.id));
  };

  const handleDeselectAll = () => {
    setSelectedMemberIds([]);
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirmBulkDelete = () => {
    storageService.deleteMembersByIds(selectedMemberIds, tenantId);
    setSelectedMemberIds([]);
    setIsBulkDeleteConfirmOpen(false);
    reloadMembers();
  };

  const handleConfirmClearAll = () => {
    storageService.clearAllMembers(tenantId);
    setSelectedMemberIds([]);
    setIsClearAllConfirmOpen(false);
    reloadMembers();
  };

  const handleSaveMember = (data: any) => {
    if (editingMember) {
      storageService.updateMember(data);
    } else {
      storageService.addMember(data);
    }
    reloadMembers();
  };

  const handleDeleteMember = () => {
    if (!memberToDelete) return;
    storageService.deleteMember(memberToDelete.id, tenantId);
    setMemberToDelete(null);
    reloadMembers();
  };

  const exportCSV = () => {
    if (filteredMembers.length === 0) return;
    const headers = ['المعرف', 'الاسم', 'الهاتف', 'البريد', 'الباقة', 'كود QR', 'تاريخ البدء', 'تاريخ الانتهاء', 'الحالة'];
    const rows = filteredMembers.map((m) => [
      m.id,
      m.fullName,
      m.phoneNumber,
      m.email,
      m.membershipPlan,
      m.qrCodeValue,
      m.startDate,
      m.expirationDate,
      m.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `قائمة_المشتركين_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">إدارة المشتركين والأعضاء</h2>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {members.length} مشترك
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            قاعدة بيانات الأعضاء، تتبع الباقات وإصدار بطاقات الدخول الرقمية
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-gray-500" />
            <span>تصدير Excel (CSV)</span>
          </button>
          <button
            onClick={() => {
              setEditingMember(null);
              setIsMemberModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة مشترك جديد</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-2xl border text-right transition-all ${
            statusFilter === 'all'
              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">إجمالي المشتركين</span>
          <span className="block mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('active')}
          className={`p-3 rounded-2xl border text-right transition-all ${
            statusFilter === 'active'
              ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">اشتراكات سارية</span>
          <span className="block mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('expiring_soon')}
          className={`p-3 rounded-2xl border text-right transition-all ${
            statusFilter === 'expiring_soon'
              ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">تنتهي قريباً (أسبوع)</span>
          <span className="block mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
            {stats.expiringSoon}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('expired')}
          className={`p-3 rounded-2xl border text-right transition-all ${
            statusFilter === 'expired'
              ? 'border-rose-600 bg-rose-50/60 dark:bg-rose-950/30'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
          }`}
        >
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">اشتراكات منتهية</span>
          <span className="block mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
            {stats.expired}
          </span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، رقم الهاتف، أو كود QR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2.5 pr-10 pl-4 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-bold text-gray-700 dark:text-zinc-200 focus:outline-none"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط فقط</option>
            <option value="expiring_soon">ينتهي قريباً (أسبوع)</option>
            <option value="expired">منتهي الصلاحية</option>
            <option value="suspended">معلق</option>
            <option value="trial">تجريبي (Trial)</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar with Select All and Clear Entire Section */}
      <BulkActionBar
        totalCount={filteredMembers.length}
        selectedCount={selectedMemberIds.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={() => setIsBulkDeleteConfirmOpen(true)}
        onClearEntireSection={() => setIsClearAllConfirmOpen(true)}
        sectionLabel="المشتركين"
      />

      {/* Members Table */}
      <div className="overflow-hidden rounded-3xl border border-gray-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/95 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/75 dark:bg-zinc-800/40 text-gray-500 dark:text-zinc-400 font-bold">
              <tr>
                <th className="py-3.5 pr-4 pl-2 w-10">
                  <input
                    type="checkbox"
                    checked={filteredMembers.length > 0 && selectedMemberIds.length === filteredMembers.length}
                    onChange={(e) => {
                      if (e.target.checked) handleSelectAll();
                      else handleDeselectAll();
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                </th>
                <th className="py-3.5 px-3">اسم المشترك</th>
                <th className="py-3.5 px-3">نوع الباقة</th>
                <th className="py-3.5 px-3">كود QR</th>
                <th className="py-3.5 px-3">تاريخ الانتهاء</th>
                <th className="py-3.5 px-3">الحالة</th>
                <th className="py-3.5 pl-4 pr-3 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    <Users className="mx-auto h-8 w-8 opacity-40 mb-2" />
                    لا توجد بيانات مطابقة لخيارات البحث
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const days = getDaysRemaining(member.expirationDate);
                  const isSelected = selectedMemberIds.includes(member.id);

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 pr-4 pl-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(member.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-black text-xs shadow-xs">
                            {member.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white leading-tight">
                              {member.fullName}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono">
                              {member.phoneNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-800 dark:text-zinc-200">
                          {member.membershipPlan}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedQRMember(member)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/80 px-2.5 py-1 text-[11px] font-mono font-bold text-gray-700 dark:text-zinc-200 hover:border-indigo-500 transition-colors"
                        >
                          <QrCode className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>{member.qrCodeValue}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono text-gray-700 dark:text-zinc-300">
                          {member.expirationDate}
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            days < 0
                              ? 'text-rose-600'
                              : days <= 7
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {days < 0 ? `منتهي منذ ${Math.abs(days)} يوم` : `باقي ${days} يوم`}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            member.status === 'active'
                              ? days <= 7
                                ? 'warning'
                                : 'success'
                              : member.status === 'trial'
                              ? 'info'
                              : member.status === 'suspended'
                              ? 'neutral'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {member.status === 'active'
                            ? days <= 7
                              ? 'ينتهي قريباً'
                              : 'ساري'
                            : member.status === 'trial'
                            ? 'تجريبي'
                            : member.status === 'suspended'
                            ? 'معلق'
                            : 'منتهي'}
                        </Badge>
                      </td>
                      <td className="py-3 pl-4 pr-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedQRMember(member)}
                            title="عرض كود QR والبطاقة"
                            className="p-1.5 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setIsMemberModalOpen(true);
                            }}
                            title="تعديل البيانات"
                            className="p-1.5 rounded-xl text-gray-500 hover:text-amber-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setMemberToDelete(member)}
                            title="حذف العضو"
                            className="p-1.5 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Edit/Add Modal */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        initialMember={editingMember || undefined}
        tenantId={tenantId}
      />

      {/* Digital Member Pass Card / QR Modal */}
      {selectedQRMember && (
        <MemberIdCardModal
          isOpen={!!selectedQRMember}
          onClose={() => setSelectedQRMember(null)}
          member={selectedQRMember}
          businessName={businessName}
        />
      )}

      {/* Single Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDeleteMember}
        title="حذف المشترك"
        message={`هل أنت متأكد من حذف المشترك "${memberToDelete?.fullName}" بشكل نهائي؟`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />

      {/* Bulk Delete Selected Confirmation */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="حذف المشتركين المحددين"
        message={`هل تريد حذف ${selectedMemberIds.length} مشترك تم تحديدهم نهائياً؟`}
        confirmText="تأكيد الحذف"
        cancelText="إلغاء"
      />

      {/* Clear All Section Confirmation */}
      <ConfirmDialog
        isOpen={isClearAllConfirmOpen}
        onClose={() => setIsClearAllConfirmOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="مسح سجل المشتركين بالكامل"
        message="تحذير: سيتم حذف كافة المشتركين المسجلين في هذا الحساب نهائياً. هل ترغب بالاستمرار؟"
        confirmText="مسح الكل"
        cancelText="إلغاء"
      />
    </div>
  );
};
