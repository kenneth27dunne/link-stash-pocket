import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const UserMenu: React.FC = () => {
  const { 
    user, 
    signOut 
  } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-9 w-9 rounded-full ${user ? 'bg-muted' : ''}`}
        >
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.name || user.email || 'User avatar'}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user.user_metadata?.name || user.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.user_metadata?.username ? `@${user.user_metadata.username}` : user.id.substring(0, 8) + '...'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/auth/signin')}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign in</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/auth/signup')}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Sign up</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default React.memo(UserMenu); 