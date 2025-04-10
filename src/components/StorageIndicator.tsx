import React, { useEffect, useState } from 'react';
import { dbService } from '../services/db.service';
import { Capacitor } from '@capacitor/core';
import { Badge } from '@/components/ui/badge';

const StorageIndicator: React.FC = () => {
  const [storageType, setStorageType] = useState<string>('Checking...');
  const [isWeb, setIsWeb] = useState<boolean>(false);

  useEffect(() => {
    const checkStorageType = async () => {
      try {
        // Check if we're in a web environment
        const platform = Capacitor.getPlatform();
        setIsWeb(platform === 'web');
        
        // Try to access the database service to determine storage type
        // This will trigger initialization if not already done
        await dbService.getCategories();
        
        // Use the new method to check storage type
        const type = dbService.getStorageType();
        setStorageType(type);
      } catch (error) {
        console.error('Error checking storage type:', error);
        setStorageType('Unknown');
      }
    };
    
    checkStorageType();
  }, []);

  if (!isWeb) {
    return null; // Don't show on native platforms
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant={storageType === 'SQLite' ? 'default' : 'outline'}>
        Storage: {storageType}
      </Badge>
    </div>
  );
};

export default StorageIndicator; 