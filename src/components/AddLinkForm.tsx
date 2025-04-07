
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, PlusCircle } from 'lucide-react';
import { shareService } from '../services/share.service';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';

interface AddLinkFormProps {
  initialUrl?: string;
  onClose: () => void;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({ initialUrl = '', onClose }) => {
  const { categories, addLink, addCategory, selectedCategory } = useAppContext();
  
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>(
    selectedCategory ? selectedCategory.id?.toString() || '' : categories[0]?.id?.toString() || ''
  );
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const selectedCategoryName = categories.find(category => category.id?.toString() === categoryId)?.name || '';

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    const categoryId = await addCategory({
      name: newCategoryName.trim(),
      icon: 'link', // Default icon
    });

    if (categoryId) {
      setCategoryId(categoryId.toString());
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      setSearchValue('');
    }
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchValue.toLowerCase())
  );

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
        {isAddingNewCategory ? (
          <div className="flex space-x-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
              autoFocus
            />
            <Button type="button" onClick={handleAddCategory} className="bg-linkstash-orange text-white hover:bg-linkstash-orange/80">
              Add
            </Button>
            <Button type="button" onClick={() => setIsAddingNewCategory(false)} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancel
            </Button>
          </div>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                {selectedCategoryName || "Select a category"}
                <span className="ml-2 opacity-50">⌄</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-[#1e1e1e] border-white/20">
              <Command className="bg-transparent">
                <CommandInput 
                  placeholder="Search category..."
                  value={searchValue}
                  onValueChange={setSearchValue}
                  className="h-9 text-white"
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="py-3 px-4 text-sm text-white">
                      {searchValue.trim() !== '' ? (
                        <Button
                          type="button"
                          onClick={() => {
                            setNewCategoryName(searchValue);
                            setIsAddingNewCategory(true);
                            setOpen(false);
                          }}
                          variant="ghost"
                          className="w-full justify-start text-left text-sm"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create "{searchValue}"
                        </Button>
                      ) : (
                        "No category found"
                      )}
                    </div>
                  </CommandEmpty>
                  <CommandGroup className="overflow-hidden">
                    {filteredCategories.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => {
                          setCategoryId(category.id?.toString() || '');
                          setOpen(false);
                          setSearchValue('');
                        }}
                        className={cn(
                          "flex items-center px-4 py-2 text-sm text-white hover:bg-white/10",
                          categoryId === category.id?.toString() ? "bg-white/10" : ""
                        )}
                      >
                        {category.name}
                        {categoryId === category.id?.toString() && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
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
