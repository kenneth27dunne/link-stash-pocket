import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { cn } from "@/lib/utils";

interface AuthFormProps {
  defaultTab?: 'signin' | 'signup';
  onSuccess?: () => void; // Optional: callback on successful sign in/up
}

const AuthForm: React.FC<AuthFormProps> = ({ defaultTab = 'signin', onSuccess }) => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(defaultTab);
  const [passwordMismatchError, setPasswordMismatchError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (action: 'signin' | 'signup') => {
    setPasswordMismatchError(false);
    setFormError(null);
    setLoading(true);
    try {
      if (action === 'signin') {
        await signIn(email, password);
      } else {
        if (password !== confirmPassword) {
          setPasswordMismatchError(true);
          setFormError('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setFormError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        await signUp(email, password);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message) {
        if (error.message.includes('User already registered')) {
          setFormError('An account with this email already exists.');
        } else if (error.message.includes('valid email')) {
          setFormError('Please enter a valid email address.');
        } else if (error.message.includes('check your email')) {
          setFormError('Please check your email to confirm your account.');
        } else {
          setFormError('An unexpected error occurred. Please try again.');
        }
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setFormError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordMismatchError(false);
    setFormError(null);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setPasswordMismatchError(false);
    setFormError(null);
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}>
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
                autoComplete="email"
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
                autoComplete="current-password"
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
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-main px-2 text-white/70">Or continue with</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={() => signInWithGoogle()}
            disabled={loading}
          >
            Sign In with Google
          </Button>
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
                onChange={handleEmailChange}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Enter your email"
                required
                autoComplete="email"
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
                onChange={handlePasswordChange}
                className={cn(
                  "bg-white/10 border-white/20 text-white",
                  passwordMismatchError && "border-red-500 focus-visible:ring-red-500"
                )}
                placeholder="Choose a password (min. 6 characters)"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password" className="text-white">
                Confirm Password
              </Label>
              <Input
                id="signup-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={cn(
                  "bg-white/10 border-white/20 text-white",
                  passwordMismatchError && "border-red-500 focus-visible:ring-red-500"
                )}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </div>
            {formError && (
              <p className="text-sm text-red-400 pt-1">{formError}</p>
            )}
            <Button
              type="submit"
              className="w-full bg-linkstash-orange hover:bg-linkstash-orange/80"
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </form>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-main px-2 text-white/70">Or continue with</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
            onClick={() => signInWithGoogle()}
            disabled={loading}
          >
            Sign Up with Google
          </Button>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AuthForm;