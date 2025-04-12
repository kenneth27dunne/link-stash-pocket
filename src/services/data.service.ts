import { dbService, Category, Link } from './db.service';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { syncService } from './sync.service';

class DataService {
  private syncInProgress = false;
  private lastSyncTime: number = 0;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes

  // Get the current user ID
  private async getUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  }

  // Check if we should use cloud storage
  private async shouldUseCloud(): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      return !!userId;
    } catch (error) {
      console.error('Error checking cloud status:', error);
      return false;
    }
  }

  // Initialize the data service
  async init() {
    console.log('DataService: Initializing');
    await dbService.init();
  }

  // Get categories from the appropriate source
  async getCategories(): Promise<Category[]> {
    try {
      // Always use local storage for reads
      return dbService.getCategories();
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }

  // Get all links from the appropriate source
  async getAllLinks(): Promise<Link[]> {
    try {
      // Always use local storage for reads
      return dbService.getAllLinks();
    } catch (error) {
      console.error('Error in getAllLinks:', error);
      return [];
    }
  }

  // Get links for a specific category
  async getLinksByCategory(categoryId: number): Promise<Link[]> {
    try {
      // Always use local storage for reads
      return dbService.getLinksByCategory(categoryId);
    } catch (error) {
      console.error('Error in getLinksByCategory:', error);
      return [];
    }
  }

  // Add a category to both local and cloud if applicable
  async addCategory(category: Category): Promise<number> {
    try {
      // Always add to local first
      const localId = await dbService.addCategory(category);
      
      // Add to sync queue for cloud sync
      await syncService.addSyncRecord('categories', localId, 'create', category);
      
      return localId;
    } catch (error) {
      console.error('Error in addCategory:', error);
      throw error;
    }
  }

  // Add a link to both local and cloud if applicable
  async addLink(link: Link): Promise<number> {
    try {
      // Always add to local first
      const localId = await dbService.addLink(link);
      
      // Add to sync queue for cloud sync
      await syncService.addSyncRecord('links', localId, 'create', link);
      
      return localId;
    } catch (error) {
      console.error('Error in addLink:', error);
      throw error;
    }
  }

  // Update a category in both local and cloud if applicable
  async updateCategory(category: Category): Promise<boolean> {
    try {
      // Always update local first
      const localSuccess = await dbService.updateCategory(category);
      
      if (localSuccess && category.id) {
        // Add to sync queue for cloud sync
        await syncService.addSyncRecord('categories', category.id, 'update', category);
      }
      
      return localSuccess;
    } catch (error) {
      console.error('Error in updateCategory:', error);
      throw error;
    }
  }

  // Update a link in both local and cloud if applicable
  async updateLink(link: Link): Promise<boolean> {
    try {
      // Always update local first
      const localSuccess = await dbService.updateLink(link);
      
      if (localSuccess && link.id) {
        // Add to sync queue for cloud sync
        await syncService.addSyncRecord('links', link.id, 'update', link);
      }
      
      return localSuccess;
    } catch (error) {
      console.error('Error in updateLink:', error);
      throw error;
    }
  }

  // Delete a link from both local and cloud if applicable
  async deleteLink(id: number): Promise<boolean> {
    try {
      // Always delete from local first
      const localSuccess = await dbService.deleteLink(id);
      
      if (localSuccess) {
        // Add to sync queue for cloud sync
        await syncService.addSyncRecord('links', id, 'delete');
      }
      
      return localSuccess;
    } catch (error) {
      console.error('Error in deleteLink:', error);
      throw error;
    }
  }

  // Delete a category from both local and cloud if applicable
  async deleteCategory(id: number): Promise<boolean> {
    try {
      // Always delete from local first
      const localSuccess = await dbService.deleteCategory(id);
      
      if (localSuccess) {
        // Add to sync queue for cloud sync
        await syncService.addSyncRecord('categories', id, 'delete');
      }
      
      return localSuccess;
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      throw error;
    }
  }

  // Perform a full sync between local and cloud
  async syncData(): Promise<void> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('Starting data sync...');
      
      // Check for pending syncs
      await syncService.checkPendingSyncs();
      
    } catch (error) {
      console.error('Error during data sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }
}

export const dataService = new DataService(); 