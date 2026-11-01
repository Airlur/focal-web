import React, { useState } from 'react';
import { Video, Heart } from 'lucide-react';

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const MediaCard = React.memo(({ item, masonry, onClick, onContextMenu }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    // w-full 撑满 Masonry 传入的 Flex 列宽
    <div className="w-full">
      <div 
        className={`
          glass-soft group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 cursor-pointer
          transition-all duration-200 ring-1 ring-gray-200 dark:ring-gray-800
          ${isHovered ? 'ring-2 ring-brand-500 shadow-lg z-10' : 'shadow-sm'}
          ${masonry ? '' : 'aspect-square'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={(e) => onContextMenu(e, item.id)}
        onClick={onClick}
      >
        <div className={`w-full bg-gray-100 dark:bg-gray-900 relative overflow-hidden flex items-center justify-center ${masonry ? '' : 'h-full'}`}>
            {item.type === 'video' && (
              <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                <Video size={10} /> {item.meta?.duration || 'VID'}
              </div>
            )}
            
            {item.type === 'image' ? (
              item.thumbUrl ? (
                <img 
                  src={item.thumbUrl} 
                  className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`} 
                  alt={item.name} 
                  decoding="async"
                />
              ) : (
                // 缩略图生成前的占位
                <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-800" />
              )
            ) : (
              <video src={item.url} className="w-full h-full object-cover opacity-80" preload="metadata" muted />
            )}
            
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        <div className={`absolute bottom-0 left-0 right-0 p-3 text-white transform transition-transform duration-200 ${isHovered ? 'translate-y-0' : 'translate-y-1'}`}>
          <div className={`flex items-center justify-between mb-1 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            <span className="font-medium text-xs truncate w-3/4 text-shadow-sm">{item.name}</span>
            {item.isFavorite && <Heart size={12} className="text-red-500 fill-current" />}
          </div>
          <div className={`flex justify-between text-[10px] text-gray-300 ${isHovered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 delay-75`}>
            <span>{item.width > 0 ? `${item.width}x${item.height}` : ''}</span>
            <span>{formatBytes(item.size)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default MediaCard;