
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  user_role: 'admin' | 'student' | 'staff' | 'visitor';
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileData) {
            const typedProfile: Profile = {
              id: profileData.id,
              email: profileData.email,
              full_name: profileData.first_name && profileData.last_name ? 
                `${profileData.first_name} ${profileData.last_name}` : undefined,
              first_name: profileData.first_name,
              last_name: profileData.last_name,
              user_role: profileData.user_role as 'admin' | 'student' | 'staff' | 'visitor',
              avatar_url: profileData.avatar_url
            };
            setProfile(typedProfile);
          }
        } else {
          setProfile(null);
        }
      }
    );

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData) {
              const typedProfile: Profile = {
                id: profileData.id,
                email: profileData.email,
                full_name: profileData.first_name && profileData.last_name ? 
                  `${profileData.first_name} ${profileData.last_name}` : undefined,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                user_role: profileData.user_role as 'admin' | 'student' | 'staff' | 'visitor',
                avatar_url: profileData.avatar_url
              };
              setProfile(typedProfile);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Calculate full_name if first_name or last_name is provided
      const updateData: any = { ...data };
      if (data.first_name || data.last_name) {
        const firstName = data.first_name ?? profile?.first_name ?? '';
        const lastName = data.last_name ?? profile?.last_name ?? '';
        updateData.full_name = `${firstName} ${lastName}`.trim();
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;
      
      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          ...data,
          full_name: updateData.full_name || profile.full_name
        });
      }
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!email.endsWith('@ajmanuni.ac.ae')) {
      toast.error('Only emails from Ajman University are allowed');
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.info('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: profile?.user_role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
