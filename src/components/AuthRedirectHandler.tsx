import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

const AuthRedirectHandler = () => {
  useEffect(() => {
    // Skip this handler if we're in a native platform, as it's handled elsewhere
    if (Capacitor.isNativePlatform()) {
      return;
    }
    
    // Get hash fragment from URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    // If we have auth tokens in URL, we've been redirected after auth
    if (accessToken && refreshToken) {
      // Set the session in Supabase
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      // Send message to opener window
      if (window.opener) {
        window.opener.postMessage({
          type: 'supabase:auth:success'
        }, window.location.origin);
        
        // Close this window after a short delay
        setTimeout(() => {
          window.close();
        }, 500);
      }
    }
  }, []);
  
  return null; // This component doesn't render anything
};

export default AuthRedirectHandler; 