import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { useAppContext } from '../contexts/AppContext';

interface BackButtonHandlerProps {
  children: React.ReactNode;
}

const BackButtonHandler: React.FC<BackButtonHandlerProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { closeModal, isModalOpen } = useAppContext();
  const lastPathRef = useRef<string>(location.pathname);
  const isFirstBackRef = useRef<boolean>(true);

  useEffect(() => {
    // Update the last path when location changes
    lastPathRef.current = location.pathname;
  }, [location]);

  useEffect(() => {
    const handleBackButton = async () => {
      console.log('Back button pressed');
      console.log('Current path:', location.pathname);
      console.log('Last path:', lastPathRef.current);
      console.log('Is modal open:', isModalOpen);
      console.log('Is first back:', isFirstBackRef.current);

      // If a modal is open, close it first
      if (isModalOpen) {
        console.log('Closing modal');
        closeModal();
        return;
      }

      // If we're in a category view, go back to the main view
      if (location.pathname.startsWith('/category/')) {
        console.log('Navigating back to main view');
        navigate('/');
        return;
      }

      // If we're on the main view and it's the first back press, show a toast
      if (location.pathname === '/' && isFirstBackRef.current) {
        console.log('First back press on main view');
        isFirstBackRef.current = false;
        
        // Show a toast or message that pressing back again will exit the app
        // You can implement this with your preferred notification system
        
        // Set a timeout to reset the first back flag
        setTimeout(() => {
          isFirstBackRef.current = true;
        }, 2000);
        
        return;
      }

      // If we're on the main view and it's not the first back press, exit the app
      if (location.pathname === '/') {
        console.log('Exiting app');
        App.exitApp();
      }
    };

    // Register the back button handler
    App.addListener('backButton', handleBackButton);

    // Clean up the listener when the component unmounts
    return () => {
      App.removeAllListeners();
    };
  }, [location, navigate, closeModal, isModalOpen]);

  return <>{children}</>;
};

export default BackButtonHandler; 