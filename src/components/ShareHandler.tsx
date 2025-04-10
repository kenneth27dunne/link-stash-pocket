import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import AddLinkForm from './AddLinkForm';
import { toast } from 'sonner';

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
  const { categories, loading, openModal, closeModal } = useAppContext();

  const handleSharedContent = useCallback((content: string) => {
    try {
      console.log('Processing shared content:', content);
      
      if (!content) {
        console.log('No content to process');
        return;
      }

      // Extract URL from the shared content
      const url = extractUrl(content);
      if (!url) {
        console.log('No URL found in shared content');
        toast.error('No valid URL found in shared content');
        return;
      }

      console.log('Extracted URL:', url);
      setSharedText(url);
      setShowDialog(true);
      openModal();
    } catch (error) {
      console.error('Error handling shared content:', error);
      toast.error('Error processing shared content');
    }
  }, [openModal]);

  const handleClose = useCallback(() => {
    try {
      console.log('Closing share dialog');
      setShowDialog(false);
      closeModal();
      // Clear the shared text after a short delay to ensure the dialog is fully closed
      setTimeout(() => {
        setSharedText(null);
      }, 100);
    } catch (error) {
      console.error('Error closing dialog:', error);
    }
  }, [closeModal]);

  const handleSave = useCallback(() => {
    console.log('Link saved, closing dialog');
    handleClose();
  }, [handleClose]);

  useEffect(() => {
    try {
      console.log('ShareHandler mounted');
      
      // Check for stored shared content
      const storedContent = localStorage.getItem(SHARED_CONTENT_KEY);
      console.log('Stored content from localStorage:', storedContent);
      
      // Check global variable
      const globalContent = (window as any).linkstashSharedContent;
      console.log('Global shared content:', globalContent);

      if (storedContent) {
        console.log('Found stored content, processing');
        handleSharedContent(storedContent);
        localStorage.removeItem(SHARED_CONTENT_KEY);
      } else if (globalContent) {
        console.log('Found global content, processing');
        handleSharedContent(globalContent);
        (window as any).linkstashSharedContent = null;
      }

      // Listen for share events
      const handleShare = (event: CustomEvent) => {
        try {
          console.log('Share event received:', event.detail);
          const text = event.detail.text;
          console.log('Shared text:', text);
          
          // Only process if dialog is not already showing
          if (!showDialog) {
            handleSharedContent(text);
            // Store in localStorage as backup
            localStorage.setItem(SHARED_CONTENT_KEY, text);
            console.log('Stored shared content in localStorage');
          } else {
            console.log('Dialog already showing, ignoring new share');
          }
        } catch (error) {
          console.error('Error handling share event:', error);
          toast.error('Error processing shared content');
        }
      };

      window.addEventListener('shareReceived', handleShare as EventListener);
      console.log('Added shareReceived event listener');

      return () => {
        console.log('ShareHandler unmounting, removing event listener');
        window.removeEventListener('shareReceived', handleShare as EventListener);
      };
    } catch (error) {
      console.error('Error in ShareHandler useEffect:', error);
      toast.error('Error initializing share handler');
    }
  }, [handleSharedContent, showDialog]);

  // Check for global variable periodically until app is initialized
  useEffect(() => {
    try {
      if (!loading && window.linkstashSharedContent && !showDialog) {
        handleSharedContent(window.linkstashSharedContent);
        window.linkstashSharedContent = undefined; // Clear it after reading
      }
    } catch (error) {
      console.error('Error checking global content:', error);
    }
  }, [loading, handleSharedContent, showDialog]);

  if (!showDialog || !sharedText) {
    console.log('ShareHandler not showing dialog - showDialog:', showDialog, 'sharedText:', sharedText);
    return null;
  }

  console.log('Rendering share dialog with text:', sharedText);
  return (
    <Dialog open={showDialog} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-main border-none sm:max-w-md">
        <AddLinkForm initialUrl={sharedText} onClose={handleClose} onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
};

export default ShareHandler; 