
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dbService, Category, Link } from '../services/db.service';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  categories: Category[];
  links: Link[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addCategory: (category: Category) => Promise<number>;
  addLink: (link: Link) => Promise<number>;
  deleteLink: (id: number) => Promise<boolean>;
  deleteCategory: (id: number) => Promise<boolean>;
  getLinksForCategory: (categoryId: number) => Link[];
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const refreshData = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await dbService.getCategories();
      const fetchedLinks = await dbService.getAllLinks();
      
      setCategories(fetchedCategories);
      setLinks(fetchedLinks);
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (category: Category): Promise<number> => {
    try {
      const id = await dbService.addCategory(category);
      if (id > 0) {
        await refreshData();
        toast({
          title: 'Category Added',
          description: `"${category.name}" category has been created`,
        });
      }
      return id;
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: 'Failed to add category',
        variant: 'destructive',
      });
      return 0;
    }
  };

  const addLink = async (link: Link): Promise<number> => {
    try {
      const id = await dbService.addLink(link);
      if (id > 0) {
        await refreshData();
        toast({
          title: 'Link Saved',
          description: 'Your link has been saved successfully',
        });
      }
      return id;
    } catch (error) {
      console.error('Error adding link:', error);
      toast({
        title: 'Error',
        description: 'Failed to save link',
        variant: 'destructive',
      });
      return 0;
    }
  };

  const deleteLink = async (id: number): Promise<boolean> => {
    try {
      const success = await dbService.deleteLink(id);
      if (success) {
        await refreshData();
        toast({
          title: 'Link Deleted',
          description: 'Link has been removed',
        });
      }
      return success;
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete link',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCategory = async (id: number): Promise<boolean> => {
    try {
      const success = await dbService.deleteCategory(id);
      if (success) {
        await refreshData();
        setSelectedCategory(null);
        toast({
          title: 'Category Deleted',
          description: 'Category and all its links have been removed',
        });
      }
      return success;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getLinksForCategory = (categoryId: number): Link[] => {
    return links.filter(link => link.categoryId === categoryId);
  };

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await dbService.init();
        await refreshData();
      } catch (error) {
        console.error('Error initializing database:', error);
        toast({
          title: 'Database Error',
          description: 'Failed to initialize database',
          variant: 'destructive',
        });
      }
    };

    initializeDatabase();

    return () => {
      dbService.closeConnection().catch(err => {
        console.error('Error closing database connection:', err);
      });
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        categories,
        links,
        loading,
        refreshData,
        addCategory,
        addLink,
        deleteLink,
        deleteCategory,
        getLinksForCategory,
        selectedCategory,
        setSelectedCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
