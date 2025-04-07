
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/db.service';
import Logo from './Logo';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface InitialSetupProps {
  onComplete: () => void;
}

const InitialSetup: React.FC<InitialSetupProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const { toast } = useToast();

  const initialize = async () => {
    try {
      // Start with 10% progress
      setProgress(10);
      setError(null);
      setIsInitializing(true);
      
      // Initialize the database
      await dbService.init();
      setProgress(60);
      
      // Simulate loading to show the nice animation
      setTimeout(() => {
        setProgress(90);
        setTimeout(() => {
          setProgress(100);
          setIsInitializing(false);
          onComplete();
        }, 500);
      }, 800);
    } catch (error) {
      console.error('Error during initialization:', error);
      setError('Failed to initialize database. Tap to retry.');
      setIsInitializing(false);
      toast({
        title: "Database Error",
        description: "There was an issue initializing the database. " + 
                    (error instanceof Error ? error.message : "Please try again."),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Initial attempt
    initialize();
    
    // Add a timeout for cases where initialization gets stuck
    const timeoutId = setTimeout(() => {
      if (isInitializing) {
        setError('Initialization is taking longer than expected. Tap to retry.');
        setIsInitializing(false);
        toast({
          title: "Initialization Timeout",
          description: "Database initialization is taking too long. You can retry or proceed with limited functionality.",
          variant: "destructive",
        });
      }
    }, 15000); // 15 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Effect to track retry attempts
  useEffect(() => {
    if (attemptCount > 0) {
      initialize();
    }
  }, [attemptCount]);

  const handleRetry = () => {
    setAttemptCount(prev => prev + 1);
  };

  const handleSkip = () => {
    toast({
      title: "Warning",
      description: "Proceeding without database initialization. Some features may not work properly.",
      variant: "destructive",
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-gradient-main flex flex-col items-center justify-center p-6 z-50">
      <div className="w-full max-w-sm flex flex-col items-center">
        <Logo size="lg" />
        
        <h1 className="text-white text-3xl font-bold mt-6 mb-2">LinkStash</h1>
        <p className="text-white/70 text-center mb-8">
          Save and organize your links
        </p>
        
        <Progress value={progress} className="w-full h-3 mb-4 bg-white/10" />
        
        {error ? (
          <div className="text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleRetry} 
                className="bg-linkstash-orange hover:bg-linkstash-orange/80 text-white"
              >
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSkip} 
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Skip
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-white/50 text-sm">
            {progress < 50 ? 'Initializing database...' : 
             progress < 90 ? 'Setting things up...' : 
             'Almost ready...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default InitialSetup;
