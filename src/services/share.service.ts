
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

class ShareService {
  async shareUrl(url: string, title?: string, text?: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Share functionality is only available on native platforms');
      return;
    }

    try {
      await Share.share({
        title: title || 'Check out this link',
        text: text || 'I found this interesting link',
        url,
        dialogTitle: 'Share this link',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }

  // Check if a URL is an image
  isImageUrl(url: string): boolean {
    return /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(url);
  }

  // Check if a URL is a video
  isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(url);
  }

  // Check if a URL is a file (excluding images and videos)
  isFileUrl(url: string): boolean {
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar|7z)$/i.test(url);
  }

  // Determine link type based on URL
  getLinkType(url: string): 'image' | 'video' | 'file' | 'other' {
    if (this.isImageUrl(url)) return 'image';
    if (this.isVideoUrl(url)) return 'video';
    if (this.isFileUrl(url)) return 'file';
    return 'other';
  }
}

export const shareService = new ShareService();
