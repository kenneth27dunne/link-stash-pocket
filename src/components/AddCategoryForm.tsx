import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Image, File, Link as LinkIcon } from 'lucide-react';

interface AddCategoryFormProps {
  onClose: () => void;
}

const AddCategoryForm: React.FC<AddCategoryFormProps> = ({ onClose }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('link');
  const { addCategory, closeModal } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    const success = await addCategory({
      name: name.trim(),
      icon,
    });

    if (success) {
      closeModal();
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-white">New Category</h2>
      
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-white">
          Category Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name"
          className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="icon" className="text-sm font-medium text-white">
          Icon
        </label>
        <Select value={icon} onValueChange={setIcon}>
          <SelectTrigger className="bg-white/10 text-white border-white/20">
            <SelectValue placeholder="Select an icon" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="video" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>Video</span>
              </div>
            </SelectItem>
            <SelectItem value="image" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span>Image</span>
              </div>
            </SelectItem>
            <SelectItem value="file" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <File className="h-4 w-4" />
                <span>File</span>
              </div>
            </SelectItem>
            <SelectItem value="link" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <span>Link</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-linkstash-orange text-white hover:bg-linkstash-orange/80">
          Create
        </Button>
      </div>
    </form>
  );
};

export default AddCategoryForm;
