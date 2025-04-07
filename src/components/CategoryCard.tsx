
import React from 'react';
import { Category } from '../services/db.service';
import { useAppContext } from '../contexts/AppContext';
import { Video, Image, File, Link as LinkIcon } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  const { getLinksForCategory } = useAppContext();
  const links = getLinksForCategory(category.id || 0);
  const count = links.length;

  const getIcon = () => {
    switch (category.icon) {
      case 'video':
        return <Video className="h-6 w-6 text-linkstash-orange" />;
      case 'image':
        return <Image className="h-6 w-6 text-yellow-400" />;
      case 'file':
        return <File className="h-6 w-6 text-blue-400" />;
      default:
        return <LinkIcon className="h-6 w-6 text-linkstash-pink" />;
    }
  };

  return (
    <div 
      className="bg-linkstash-purple/70 backdrop-blur-sm rounded-xl p-4 shadow-card cursor-pointer transform transition-transform duration-200 hover:scale-[1.02] active:scale-95"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 bg-linkstash-purple/80 rounded-lg p-2">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-white text-xl font-semibold">{category.name}</h3>
          <p className="text-white/70 text-sm">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;
