
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import CategoryView from "./pages/CategoryView";
import NotFound from "./pages/NotFound";
import InitialSetup from "./components/InitialSetup";
import { toast } from "@/hooks/use-toast";

const queryClient = new QueryClient();

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Add a timeout to prevent infinite loading (as a failsafe)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isInitializing) {
        console.log('Initialization timeout reached in App.tsx, proceeding to app');
        setIsInitializing(false);
        toast({
          title: "Warning",
          description: "Database initialization took longer than expected. Some features might not work correctly.",
          variant: "destructive",
        });
      }
    }, 20000); // 20 seconds timeout (longer than the one in InitialSetup)
    
    return () => clearTimeout(timeoutId);
  }, [isInitializing]);
  
  useEffect(() => {
    // Add event listener to prevent pull-to-refresh on mobile
    const preventPullToRefresh = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      const touch = e.touches[0];
      const startY = touch.screenY;
      
      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        const currentY = touch.screenY;
        // If pulling down from the top of the screen
        if (document.scrollingElement!.scrollTop === 0 && currentY > startY) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchstart', preventPullToRefresh, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', preventPullToRefresh);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          {isInitializing ? (
            <InitialSetup onComplete={() => setIsInitializing(false)} />
          ) : (
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/category/:id" element={<CategoryView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          )}
          <Toaster />
          <Sonner position="top-center" />
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
