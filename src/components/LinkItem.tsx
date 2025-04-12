import React from 'react';
import { Link } from 'react-router-dom';
import { Video, Image, File, Link as LinkIcon, Trash2, ExternalLink } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { shareService } from '../services/share.service';
import { Capacitor } from '@capacitor/core';
import LinkThumbnail from './LinkThumbnail';
import { Link as LinkType } from '../services/db.service';

interface LinkItemProps {
  link: LinkType;
  onDelete: (id: number) => void;
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
    <div className="group relative bg-white/5 hover:bg-white/10 rounded-lg overflow-hidden transition-colors">
      <Link to={link.url} target="_blank" rel="noopener noreferrer" className="block p-4">
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-3">
            {link.favicon && (
              <img
                src={link.favicon}
                alt=""
                className="w-4 h-4 mt-1 flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{link.title || link.url}</h3>
              {link.description && (
                <p className="text-white/70 text-sm line-clamp-2 mt-1">{link.description}</p>
              )}
            </div>
          </div>
          {link.thumbnail && (
            <div className="mt-3 aspect-video rounded overflow-hidden">
              <img
                src={link.thumbnail}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </Link>
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default LinkItem;
