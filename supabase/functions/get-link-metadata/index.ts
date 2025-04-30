// Follow this setup guide to integrate the Deno runtime:
// https://deno.com/manual/getting_started/setup_your_environment

// @deno-types="npm:@types/node"
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';
import * as linkify from 'https://esm.sh/linkifyjs@4.1.1';

interface LinkMetadata {
  title: string;
  description?: string;
  thumbnail?: string;
  favicon?: string;
  type: 'image' | 'video' | 'file' | 'other';
  suggestedCategory?: string;
}

async function extractMetadata(url: string): Promise<LinkMetadata | null> {
  try {
    // Validate URL
    const validUrl = linkify.find(url)[0]?.href;
    if (!validUrl) {
      throw new Error('Invalid URL');
    }

    // Detect content type from URL
    const type = detectContentType(validUrl);
    
    // For YouTube links, use their oEmbed API
    if (validUrl.includes('youtube.com') || validUrl.includes('youtu.be')) {
      const videoId = extractYouTubeId(validUrl);
      if (videoId) {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!response.ok) {
          throw new Error(`YouTube API error: ${response.status}`);
        }
        const data = await response.json();
        
        return {
          title: data.title,
          description: data.author_name ? `Video by ${data.author_name}` : undefined,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          favicon: 'https://www.youtube.com/favicon.ico',
          type: 'video',
          suggestedCategory: 'Videos'
        };
      }
    }

    // For other links, fetch the HTML and parse it
    const response = await fetch(validUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkStash/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // Extract metadata with fallbacks
    const title = $('meta[property="og:title"]').attr('content') ||
                 $('meta[name="twitter:title"]').attr('content') ||
                 $('title').text() ||
                 '';

    const description = $('meta[property="og:description"]').attr('content') ||
                       $('meta[name="description"]').attr('content') ||
                       $('meta[name="twitter:description"]').attr('content');

    const thumbnail = $('meta[property="og:image"]').attr('content') ||
                     $('meta[property="twitter:image"]').attr('content') ||
                     $('meta[name="twitter:image"]').attr('content');

    // Handle relative URLs for favicon
    let favicon = $('link[rel="icon"]').attr('href') ||
                 $('link[rel="shortcut icon"]').attr('href');
    
    if (favicon && !favicon.startsWith('http')) {
      try {
        const urlObj = new URL(validUrl);
        favicon = new URL(favicon, `${urlObj.protocol}//${urlObj.hostname}`).href;
      } catch {
        favicon = undefined;
      }
    }

    // If no favicon found, try to construct one from the domain
    if (!favicon) {
      try {
        const urlObj = new URL(validUrl);
        favicon = `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`;
      } catch {
        // Ignore errors
      }
    }

    // Suggest a category based on the content
    const suggestedCategory = guessCategoryFromMetadata(title, description || '', validUrl);

    return {
      title: title.trim(),
      description: description?.trim(),
      thumbnail,
      favicon,
      type,
      suggestedCategory
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return null;
  }
}

function detectContentType(url: string): 'image' | 'video' | 'file' | 'other' {
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

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function guessCategoryFromMetadata(title: string, description: string, url: string): string {
  const combined = `${title} ${description} ${url}`.toLowerCase();
  
  // Define different categories and their related keywords
  const categories = {
    'Technology': ['tech', 'programming', 'code', 'developer', 'software', 'hardware', 'computer', 'app', 'gadget'],
    'Finance': ['money', 'finance', 'investment', 'stock', 'crypto', 'bitcoin', 'banking', 'economic'],
    'Health': ['health', 'fitness', 'workout', 'exercise', 'diet', 'nutrition', 'medical', 'wellness'],
    'Education': ['learn', 'course', 'tutorial', 'education', 'school', 'university', 'study', 'academic'],
    'Entertainment': ['movie', 'film', 'tv', 'show', 'music', 'game', 'play', 'entertainment', 'fun'],
    'News': ['news', 'politics', 'world', 'breaking', 'report', 'update', 'latest'],
    'Social': ['social', 'media', 'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat', 'linkedin'],
    'Shopping': ['shop', 'store', 'buy', 'price', 'deal', 'discount', 'product', 'purchase'],
    'Travel': ['travel', 'vacation', 'trip', 'flight', 'hotel', 'booking', 'destination', 'tourism'],
    'Food': ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'diet', 'nutrition', 'eat'],
    'Science': ['science', 'research', 'study', 'scientific', 'discovery', 'experiment', 'journal'],
    'Sports': ['sport', 'team', 'player', 'game', 'match', 'league', 'championship', 'tournament'],
    'Art': ['art', 'design', 'creative', 'artist', 'paint', 'drawing', 'photography'],
    'Business': ['business', 'company', 'startup', 'entrepreneur', 'corporate', 'industry', 'market'],
    'Videos': ['video', 'youtube', 'vimeo', 'watch', 'stream', 'streaming']
  };
  
  // Check URL domains for quick categorization
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || urlLower.includes('vimeo.com')) {
    return 'Videos';
  }
  if (urlLower.includes('github.com') || urlLower.includes('stackoverflow.com') || urlLower.includes('dev.to')) {
    return 'Technology';
  }
  if (urlLower.includes('netflix.com') || urlLower.includes('hulu.com') || urlLower.includes('disney.com')) {
    return 'Entertainment';
  }
  if (urlLower.includes('cnn.com') || urlLower.includes('bbc.com') || urlLower.includes('nytimes.com')) {
    return 'News';
  }
  
  // Count keyword matches for each category
  const scores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(categories)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (combined.includes(keyword)) {
        scores[category]++;
      }
    }
  }
  
  // Find the category with the highest score
  let bestCategory = 'Other';
  let highestScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }
  
  return highestScore > 0 ? bestCategory : 'Other';
}

// Create a handler for the HTTP request
serve(async (req) => {
  // Define all CORS headers upfront
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Parse request body
    const { url } = await req.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Extract metadata
    const metadata = await extractMetadata(url);
    
    if (!metadata) {
      return new Response(JSON.stringify({ error: 'Failed to extract metadata' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    
    // Return metadata
    return new Response(JSON.stringify({ metadata }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}); 