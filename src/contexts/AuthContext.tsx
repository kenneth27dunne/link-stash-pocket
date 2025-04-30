import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const abandonOAuthTimerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateListenerRef = useRef<PluginListenerHandle | null>(null);

  useEffect(() => {
    setLoading(true);
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
        setUser(null);
      } finally {
        const { data } = await supabase.auth.getSession();
        if (!data.session) { 
             setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (abandonOAuthTimerRef.current) {
           clearTimeout(abandonOAuthTimerRef.current);
           abandonOAuthTimerRef.current = null;
        }
        console.log('Auth state changed:', _event, session?.user?.id);
        setUser(session?.user ?? null);
        setLoading(false); 
      }
    );

    return () => {
      subscription.unsubscribe();
      if (abandonOAuthTimerRef.current) {
        clearTimeout(abandonOAuthTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
     let isMounted = true; 

     const setupListener = async () => {
        const handle = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
           if (!isMounted) return;
           
           if (isActive) {
              if (abandonOAuthTimerRef.current) clearTimeout(abandonOAuthTimerRef.current);
              
              abandonOAuthTimerRef.current = setTimeout(() => {
                if (loadingRef.current && !userRef.current) { 
                  console.log('OAuth flow likely abandoned, resetting loading state.');
                  if(isMounted) setLoading(false); 
                }
                abandonOAuthTimerRef.current = null;
              }, 2000); 
           } else {
             if (abandonOAuthTimerRef.current) {
                clearTimeout(abandonOAuthTimerRef.current);
                abandonOAuthTimerRef.current = null;
             }
           }
        });
        if (isMounted) {
            appStateListenerRef.current = handle;
        }
     };
     
     setupListener();
     
     return () => {
        isMounted = false;
        appStateListenerRef.current?.remove();
        if (abandonOAuthTimerRef.current) {
           clearTimeout(abandonOAuthTimerRef.current);
           abandonOAuthTimerRef.current = null;
        }
     };
  }, []);
  
  const loadingRef = useRef(loading);
  const userRef = useRef(user);
  useEffect(() => {
      loadingRef.current = loading;
      userRef.current = user;
  }, [loading, user]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
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
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Signed up successfully, please check your email to confirm your account');
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Failed to sign up. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth.') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      window.location.reload();
      
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      const isNative = Capacitor.isNativePlatform();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: isNative
        ? 'linkstash://'         // deep-link back into the app
        : window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast.error('Failed to sign in with Google. Please try again.');
      setLoading(false);
      throw error;
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 