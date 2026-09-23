import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  SaaSUser,
  Member,
  AttendanceRecord,
  SubscriptionPayment,
  Expense,
  BusinessSettings,
} from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Collection Names
export const COLLECTIONS = {
  USERS: 'saas_users',
  MEMBERS: 'members',
  ATTENDANCE: 'attendance',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  SETTINGS: 'settings',
} as const;

export const firebaseService = {
  // ==========================================
  // SAAS USERS (Admin Dashboard Central Storage)
  // ==========================================

  /**
   * Fetch all SaaS users from Firestore
   */
  async fetchUsers(): Promise<SaaSUser[]> {
    try {
      const colRef = collection(db, COLLECTIONS.USERS);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        return [];
      }
      const users: SaaSUser[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as SaaSUser);
      });
      // Sort newest first
      return users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (error) {
      console.warn('Firebase fetchUsers warning:', error);
      return [];
    }
  },

  /**
   * Listen to real-time changes to SaaS users from any device
   */
  subscribeToUsers(callback: (users: SaaSUser[]) => void): () => void {
    try {
      const colRef = collection(db, COLLECTIONS.USERS);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const users: SaaSUser[] = [];
          snapshot.forEach((docSnap) => {
            users.push(docSnap.data() as SaaSUser);
          });
          users.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          callback(users);
        },
        (error) => {
          console.warn('Firebase subscribeToUsers error:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to setup users snapshot listener:', err);
      return () => {};
    }
  },

  /**
   * Save or update a single SaaS user in Firestore
   */
  async saveUser(user: SaaSUser): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, user.id);
      await setDoc(docRef, user, { merge: true });
    } catch (error) {
      console.error('Firebase saveUser error:', error);
      throw error;
    }
  },

  /**
   * Delete a SaaS user from Firestore
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Firebase deleteUser error:', error);
      throw error;
    }
  },

  /**
   * Update specific fields of a SaaS user
   */
  async updateUserFields(userId: string, fields: Partial<SaaSUser>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(docRef, fields);
    } catch (error) {
      console.error('Firebase updateUserFields error:', error);
      throw error;
    }
  },

  /**
   * Query a user by username directly from Firestore (for login on any fresh device)
   */
  async getUserByUsername(username: string): Promise<SaaSUser | null> {
    try {
      const colRef = collection(db, COLLECTIONS.USERS);
      const q = query(colRef, where('username', '==', username.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as SaaSUser;
      }
      return null;
    } catch (error) {
      console.warn('Firebase getUserByUsername warning:', error);
      return null;
    }
  },

  /**
   * Seed initial users into Firestore if cloud collection is currently empty
   */
  async seedInitialUsersIfEmpty(initialUsers: SaaSUser[]): Promise<void> {
    try {
      const colRef = collection(db, COLLECTIONS.USERS);
      const snap = await getDocs(colRef);
      if (snap.empty) {
        const batch = writeBatch(db);
        for (const u of initialUsers) {
          const docRef = doc(db, COLLECTIONS.USERS, u.id);
          batch.set(docRef, u);
        }
        await batch.commit();
      }
    } catch (error) {
      console.warn('Firebase seedInitialUsers warning:', error);
    }
  },

  // ==========================================
  // TENANT DATA (Members, Subscriptions, etc.)
  // ==========================================

  async saveMember(member: Member): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.MEMBERS, member.id);
      await setDoc(docRef, member, { merge: true });
    } catch (err) {
      console.warn('Firebase saveMember warning:', err);
    }
  },

  async deleteMember(memberId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.MEMBERS, memberId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firebase deleteMember warning:', err);
    }
  },

  async fetchMembers(tenantId: string): Promise<Member[]> {
    try {
      const colRef = collection(db, COLLECTIONS.MEMBERS);
      const q = query(colRef, where('tenantId', '==', tenantId));
      const snap = await getDocs(q);
      const members: Member[] = [];
      snap.forEach((d) => members.push(d.data() as Member));
      return members;
    } catch (err) {
      console.warn('Firebase fetchMembers warning:', err);
      return [];
    }
  },

  async saveAttendance(record: AttendanceRecord): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ATTENDANCE, record.id);
      await setDoc(docRef, record, { merge: true });
    } catch (err) {
      console.warn('Firebase saveAttendance warning:', err);
    }
  },

  async fetchAttendance(tenantId: string): Promise<AttendanceRecord[]> {
    try {
      const colRef = collection(db, COLLECTIONS.ATTENDANCE);
      const q = query(colRef, where('tenantId', '==', tenantId));
      const snap = await getDocs(q);
      const list: AttendanceRecord[] = [];
      snap.forEach((d) => list.push(d.data() as AttendanceRecord));
      return list;
    } catch (err) {
      console.warn('Firebase fetchAttendance warning:', err);
      return [];
    }
  },

  async savePayment(payment: SubscriptionPayment): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.PAYMENTS, payment.id);
      await setDoc(docRef, payment, { merge: true });
    } catch (err) {
      console.warn('Firebase savePayment warning:', err);
    }
  },

  async fetchPayments(tenantId: string): Promise<SubscriptionPayment[]> {
    try {
      const colRef = collection(db, COLLECTIONS.PAYMENTS);
      const q = query(colRef, where('tenantId', '==', tenantId));
      const snap = await getDocs(q);
      const list: SubscriptionPayment[] = [];
      snap.forEach((d) => list.push(d.data() as SubscriptionPayment));
      return list;
    } catch (err) {
      console.warn('Firebase fetchPayments warning:', err);
      return [];
    }
  },

  async saveExpense(expense: Expense): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.EXPENSES, expense.id);
      await setDoc(docRef, expense, { merge: true });
    } catch (err) {
      console.warn('Firebase saveExpense warning:', err);
    }
  },

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.EXPENSES, expenseId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firebase deleteExpense warning:', err);
    }
  },

  async fetchExpenses(tenantId: string): Promise<Expense[]> {
    try {
      const colRef = collection(db, COLLECTIONS.EXPENSES);
      const q = query(colRef, where('tenantId', '==', tenantId));
      const snap = await getDocs(q);
      const list: Expense[] = [];
      snap.forEach((d) => list.push(d.data() as Expense));
      return list;
    } catch (err) {
      console.warn('Firebase fetchExpenses warning:', err);
      return [];
    }
  },

  async saveSettings(settings: BusinessSettings): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, settings.tenantId);
      await setDoc(docRef, settings, { merge: true });
    } catch (err) {
      console.warn('Firebase saveSettings warning:', err);
    }
  },

  async fetchSettings(tenantId: string): Promise<BusinessSettings | null> {
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, tenantId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as BusinessSettings;
      }
      return null;
    } catch (err) {
      console.warn('Firebase fetchSettings warning:', err);
      return null;
    }
  },
};
