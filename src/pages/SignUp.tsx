import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// import AuthDialog from '@/components/AuthDialog'; // Remove old import
import AuthForm from '@/components/AuthForm'; // Import new form
import Logo from '@/components/Logo';

const SignUp = () => {
  // const [open, setOpen] = useState(true); // Remove dialog state
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already signed in, redirect to home
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSuccess = () => {
    // On successful sign up, user needs to confirm email.
    // The success toast from AuthContext provides instructions.
    // We remove the navigation here and let the useEffect handle redirection
    // once the user state changes after confirmation.
    // navigate('/'); 
    console.log('Sign up request successful. Waiting for email confirmation.');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-main p-6">
      <div className="w-full max-w-md space-y-8"> {/* Added space-y-8 */}
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        {/* Render AuthForm directly, passing onSuccess */}
        <AuthForm onSuccess={handleSuccess} defaultTab="signup" />
      </div>
    </div>
  );
};

export default SignUp; 