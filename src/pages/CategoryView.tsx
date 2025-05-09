import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import { dataService, Link } from '@/services/data.service';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import LinkItem from '@/components/LinkItem';
import AddLinkForm from '@/components/AddLinkForm';

const CategoryView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { categories, deleteCategory, selectedCategory, setSelectedCategory, openModal, closeModal, isModalOpen } = useAppContext();

  const categoryId = parseInt(id || '0', 10);

  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const category = categories.find(c => c.id === categoryId);

  const { data: links = [], isLoading: isLoadingLinks, isError: isErrorLinks } = useQuery<Link[], Error>({
    queryKey: ['links', categoryId],
    queryFn: () => dataService.getLinksByCategory(categoryId),
    enabled: !!categoryId,
  });

  const addLinkMutation = useMutation({
    mutationFn: dataService.addLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', categoryId] });
      handleCloseAddLink();
    },
  });

  const updateLinkMutation = useMutation({
    mutationFn: dataService.updateLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', categoryId] });
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: dataService.deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', categoryId] });
    },
  });

  useEffect(() => {
    if (!isModalOpen) {
      if (addLinkOpen) setAddLinkOpen(false);
      if (deleteDialogOpen) setDeleteDialogOpen(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (categoryId && !category && categories.length > 0) {
      const firstCategory = categories[0];
      if(firstCategory?.id) {
          setSelectedCategory(firstCategory);
          navigate(`/category/${firstCategory.id}`, { replace: true });
      }
    } else if (category) {
      setSelectedCategory(category);
    }
  }, [categoryId, category, categories, navigate, setSelectedCategory]);

  const handleBack = () => {
    navigate('/');
  };

  const handleDeleteCategory = async () => {
    setDeleteDialogOpen(false);
    closeModal();
    if (!categoryId) return;
    const success = await deleteCategory(categoryId);
    if (success) {
      navigate('/');
    }
  };

  const handleOpenAddLink = useCallback(() => {
    setAddLinkOpen(true);
    openModal();
  }, [openModal]);

  const handleCloseAddLink = useCallback(() => {
    setAddLinkOpen(false);
    closeModal();
  }, [closeModal]);

  const handleOpenDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(true);
    openModal();
  }, [openModal]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    closeModal();
  }, [closeModal]);

  if (!category && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-white">Loading Categories...</div>
      </div>
    );
  }
  
  if (isLoadingLinks) {
     return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse text-white">Loading Links...</div>
      </div>   
    );
  }
  
  if (!category) {
     return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-white">Category not found.</div>
      </div>
    );
  }
  
  if (isErrorLinks) {
     return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">Error loading links.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full max-w-5xl mx-auto">
      <header className="flex-none p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 bg-white/10 text-white rounded-full h-10 w-10"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-white text-2xl font-bold">{category.name}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/10 text-white/80 hover:text-red-400 rounded-full h-10 w-10"
            onClick={handleOpenDeleteDialog}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/70">
            <p className="mb-4">No links saved in this category yet</p>
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={handleOpenAddLink}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first link
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <LinkItem 
                key={link.id} 
                link={link} 
                onDelete={() => link.id && deleteLinkMutation.mutate(link.id)}
                updateLinkMutate={updateLinkMutation.mutate}
                isUpdatingLink={updateLinkMutation.isPending}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="flex-none p-6">
        <Button 
          className="w-full bg-linkstash-orange hover:bg-linkstash-orange/80 text-white text-xl font-medium py-6 rounded-xl"
          onClick={handleOpenAddLink}
        >
          Save
        </Button>
      </footer>

      <Dialog open={addLinkOpen} onOpenChange={(open) => !open && handleCloseAddLink()}>
        <DialogContent className="bg-gradient-main border-none sm:max-w-md">
          <AddLinkForm 
            onClose={handleCloseAddLink} 
            categoryId={categoryId}
            addLinkMutate={addLinkMutation.mutate}
            isAddingLink={addLinkMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => !open && handleCloseDeleteDialog()}>
        <DialogContent className="bg-gradient-main border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Delete Category</DialogTitle>
            <DialogDescription className="text-white/70">
              Are you sure you want to delete this category? All links in this category will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={handleCloseDeleteDialog}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteCategory}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryView;
