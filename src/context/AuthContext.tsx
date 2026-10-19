import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api, setCurrentUserUid } from '../services/api.js';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  role: UserRole;
  switchUser: (uid: string) => void;
  isLoading: boolean;
  can: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const userList = await api.getUsers();
      setUsers(userList);
      if (userList.length > 0) {
        // default to principal
        const defaultUser = userList.find((u) => u.role === 'principal') || userList[0];
        setCurrentUser(defaultUser);
        setCurrentUserUid(defaultUser.uid);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = (uid: string) => {
    const target = users.find((u) => u.uid === uid);
    if (target) {
      setCurrentUser(target);
      setCurrentUserUid(target.uid);
    }
  };

  const can = (action: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'principal') return true;

    switch (action) {
      case 'approve_schedule':
      case 'approve_document':
      case 'manage_campuses':
        return currentUser.role === 'vice_principal';
      case 'manage_tasks':
        return currentUser.role === 'vice_principal' || currentUser.role === 'dean';
      case 'upload_documents':
        return currentUser.role === 'vice_principal' || currentUser.role === 'dean' || currentUser.role === 'clerk';
      case 'delete_task':
        return currentUser.role === 'vice_principal';
      case 'view_audit_logs':
        return currentUser.role === 'vice_principal';
      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        role: currentUser?.role || 'principal',
        switchUser,
        isLoading,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
