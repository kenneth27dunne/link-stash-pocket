import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { toast } from 'sonner';
import { Link, Category } from '@/services/data.service';
import { UseMutateFunction } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddLinkFormProps {
  onClose: () => void;
  categoryId: number;
  addLinkMutate: UseMutateFunction<Link | null, Error, Link, unknown>;
  isAddingLink: boolean;
  initialUrl?: string;
  onSave?: () => void;
}

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
  title: z.string().optional(),
  description: z.string().optional(),
});

const detectLinkType = (url: string): Link['type'] => {
  const urlLower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(urlLower)) return 'image';
  if (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(urlLower)) return 'video';
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z|tar|gz)$/i.test(urlLower)) return 'file';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || urlLower.includes('vimeo.com')) return 'video';
  // Add more specific checks if necessary
  return 'other'; // Use 'other' as the default to match the Link type
};

const AddLinkForm: React.FC<AddLinkFormProps> = ({ 
  onClose, 
  categoryId,
  addLinkMutate,
  isAddingLink,
  initialUrl = '',
  onSave
}) => {
  const { categories, addCategory } = useAppContext();
  
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [favicon, setFavicon] = useState<string | undefined>();
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  
  const [selectedCategoryIdInForm, setSelectedCategoryIdInForm] = useState<number>(categoryId);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      url: initialUrl || '', 
      title: '', 
      description: '' 
    },
  });

  const urlInputRef = useRef<HTMLInputElement>(null);

  const fetchMetadata = useCallback(async (url: string) => {
    if (!url || !z.string().url().safeParse(url).success) {
      setThumbnail(undefined);
      setFavicon(undefined);
      form.reset({ ...form.getValues(), title: '', description: '' });
      return;
    }
    setIsFetchingMeta(true);
    try {
      const metadata = await linkMetadataService.getMetadata(url);
      form.setValue('title', metadata.title || '', { shouldValidate: false });
      form.setValue('description', metadata.description || '', { shouldValidate: false });
      setThumbnail(metadata.thumbnail);
      setFavicon(metadata.favicon);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setThumbnail(undefined);
      setFavicon(undefined);
      toast.error('Failed to fetch metadata for the URL.');
    } finally {
      setIsFetchingMeta(false);
    }
  }, [form]);

  useEffect(() => {
    if (initialUrl) {
      fetchMetadata(initialUrl);
    }
  }, [initialUrl, fetchMetadata]);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleUrlChangeDebounced = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    form.setValue('url', url, { shouldValidate: true });

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchMetadata(url);
    }, 500);
  };

  const handleAddCategory = async (categoryName: string) => {
    if (!categoryName.trim()) return;
    
    setIsAddingNewCategory(true);
    const newCategoryData: Category = {
      name: categoryName.trim(),
      icon: 'link', // Default icon, or maybe derive?
    };
    
    try {
      const addedCategory = await addCategory(newCategoryData);
      if (addedCategory?.id) {
        setSelectedCategoryIdInForm(addedCategory.id);
        setSearchValue('');
        setPopoverOpen(false);
        toast.success(`Category "${categoryName}" created`);
      } else {
        toast.error('Failed to create category');
      }
    } catch (error) {
       console.error("Error adding category:", error);
       toast.error('Failed to create category. Please try again.');
    } finally {
      setIsAddingNewCategory(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (selectedCategoryIdInForm <= 0) {
       toast.error("Please select a category.");
       return; 
    }
    
    const linkType = detectLinkType(values.url);
    
    const newLink: Omit<Link, 'id' | 'user_id' | 'created_at'> = {
      url: values.url,
      title: values.title || values.url,
      description: values.description,
      thumbnail: thumbnail,
      favicon: favicon,
      type: linkType,
      category_id: selectedCategoryIdInForm,
    };

    addLinkMutate(newLink as Link, {
      onSuccess: () => {
        toast.success('Link added successfully');
        onSave?.();
        onClose();
      },
      onError: (error) => {
        console.error("Failed to add link:", error);
        toast.error("Failed to add link. Please try again.");
      }
    });
  }

  const selectedCategoryName = categories.find(c => c.id === selectedCategoryIdInForm)?.name || "Select a category";
  const filteredCategories = categories.filter(category => 
     category.name.toLowerCase().includes(searchValue.toLowerCase())
   );

  return (
    <div className="max-h-[80vh] overflow-y-auto pr-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <h2 className="text-xl font-bold text-white">Save Link</h2>
          
          <div className="space-y-2">
            <Label htmlFor="url" className="text-white">URL</Label>
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com"
                      {...field}
                      onChange={handleUrlChangeDebounced}
                      ref={urlInputRef}
                      className={cn(
                        "bg-white/10 border-white/20 text-white placeholder:text-white/50",
                        form.formState.errors.url && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  </FormControl>
                  {form.formState.errors.url && (
                    <FormMessage className="text-red-500" />
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Thumbnail Preview */}
          {thumbnail && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Preview
              </label>
              <div className="relative max-h-[200px] overflow-hidden rounded-lg">
                <div className="max-h-[200px] overflow-hidden">
                  <LinkThumbnail
                    title={form.watch('title') || form.watch('url')}
                    thumbnail={thumbnail}
                    favicon={favicon}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-white">
              Title
            </label>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Link title"
                      {...field}
                      className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
                    />
                  </FormControl>
                  {form.formState.errors.title && (
                    <FormMessage className="text-red-500" />
                  )}
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-white">
              Description
            </label>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder="Link description"
                      {...field}
                      className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
                      rows={3}
                    />
                  </FormControl>
                  {form.formState.errors.description && (
                    <FormMessage className="text-red-500" />
                  )}
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-white">Category</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between bg-white/10 text-white border-white/20 hover:bg-white/20"
                  disabled={categories.length === 0}
                >
                  {selectedCategoryName}
                  <span className="ml-2 opacity-50">⌄</span> 
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-[#1C0C23] border-white/20">
                <Command className="bg-transparent">
                  <CommandInput 
                    placeholder="Search categories..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                    className="border-none bg-transparent text-white placeholder:text-white/50 focus:ring-0"
                  />
                  <CommandEmpty className="py-2 px-4 text-center text-sm text-white/50">
                    {searchValue.trim() ? (
                      <Button
                        type="button"
                        onClick={() => handleAddCategory(searchValue.trim())}
                        variant="ghost"
                        className="w-full justify-center text-white hover:bg-white/10 text-sm"
                        disabled={isAddingNewCategory}
                      >
                        {isAddingNewCategory ? 
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 
                          <><PlusCircle className="mr-2 h-4 w-4" /> Create "{searchValue.trim()}"</>
                        }
                      </Button>
                    ) : (
                      "No categories found."
                    )}
                  </CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {filteredCategories.map((cat) => (
                      <CommandItem
                        key={cat.id}
                        value={cat.name}
                        onSelect={() => {
                          setSelectedCategoryIdInForm(cat.id || 0);
                          setSearchValue('');
                          setPopoverOpen(false);
                        }}
                        className="flex items-center px-2 py-2 text-white hover:bg-white/10 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCategoryIdInForm === cat.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {cat.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            
            {selectedCategoryIdInForm <= 0 && (
               <p className="text-sm font-medium text-red-500">Please select a category.</p>
            )}
          </div>
          
          <div className="flex space-x-2 pt-2 sticky bottom-0 pb-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-linkstash-orange text-white hover:bg-linkstash-orange/80"
              disabled={isAddingLink || isFetchingMeta || isAddingNewCategory}
            >
              {(isAddingLink || isFetchingMeta || isAddingNewCategory) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isAddingLink ? 'Saving...' : (isFetchingMeta || isAddingNewCategory) ? 'Processing...' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddLinkForm;
