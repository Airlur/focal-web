import React, { useState, useEffect } from 'react';
import { useAppStore, matchShortcut } from './store/useAppStore';
import { useFilteredMedia } from './hooks/useFilteredMedia';

import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import MainContent from './components/layout/MainContent';
import FullscreenViewer from './components/viewer/FullscreenViewer';
import SettingsModal from './components/common/SettingsModal';

export default function App() {
  const { darkMode, appearance, glassIntensity } = useAppStore();
  const filteredItems = useFilteredMedia();
  const [fullscreenItem, setFullscreenItem] = useState(null);

  // 全局快捷键：打开/关闭设置弹窗（默认 Ctrl+,，可在设置中自定义；任何界面可用，含全屏预览）
  useEffect(() => {
    const onKey = (e) => {
      if (matchShortcut(e, useAppStore.getState().shortcuts.settings)) {
        e.preventDefault();
        const { showSettings, setShowSettings } = useAppStore.getState();
        setShowSettings(!showSettings);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className={`app-shell flex h-screen w-full ${darkMode ? 'dark' : ''} ${appearance === 'glass' ? 'app-glass' : ''} bg-white dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden font-sans`}
      data-glass-intensity={glassIntensity}
    >
      {/* 液态玻璃氛围彩色场：真实 DOM 图层，供各玻璃面 blur 取样 */}
      {appearance === 'glass' && <div className="ambient-wash" aria-hidden="true" />}
      <Sidebar />
      <div className="app-content flex-1 flex flex-col h-full overflow-hidden bg-[#FAFAFA] dark:bg-[#0a0a0a] relative">
        <TopBar />
        <MainContent onFullscreen={setFullscreenItem} />
      </div>
      {fullscreenItem && (
        <FullscreenViewer 
           item={fullscreenItem} 
           items={filteredItems} 
           onClose={() => setFullscreenItem(null)}
           onNavigate={setFullscreenItem}
        />
      )}
      {/* 挂载设置弹窗 */}
      <SettingsModal />
    </div>
  );
}