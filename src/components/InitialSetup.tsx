import React, { useEffect, useState } from 'react';
import Logo from './Logo';
// Remove unused Button import
// import { Button } from "@/components/ui/button";
// Remove unused useToast import
// import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Capacitor } from '@capacitor/core';
// Remove unused imports if dataService and useAuth are no longer needed here
// import { dataService } from '@/services/data.service';
// import { useAuth } from '@/contexts/AuthContext';

interface InitialSetupProps {
  // Remove onComplete prop
  // onComplete: () => void;
}

// Simplify the component - it now primarily acts as a loading screen
// The actual initialization is handled by AuthContext and AppContext
const InitialSetup: React.FC<InitialSetupProps> = (/* Remove { onComplete } */) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing...');
  // No need for error state, retry, or skip logic here anymore
  // const [error, setError] = useState<string | null>(null);
  // const [attemptCount, setAttemptCount] = useState(0);
  // const [isInitializing, setIsInitializing] = useState(true);
  // Remove unused toast variable
  // const { toast } = useToast(); 
  // const { user } = useAuth(); // No longer needed directly here
  const isWeb = Capacitor.getPlatform() === 'web';

  // Remove the initialize function
  // const initialize = async () => { ... };

  // Remove useEffect hooks related to initialization, retry, and timeout
  // useEffect(() => { ... initial attempt ... }, []);
  // useEffect(() => { ... retry attempts ... }, [attemptCount]);

  // Use a simple effect for the loading animation
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    setMessage('Checking authentication...');
    setProgress(25);
    
    timers.push(setTimeout(() => {
      setMessage('Loading data...');
      setProgress(60);
    }, 800));
    
    timers.push(setTimeout(() => {
      setMessage('Almost ready...');
      setProgress(90);
    }, 1500));

    // Note: onComplete is now called externally when App is ready
    // We don't call it from here anymore

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Remove handlers for retry and skip
  // const handleRetry = () => { ... };
  // const handleSkip = () => { ... };

  return (
    <div className="fixed inset-0 bg-gradient-main flex flex-col items-center justify-center p-6 z-50">
      <div className="w-full max-w-sm flex flex-col items-center">
        <Logo size="lg" />
        
        <h1 className="text-white text-3xl font-bold mt-6 mb-2">LinkStash</h1>
        <p className="text-white/70 text-center mb-8">
          Save and organize your links
        </p>
        
        <Progress value={progress} className="w-full h-3 mb-4 bg-white/10" />
        
        {/* Remove error display and buttons */}
        {/* {error ? (...) : (...) } */}
        <p className="text-white/50 text-sm">
          {message}
        </p>
      </div>
    </div>
  );
};

export default InitialSetup;
