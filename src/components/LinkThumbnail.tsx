import React from 'react';
import { cn } from '@/lib/utils';

interface LinkThumbnailProps {
  title: string;
  thumbnail?: string;
  favicon?: string;
  className?: string;
}

const LinkThumbnail: React.FC<LinkThumbnailProps> = ({ title, thumbnail, favicon, className }) => {
  // Function to truncate long titles
  const truncateTitle = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (thumbnail) {
    return (
      <div className={cn("relative aspect-video rounded-lg overflow-hidden", className)}>
        <img
          src={thumbnail}
          alt={truncateTitle(title)}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, replace with title-based thumbnail
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement!;
            parent.classList.add('bg-gradient-main');
            parent.classList.add('flex');
            parent.classList.add('items-center');
            parent.classList.add('justify-center');
            parent.classList.add('p-4');
            parent.classList.add('text-center');
            parent.innerHTML = `
              <div class="text-white text-lg font-medium line-clamp-3">${truncateTitle(title)}</div>
            `;
          }}
        />
      </div>
    );
  }

  // Title-based thumbnail
  return (
    <div className={cn(
      "aspect-video rounded-lg bg-gradient-main flex items-center justify-center p-4",
      className
    )}>
      <div className="text-white text-lg font-medium line-clamp-3 text-center">
        {truncateTitle(title)}
      </div>
    </div>
  );
};

export default LinkThumbnail; 