import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 快捷键默认值。组合键记为 "Ctrl+Alt+Shift+Meta+Base" 规范串（Base 单字符小写），
// 纯按键即为 Base 本身（与 KeyboardEvent.key 一致，空格记为 ' '）
export const DEFAULT_SHORTCUTS = {
  prev: 'a',           // 上一个文件
  next: 'd',           // 下一个文件
  seekBackward: 'ArrowLeft',  // 快退（视频，步长见设置）
  seekForward: 'ArrowRight',  // 快进（视频，步长见设置）
  playPause: ' ',      // 播放 / 暂停（视频）
  fullscreen: 'f',     // 网页全屏
  volumeUp: 'ArrowUp',    // 音量 +
  volumeDown: 'ArrowDown', // 音量 -
  close: 'Escape',     // 关闭预览
  delete: 'Delete',    // 删除
  reset: 'r',          // 复位视图
  info: 'i',           // 信息面板
  zoomIn: '+',         // 放大
  zoomOut: '-',        // 缩小
  oneToOne: '1',       // 实际大小
  rotateCcw: 'q',      // 逆时针旋转
  rotateCw: 'e',       // 顺时针旋转
  mirror: 'm',         // 镜像翻转
  slideshow: 'p',      // 幻灯片开关
  search: 'Alt+f',     // 聚焦搜索
  settings: 'k',       // 打开设置
};

// 由键盘事件生成规范组合串（用于匹配与录制）
export const eventToCombo = (e) => {
  const base = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const mods = [];
  if (e.ctrlKey) mods.push('Ctrl');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');
  if (e.metaKey) mods.push('Meta');
  return [...mods, base].join('+');
};

export const matchShortcut = (e, combo) => !!combo && eventToCombo(e) === combo;

const KEY_LABELS = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
  Escape: 'Esc', Delete: 'Del', Enter: 'Enter', Tab: 'Tab', Backspace: '⌫', ',': ',',
};

// 组合键美化显示（"Ctrl+f" → "Ctrl+F"；空格按语言显示 空格/Space）
export const formatKey = (combo, lang = 'zh') => {
  if (!combo) return '-';
  return combo.split('+').map(part => {
    if (['Ctrl', 'Alt', 'Shift', 'Meta'].includes(part)) return part;
    if (part === ' ') return lang === 'zh' ? '空格' : 'Space';
    return KEY_LABELS[part] ?? part.toUpperCase();
  }).join('+');
};

export const useAppStore = create(
  persist(
    (set) => ({
      // 界面状态
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      darkMode: false, // 默认浅色模式
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // 外观风格：classic 经典 | glass 液态玻璃
      appearance: 'classic',
      setAppearance: (mode) => set({ appearance: mode }),
      // 液态玻璃强度：subtle 轻盈 | standard 标准 | strong 浓郁
      glassIntensity: 'subtle',
      setGlassIntensity: (level) => set({ glassIntensity: level }),

      // 幻灯片切换间隔（秒），可在设置中自定义（1-60）
      slideshowInterval: 3,
      setSlideshowInterval: (sec) => set({ slideshowInterval: Math.min(60, Math.max(1, Math.round(Number(sec) || 3))) }),

      // 缩略图质量：low 480 | medium 960 | high 1440（最长边）
      thumbnailQuality: 'medium',
      setThumbnailQuality: (q) => set({ thumbnailQuality: q }),

      // 视频快进/快退步长（秒），可在设置中自定义（1-120）
      seekStep: 5,
      setSeekStep: (sec) => set({ seekStep: Math.min(120, Math.max(1, Math.round(Number(sec) || 5))) }),
      
      // 多语言
      language: 'zh', // 'en' | 'zh'，默认中文
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

      // 预览页快捷键（可在设置-快捷键页自定义）
      shortcuts: { ...DEFAULT_SHORTCUTS },
      setShortcut: (action, key) => set((state) => ({
        shortcuts: { ...state.shortcuts, [action]: key }
      })),
      resetShortcuts: () => set({ shortcuts: { ...DEFAULT_SHORTCUTS } }),
    }),
    {
      name: 'focal-app-storage',
      // 兼容旧持久化数据：补齐新增的快捷键位（否则老用户 search/settings 为 undefined）
      merge: (persistedState, currentState) => {
        const shortcuts = { ...DEFAULT_SHORTCUTS, ...(persistedState?.shortcuts || {}) };
        // 迁移：老默认值升级（空格复位→R；←→切换→A/D；Ctrl+,设置→K）
        if (shortcuts.reset === ' ') shortcuts.reset = DEFAULT_SHORTCUTS.reset;
        if (shortcuts.prev === 'ArrowLeft') shortcuts.prev = DEFAULT_SHORTCUTS.prev;
        if (shortcuts.next === 'ArrowRight') shortcuts.next = DEFAULT_SHORTCUTS.next;
        if (shortcuts.settings === 'Ctrl+,') shortcuts.settings = DEFAULT_SHORTCUTS.settings;
        return { ...currentState, ...persistedState, shortcuts };
      },
      partialize: (state) => ({
        darkMode: state.darkMode,
        language: state.language, // 持久化语言
        appearance: state.appearance, // 外观风格
        glassIntensity: state.glassIntensity, // 玻璃强度
        slideshowInterval: state.slideshowInterval, // 幻灯片间隔
        seekStep: state.seekStep, // 快进/快退步长
        thumbnailQuality: state.thumbnailQuality, // 缩略图质量
        viewMode: state.viewMode,
        columns: state.columns,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        sidebarOpen: state.sidebarOpen,
        shortcuts: state.shortcuts, // 持久化快捷键
      }),
    }
  )
);