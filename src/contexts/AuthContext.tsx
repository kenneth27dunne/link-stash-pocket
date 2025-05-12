import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Import supabaseUrl 
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

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
      console.log('Platform is native:', isNative, 'Platform:', Capacitor.getPlatform());
      
      if (isNative) {
        // For native platforms, we'll use a simpler approach
        console.log('Using native auth approach');
        
        // Use the EXACT redirect URL format that matches our intent filter
        const redirectUrl = 'linkstash://';
        console.log('Using redirect URL:', redirectUrl);
        
        // This is key - we'll use the Browser plugin directly
        // First, set up a listener for the deep link return
        let listenerRemoved = false;
        const removeListener = await CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
          console.log('Auth callback received:', url);
          console.log('URL contains login-callback:', url.includes('login-callback'));
          console.log('Full URL details:', {
            url,
            hasHash: url.includes('#'),
            hasQuery: url.includes('?'),
            length: url.length,
            isLinkstashScheme: url.startsWith('linkstash://')
          });
          
          if (listenerRemoved) return;
          listenerRemoved = true;
          
          // Check for either login-callback or the presence of auth tokens
          if (url.includes('login-callback') || url.includes('access_token') || url.includes('refresh_token')) {
            try {
              console.log('Attempting to close browser');
              await Browser.close();
            } catch (e) {
              console.error('Error closing browser:', e);
            }
            
            // Remove the listener to avoid multiple callbacks
            try {
              removeListener.remove();
            } catch (e) {
              console.error('Error removing listener:', e);
            }
            
            // Now manually extract tokens and set session
            try {
              // The URL might contain tokens in various formats
              console.log('Processing URL for tokens:', url);
              
              // Extract the hash fragment or query parameters
              const hashFragment = url.split('#')[1];
              const queryParams = url.split('?')[1];
              const paramsString = hashFragment || queryParams;
              
              console.log('Extracted params string:', paramsString);
              
              if (!paramsString) {
                console.error('No parameters found in URL');
                toast.error('Failed to complete sign in. Please try again.');
                return;
              }
              
              const params = new URLSearchParams(paramsString);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              
              console.log('Extracted tokens:', {
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
                accessTokenLength: accessToken?.length,
                refreshTokenLength: refreshToken?.length
              });
              
              if (accessToken && refreshToken) {
                console.log('Found tokens, setting session manually');
                try {
                  const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                  });
                  
                  if (error) {
                    console.error('Error setting session:', error);
                    toast.error('Failed to complete sign in. Please try again.');
                    return;
                  }
                  
                  console.log('Session set successfully:', {
                    hasData: !!data,
                    hasSession: !!data?.session,
                    userId: data?.session?.user?.id
                  });
                  
                  // Force a session check
                  const { data: { session } } = await supabase.auth.getSession();
                  if (session) {
                    console.log('Session verified after setting:', {
                      userId: session.user.id,
                      email: session.user.email
                    });
                    setUser(session.user);
                    setLoading(false);
                    toast.success('Signed in successfully');
                  } else {
                    console.error('Session not found after setting');
                    toast.error('Failed to complete sign in. Please try again.');
                  }
                } catch (sessionError) {
                  console.error('Error during session setting:', sessionError);
                  toast.error('Failed to complete sign in. Please try again.');
                }
              } else {
                console.error('Missing tokens in URL:', {
                  hasAccessToken: !!accessToken,
                  hasRefreshToken: !!refreshToken
                });
                toast.error('Failed to complete sign in. Please try again.');
              }
            } catch (e) {
              console.error('Error handling authentication callback:', e);
              toast.error('Failed to complete sign in. Please try again.');
            }
          }
        });
        
        // Get the OAuth URL but don't follow redirects automatically
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true, // Important for manual browser handling
          }
        });
        
        if (error) {
          console.error('Error initiating OAuth:', error);
          throw error;
        }
        
        if (!data?.url) {
          console.error('No OAuth URL returned from Supabase');
          return;
        }
        
        // Log the URL for debugging
        console.log('Opening auth URL:', data.url);
        
        // Open in browser with explicit options for better compatibility
        await Browser.open({
          url: data.url,
          presentationStyle: 'fullscreen',
        });
      } else {
        // For web platform, use our popup window approach
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            skipBrowserRedirect: true // We'll handle the redirect ourselves
          }
        });
        
        if (error) throw error;
        
        if (data?.url) {
          const authWindow = window.open(data.url, '_blank', 'width=600,height=700');
          
          // Set up a message listener to detect successful auth
          const messageListener = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data?.type === 'supabase:auth:success') {
              if (authWindow) {
                authWindow.close();
              }
              window.removeEventListener('message', messageListener);
            }
          };
          
          window.addEventListener('message', messageListener);
        }
      }
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