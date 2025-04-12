import React, { useState } from 'react';
import { Category } from '../services/db.service';
import { useAppContext } from '../contexts/AppContext';
import { Video, Image, File, Link as LinkIcon, Trash2, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EditCategoryForm from './EditCategoryForm';

interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  const { getLinksForCategory, deleteCategory } = useAppContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const links = getLinksForCategory(category.id || 0);
  const count = links.length;

  const getIcon = () => {
    switch (category.icon) {
      case 'video':
        return <Video className="h-6 w-6 text-linkstash-orange" />;
      case 'image':
        return <Image className="h-6 w-6 text-yellow-400" />;
      case 'file':
        return <File className="h-6 w-6 text-blue-400" />;
      default:
        return <LinkIcon className="h-6 w-6 text-linkstash-pink" />;
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    const success = await deleteCategory(category.id);
    if (success) {
      setDeleteDialogOpen(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditDialogOpen(true);
  };

  return (
    <>
      <div 
        className="bg-linkstash-purple/70 backdrop-blur-sm rounded-xl p-4 shadow-card cursor-pointer transform transition-transform duration-200 hover:scale-[1.02] active:scale-95"
        onClick={onClick}
      >
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 bg-linkstash-purple/80 rounded-lg p-2">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-white text-xl font-semibold">{category.name}</h3>
            <p className="text-white/70 text-sm">
              {count} {count === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-400 hover:text-blue-500 hover:bg-white/10"
              onClick={handleEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-white/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-gradient-main border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Edit Category</DialogTitle>
          </DialogHeader>
          <EditCategoryForm 
            category={category} 
            onClose={() => setEditDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gradient-main border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Delete Category</DialogTitle>
            <p className="text-white/70 mt-2">
              Are you sure you want to delete "{category.name}"? All links in this category will also be deleted.
            </p>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CategoryCard;
