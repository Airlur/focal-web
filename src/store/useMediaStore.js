import { create } from 'zustand';

// 释放条目占用的 blob URL，防止内存泄漏
const revokeItemUrls = (item) => {
  if (!item) return;
  if (item.url?.startsWith('blob:')) URL.revokeObjectURL(item.url);
  if (item.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(item.thumbUrl);
};

// 管理核心媒体数据
export const useMediaStore = create((set, get) => ({
  items: [],
  
  // 动作：添加媒体文件
  addItems: (newItems) => set((state) => ({ 
    items: [...newItems, ...state.items] 
  })),

  // 动作：删除单个文件
  deleteItem: (id) => set((state) => {
    const target = state.items.find((i) => i.id === id);
    revokeItemUrls(target);
    return { items: state.items.filter((i) => i.id !== id) };
  }),

  // 动作：移除整个文件夹 (新增)
  removeFolder: (folderName) => set((state) => {
    state.items.filter((i) => i.folder === folderName).forEach(revokeItemUrls);
    return { items: state.items.filter((i) => i.folder !== folderName) };
  }),

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

  // 动作：批量更新（导入缩略图时使用，一次 store 更新代替 N 次）
  updateItems: (updates) => set((state) => {
    const byId = new Map(updates.map((u) => [u.id, u.updates]));
    return {
      items: state.items.map((i) => {
        const patch = byId.get(i.id);
        return patch ? { ...i, ...patch } : i;
      })
    };
  }),

  // 动作：清空所有
  clearAll: () => set((state) => {
    state.items.forEach(revokeItemUrls);
    return { items: [] };
  }),

  // 获取所有唯一的文件夹列表
  getFolders: () => {
    const items = get().items;
    return [...new Set(items.map(i => i.folder).filter(f => f !== 'Imported'))];
  }
}));