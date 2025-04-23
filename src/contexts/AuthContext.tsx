
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name?: string;
  user_type: 'student' | 'staff';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('spoton_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('spoton_user');
      }
    }
    setLoading(false);
  }, []);

  // In a real app, this would connect to Supabase
  // For now, we'll simulate authentication
  const login = async (email: string, password: string) => {
    if (!email.endsWith('@ajmanuni.ac.ae')) {
      toast.error('Only emails from Ajman University are allowed');
      return;
    }
    
    try {
      setLoading(true);
      
      // Simulating login - in a real app this would call Supabase auth
      const mockUser: User = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email: email,
        full_name: email.split('@')[0].replace(/[.]/g, ' '),
        user_type: email.includes('staff') ? 'staff' : 'student'
      };
      
      setUser(mockUser);
      localStorage.setItem('spoton_user', JSON.stringify(mockUser));
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('spoton_user');
    toast.info('Logged out successfully');
    navigate('/');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
