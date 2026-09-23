import React, { createContext, useContext, useState, useEffect } from 'react';
import { SaaSUser } from '../types';
import { storageService, getDaysRemaining } from '../services/storage';
import { firebaseService } from '../services/firebase';

interface AuthContextType {
  currentUser: SaaSUser | null;
  isSuperAdmin: boolean;
  loginAsUser: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsSuperAdmin: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  switchToTenant: (user: SaaSUser) => void;
  updateCurrentUserProfile: (updated: Partial<SaaSUser>) => void;
  refreshUsers: () => void;
  allUsers: SaaSUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'pulsesync_auth_user_v1';
const IS_SUPERADMIN_KEY = 'pulsesync_auth_is_superadmin_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SaaSUser | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<SaaSUser[]>([]);

  const refreshUsers = () => {
    const users = storageService.getUsers();
    setAllUsers(users);
  };

  useEffect(() => {
    // 1. Initial fast local load
    refreshUsers();

    // 2. Sync centrally from Firestore database
    storageService.syncUsersWithCloud().then((syncedUsers) => {
      if (syncedUsers && syncedUsers.length > 0) {
        setAllUsers(syncedUsers);
      }
    });

    // 3. Subscribe to real-time changes from any device across the internet
    const unsubscribe = firebaseService.subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        storageService.saveUsers(cloudUsers);
        setAllUsers(cloudUsers);

        // Keep current logged-in user profile synced if updated in the cloud
        setCurrentUser((current) => {
          if (!current) return null;
          const fresh = cloudUsers.find((u) => u.id === current.id);
          if (fresh) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(fresh));
            return fresh;
          }
          return current;
        });
      }
    });

    // 4. Restore existing session if any
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    const storedIsAdmin = localStorage.getItem(IS_SUPERADMIN_KEY) === 'true';

    if (storedIsAdmin) {
      setIsSuperAdmin(true);
    } else if (storedUser) {
      try {
        const parsed: SaaSUser = JSON.parse(storedUser);
        setCurrentUser(parsed);
      } catch {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const loginAsUser = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = username.trim().toLowerCase();

    // 1. Check local storage first
    let users = storageService.getUsers();
    let found = users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === password
    );

    // 2. If not found locally or if password doesn't match local cache,
    // fetch directly from central Firestore database (e.g. user added from another device or password updated)
    if (!found) {
      try {
        const cloudUser = await firebaseService.getUserByUsername(cleanUser);
        if (cloudUser) {
          // Merge into local cache
          const existing = users.filter((u) => u.id !== cloudUser.id);
          users = [cloudUser, ...existing];
          storageService.saveUsers(users);
          setAllUsers(users);

          if (cloudUser.password === password) {
            found = cloudUser;
          }
        }
      } catch (err) {
        console.warn('Central database lookup error:', err);
      }
    }

    if (!found) {
      return {
        success: false,
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة.',
      };
    }

    if (found.status === 'disabled') {
      return {
        success: false,
        error: 'تم تعطيل هذا الحساب بواسطة إدارة المنصة. يرجى مراجعة الدعم الفني.',
      };
    }

    const daysRemaining = getDaysRemaining(found.expirationDate);
    if (daysRemaining < 0 || found.status === 'expired') {
      return {
        success: false,
        error: `انتهت صلاحية اشتراك هذا الحساب بتاريخ ${found.expirationDate}. يرجى التجديد مع إدارة المنصة.`,
      };
    }

    setCurrentUser(found);
    setIsSuperAdmin(false);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
    localStorage.removeItem(IS_SUPERADMIN_KEY);
    return { success: true };
  };

  const loginAsSuperAdmin = (username: string, password: string): { success: boolean; error?: string } => {
    const cleanUser = username.trim().toLowerCase();
    if (cleanUser === 'halok' && password === 'halok') {
      setIsSuperAdmin(true);
      setCurrentUser(null);
      localStorage.setItem(IS_SUPERADMIN_KEY, 'true');
      localStorage.removeItem(CURRENT_USER_KEY);
      return { success: true };
    }
    return { success: false, error: 'بيانات الدخول للوحة الإدارة العليا غير صحيحة (اسم المستخدم وكلمة المرور: halok)' };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsSuperAdmin(false);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(IS_SUPERADMIN_KEY);
  };

  const switchToTenant = (user: SaaSUser) => {
    setCurrentUser(user);
    setIsSuperAdmin(false);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.removeItem(IS_SUPERADMIN_KEY);
  };

  const updateCurrentUserProfile = (updated: Partial<SaaSUser>) => {
    if (!currentUser) return;
    const modified = { ...currentUser, ...updated };
    setCurrentUser(modified);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(modified));
    storageService.updateUser(modified);
    refreshUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isSuperAdmin,
        loginAsUser,
        loginAsSuperAdmin,
        logout,
        switchToTenant,
        updateCurrentUserProfile,
        refreshUsers,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
