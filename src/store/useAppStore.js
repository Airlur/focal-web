import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      // 界面状态
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      darkMode: true, // 默认深色可能更有质感
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      
      // 多语言
      language: 'en', // 'en' | 'zh'
      setLanguage: (lang) => set({ language: lang }),

      // 设置弹窗
      showSettings: false,
      setShowSettings: (show) => set({ showSettings: show }),

      // 视图配置
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      columns: 5,
      setColumns: (cols) => set({ columns: cols }),

      // 导航与数据
      selectedFolder: 'All',
      setSelectedFolder: (folder) => set({ selectedFolder: folder }),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // 排序
      sortBy: 'date', // date, name, size, type
      setSortBy: (sort) => set({ sortBy: sort }),
      sortOrder: 'desc',
      setSortOrder: (order) => set({ sortOrder: order }),

      // 筛选器 (新增)
      filters: {
        type: 'all', // all, image, video
        format: 'all', // all, jpg, png, mp4... (暂留接口)
      },
      setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
      })),
    }),
    {
      name: 'focal-app-storage',
      partialize: (state) => ({ 
        darkMode: state.darkMode,
        language: state.language, // 持久化语言
        viewMode: state.viewMode,
        columns: state.columns,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        sidebarOpen: state.sidebarOpen
      }), 
    }
  )
);