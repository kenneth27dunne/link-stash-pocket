import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AddLinkForm from './AddLinkForm';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService, Link } from '@/services/data.service';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Define the interface for the native plugin
interface ShareHandlerPlugin {
  notifyShareHandlerReady(): Promise<void>;
}

// Register the plugin, ShareHandler is the name used in @CapacitorPlugin(name = "ShareHandler")
const ShareHandlerNative = registerPlugin<ShareHandlerPlugin>('ShareHandler');

const SHARED_CONTENT_KEY = 'linkstash_shared_content';

// Declare the global variable
declare global {
  interface Window {
    linkstashSharedContent?: string;
  }
}

const extractUrl = (text: string): string | null => {
  try {
    // Regular expression to match URLs
    const urlPattern = /https?:\/\/[^\s]+/g;
    const matches = text.match(urlPattern);
    return matches ? matches[0] : null;
  } catch (error) {
    console.error('Error extracting URL:', error);
    return null;
  }
};

const ShareHandler: React.FC = () => {
  const [sharedText, setSharedText] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { categories, loading, openModal, closeModal, refreshData, isModalOpen } = useAppContext();
  const queryClient = useQueryClient();

  const addLinkFromShareMutation = useMutation({
    mutationFn: dataService.addLink,
    onSuccess: (data) => {
      if (data?.category_id) {
        queryClient.invalidateQueries({ queryKey: ['links', data.category_id] });
      } else {
        refreshData();
      }
      handleLinkSaved();
    },
    onError: (error) => {
      console.error("Failed to add link from share:", error);
      toast.error("Failed to add link. Please try again.");
    }
  });

  const processSharedContent = useCallback(async (content: string | null) => {
    if (!content) {
      setSharedText(null);
      setShowDialog(false);
      return;
    }

    const url = extractUrl(content);
    if (!url) {
      toast.error("No URL found in shared text");
      setSharedText(null);
      setShowDialog(false);
      return;
    }
    setSharedText(url);
    setShowDialog(true);
    openModal();
    localStorage.removeItem('sharedContent');
  }, [openModal]);

  const handleCloseDialog = useCallback(() => {
    setShowDialog(false);
    setSharedText(null);
    closeModal();
    localStorage.removeItem('sharedContent');
    window.linkstashSharedContent = undefined;
  }, [closeModal]);

  const handleLinkSaved = useCallback(() => {
    handleCloseDialog();
  }, [handleCloseDialog]);

  useEffect(() => {
    if (!isModalOpen && showDialog) {
      setShowDialog(false);
      setSharedText(null);
    }
  }, [isModalOpen, showDialog]);

  useEffect(() => {
    if (ShareHandlerNative && typeof ShareHandlerNative.notifyShareHandlerReady === 'function') {
      console.log('ShareHandler: Calling notifyShareHandlerReady to native.');
      ShareHandlerNative.notifyShareHandlerReady().catch(error => {
        console.error('ShareHandler: Error calling notifyShareHandlerReady:', error);
      });
    }

    if (window.linkstashSharedContent && !showDialog) {
      console.log('ShareHandler: Processing initial window.linkstashSharedContent');
      processSharedContent(window.linkstashSharedContent);
      window.linkstashSharedContent = undefined;
    }

    const storedContent = localStorage.getItem('sharedContent');
    if (!window.linkstashSharedContent && storedContent && !showDialog) {
      console.log('ShareHandler: Processing initial localStorage sharedContent');
      processSharedContent(storedContent);
    }

    const handleShareReceived = (event: CustomEvent) => {
      const { text } = event.detail;
      if (text) {
        if (!showDialog) {
          console.log('ShareHandler: Received shareReceived event with text:', text);
          processSharedContent(text);
        } else {
          toast.info("Already handling a shared link.");
        }
      }
    };

    window.addEventListener('shareReceived', handleShareReceived as EventListener);

    return () => {
      window.removeEventListener('shareReceived', handleShareReceived as EventListener);
    };
  }, [processSharedContent, showDialog]);

  useEffect(() => {
    if (!loading && window.linkstashSharedContent && !showDialog) {
      console.log('ShareHandler: Processing window.linkstashSharedContent after loading');
      processSharedContent(window.linkstashSharedContent);
      window.linkstashSharedContent = undefined;
    }
  }, [loading, processSharedContent, showDialog]);

  if (!showDialog || !sharedText) {
    return null;
  }

  const defaultCategoryId = categories[0]?.id || 0;

  return (
    <Dialog open={showDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
      <DialogContent className="bg-gradient-main border-none sm:max-w-md">
        <AddLinkForm 
          initialUrl={sharedText} 
          onClose={handleCloseDialog} 
          onSave={handleLinkSaved}
          categoryId={defaultCategoryId}
          addLinkMutate={addLinkFromShareMutation.mutate}
          isAddingLink={addLinkFromShareMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ShareHandler; 