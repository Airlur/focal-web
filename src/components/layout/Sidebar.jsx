import React, { useRef, useMemo } from 'react';
import { Folder, Heart, FilePlus, FolderPlus, Monitor, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useMediaStore } from '../../store/useMediaStore';

// 带删除按钮的 SidebarItem
const SidebarItem = ({ icon, label, active, count, onClick, onDelete }) => (
  <div 
    onClick={onClick}
    className={`
      group flex items-center justify-between px-4 py-2 mx-2 rounded-lg cursor-pointer transition-colors select-none mb-1
      ${active 
        ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400' 
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
    `}
  >
    <div className="flex items-center gap-3 min-w-0">
      {React.isValidElement(icon) ? icon : <Folder size={18} />}
      <span className="text-sm font-medium truncate max-w-[140px]">{label}</span>
    </div>
    <div className="flex items-center">
      {count !== undefined && <span className="text-xs opacity-60 mr-2">{count}</span>}
      {onDelete && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
          title="Remove Source"
        >
          <X size={14} />
        </button>
      )}
    </div>
  </div>
);

const Sidebar = () => {
  const { sidebarOpen, selectedFolder, setSelectedFolder, language } = useAppStore();
  // 引入 removeFolder
  const { items, addItems, removeFolder } = useMediaStore(); 
  
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // 真正的移除源逻辑
  const handleRemoveSource = (folderName) => {
    if(confirm(language === 'zh' ? `确定要移除 "${folderName}" 吗？` : `Remove "${folderName}" from library?`)) {
       removeFolder(folderName);
       // 如果当前正选中这个文件夹，删除后跳转回 'All'
       if (selectedFolder === folderName) {
         setSelectedFolder('All');
       }
    }
  };

  const folders = useMemo(() => {
    return [...new Set(items.map(i => i.folder).filter(f => f !== 'Imported'))];
  }, [items]);

  const processFiles = (fileList, sourceName) => {
    const MAX_FILES = 3000;
    if (fileList.length > MAX_FILES) return alert("Too many files");

    let derivedFolderName = sourceName || 'Imported';
    if (!sourceName && fileList.length > 0 && fileList[0].webkitRelativePath) {
        const parts = fileList[0].webkitRelativePath.split('/');
        if (parts.length > 1) derivedFolderName = parts[0];
    }

    const newItems = Array.from(fileList)
      .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
      .map((f) => ({
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: f.name,
        type: f.type.startsWith('image/') ? 'image' : 'video',
        url: URL.createObjectURL(f),
        folder: derivedFolderName,
        size: f.size,
        date: new Date(f.lastModified).toISOString(),
        width: 0,
        height: 0,
        isFavorite: false,
        meta: {}
      }));

    addItems(newItems);
    
    // 导入后自动选中该文件夹
    if (newItems.length > 0) {
        setSelectedFolder(derivedFolderName);
    }
  };

  const handleImportFile = (e) => processFiles(e.target.files, 'Imported');
  const handleImportFolder = (e) => processFiles(e.target.files, null);

  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden h-full`}>
      <div className="p-4 flex items-center gap-3 flex-shrink-0">
        <img src="/focal-mint-fizz.svg" alt="Logo" className="w-8 h-8 select-none" />
        <div className="font-bold text-xl text-gray-800 dark:text-white tracking-tight select-none">Focal</div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{language === 'zh' ? '库' : 'Library'}</div>
        <SidebarItem icon={<Folder size={18} />} label={language === 'zh' ? '所有媒体' : 'All Media'} active={selectedFolder === 'All'} count={items.length} onClick={() => setSelectedFolder('All')} />
        <SidebarItem icon={<Heart size={18} />} label={language === 'zh' ? '收藏' : 'Favorites'} active={selectedFolder === 'Favorites'} count={items.filter(i => i.isFavorite).length} onClick={() => setSelectedFolder('Favorites')} />
        {items.some(i => i.folder === 'Imported') && (
            <SidebarItem icon={<Monitor size={18} />} label={language === 'zh' ? '已导入' : 'Imported'} active={selectedFolder === 'Imported'} count={items.filter(i => i.folder === 'Imported').length} onClick={() => setSelectedFolder('Imported')} />
        )}
        {folders.length > 0 && (
          <>
            <div className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{language === 'zh' ? '文件夹' : 'Folders'}</div>
            {folders.map(folder => (
              <SidebarItem 
                key={folder}
                icon={<Folder size={18} className="text-yellow-500" />} 
                label={folder} 
                active={selectedFolder === folder} 
                count={items.filter(i => i.folder === folder).length}
                onClick={() => setSelectedFolder(folder)}
                onDelete={() => handleRemoveSource(folder)}
              />
            ))}
          </>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 flex-shrink-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
         <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleImportFile} />
         <input ref={folderInputRef} type="file" webkitdirectory="true" directory="true" multiple className="hidden" onChange={handleImportFolder} />
         <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium shadow-sm">
            <FilePlus size={16} className="text-brand-500" /> <span>{language === 'zh' ? '导入文件' : 'Import Files'}</span>
         </button>
         <button onClick={() => folderInputRef.current?.click()} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all text-sm font-medium shadow-md shadow-brand-500/20 active:scale-[0.98]">
            <FolderPlus size={16} /> <span>{language === 'zh' ? '导入文件夹' : 'Import Folder'}</span>
         </button>
      </div>
    </div>
  );
};

export default Sidebar;