import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Video, Image, File, Link as LinkIcon } from 'lucide-react';
import { Category } from '@/services/data.service';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'react-hot-toast';

const formSchema = z.object({
  name: z.string().min(1, { message: "Category name is required." }),
  icon: z.string().min(1, { message: "Icon is required." }),
  description: z.string().optional(),
  color: z.string().optional(),
});

const iconOptions = [
  { value: 'link', label: 'Link', Icon: LinkIcon },
  { value: 'video', label: 'Video', Icon: Video },
  { value: 'image', label: 'Image', Icon: Image },
  { value: 'file', label: 'File', Icon: File },
];

interface EditCategoryFormProps {
  category: Category;
  onClose: () => void;
}

const EditCategoryForm: React.FC<EditCategoryFormProps> = ({ category, onClose }) => {
  const { updateCategory } = useAppContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category.name || '',
      icon: category.icon || 'link',
      description: category.description || '',
      color: category.color || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!category.id) {
      toast.error("Category ID is missing, cannot update.");
      return;
    }

    const updatePayload: Partial<Category> & { id: number } = {
      id: category.id,
      name: values.name,
      icon: values.icon,
      description: values.description,
      color: values.color || null,
    };

    try {
      const success = await updateCategory(updatePayload as Category);
      if (success) {
        toast.success('Category updated successfully');
        onClose();
      } else {
        toast.error('Failed to update category. Please try again.');
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error('An error occurred while updating the category.');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Name</FormLabel>
              <FormControl>
                <Input {...field} className="bg-white/5 border-white/20 text-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Icon</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-[#1C0C23] border-white/20 text-white">
                  {iconOptions.map(({ value, label, Icon }) => (
                    <SelectItem key={value} value={value} className="hover:bg-white/10 focus:bg-white/10">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Description (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} className="bg-white/5 border-white/20 text-white" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            className="bg-linkstash-orange hover:bg-linkstash-orange/80 text-white"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditCategoryForm; 