import { supabase } from '@/lib/supabase';
// Remove useAuth import if unused now
// import { useAuth } from '@/contexts/AuthContext';

// Remove Profile interface definition
/*
export interface Profile {
  id: string; // Matches auth.users.id
  display_name: string;
  username: string;
  updated_at?: string;
  // Add other profile fields here if needed
}
*/

export interface Category {
  id?: number;
  user_id?: string;
  name: string;
  icon: string;
  color?: string | null;
  description?: string | null;
  created_at?: string;
}

export interface Link {
  id?: number;
  user_id?: string;
  category_id: number;
  url: string;
  title?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  favicon?: string | null;
  type: string;
  created_at?: string;
}

class DataService {
  // Remove isInitialized and initializationPromise
  // private isInitialized = false;
  // private initializationPromise: Promise<boolean> | null = null;

  // Remove the init method entirely
  // async init() { ... }

  // Get categories from Supabase
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }

  // Get all links from Supabase
  async getAllLinks(): Promise<Link[]> {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getAllLinks:', error);
      return [];
    }
  }

  // Get links for a specific category
  async getLinksByCategory(categoryId: number): Promise<Link[]> {
    try {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getLinksByCategory:', error);
      return [];
    }
  }

  // Add a category to Supabase
  async addCategory(category: Category): Promise<Category> {
    try {
      // Get the current user ID
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      
      // Add user_id to category
      const newCategory = {
        ...category,
        user_id: session.user.id,
      };
      
      const { data, error } = await supabase
        .from('categories')
        .insert(newCategory)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to insert category, no data returned.');
      return data; // Return the full category object
    } catch (error) {
      console.error('Error in addCategory:', error);
      throw error;
    }
  }

  // Add a link to Supabase
  async addLink(link: Link): Promise<Link> {
    try {
      // Get the current user ID
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      
      // Add user_id to link
      const newLink = {
        ...link,
        user_id: session.user.id,
      };
      
      const { data, error } = await supabase
        .from('links')
        .insert(newLink)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to insert link, no data returned.');
      return data; // Return the full link object
    } catch (error) {
      console.error('Error in addLink:', error);
      throw error;
    }
  }

  // Update a category in Supabase
  async updateCategory(category: Category): Promise<boolean> {
    try {
      // Remove the id from the update data since it's an identity column
      const { id, ...updateData } = category;
      
      const { error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in updateCategory:', error);
      throw error;
    }
  }

  // Update a link in Supabase
  async updateLink(link: Link): Promise<boolean> {
    try {
      // Remove the id from the update data since it's an identity column
      const { id, ...updateData } = link;
      
      const { error } = await supabase
        .from('links')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in updateLink:', error);
      throw error;
    }
  }

  // Delete a link from Supabase
  async deleteLink(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteLink:', error);
      throw error;
    }
  }

  // Delete a category from Supabase
  async deleteCategory(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      throw error;
    }
  }
}

export const dataService = new DataService(); 