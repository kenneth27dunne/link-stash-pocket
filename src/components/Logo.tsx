
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-linkstash-purple via-linkstash-pink to-linkstash-orange rounded-full opacity-80"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
          {size === 'sm' ? (
            <span className="text-lg">LC</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </div>
      </div>
      {size !== 'sm' && (
        <span className="text-white text-xl font-bold">LC</span>
      )}
    </div>
  );
};

export default Logo;
