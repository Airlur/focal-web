import React, { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { useFilteredMedia } from './hooks/useFilteredMedia';

import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import MainContent from './components/layout/MainContent';
import FullscreenViewer from './components/viewer/FullscreenViewer';
import SettingsModal from './components/common/SettingsModal';

export default function App() {
  const { darkMode } = useAppStore();
  const filteredItems = useFilteredMedia();
  const [fullscreenItem, setFullscreenItem] = useState(null);

  return (
    <div className={`flex h-screen w-full ${darkMode ? 'dark' : ''} bg-white dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden font-sans`}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFAFA] dark:bg-[#0a0a0a] relative">
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