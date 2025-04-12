import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, PlusCircle, Loader2 } from 'lucide-react';
import { shareService } from '../services/share.service';
import { linkMetadataService } from '../services/linkMetadata.service';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import LinkThumbnail from './LinkThumbnail';
import { Label } from "@/components/ui/label";

interface AddLinkFormProps {
  initialUrl?: string;
  onClose: () => void;
  onSave?: () => void;
}

const AddLinkForm: React.FC<AddLinkFormProps> = ({ initialUrl = '', onClose, onSave }) => {
  const { categories, addLink, addCategory, selectedCategory, openModal, closeModal } = useAppContext();
  
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [favicon, setFavicon] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(
    selectedCategory ? selectedCategory.id?.toString() || '' : categories[0]?.id?.toString() || ''
  );
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const selectedCategoryName = categories.find(category => category.id?.toString() === categoryId)?.name || '';

  // Fetch metadata when URL changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!url.trim()) return;
      
      setIsLoading(true);
      try {
        const metadata = await linkMetadataService.getMetadata(url);
        if (metadata) {
          setTitle(metadata.title || '');
          setDescription(metadata.description || '');
          setThumbnail(metadata.thumbnail);
          setFavicon(metadata.favicon);
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(fetchMetadata, 500);
    return () => clearTimeout(timeoutId);
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!url.trim() || !categoryId) {
      if (!url.trim()) {
        urlInputRef.current?.focus();
      }
      return;
    }

    const type = shareService.getLinkType(url);
    const success = await addLink({
      url: url.trim(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      thumbnail: thumbnail,
      favicon: favicon,
      categoryId: parseInt(categoryId, 10),
      type
    });

    if (success) {
      if (onSave) {
        onSave();
      }
      closeModal();
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
    <div className="max-h-[80vh] overflow-y-auto pr-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold text-white">Save Link</h2>
        
        <div className="space-y-2">
          <Label htmlFor="url" className="text-white">URL</Label>
          <Input
            ref={urlInputRef}
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={cn(
              "bg-white/10 border-white/20 text-white placeholder:text-white/50",
              showValidation && !url.trim() && "border-red-500 focus-visible:ring-red-500"
            )}
            placeholder="Enter URL"
          />
          {showValidation && !url.trim() && (
            <p className="text-sm text-red-500">URL is required</p>
          )}
        </div>

        {/* Thumbnail Preview */}
        {url && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Preview
            </label>
            <div className="relative max-h-[200px] overflow-hidden rounded-lg">
              {isLoading ? (
                <div className="aspect-video rounded-lg bg-gradient-main flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              ) : (
                <div className="max-h-[200px] overflow-hidden">
                  <LinkThumbnail
                    title={title || url}
                    thumbnail={thumbnail}
                    favicon={favicon}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
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
          <Label htmlFor="category" className="text-white">Category</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                {selectedCategoryName || "Select a category"}
                <span className="ml-2 opacity-50">⌄</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-[#1C0C23] border-white/20">
              <Command className="bg-transparent">
                <CommandInput 
                  placeholder="Search categories..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                  className="border-none bg-transparent text-white placeholder:text-white/50"
                />
                <CommandEmpty className="py-2 px-2">
                  {searchValue.trim() ? (
                    <Button
                      type="button"
                      onClick={() => {
                        const newName = searchValue.trim();
                        addCategory({
                          name: newName,
                          icon: 'link'
                        }).then(newId => {
                          if (newId) {
                            setCategoryId(newId.toString());
                            setSearchValue('');
                            setOpen(false);
                          }
                        });
                      }}
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create "{searchValue.trim()}"
                    </Button>
                  ) : (
                    <p className="text-center text-sm text-white/50">No categories found.</p>
                  )}
                </CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={() => {
                        setCategoryId(category.id?.toString() || '');
                        setSearchValue('');
                        setOpen(false);
                      }}
                      className="flex items-center px-2 py-2 text-white hover:bg-white/10 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          categoryId === category.id?.toString() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {category.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex space-x-2 pt-2 sticky bottom-0 pb-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-linkstash-orange text-white hover:bg-linkstash-orange/80">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddLinkForm;
