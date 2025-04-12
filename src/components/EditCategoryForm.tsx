import React, { useState } from 'react';
import { Category } from '../services/db.service';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Image, File, Link as LinkIcon } from 'lucide-react';

interface EditCategoryFormProps {
  category: Category;
  onClose: () => void;
}

const EditCategoryForm: React.FC<EditCategoryFormProps> = ({ category, onClose }) => {
  const { updateCategory } = useAppContext();
  const [formData, setFormData] = useState({
    name: category.name,
    icon: category.icon || 'link'
  });

  const icons = [
    { value: 'link', label: 'Link', icon: <LinkIcon className="h-4 w-4" /> },
    { value: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
    { value: 'image', label: 'Image', icon: <Image className="h-4 w-4" /> },
    { value: 'file', label: 'File', icon: <File className="h-4 w-4" /> }
  ];

  const handleSubmit = async () => {
    if (formData.name.trim()) {
      const success = await updateCategory({
        ...category,
        name: formData.name.trim(),
        icon: formData.icon
      });
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          placeholder="Enter category name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon" className="text-white">Icon</Label>
        <Select
          value={formData.icon}
          onValueChange={(value) => setFormData({ ...formData, icon: value })}
        >
          <SelectTrigger className="bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gradient-main border-white/20">
            {icons.map(({ value, label, icon }) => (
              <SelectItem
                key={value}
                value={value}
                className="text-white hover:bg-white/10"
              >
                <div className="flex items-center space-x-2">
                  {icon}
                  <span>{label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={handleSubmit}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default EditCategoryForm; 