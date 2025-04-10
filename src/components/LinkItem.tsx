import React from 'react';
import { Link } from '../services/db.service';
import { Video, Image, File, Link as LinkIcon, Trash2, ExternalLink } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { shareService } from '../services/share.service';
import { Capacitor } from '@capacitor/core';
import LinkThumbnail from './LinkThumbnail';

interface LinkItemProps {
  link: Link;
}

const LinkItem: React.FC<LinkItemProps> = ({ link }) => {
  const { deleteLink } = useAppContext();

  const getIcon = () => {
    switch (link.type) {
      case 'video':
        return <Video className="h-5 w-5 text-linkstash-orange" />;
      case 'image':
        return <Image className="h-5 w-5 text-yellow-400" />;
      case 'file':
        return <File className="h-5 w-5 text-blue-400" />;
      default:
        return <LinkIcon className="h-5 w-5 text-linkstash-pink" />;
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await deleteLink(link.id || 0);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (Capacitor.isNativePlatform()) {
      await shareService.shareUrl(link.url, link.title);
    } else {
      window.open(link.url, '_blank');
    }
  };

  const handleOpen = () => {
    window.open(link.url, '_blank');
  };

  const formattedDate = link.createdAt 
    ? formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })
    : '';

  return (
    <div 
      className="bg-linkstash-purple/60 backdrop-blur-sm rounded-lg overflow-hidden shadow-md cursor-pointer animate-fade-in"
      onClick={handleOpen}
    >
      <div className="flex flex-col">
        <div className="w-full">
          <LinkThumbnail 
            title={link.title || link.url} 
            thumbnail={link.thumbnail}
            favicon={link.favicon}
            className="rounded-none"
          />
        </div>
        <div className="p-3">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 bg-linkstash-purple/80 rounded-md p-2">
              {getIcon()}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="text-white font-medium truncate">
                {link.title || link.url}
              </h3>
              {link.description && (
                <p className="text-white/70 text-sm line-clamp-2 mt-1">
                  {link.description}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <p className="text-white/50 text-xs">
                  {formattedDate}
                </p>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-white/80 hover:text-white hover:bg-linkstash-purple/80"
                    onClick={handleShare}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-white/80 hover:text-red-400 hover:bg-linkstash-purple/80"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkItem;
