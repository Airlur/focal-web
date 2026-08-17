import { create } from 'zustand';

// 管理核心媒体数据
export const useMediaStore = create((set, get) => ({
  items: [],
  
  // 动作：添加媒体文件
  addItems: (newItems) => set((state) => ({ 
    items: [...newItems, ...state.items] 
  })),

  // 动作：删除单个文件
  deleteItem: (id) => set((state) => ({
    items: state.items.filter((i) => i.id !== id)
  })),

  // 动作：移除整个文件夹 (新增)
  removeFolder: (folderName) => set((state) => ({
    items: state.items.filter((i) => i.folder !== folderName)
  })),

  // 动作：切换收藏
  toggleFavorite: (id) => set((state) => ({
    items: state.items.map((i) => 
      i.id === id ? { ...i, isFavorite: !i.isFavorite } : i
    )
  })),

  // 动作：更新文件属性
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((i) => 
      i.id === id ? { ...i, ...updates } : i
    )
  })),

  // 动作：清空所有
  clearAll: () => set({ items: [] }),

  // 获取所有唯一的文件夹列表
  getFolders: () => {
    const items = get().items;
    return [...new Set(items.map(i => i.folder).filter(f => f !== 'Imported'))];
  }
}));