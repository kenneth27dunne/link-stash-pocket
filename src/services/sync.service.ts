import { supabase } from '@/lib/supabase';
import { dbService, Category, Link } from './db.service';
import { toast } from 'react-hot-toast';

// Define sync status types
export type SyncStatus = 'pending' | 'synced' | 'failed';

// Define interfaces for sync tracking
export interface SyncRecord {
  id: number;
  table: 'categories' | 'links';
  record_id: number;
  action: 'create' | 'update' | 'delete';
  status: SyncStatus;
  data?: any;
  created_at: string;
  updated_at: string;
}

class SyncService {
  private syncInProgress = false;
  private networkAvailable = true;
  private syncInterval: number | null = null;
  private syncIntervalTime = 5 * 60 * 1000; // 5 minutes
  private lastSyncTime = 0;
  private syncEnabled = false;

  constructor() {
    // Set up network status listener
    this.setupNetworkListener();
    
    // Check if sync was previously enabled
    this.syncEnabled = localStorage.getItem('cloud_sync_enabled') === 'true';
    
    // Initialize sync service
    this.init();
  }

  // Initialize the sync service
  async init() {
    console.log('SyncService: Initializing');
    
    // Create sync table if it doesn't exist
    await this.createSyncTable();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Check for pending syncs
    this.checkPendingSyncs();
    
    // Perform initial sync if enabled
    if (this.syncEnabled) {
      this.performBackgroundSync();
    }
  }

