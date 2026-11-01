import React, { useState, useMemo, forwardRef } from 'react';
import { Video, Heart, MoreVertical, FolderPlus, Maximize2, Trash2 } from 'lucide-react';
// 引入现代虚拟滚动库
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

import { useAppStore } from '../../store/useAppStore';
import { useMediaStore } from '../../store/useMediaStore';
import { useFilteredMedia } from '../../hooks/useFilteredMedia';
import MediaCard from '../media/MediaCard';

const formatBytes = (bytes) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
};

const MainContent = ({ onFullscreen }) => {
  const { viewMode, columns, language } = useAppStore();
  const { items, deleteItem, toggleFavorite } = useMediaStore();
  const [contextMenu, setContextMenu] = useState(null);

  // 使用 Hook 获取统一的筛选列表
  const filteredAndSortedItems = useFilteredMedia();

  // --- JS 瀑布流算法 ---
  const masonryColumns = useMemo(() => {
    if (viewMode !== 'masonry') return [];
    
    const cols = Array.from({ length: columns }, () => ({ 
      items: [], 
      height: 0 
    }));

    filteredAndSortedItems.forEach((item) => {
      // 寻找当前高度最小的一列放入图片
      const minCol = cols.reduce((prev, curr) => (curr.height < prev.height ? curr : prev), cols[0]);
      minCol.items.push(item);
      // 累加估算高度
      const aspectRatio = (item.height && item.width) ? item.height / item.width : 1;
      minCol.height += aspectRatio;
    });

    return cols;
  }, [filteredAndSortedItems, columns, viewMode]);

  // 事件处理
  const handleContextMenu = (e, itemId) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, itemId });
  };
  const closeContextMenu = () => setContextMenu(null);
  const handleDelete = (id) => { deleteItem(id); closeContextMenu(); };
  const handleFavorite = (id) => { toggleFavorite(id); closeContextMenu(); };

  // --- Virtuoso 组件配置 ---
  const GridListContainer = useMemo(() => forwardRef(({ style, children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: '1rem',
        padding: '1rem',
      }}
    >
      {children}
    </div>
  )), [columns]);

  const GridItemContainer = useMemo(() => forwardRef(({ children, ...props }, ref) => (
    <div ref={ref} {...props}>{children}</div>
  )), []);

  // components 对象必须 memoize，否则每次渲染都传新引用给 Virtuoso
  const gridComponents = useMemo(() => (
    { List: GridListContainer, Item: GridItemContainer }
  ), [GridListContainer, GridItemContainer]);

  // --- 列表表头组件 (修复对齐问题) ---
  const ListHeader = () => (
    // 这里的 padding-x (px-4) 对应 ListRow 外层的 padding
    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur sticky top-0 z-10 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {/* 对应 ListRow 内部的 flex 结构 */}
      <div className="flex items-center gap-4 px-2"> 
        {/* 缩略图占位 (w-10) 对应 ListRow 中的图片容器宽度 */}
        <div className="w-10 flex-shrink-0"></div> 
        
        {/* Grid 比例调整: 文件名(5), 日期(3), 大小(2), 分辨率(2) */}
        <div className="grid grid-cols-12 gap-4 flex-1 text-left">
          <div className="col-span-5">{language === 'zh' ? '名称' : 'Name'}</div>
          <div className="col-span-3">{language === 'zh' ? '修改日期' : 'Date'}</div>
          <div className="col-span-2 text-right">{language === 'zh' ? '大小' : 'Size'}</div>
          <div className="col-span-2 text-right">{language === 'zh' ? '分辨率' : 'Dim'}</div>
        </div>
      </div>
    </div>
  );

  // 渲染逻辑
  const renderContent = () => {
    if (filteredAndSortedItems.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 select-none">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
             <FolderPlus size={32} />
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">No media found</p>
        </div>
      );
    }

    // --- MASONRY 模式 ---
    if (viewMode === 'masonry') {
      return (
        <div className="h-full overflow-y-auto p-4 scrollbar-hide">
          <div className="flex gap-4 items-start flex-nowrap pb-32">
            {masonryColumns.map((col, colIndex) => (
              <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
                {col.items.map((item) => (
                  <MediaCard 
                    key={item.id} item={item} masonry={true}
                    onClick={() => onFullscreen(item)} onContextMenu={handleContextMenu}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // --- LIST 模式 ---
    if (viewMode === 'list') {
      return (
        <div className="h-full flex flex-col">
          <ListHeader />
          <div className="flex-1">
            <Virtuoso
              // 修复：库从空→非空时 Virtuoso 的可视区测量存在竞态（可能渲染 0 行且滚动也不恢复），
              // 用 key 在空/非空边界强制重挂载，让它在有数据的状态下重新初始化测量。
              key={filteredAndSortedItems.length > 0 ? 'list-has-items' : 'list-empty'}
              style={{ height: '100%' }}
              data={filteredAndSortedItems}
              itemContent={(index, item) => (
                <div className="px-4 py-1" onClick={() => onFullscreen(item)} onContextMenu={(e) => handleContextMenu(e, item.id)}>
                  <div className="flex items-center gap-4 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group border-b border-gray-100 dark:border-gray-800 text-sm">
                     {/* 缩略图：修复视频不显示画面问题，使用 video 标签渲染首帧 */}
                     <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        {item.type === 'image' ? (
                          <img src={item.url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          // 视频缩略图：静音 + 预加载元数据，通常能显示第一帧
                          <video src={item.url} className="w-full h-full object-cover opacity-80" muted preload="metadata" />
                        )}
                     </div>
                     
                     {/* 列表内容：比例与 Header 保持一致 (5:3:2:2) */}
                     <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 font-medium truncate text-gray-800 dark:text-gray-200 flex items-center gap-2" title={item.name}>
                           <span className="truncate">{item.name}</span>
                           {item.isFavorite && <Heart size={12} className="text-red-500 fill-current shrink-0" />}
                        </div>
                        <div className="col-span-3 text-gray-500 truncate">{new Date(item.date).toLocaleDateString()}</div>
                        <div className="col-span-2 font-mono text-gray-500 text-right">{formatBytes(item.size)}</div>
                        <div className="col-span-2 text-gray-400 text-right whitespace-nowrap">{item.width > 0 ? `${item.width}x${item.height}` : '-'}</div>
                     </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      );
    }

    // --- GRID 模式 ---
    return (
      <VirtuosoGrid
        // 修复：同 LIST 模式——空→非空转变时重挂载，规避首次导入 0 卡片的测量竞态
        key={filteredAndSortedItems.length > 0 ? 'grid-has-items' : 'grid-empty'}
        style={{ height: '100%' }}
        data={filteredAndSortedItems}
        computeItemKey={(_, item) => item.id}
        components={gridComponents}
        itemContent={(_, item) => (
          <MediaCard 
            item={item} 
            onClick={() => onFullscreen(item)}
            onContextMenu={handleContextMenu}
          />
        )}
      />
    );
  };

  return (
    <div className="main-area flex-1 relative min-h-0 bg-[#FAFAFA] dark:bg-[#0a0a0a]" onClick={closeContextMenu}>
      {renderContent()}
      
      {/* 底部状态栏 */}
      <div className="glass-chrome fixed bottom-0 right-0 left-64 h-8 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 text-xs text-gray-500 shrink-0 z-10">
          <div>{language === 'zh' ? `${filteredAndSortedItems.length} 项` : `${filteredAndSortedItems.length} items`}</div>
          <div>
            {viewMode === 'masonry'
              ? (language === 'zh' ? '瀑布流' : 'Masonry')
              : viewMode === 'grid'
                ? (language === 'zh' ? '虚拟网格' : 'Virtual Grid')
                : (language === 'zh' ? '虚拟列表' : 'Virtual List')}
            {' • '}{columns} {language === 'zh' ? '列' : 'Cols'}
          </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div className="glass-chrome fixed z-50 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-100 dark:border-gray-700 py-1 w-48 text-sm" style={{ top: contextMenu.y, left: contextMenu.x }} onMouseLeave={closeContextMenu}>
           <button onClick={() => { onFullscreen(items.find(i => i.id === contextMenu.itemId)); closeContextMenu(); }} className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 flex items-center gap-2"><Maximize2 size={14} /> {language === 'zh' ? '打开' : 'Open'}</button>
           <button onClick={() => handleFavorite(contextMenu.itemId)} className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 flex items-center gap-2"><Heart size={14} /> {language === 'zh' ? '收藏' : 'Favorite'}</button>
           <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
           <button onClick={() => handleDelete(contextMenu.itemId)} className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"><Trash2 size={14} /> {language === 'zh' ? '删除' : 'Delete'}</button>
        </div>
      )}
    </div>
  );
};

export default MainContent;