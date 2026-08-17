import React, { useState, useEffect, useRef } from 'react';
import { 
  AlignLeft, Search, X, Grid3X3, LayoutGrid, SlidersHorizontal, List, 
  ArrowUp, ArrowDown, Filter, Settings, Moon, Sun, Languages
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const TopBar = () => {
  const { 
    sidebarOpen, toggleSidebar,
    searchQuery, setSearchQuery,
    viewMode, setViewMode,
    columns, setColumns,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    darkMode, toggleDarkMode,
    language, setLanguage,
    setShowSettings,
    filters, setFilter
  } = useAppStore();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const searchInputRef = useRef(null);

  // 快捷键 Alt+F 聚焦搜索
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sortOptions = [
    { label: language === 'zh' ? '日期' : 'Date', value: 'date' },
    { label: language === 'zh' ? '名称' : 'Name', value: 'name' },
    { label: language === 'zh' ? '大小' : 'Size', value: 'size' },
    { label: language === 'zh' ? '类型' : 'Type', value: 'type' },
  ];

  const handleSortOptionClick = (value) => {
    if (sortBy === value) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(value);
      setSortOrder('desc');
    }
    setShowSortMenu(false);
  };

  const toggleOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 z-20 transition-colors duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={toggleSidebar} 
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
        >
          <AlignLeft size={20} />
        </button>
        
        <div className="relative group max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400 group-focus-within:text-brand-500 transition-colors" />
          </div>
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder={language === 'zh' ? "搜索媒体... (Alt+F)" : "Search media... (Alt+F)"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm rounded-lg pl-10 pr-8 py-2 w-full focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all placeholder-gray-400 dark:placeholder-gray-500"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 列数调整 - 恢复 Tooltip，最大值改为 10 */}
        {viewMode !== 'list' && (
           <div className="hidden md:flex items-center gap-2 px-2 group relative">
             <Grid3X3 size={18} className="text-gray-400" />
             <input 
                type="range" min="2" max="10" step="1" 
                value={columns} 
                onChange={(e) => setColumns(parseInt(e.target.value))}
                className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
             />
             {/* 恢复的 Tooltip */}
             <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
               {columns}
             </div>
           </div>
        )}

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

        {/* 视图切换 */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { id: 'grid', icon: LayoutGrid },
            { id: 'masonry', icon: SlidersHorizontal, className: "rotate-90" },
            { id: 'list', icon: List }
          ].map(mode => (
            <button 
              key={mode.id}
              onClick={() => setViewMode(mode.id)} 
              className={`p-1.5 rounded-md transition-all ${viewMode === mode.id ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              <mode.icon size={18} className={mode.className || ''} />
            </button>
          ))}
        </div>

        {/* 排序下拉 */}
        <div className="relative">
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 font-medium transition-colors"
          >
            {sortOptions.find(o => o.value === sortBy)?.label}
            {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </button>

          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-40 flex flex-col overflow-hidden">
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSortOptionClick(opt.value)}
                    className={`px-4 py-2 text-left text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors ${sortBy === opt.value ? 'text-brand-600 font-medium' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                <button 
                  onClick={toggleOrder}
                  className="px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-between transition-colors w-full"
                >
                  <span>{sortOrder === 'asc' ? (language === 'zh' ? '升序' : 'Ascending') : (language === 'zh' ? '降序' : 'Descending')}</span>
                  {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 筛选下拉 (你的代码逻辑) */}
        <div className="relative">
          <button 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${filters.type !== 'all' ? 'text-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'text-gray-600 dark:text-gray-300'}`}
          >
             <Filter size={18} />
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowFilterMenu(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-40 flex flex-col overflow-hidden text-sm">
                 <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/50">{language === 'zh' ? '类型' : 'Type'}</div>
                 {['all', 'image', 'video'].map(type => {
                  const typeLabels = {
                    all: language === 'zh' ? '全部' : 'All',
                    image: language === 'zh' ? '图片' : 'Image',
                    video: language === 'zh' ? '视频' : 'Video'
                  };
                  return (
                    <button 
                      key={type}
                      onClick={() => { setFilter('type', type); setShowFilterMenu(false); }}
                      className={`px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 w-full ${filters.type === type ? 'text-brand-600 font-medium' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                      {typeLabels[type]}
                    </button>
                  );
                 })}
              </div>
            </>
          )}
        </div>

        {/* 设置按钮 */}
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
        >
           <Settings size={18} />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

        {/* 语言切换 */}
        <button 
          onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-xs w-8 h-8 flex items-center justify-center"
          title="Switch Language"
        >
          {language === 'en' ? 'EN' : '中'}
        </button>

        {/* 主题切换 */}
        <button 
          onClick={toggleDarkMode} 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-yellow-500 dark:text-blue-400 transition-all active:scale-95"
        >
          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </div>
  );
};

export default TopBar;