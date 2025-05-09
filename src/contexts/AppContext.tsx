import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dataService, Category, Link } from '../services/data.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

interface AppContextType {
  categories: Category[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addCategory: (category: Category) => Promise<Category | null>;
  updateCategory: (category: Category) => Promise<boolean>;
  deleteCategory: (id: number) => Promise<boolean>;
  updateLink: (link: Link) => Promise<boolean>;
  deleteLink: (id: number) => Promise<boolean>;
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const refreshData = async () => {
    if (!user) {
      console.log('AppContext: No authenticated user, clearing category data.');
      setCategories([]);
      setLoading(false);
      return;
    }
    
    console.log('AppContext: Refreshing categories for user:', user.id);
    setLoading(true);
    
    try {
      const fetchedCategories = await dataService.getCategories();
      console.log('AppContext: Categories fetched:', fetchedCategories.length);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('AppContext: Error refreshing categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (category: Category): Promise<Category | null> => {
    try {
      console.log('AppContext: Adding category', category);
      if (!user) {
        console.error('AppContext: No authenticated user, cannot add category');
        toast({ title: 'Error', description: 'You must be logged in to add categories', variant: 'destructive' });
        return null;
      }
      
      const newCategoryFromServer = await dataService.addCategory(category);
      console.log('AppContext: Category added from server:', newCategoryFromServer);
      
      if (newCategoryFromServer?.id) {
        setCategories(prev => [newCategoryFromServer, ...prev]);
        toast({ title: 'Success', description: 'Category added successfully' });
        return newCategoryFromServer;
      } else {
        toast({ title: 'Warning', description: 'Category may not have been saved correctly', variant: 'destructive' });
        return null;
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast({ title: 'Error', description: 'Failed to add category', variant: 'destructive' });
      return null;
    }
  };

  const updateCategory = async (category: Category): Promise<boolean> => {
    try {
      console.log('AppContext: Updating category', category);
      if (!user) {
        console.error('AppContext: No authenticated user, cannot update category');
        toast({ title: 'Error', description: 'You must be logged in to update categories', variant: 'destructive' });
        return false;
      }
      if (!category.id || !Number.isInteger(category.id) || category.id <= 0) {
        console.error(`AppContext: Invalid category ID for update: ${category.id}`);
        return false;
      }
      
      const result = await dataService.updateCategory(category);
      console.log('AppContext: Category update result:', result, 'for ID:', category.id);
      
      if (result) {
        setCategories(prev => prev.map(c => c.id === category.id ? { ...category } : c));
        toast({ title: 'Success', description: 'Category updated successfully' });
        return true;
      } else {
        toast({ title: 'Warning', description: 'Category may not have been updated correctly', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast({ title: 'Error', description: 'Failed to update category', variant: 'destructive' });
      return false;
    }
  };

  const deleteCategory = async (id: number): Promise<boolean> => {
    try {
      console.log('AppContext: Deleting category with ID:', id);
      if (!user) {
        console.error('AppContext: No authenticated user, cannot delete category');
        toast({ title: 'Error', description: 'You must be logged in to delete categories', variant: 'destructive' });
        return false;
      }
      if (!id || !Number.isInteger(id) || id <= 0) {
        console.error(`AppContext: Invalid category ID for deletion: ${id}`);
        return false;
      }
      
      const result = await dataService.deleteCategory(id);
      console.log('AppContext: Category deletion result:', result, 'for ID:', id);
      
      if (result) {
        setCategories(prev => prev.filter(category => category.id !== id));
        toast({ title: 'Success', description: 'Category deleted successfully' });
        return true;
      } else {
        toast({ title: 'Warning', description: 'Category may not have been deleted correctly', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
      return false;
    }
  };

  const updateLink = async (link: Link): Promise<boolean> => {
    try {
      console.log('AppContext: Updating link', link);
      if (!user) {
        console.error('AppContext: No authenticated user, cannot update link');
        toast({ title: 'Error', description: 'You must be logged in to update links', variant: 'destructive' });
        return false;
      }
      if (!link.id || !Number.isInteger(link.id) || link.id <= 0) {
        console.error(`AppContext: Invalid link ID for update: ${link.id}`);
        return false;
      }

      const result = await dataService.updateLink(link);
      console.log('AppContext: Link update result:', result, 'for ID:', link.id);

      if (result) {
        toast({ title: 'Success', description: 'Link updated successfully' });
        return true;
      } else {
        toast({ title: 'Warning', description: 'Link may not have been updated correctly', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      console.error('Error updating link:', error);
      toast({ title: 'Error', description: 'Failed to update link', variant: 'destructive' });
      return false;
    }
  };

  const deleteLink = async (id: number): Promise<boolean> => {
    try {
      console.log('AppContext: Deleting link with ID:', id);
      if (!user) {
        console.error('AppContext: No authenticated user, cannot delete link');
        toast({ title: 'Error', description: 'You must be logged in to delete links', variant: 'destructive' });
        return false;
      }
      if (!id || !Number.isInteger(id) || id <= 0) {
        console.error(`AppContext: Invalid link ID for deletion: ${id}`);
        return false;
      }

      const result = await dataService.deleteLink(id);
      console.log('AppContext: Link deletion result:', result, 'for ID:', id);

      if (result) {
        toast({ title: 'Success', description: 'Link deleted successfully' });
        return true;
      } else {
        toast({ title: 'Warning', description: 'Link may not have been deleted correctly', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({ title: 'Error', description: 'Failed to delete link', variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    console.log('AppContext: useEffect triggered. User ID:', user?.id);
    refreshData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  
  return (
    <AppContext.Provider
      value={{
        categories,
        loading,
        refreshData,
        addCategory,
        updateCategory,
        deleteCategory,
        updateLink,
        deleteLink,
        selectedCategory,
        setSelectedCategory,
        isModalOpen,
        openModal,
        closeModal,
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
