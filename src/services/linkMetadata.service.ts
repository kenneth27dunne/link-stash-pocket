import { toast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

interface LinkMetadata {
  title: string;
  description?: string;
  thumbnail?: string;
  favicon?: string;
  type: 'image' | 'video' | 'file' | 'other';
}

class LinkMetadataService {
  private async fetchMetadata(url: string): Promise<LinkMetadata | null> {
    try {
      console.log('Starting metadata fetch for URL:', url);
      console.log('Platform:', Capacitor.getPlatform());

      // Detect content type from URL
      const type = this.detectContentType(url);
      console.log('Detected content type:', type);

      // For YouTube links, we can use their oEmbed API
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        console.log('Detected YouTube URL');
        const videoId = this.extractYouTubeId(url);
        if (videoId) {
          console.log('Extracted YouTube ID:', videoId);
          const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
          }
          const data = await response.json();
          console.log('YouTube metadata fetched successfully');
          return {
            title: data.title,
            description: data.description,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            favicon: 'https://www.youtube.com/favicon.ico',
            type: 'video'
          };
        }
      }

      // For other links, we'll need to fetch the HTML and parse it
      console.log('Fetching HTML content...');
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkStash/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      console.log('HTML content fetched, parsing...');
      const html = await response.text();
      
      // Use a more robust way to parse HTML that works on both web and Android
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract metadata with fallbacks
      const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                   doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                   doc.querySelector('title')?.textContent ||
                   '';

      const description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                         doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                         doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content');

      const thumbnail = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                       doc.querySelector('meta[property="twitter:image"]')?.getAttribute('content') ||
                       doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

      // Handle relative URLs for favicon
      let favicon = doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                   doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href');
      
      if (favicon) {
        try {
          favicon = new URL(favicon, url).href;
        } catch (e) {
          console.warn('Failed to resolve favicon URL:', e);
          favicon = undefined;
        }
      }

      // If no favicon found, try to construct one from the domain
      if (!favicon) {
        try {
          const urlObj = new URL(url);
          favicon = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
        } catch (e) {
          console.warn('Failed to construct favicon URL:', e);
        }
      }

      console.log('Metadata extracted successfully:', {
        title: title.trim(),
        hasDescription: !!description,
        hasThumbnail: !!thumbnail,
        hasFavicon: !!favicon,
        type
      });

      return {
        title: title.trim(),
        description: description?.trim(),
        thumbnail,
        favicon,
        type
      };
    } catch (error) {
      console.error('Error fetching link metadata:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      return null;
    }
  }

  private detectContentType(url: string): 'image' | 'video' | 'file' | 'other' {
    const urlLower = url.toLowerCase();
    
    // Image extensions
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/i.test(urlLower)) {
      return 'image';
    }
    
    // Video extensions
    if (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i.test(urlLower)) {
      return 'video';
    }
    
    // File extensions
    if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z|tar|gz)$/i.test(urlLower)) {
      return 'file';
    }
    
    // Video platforms
    if (urlLower.includes('youtube.com') || 
        urlLower.includes('youtu.be') || 
        urlLower.includes('vimeo.com') || 
        urlLower.includes('dailymotion.com')) {
      return 'video';
    }
    
    // Image hosting platforms
    if (urlLower.includes('imgur.com') || 
        urlLower.includes('flickr.com') || 
        urlLower.includes('500px.com') || 
        urlLower.includes('unsplash.com')) {
      return 'image';
    }
    
    return 'other';
  }

  private extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  async getMetadata(url: string): Promise<LinkMetadata | null> {
    try {
      console.log('Starting getMetadata for URL:', url);
      
      // Add a small delay on Android to ensure the network is ready
      if (Capacitor.getPlatform() === 'android') {
        console.log('Adding delay for Android platform');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const metadata = await this.fetchMetadata(url);
      if (!metadata) {
        console.log('No metadata returned from fetchMetadata');
        toast({
          title: 'Warning',
          description: 'Could not fetch link metadata. You can still save the link manually.',
          variant: 'default',
        });
      }
      return metadata;
    } catch (error) {
      console.error('Error in getMetadata:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      toast({
        title: 'Error',
        description: 'Failed to fetch link metadata. You can still save the link manually.',
        variant: 'destructive',
      });
      return null;
    }
  }
}

export const linkMetadataService = new LinkMetadataService(); 