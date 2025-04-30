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
import { App as CapacitorApp } from '@capacitor/app';
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
    </BackButtonHandler>
  );
};

const App = () => {
  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', ({ url }) => {
        // Parse the URL fragment
        const hash = url.split('#')[1]; 
        if (!hash) {
            console.error("No URL fragment found for session", url);
            return;
        }
        
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            }).then(({ error }) => {
                if (error) {
                    console.error("Error setting session from URL:", error);
                } else {
                    console.log('📱 Deep-link login successful, session set.');
                    // AuthProvider listener should pick up the new session
                }
            });
        } else {
            console.error("Tokens not found in URL fragment:", url);
        }
    });
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
