import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, Image, File, Link as LinkIcon, Trash2, ExternalLink, Share2, Edit } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { shareService } from '../services/share.service';
import { Capacitor } from '@capacitor/core';
import LinkThumbnail from './LinkThumbnail';
import { Link as LinkType } from '../services/data.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditLinkForm from './EditLinkForm';
import './LinkItem.css';

interface LinkItemProps {
  link: LinkType;
  onDelete: (id: number) => void;
}

// Predefined gradient colors
const gradients = [
  'from-blue-500 to-purple-600',
  'from-green-400 to-cyan-500',
  'from-yellow-400 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500',
  'from-red-500 to-orange-500',
  'from-teal-400 to-emerald-500',
  'from-fuchsia-500 to-purple-600',
  'from-amber-400 to-yellow-500',
  'from-cyan-500 to-sky-500',
];

const LinkItem: React.FC<LinkItemProps> = ({ link }) => {
  const { deleteLink } = useAppContext();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const titleRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLHeadingElement>(null);
  
  // Check if title needs scrolling
  useEffect(() => {
    if (titleRef.current && containerRef.current) {
      const isOverflowing = titleRef.current.offsetWidth > containerRef.current.offsetWidth;
      if (isOverflowing) {
        titleRef.current.setAttribute('data-scrollable', 'true');
      } else {
        titleRef.current.removeAttribute('data-scrollable');
      }
    }
  }, [link.title, link.url]);
  
  // Generate a consistent gradient based on link URL
  const gradientClass = useMemo(() => {
    // Use the link id or a hash of the URL to select a consistent gradient
    const index = (link.id || link.url.length) % gradients.length;
    return gradients[index];
  }, [link.id, link.url]);

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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditDialogOpen(true);
  };

  const handleOpen = () => {
    window.open(link.url, '_blank');
  };

  const formattedDate = link.created_at 
    ? formatDistanceToNow(new Date(link.created_at), { addSuffix: true })
    : '';

  return (
    <>
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
                <h3 ref={containerRef} className="text-white font-medium scrolling-title-container">
                  <span ref={titleRef} className="scrolling-title">{link.title || link.url}</span>
                </h3>
                {link.description && (
                  <p className="text-white/70 text-sm line-clamp-2 mt-1">{link.description}</p>
                )}
              </div>
            </div>
            
            <div className="mt-3 aspect-video rounded overflow-hidden">
              {link.thumbnail ? (
                <img
                  src={link.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentNode as HTMLElement;
                    parent.classList.add(`bg-gradient-to-br`, gradientClass);
                    parent.innerHTML = `<div class="flex items-center justify-center h-full p-4 text-white text-center font-medium">${link.title || link.url}</div>`;
                  }}
                />
              ) : (
                <div className={`bg-gradient-to-br ${gradientClass} w-full h-full flex items-center justify-center p-4`}>
                  <p className="text-white text-center font-medium line-clamp-3">{link.title || link.url}</p>
                </div>
              )}
            </div>
          </div>
        </Link>
        
        <div className="flex justify-center space-x-2 pb-3 pt-1">
          {/* Edit button */}
          <div className="p-2 bg-white/10 hover:bg-blue-500/80 text-white rounded-lg transition-all duration-200 backdrop-blur-sm shadow-sm hover:shadow-blue-500/25 hover:scale-105">
            <button onClick={handleEdit} className="flex items-center justify-center">
              <Edit className="w-4 h-4" />
            </button>
          </div>
          {/* Share button */}
          <div className="p-2 bg-white/10 hover:bg-green-500/80 text-white rounded-lg transition-all duration-200 backdrop-blur-sm shadow-sm hover:shadow-green-500/25 hover:scale-105">
            <button onClick={handleShare} className="flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          {/* Delete button */}
          <div className="p-2 bg-white/10 hover:bg-red-500/80 text-white rounded-lg transition-all duration-200 backdrop-blur-sm shadow-sm hover:shadow-red-500/25 hover:scale-105">
            <button onClick={handleDelete} className="flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-gradient-main border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Edit Link</DialogTitle>
          </DialogHeader>
          <EditLinkForm 
            link={link}
            onClose={() => setEditDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LinkItem;
