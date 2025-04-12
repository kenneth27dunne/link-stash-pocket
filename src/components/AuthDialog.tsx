import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange }) => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (action: 'signin' | 'signup') => {
    setLoading(true);
    try {
      if (action === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Auth error:', error);
      // Error is already handled by the auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-main border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Account</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="signin" className="text-white data-[state=active]:bg-white/20">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="text-white data-[state=active]:bg-white/20">
              Sign Up
            </TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit('signin');
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-white">
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-white">
                  Password
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-linkstash-orange hover:bg-linkstash-orange/80"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit('signup');
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-white">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-white">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Choose a password"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-linkstash-orange hover:bg-linkstash-orange/80"
                disabled={loading}
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog; 