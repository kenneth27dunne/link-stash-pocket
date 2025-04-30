import React from 'react';
// Import Profile type if needed for state, although profile from context might suffice
// import { Profile } from '@/services/data.service'; 
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Profile: React.FC = () => {
  // Remove profile from context destructuring
  const { user, loading: authLoading } = useAuth(); 

  // Placeholder state and handlers for profile updates
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      // Add toast notification for password mismatch
      console.error("Passwords don't match");
      return;
    }
    if (!newPassword) {
       // Add toast notification for empty password
      console.error("Password cannot be empty");
      return;
    }
    
    setIsUpdating(true);
    console.log('Updating password...');
    // TODO: Implement actual password update logic using useAuth context
    // Example: await updatePassword(newPassword);
    
    // Simulate update delay
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    console.log('Password update mocked.');
    setIsUpdating(false);
    setNewPassword('');
    setConfirmPassword('');
    // Add success toast notification
  };

  if (authLoading) { 
    return <div>Loading user profile...</div>;
  }

  // Check only for user now
  if (!user) { 
    // Maybe redirect to sign-in?
    return <div>User not found. Please sign in.</div>; 
  }
  console.log(user);
  // Re-add metadata extraction logic
  const metadata = user.user_metadata || {};
  const currentDisplayName = metadata.name || 'Not Set';
  const currentUsername = metadata.username || 'Not Set';

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>View and update your profile details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email || 'No email available'} readOnly disabled />
            <p className="text-xs text-muted-foreground">
              Email address cannot be changed here. Contact support if needed.
            </p>
          </div>

          {/* Display Name - Read from metadata */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Name</Label>
            {/* Use currentDisplayName from metadata */}
            <Input id="displayName" value={currentDisplayName} readOnly disabled />
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4 border-t pt-6 mt-6">
             <h3 className="text-lg font-semibold">Update Password</h3>
             <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required 
                />
             </div>
             <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required 
                />
             </div>
             <Button type="submit" disabled={isUpdating}>
               {isUpdating ? 'Updating...' : 'Update Password'}
             </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile; 