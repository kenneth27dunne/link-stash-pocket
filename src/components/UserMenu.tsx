import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Cloud, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from './AuthDialog';

const UserMenu = () => {
  const { user, signOut, cloudSyncEnabled, toggleCloudSync } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/10 text-white rounded-full h-10 w-10 relative"
          >
            <User className="h-5 w-5" />
            {user && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-linkstash-purple" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-gradient-main border-white/20"
        >
          {user ? (
            <>
              <DropdownMenuItem className="text-white/70">
                {user.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem
                className="text-white flex items-center cursor-pointer"
                onClick={toggleCloudSync}
              >
                <Cloud className="mr-2 h-4 w-4" />
                {cloudSyncEnabled ? 'Disable Cloud Sync' : 'Enable Cloud Sync'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-white flex items-center cursor-pointer"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              className="text-white flex items-center cursor-pointer"
              onClick={() => setAuthDialogOpen(true)}
            >
              <User className="mr-2 h-4 w-4" />
              Sign In
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
      />
    </>
  );
};

export default UserMenu; 