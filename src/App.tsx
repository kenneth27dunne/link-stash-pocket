import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { AuthProvider } from "./contexts/AuthContext";
import { useState } from "react";
import Index from "./pages/Index";
import CategoryView from "./pages/CategoryView";
import NotFound from "./pages/NotFound";
import InitialSetup from "./components/InitialSetup";
import ShareHandler from "./components/ShareHandler";
import BackButtonHandler from "./components/BackButtonHandler";

const queryClient = new QueryClient();

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppProvider>
            <BrowserRouter>
              <BackButtonHandler>
                {isInitializing ? (
                  <InitialSetup onComplete={() => setIsInitializing(false)} />
                ) : (
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/category/:id" element={<CategoryView />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                )}
                <Toaster />
                <SonnerToaster />
                <ShareHandler />
              </BackButtonHandler>
            </BrowserRouter>
          </AppProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
