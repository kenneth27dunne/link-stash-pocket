import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
// import AuthDialog from '@/components/AuthDialog'; // Remove old import
import AuthForm from '@/components/AuthForm'; // Import new form
import Logo from '@/components/Logo';

const SignIn = () => {
  // const [open, setOpen] = useState(true); // Remove dialog state
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already signed in, redirect to home
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Remove handleOpenChange function
  // const handleOpenChange = (open: boolean) => {
  //   setOpen(open);
  //   if (!open) {
  //     navigate('/');
  //   }
  // };

  const handleSuccess = () => {
    navigate('/'); // Navigate home on successful sign in
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-main p-6">
      <div className="w-full max-w-md space-y-8"> {/* Added space-y-8 */}
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        {/* Render AuthForm directly, passing onSuccess */}
        <AuthForm onSuccess={handleSuccess} defaultTab="signin" />
      </div>
    </div>
  );
};

export default SignIn; 