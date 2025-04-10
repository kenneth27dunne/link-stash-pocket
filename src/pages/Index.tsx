import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import Logo from '@/components/Logo';
import CategoryCard from '@/components/CategoryCard';
import AddCategoryForm from '@/components/AddCategoryForm';
import AddLinkForm from '@/components/AddLinkForm';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { categories, loading, setSelectedCategory, openModal, closeModal } = useAppContext();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setSelectedCategory(category);
      navigate(`/category/${categoryId}`);
    }
  };

  const handleOpenAddCategory = () => {
    setAddCategoryOpen(true);
    openModal();
  };

  const handleCloseAddCategory = () => {
    setAddCategoryOpen(false);
    closeModal();
  };

  const handleOpenAddLink = () => {
    setAddLinkOpen(true);
    openModal();
  };

  const handleCloseAddLink = () => {
    setAddLinkOpen(false);
    closeModal();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-main">
      <header className="flex-none p-6">
        <div className="flex justify-between items-center">
          <Logo size="lg" />
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/10 text-white rounded-full h-10 w-10"
            onClick={handleOpenAddLink}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <h1 className="text-white text-4xl font-bold mb-2">
          Save and categorize links
        </h1>
        <p className="text-white/70 mb-8">
          Organize your online content in one place
        </p>

        <div className="space-y-4 pb-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-pulse text-white">Loading...</div>
            </div>
          ) : (
            <>
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onClick={() => handleCategoryClick(category.id || 0)}
                />
              ))}
              
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center py-4 text-yellow-400 hover:bg-linkstash-purple/40 rounded-xl"
                onClick={handleOpenAddCategory}
              >
                <Plus className="h-5 w-5 mr-2" />
                New category
              </Button>
            </>
          )}
        </div>
      </main>

      <footer className="flex-none p-6">
        <Button 
          className="w-full bg-linkstash-orange hover:bg-linkstash-orange/80 text-white text-xl font-medium py-6 rounded-xl"
          onClick={handleOpenAddLink}
        >
          Save
        </Button>
      </footer>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryOpen} onOpenChange={handleCloseAddCategory}>
        <DialogContent className="bg-gradient-main border-none sm:max-w-md">
          <AddCategoryForm onClose={handleCloseAddCategory} />
        </DialogContent>
      </Dialog>

      {/* Add Link Dialog */}
      <Dialog open={addLinkOpen} onOpenChange={handleCloseAddLink}>
        <DialogContent className="bg-gradient-main border-none sm:max-w-md">
          <AddLinkForm onClose={handleCloseAddLink} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
