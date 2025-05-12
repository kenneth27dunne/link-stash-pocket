import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import CategoryView from "./pages/CategoryView";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import InitialSetup from "./components/InitialSetup";
import ShareHandler from "./components/ShareHandler";
import BackButtonHandler from "./components/BackButtonHandler";
import AuthRedirectHandler from "./components/AuthRedirectHandler";
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gradient-main">
      <p className="text-white">Loading...</p>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }
  
  return <>{children}</>;
};

// App routes component
const AppRoutes = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: appLoading } = useAppContext();

  // 1. Handle initial authentication loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-main">
        <p className="text-white">Loading Authentication...</p>
      </div>
    );
  }

  // 2. Handle app data loading/initial setup for logged-in users
  if (user && appLoading) {
    // Assuming InitialSetup is meant for post-auth app loading/setup
    return <InitialSetup />; 
  }

  // 3. Auth is done, and app data (if relevant) is loaded - show main routes
  return (
    <BackButtonHandler>
      <Routes>
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />

        <Route path="/category/:id" element={
          <ProtectedRoute>
            <CategoryView />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Keep Toasters and ShareHandler outside the conditional loading */}
      <Toaster />
      <SonnerToaster />
      <ShareHandler />
      <AuthRedirectHandler />
    </BackButtonHandler>
  );
};

const App = () => {
  useEffect(() => {
    let listenerCleanup: PluginListenerHandle | null = null;

    const setupListener = async () => {
      // Add the listener and save the handle
      listenerCleanup = await CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);
    };

    const handleAppUrlOpen = async ({ url }: { url: string }) => {
      console.log('[App.tsx] App URL opened:', url);
      
      // Handle login callback URLs for OAuth
      if (url.includes('login-callback')) {
        try {
          // Try to close browser if it's still open
          try {
            await Browser.close();
          } catch (e) {
            console.warn('[App.tsx] Browser closing error:', e);
          }
          
          // Parse tokens directly from the URL
          const extractTokens = (url: string) => {
            console.log('[App.tsx] Extracting tokens from URL');
            
            try {
              // Try hash fragment first
              if (url.includes('#')) {
                const hashPart = url.split('#')[1];
                if (hashPart) {
                  const params = new URLSearchParams(hashPart);
                  const accessToken = params.get('access_token');
                  const refreshToken = params.get('refresh_token');
                  
                  if (accessToken && refreshToken) {
                    return { accessToken, refreshToken };
                  }
                }
              }
              
              // Then try query params
              if (url.includes('?')) {
                const queryPart = url.split('?')[1];
                if (queryPart) {
                  const params = new URLSearchParams(queryPart);
                  const accessToken = params.get('access_token');
                  const refreshToken = params.get('refresh_token');
                  
                  if (accessToken && refreshToken) {
                    return { accessToken, refreshToken };
                  }
                }
              }
              
              // Try raw URL too (some redirects might have weirdly formatted tokens)
              const rawParams = new URLSearchParams(url);
              const accessToken = rawParams.get('access_token');
              const refreshToken = rawParams.get('refresh_token');
              
              if (accessToken && refreshToken) {
                return { accessToken, refreshToken };
              }
            } catch (e) {
              console.error('[App.tsx] Error extracting tokens:', e);
            }
            
            return null;
          };
          
          const tokens = extractTokens(url);
          
          if (tokens) {
            console.log('[App.tsx] Setting session with extracted tokens');
            const { error } = await supabase.auth.setSession({
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
            });
            
            if (error) {
              console.error('[App.tsx] Error setting session:', error);
            } else {
              console.log('[App.tsx] Deep-link login successful, session set');
            }
          } else {
            console.error('[App.tsx] Could not extract tokens from URL:', url);
          }
        } catch (error) {
          console.error('[App.tsx] Error handling login callback:', error);
        }
      }
      // Handle other deep link types
      else if (url.includes('linkstash://')) {
        console.log('[App.tsx] Other deep link received:', url);
      }
    };
    
    setupListener();
    
    // Cleanup
    return () => {
      if (listenerCleanup) {
        listenerCleanup.remove();
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
