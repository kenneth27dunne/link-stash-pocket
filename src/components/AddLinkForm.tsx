
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { shareService } from '../services/share.service';

interface AddLinkFormProps {
  initialUrl?: string;
  onClose: () => void;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({ initialUrl = '', onClose }) => {
  const { categories, addLink, selectedCategory } = useAppContext();
  
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>(
    selectedCategory ? selectedCategory.id?.toString() || '' : categories[0]?.id?.toString() || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || !categoryId) {
      return;
    }

    const type = shareService.getLinkType(url);
    const success = await addLink({
      url: url.trim(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      categoryId: parseInt(categoryId, 10),
      type
    });

    if (success) {
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-white">Save Link</h2>
      
      <div className="space-y-2">
        <label htmlFor="url" className="text-sm font-medium text-white">
          URL *
        </label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-white">
          Title
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title (optional)"
          className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-white">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium text-white">
          Category *
        </label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="bg-white/10 text-white border-white/20">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id?.toString() || ''}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-linkstash-orange text-white hover:bg-linkstash-orange/80">
          Save
        </Button>
      </div>
    </form>
  );
};

export default AddLinkForm;
