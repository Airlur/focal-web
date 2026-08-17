import React, { useState } from 'react';
import { X, Command, Monitor, Keyboard, Database } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useMediaStore } from '../../store/useMediaStore';

const SettingsModal = () => {
  const { showSettings, setShowSettings, language } = useAppStore();
  const { clearAll, items } = useMediaStore();
  const [activeTab, setActiveTab] = useState('shortcuts');

  if (!showSettings) return null;

  const tabs = [
    { id: 'shortcuts', label: language === 'zh' ? '快捷键' : 'Shortcuts', icon: Keyboard },
    { id: 'general', label: language === 'zh' ? '常规' : 'General', icon: Monitor },
    { id: 'data', label: language === 'zh' ? '数据' : 'Data', icon: Database },
  ];

  const shortcuts = [
    { keys: ['←', '→'], action: language === 'zh' ? '切换上/下一张' : 'Previous / Next Media' },
    { keys: ['Space'], action: language === 'zh' ? '重置视图' : 'Reset View' },
    { keys: ['Alt', 'F'], action: language === 'zh' ? '聚焦搜索' : 'Focus Search' },
    { keys: ['Delete'], action: language === 'zh' ? '删除媒体' : 'Delete Media' },
    { keys: ['I'], action: language === 'zh' ? '切换信息面板' : 'Toggle Info Panel' },
    { keys: ['Esc'], action: language === 'zh' ? '退出全屏' : 'Exit Fullscreen' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl h-[600px] rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
        
        {/* 左侧导航 */}
        <div className="w-64 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-2">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 px-2">
            {language === 'zh' ? '设置' : 'Settings'}
          </h2>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 flex justify-end border-b border-gray-100 dark:border-gray-800">
            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'shortcuts' && (
              <div>
                <h3 className="text-lg font-medium mb-6 dark:text-white">{language === 'zh' ? '键盘快捷键' : 'Keyboard Shortcuts'}</h3>
                <div className="space-y-4">
                  {shortcuts.map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-600 dark:text-gray-300">{s.action}</span>
                      <div className="flex gap-2">
                        {s.keys.map(k => (
                          <kbd key={k} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-600 dark:text-gray-400 shadow-sm min-w-[2rem] text-center">
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2 dark:text-white">{language === 'zh' ? '缓存管理' : 'Cache Management'}</h3>
                  <p className="text-sm text-gray-500 mb-4">{language === 'zh' ? `当前加载了 ${items.length} 个媒体文件。` : `Currently loaded ${items.length} items.`}</p>
                  <button 
                    onClick={() => { if(confirm('Clear all?')) clearAll(); }}
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm"
                  >
                    {language === 'zh' ? '清空所有数据' : 'Clear All Data'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;