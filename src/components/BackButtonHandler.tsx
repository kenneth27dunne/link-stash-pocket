import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PluginListenerHandle } from '@capacitor/core';
import { App, BackButtonListenerEvent } from '@capacitor/app';
import { useAppContext } from '../contexts/AppContext';
import { toast } from 'react-hot-toast';

interface BackButtonHandlerProps {
  children: React.ReactNode;
}

const BackButtonHandler: React.FC<BackButtonHandlerProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { closeModal, isModalOpen } = useAppContext();
  const lastPathRef = useRef<string>(location.pathname);
  const isFirstBackRef = useRef<boolean>(true);
  const backPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const listenerHandleRef = useRef<PluginListenerHandle | null>(null);

  useEffect(() => {
    // Update the last path when location changes
    lastPathRef.current = location.pathname;
  }, [location]);

  useEffect(() => {
    const handleBackButton = (event: BackButtonListenerEvent) => {
      if (isModalOpen) {
        closeModal();
        // We handled it (closed modal). We might want to prevent the default
        // back action here depending on desired Capacitor behavior.
        // For now, just returning handles closing the modal.
        return; 
      }

      if (location.pathname !== '/') {
         // If not on the main page, perform standard back navigation
         navigate(-1); 
         // Reset first back press flag since we navigated away
         isFirstBackRef.current = true; 
         lastPathRef.current = location.pathname; 
      } else {
        // On main view ('/') - Handle exit logic
        if (isFirstBackRef.current) {
          toast('Press back again to exit');
          isFirstBackRef.current = false;
          if (backPressTimerRef.current) clearTimeout(backPressTimerRef.current);
          backPressTimerRef.current = setTimeout(() => {
            isFirstBackRef.current = true;
          }, 2000); 
          // Prevent default back action (exit) on first press
          // This might require specific Capacitor handling if event object allows
        } else {
          // Second back press on main view, allow exit
          App.exitApp();
        }
      }
    };

    // Add the listener and store the handle
    let isMounted = true;
    App.addListener('backButton', handleBackButton).then(handle => {
      if (isMounted) {
        listenerHandleRef.current = handle;
      }
    });

    // Clean up listener and timer on unmount or path change
    return () => {
      isMounted = false;
      listenerHandleRef.current?.remove();
      if (backPressTimerRef.current) {
        clearTimeout(backPressTimerRef.current);
      }
    };
  }, [location.pathname, isModalOpen, closeModal, navigate]);

  return <>{children}</>;
};

export default BackButtonHandler; 