import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMediaStore } from '../store/useMediaStore';

export const useFilteredMedia = () => {
  const { selectedFolder, searchQuery, sortBy, sortOrder, filters } = useAppStore();
  const { items } = useMediaStore();

  const filteredAndSortedItems = useMemo(() => {
    let res = items;

    // 1. 侧边栏文件夹筛选
    if (selectedFolder === 'Favorites') {
      res = res.filter(i => i.isFavorite);
    } else if (selectedFolder !== 'All') {
      res = res.filter(i => i.folder === selectedFolder);
    }

    // 2. 顶部工具栏筛选器 (Type Filter)
    if (filters.type !== 'all') {
      res = res.filter(i => i.type === filters.type);
    }

    // 3. 搜索 (模糊匹配)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(i => i.name.toLowerCase().includes(q));
    }

    // 4. 排序
    return [...res].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'name') {
         valA = valA.toLowerCase();
         valB = valB.toLowerCase();
      } else if (sortBy === 'date') {
         valA = new Date(valA).getTime();
         valB = new Date(valB).getTime();
      } else if (sortBy === 'size') {
         valA = a.size;
         valB = b.size;
      } else if (sortBy === 'type') {
         valA = a.type; // 'image' or 'video'
         valB = b.type;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, selectedFolder, searchQuery, sortBy, sortOrder, filters]);

  return filteredAndSortedItems;
};