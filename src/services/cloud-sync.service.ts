import { supabase } from '@/lib/supabase';
import { dbService, Category, Link } from './db.service';

class CloudSyncService {
  private syncInProgress = false;

  async syncToCloud() {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('Starting cloud sync...');

      // Get all local data
      const categories = await dbService.getCategories();
      const links = await dbService.getAllLinks();

      // Sync categories
      for (const category of categories) {
        const { error } = await supabase
          .from('categories')
          .upsert({
            name: category.name,
            icon: category.icon,
            color: category.color,
            description: category.description,
            created_at: category.createdAt,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) {
          console.error('Error syncing category:', error);
          throw error;
        }
      }

      // Sync links
      for (const link of links) {
        const { error } = await supabase
          .from('links')
          .upsert({
            url: link.url,
            title: link.title,
            description: link.description,
            thumbnail: link.thumbnail,
            favicon: link.favicon,
            category_id: link.categoryId,
            type: link.type,
            created_at: link.createdAt,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) {
          console.error('Error syncing link:', error);
          throw error;
        }
      }

      console.log('Cloud sync completed successfully');
    } catch (error) {
      console.error('Error during cloud sync:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncFromCloud() {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log('Starting cloud sync...');

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) {
        throw new Error('No user ID found');
      }

      // Get cloud data
      const { data: cloudCategories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (categoriesError) {
        console.error('Error fetching categories from cloud:', categoriesError);
        throw categoriesError;
      }

      const { data: cloudLinks, error: linksError } = await supabase
        .from('links')
        .select('*')
        .eq('user_id', userId);

      if (linksError) {
        console.error('Error fetching links from cloud:', linksError);
        throw linksError;
      }

      // Sync categories to local
      for (const category of cloudCategories || []) {
        await dbService.addCategory({
          name: category.name,
          icon: category.icon,
          color: category.color,
          description: category.description,
          createdAt: category.created_at
        });
      }

      // Sync links to local
      for (const link of cloudLinks || []) {
        await dbService.addLink({
          url: link.url,
          title: link.title,
          description: link.description,
          thumbnail: link.thumbnail,
          favicon: link.favicon,
          categoryId: link.category_id,
          type: link.type,
          createdAt: link.created_at
        });
      }

      console.log('Cloud sync completed successfully');
    } catch (error) {
      console.error('Error during cloud sync:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }
}

export const cloudSyncService = new CloudSyncService(); 