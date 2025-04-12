import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { dataService } from '@/services/data.service';
import { syncService } from '@/services/sync.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  cloudSyncEnabled: boolean;
  toggleCloudSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(false);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        
        // Initialize data service
        await dataService.init();
        
        // Initialize sync service
        await syncService.init();
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user || null);
        
        if (event === 'SIGNED_IN') {
          // Initialize data service when user signs in
          await dataService.init();
          
          // Initialize sync service
          await syncService.init();
          
          // Check if user has local data and sync automatically
          const categories = await dataService.getCategories();
          const links = await dataService.getAllLinks();
          
          if ((categories.length > 0 || links.length > 0) && session?.user?.id) {
            // Automatically sync local data without asking
            console.log('Auto-syncing local data to cloud');
            await syncService.initialLoginSync(session.user.id);
            setCloudSyncEnabled(true);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      syncService.cleanup();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Initialize data service after successful sign in
      await dataService.init();
      toast.success('Signed in successfully');
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Account created! Please check your email to confirm your account.');
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Failed to create account. Please try again.');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Disable cloud sync before signing out
      if (cloudSyncEnabled) {
        setCloudSyncEnabled(false);
        syncService.setCloudSyncEnabled(false);
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Explicitly clear the user state
      setUser(null);
      
      // Clear all auth-related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      // Force reload the page to clear any cached state
      window.location.reload();
      
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCloudSync = async () => {
    try {
      const newValue = !cloudSyncEnabled;
      setCloudSyncEnabled(newValue);
      
      // Update the sync service
      syncService.setCloudSyncEnabled(newValue);
      
      toast.success(newValue ? 'Cloud sync enabled' : 'Cloud sync disabled');
    } catch (error) {
      console.error('Error toggling cloud sync:', error);
      toast.error('Failed to toggle cloud sync');
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    cloudSyncEnabled,
    toggleCloudSync,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 