  // Create the sync tracking table
  private async createSyncTable() {
    try {
      // Initialize storage if needed
      await dbService.init();
      
      // Create sync table using the storage interface
      if (dbService.isWebFallback) {
        // For web storage, we'll store sync records in localStorage
        const syncRecords = localStorage.getItem('sync_queue') || '[]';
        if (syncRecords === '[]') {
          localStorage.setItem('sync_queue', '[]');
        }
      } else {
        // For SQLite, we'll create the table using the db connection
        const db = (dbService as any).storage.db;
        await db.run(`
          CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            status TEXT NOT NULL,
            data TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);
      }
      console.log('SyncService: Sync table created or already exists');
    } catch (error) {
      console.error('SyncService: Error creating sync table:', error);
    }
  }

  // Set up network status listener
  private setupNetworkListener() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // Set initial network status
      this.networkAvailable = navigator.onLine;
      
      // Add event listeners for network status changes
      window.addEventListener('online', () => {
        console.log('SyncService: Network is online');
        this.networkAvailable = true;
        
        // Perform sync when network becomes available
        if (this.syncEnabled) {
          this.performBackgroundSync();
        }
      });
      
      window.addEventListener('offline', () => {
        console.log('SyncService: Network is offline');
        this.networkAvailable = false;
      });
    }
  }

  // Start periodic sync
  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = window.setInterval(() => {
      if (this.syncEnabled && this.networkAvailable) {
        this.performBackgroundSync();
      }
    }, this.syncIntervalTime);
  }

  // Stop periodic sync
  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Perform background sync without user prompts
  async performBackgroundSync() {
    if (this.syncInProgress || !this.networkAvailable || !this.syncEnabled) {
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('SyncService: Performing background sync');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('SyncService: No user logged in, skipping sync');
        return;
      }
      
      // Check if we need to sync (avoid too frequent syncs)
      const now = Date.now();
      if (now - this.lastSyncTime < 60000) { // Don't sync more than once per minute
        console.log('SyncService: Skipping sync, too soon since last sync');
        return;
      }
      
      // Get pending sync records
      const pendingSyncs = await this.getPendingSyncs();
      
      // Process each pending sync
      for (const sync of pendingSyncs) {
        await this.processSync(sync, user.id);
      }
      
      // After processing all pending syncs, check for cloud changes
      await this.syncFromCloud(user.id);
      
      // Update last sync time
      this.lastSyncTime = now;
      console.log('SyncService: Background sync completed');
    } catch (error) {
      console.error('SyncService: Error during background sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Enable or disable cloud sync
  setCloudSyncEnabled(enabled: boolean) {
    this.syncEnabled = enabled;
    localStorage.setItem('cloud_sync_enabled', enabled.toString());
    
    if (enabled) {
      // Perform initial sync when enabled
      this.performBackgroundSync();
    }
    
    return enabled;
  }

  // Check if cloud sync is enabled
  isCloudSyncEnabled(): boolean {
    return this.syncEnabled;
  }

  // Check for pending syncs and process them
  async checkPendingSyncs() {
    if (this.syncInProgress || !this.networkAvailable) {
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('SyncService: Checking for pending syncs');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('SyncService: No user logged in, skipping sync');
        return;
      }
      
      // Get pending sync records
      const pendingSyncs = await this.getPendingSyncs();
      if (pendingSyncs.length === 0) {
        console.log('SyncService: No pending syncs found');
        return;
      }
      
      console.log(`SyncService: Found ${pendingSyncs.length} pending syncs`);
      
      // Process each pending sync
      for (const sync of pendingSyncs) {
        await this.processSync(sync, user.id);
      }
      
      // After processing all pending syncs, check for cloud changes
      await this.syncFromCloud(user.id);
      
    } catch (error) {
      console.error('SyncService: Error checking pending syncs:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get pending sync records
  private async getPendingSyncs(): Promise<SyncRecord[]> {
    try {
      await dbService.init();
      
      if (dbService.isWebFallback) {
        // For web storage, get from localStorage
        const syncRecords = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        return syncRecords.filter((record: any) => record.status === 'pending');
      } else {
        // For SQLite, query the database
        const db = (dbService as any).storage.db;
        const result = await db.query(
          'SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC',
          ['pending']
        );
        
        return result.values?.map((row: any) => ({
          id: row.id,
          table: row.table_name,
          record_id: row.record_id,
          action: row.action,
          status: row.status,
          data: row.data ? JSON.parse(row.data) : undefined,
          created_at: row.created_at,
          updated_at: row.updated_at
        })) || [];
      }
    } catch (error) {
      console.error('SyncService: Error getting pending syncs:', error);
      return [];
    }
  }

  // Process a single sync record
  private async processSync(sync: SyncRecord, userId: string) {
    try {
      console.log(`SyncService: Processing sync for ${sync.table} ${sync.action} ${sync.record_id}`);
      
      let success = false;
      
      switch (sync.table) {
        case 'categories':
          success = await this.syncCategory(sync, userId);
          break;
        case 'links':
          success = await this.syncLink(sync, userId);
          break;
      }
      
      // Update sync status
      await this.updateSyncStatus(sync.id, success ? 'synced' : 'failed');
      
    } catch (error) {
      console.error(`SyncService: Error processing sync for ${sync.table} ${sync.record_id}:`, error);
      await this.updateSyncStatus(sync.id, 'failed');
    }
  }

  // Sync a category
  private async syncCategory(sync: SyncRecord, userId: string): Promise<boolean> {
    try {
      switch (sync.action) {
        case 'create':
          const { error: createError } = await supabase
            .from('categories')
            .insert({
              name: sync.data.name,
              icon: sync.data.icon,
              color: sync.data.color,
              description: sync.data.description,
              created_at: sync.data.createdAt,
              user_id: userId
            });
          
          if (createError) throw createError;
          break;
          
        case 'update':
          const { error: updateError } = await supabase
            .from('categories')
            .update({
              name: sync.data.name,
              icon: sync.data.icon,
              color: sync.data.color,
              description: sync.data.description
            })
            .eq('id', sync.record_id)
            .eq('user_id', userId);
          
          if (updateError) throw updateError;
          break;
          
        case 'delete':
          const { error: deleteError } = await supabase
            .from('categories')
            .delete()
            .eq('id', sync.record_id)
            .eq('user_id', userId);
          
          if (deleteError) throw deleteError;
          break;
      }
      
      return true;
    } catch (error) {
      console.error('SyncService: Error syncing category:', error);
      return false;
    }
  }

  // Sync a link
  private async syncLink(sync: SyncRecord, userId: string): Promise<boolean> {
    try {
      switch (sync.action) {
        case 'create':
          const { error: createError } = await supabase
            .from('links')
            .insert({
              url: sync.data.url,
              title: sync.data.title,
              description: sync.data.description,
              thumbnail: sync.data.thumbnail,
              favicon: sync.data.favicon,
              category_id: sync.data.categoryId,
              type: sync.data.type,
              created_at: sync.data.createdAt,
              user_id: userId
            });
          
          if (createError) throw createError;
          break;
          
        case 'update':
          const { error: updateError } = await supabase
            .from('links')
            .update({
              url: sync.data.url,
              title: sync.data.title,
              description: sync.data.description,
              thumbnail: sync.data.thumbnail,
              favicon: sync.data.favicon,
              category_id: sync.data.categoryId,
              type: sync.data.type
            })
            .eq('id', sync.record_id)
            .eq('user_id', userId);
          
          if (updateError) throw updateError;
          break;
          
        case 'delete':
          const { error: deleteError } = await supabase
            .from('links')
            .delete()
            .eq('id', sync.record_id)
            .eq('user_id', userId);
          
          if (deleteError) throw deleteError;
          break;
      }
      
      return true;
    } catch (error) {
      console.error('SyncService: Error syncing link:', error);
      return false;
    }
  }

  // Update sync status
  private async updateSyncStatus(syncId: number, status: SyncStatus) {
    try {
      await dbService.init();
      
      if (dbService.isWebFallback) {
        // For web storage, update in localStorage
        const syncRecords = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        const updatedRecords = syncRecords.map((record: any) => {
          if (record.id === syncId) {
            return { ...record, status, updated_at: new Date().toISOString() };
          }
          return record;
        });
        localStorage.setItem('sync_queue', JSON.stringify(updatedRecords));
      } else {
        // For SQLite, update the database
        const db = (dbService as any).storage.db;
        await db.run(
          'UPDATE sync_queue SET status = ?, updated_at = ? WHERE id = ?',
          [status, new Date().toISOString(), syncId]
        );
      }
    } catch (error) {
      console.error('SyncService: Error updating sync status:', error);
    }
  }

  // Add a sync record
  async addSyncRecord(table: 'categories' | 'links', recordId: number, action: 'create' | 'update' | 'delete', data?: any) {
    try {
      await dbService.init();
      const now = new Date().toISOString();
      
      if (dbService.isWebFallback) {
        // For web storage, add to localStorage
        const syncRecords = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        const newId = syncRecords.length > 0 ? Math.max(...syncRecords.map((r: any) => r.id)) + 1 : 1;
        
        syncRecords.push({
          id: newId,
          table_name: table,
          record_id: recordId,
          action,
          status: 'pending',
          data: data ? JSON.stringify(data) : null,
          created_at: now,
          updated_at: now
        });
        
        localStorage.setItem('sync_queue', JSON.stringify(syncRecords));
      } else {
        // For SQLite, insert into database
        const db = (dbService as any).storage.db;
        await db.run(
          'INSERT INTO sync_queue (table_name, record_id, action, status, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [table, recordId, action, 'pending', data ? JSON.stringify(data) : null, now, now]
        );
      }
      
      // Check for pending syncs if online
      if (this.networkAvailable) {
        this.checkPendingSyncs();
      }
    } catch (error) {
      console.error('SyncService: Error adding sync record:', error);
    }
  }

  // Sync from cloud to local
  async syncFromCloud(userId: string) {
    try {
      console.log('SyncService: Syncing from cloud to local');
      
      // Get cloud categories
      const { data: cloudCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);
      
      if (categoriesError) {
        console.error('SyncService: Error fetching categories from cloud:', categoriesError);
        return;
      }
      
      // Get cloud links
      const { data: cloudLinks, error: linksError } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', userId);
      
      if (linksError) {
        console.error('SyncService: Error fetching links from cloud:', linksError);
        return;
      }
      
      // Get local categories
      const localCategories = await dbService.getCategories();
      
      // Get local links
      const localLinks = await dbService.getAllLinks();
      
      // Sync categories
      for (const cloudCategory of cloudCategories || []) {
        const localCategory = localCategories.find(c => c.id === cloudCategory.id);
        
        if (!localCategory) {
          // Add new category from cloud
          await dbService.addCategory({
            name: cloudCategory.name,
            icon: cloudCategory.icon,
            color: cloudCategory.color,
            description: cloudCategory.description,
            createdAt: cloudCategory.created_at
          });
        } else {
          // Check if cloud version is newer
          const cloudDate = new Date(cloudCategory.updated_at || cloudCategory.created_at);
          const localDate = new Date(localCategory.createdAt || '');
          
          if (cloudDate > localDate) {
            // Update local category
            await dbService.updateCategory({
              id: cloudCategory.id,
              name: cloudCategory.name,
              icon: cloudCategory.icon,
              color: cloudCategory.color,
              description: cloudCategory.description,
              createdAt: localCategory.createdAt
            });
          }
        }
      }
      
      // Sync links
      for (const cloudLink of cloudLinks || []) {
        const localLink = localLinks.find(l => l.id === cloudLink.id);
        
        if (!localLink) {
          // Add new link from cloud
          await dbService.addLink({
            url: cloudLink.url,
            title: cloudLink.title,
            description: cloudLink.description,
            thumbnail: cloudLink.thumbnail,
            favicon: cloudLink.favicon,
            categoryId: cloudLink.category_id,
            type: cloudLink.type,
            createdAt: cloudLink.created_at
          });
        } else {
          // Check if cloud version is newer
          const cloudDate = new Date(cloudLink.updated_at || cloudLink.created_at);
          const localDate = new Date(localLink.createdAt || '');
          
          if (cloudDate > localDate) {
            // Update local link
            await dbService.updateLink({
              id: cloudLink.id,
              url: cloudLink.url,
              title: cloudLink.title,
              description: cloudLink.description,
              thumbnail: cloudLink.thumbnail,
              favicon: cloudLink.favicon,
              categoryId: cloudLink.category_id,
              type: cloudLink.type,
              createdAt: localLink.createdAt
            });
          }
        }
      }
      
      console.log('SyncService: Cloud to local sync completed');
    } catch (error) {
      console.error('SyncService: Error syncing from cloud:', error);
    }
  }

  // Initial login sync
  async initialLoginSync(userId: string) {
    try {
      console.log('SyncService: Starting initial login sync');
      
      // Get local data
      const localCategories = await dbService.getCategories();
      const localLinks = await dbService.getAllLinks();
      
      // Upload categories to cloud
      for (const category of localCategories) {
        const { error } = await supabase
          .from('categories')
          .insert({
            name: category.name,
            icon: category.icon,
            color: category.color,
            description: category.description,
            created_at: category.createdAt,
            user_id: userId
          });
        
        if (error) {
          console.error('SyncService: Error uploading category to cloud:', error);
        }
      }
      
      // Upload links to cloud
      for (const link of localLinks) {
        const { error } = await supabase
          .from('links')
          .insert({
            url: link.url,
            title: link.title,
            description: link.description,
            thumbnail: link.thumbnail,
            favicon: link.favicon,
            category_id: link.categoryId,
            type: link.type,
            created_at: link.createdAt,
            user_id: userId
          });
        
        if (error) {
          console.error('SyncService: Error uploading link to cloud:', error);
        }
      }
      
      console.log('SyncService: Initial login sync completed');
      toast.success('Your data has been synced to your account');
    } catch (error) {
      console.error('SyncService: Error during initial login sync:', error);
      toast.error('Failed to sync your data to your account');
    }
  }

  // Clean up
  cleanup() {
    this.stopPeriodicSync();
  }
}

export const syncService = new SyncService(); 