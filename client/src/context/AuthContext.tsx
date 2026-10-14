import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'seller' | 'admin';
  phone?: string;
  studentId?: string;
  hostelRoom?: string;
  assignedStoreId?: any;
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  googleLogin: (email: string, name: string) => Promise<User>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<void>;
  switchDemoUser: (email: string, password?: string) => Promise<void>;
  isStudent: boolean;
  isSeller: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/auth/me');
      if (data.success && data.user) {
        setUser({
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          phone: data.user.phone,
          studentId: data.user.studentId,
          hostelRoom: data.user.hostelRoom,
          assignedStoreId: data.user.assignedStoreId,
          isApproved: data.user.isApproved
        });
      }
    } catch (err) {
      console.warn('Session expired or invalid token');
      removeAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData: any): Promise<User> => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const googleLogin = async (email: string, name: string): Promise<User> => {
    const data = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ email, name })
    });

    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const updateProfile = async (profileData: any) => {
    const data = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    if (data.user) {
      setUser((prev) => (prev ? { ...prev, ...data.user } : null));
    }
  };

  const switchDemoUser = async (email: string, password = 'Seller@123') => {
    setLoading(true);
    try {
      if (email === 'admin@vendersetu.edu.in') {
        password = 'Admin@123';
      } else if (email === 'student@vendersetu.edu.in') {
        password = 'Student@123';
      }
      await login(email, password);
    } finally {
      setLoading(false);
    }
  };

  const isStudent = user?.role === 'student';
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        updateProfile,
        switchDemoUser,
        isStudent,
        isSeller,
        isAdmin
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
