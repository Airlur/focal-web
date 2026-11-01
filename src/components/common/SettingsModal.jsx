import React, { useState, useEffect } from 'react';
import { X, Command, Monitor, Keyboard, Database, Moon, Sun, Languages, LayoutGrid, ArrowUpDown, RotateCcw, Palette, Sparkles } from 'lucide-react';
import { useAppStore, eventToCombo, formatKey } from '../../store/useAppStore';
import { useMediaStore } from '../../store/useMediaStore';
import { regenerateAllThumbnails } from '../../utils/thumbnails';

// 可自定义的快捷键动作（预览页 + 全局）
const SHORTCUT_ACTIONS = [
  { id: 'prev', zh: '上一个文件', en: 'Previous Media' },
  { id: 'next', zh: '下一个文件', en: 'Next Media' },
  { id: 'seekBackward', zh: '快退（视频）', en: 'Seek Backward' },
  { id: 'seekForward', zh: '快进（视频）', en: 'Seek Forward' },
  { id: 'playPause', zh: '播放 / 暂停（视频）', en: 'Play / Pause' },
  { id: 'volumeUp', zh: '音量 +（视频）', en: 'Volume Up' },
  { id: 'volumeDown', zh: '音量 −（视频）', en: 'Volume Down' },
  { id: 'fullscreen', zh: '网页全屏', en: 'Fullscreen' },
  { id: 'close', zh: '关闭预览', en: 'Close Viewer' },
  { id: 'reset', zh: '复位视图', en: 'Reset View' },
  { id: 'zoomIn', zh: '放大', en: 'Zoom In' },
  { id: 'zoomOut', zh: '缩小', en: 'Zoom Out' },
  { id: 'oneToOne', zh: '实际大小', en: 'Actual Size' },
  { id: 'rotateCcw', zh: '逆时针旋转', en: 'Rotate Left' },
  { id: 'rotateCw', zh: '顺时针旋转', en: 'Rotate Right' },
  { id: 'mirror', zh: '镜像翻转', en: 'Mirror' },
  { id: 'slideshow', zh: '幻灯片开关', en: 'Toggle Slideshow' },
  { id: 'info', zh: '信息面板', en: 'Info Panel' },
  { id: 'delete', zh: '删除媒体', en: 'Delete Media' },
  { id: 'search', zh: '聚焦搜索', en: 'Focus Search' },
  { id: 'settings', zh: '打开设置', en: 'Open Settings' },
];

const SettingsModal = () => {
  const {
    showSettings, setShowSettings, language, setLanguage,
    darkMode, toggleDarkMode,
    appearance, setAppearance, glassIntensity, setGlassIntensity,
    slideshowInterval, setSlideshowInterval, thumbnailQuality, setThumbnailQuality,
    seekStep, setSeekStep,
    viewMode, setViewMode,
    sortBy, setSortBy, sortOrder, setSortOrder,
    shortcuts, setShortcut, resetShortcuts,
  } = useAppStore();
  const { clearAll, items } = useMediaStore();
  const [activeTab, setActiveTab] = useState('general');
  const [recording, setRecording] = useState(null); // 正在录制的动作 id
  const [conflict, setConflict] = useState(null);   // 冲突提示文本

  const t = (zh, en) => (language === 'zh' ? zh : en);

  // Esc 关闭设置弹窗（录制改键时由录制监听优先拦截）
  useEffect(() => {
    if (!showSettings) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.metaKey) setShowSettings(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings, setShowSettings]);

  // 录制模式：捕获下一次按键（支持组合键）写入 store；Esc 取消；冲突则提示不保存
  useEffect(() => {
    if (!recording) return;
    const onKey = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.metaKey) { setRecording(null); return; }
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return; // 忽略单独的修饰键
      const combo = eventToCombo(e);
      const owner = Object.entries(shortcuts).find(([act, k]) => k === combo && act !== recording);
      if (owner) {
        const ownerLabel = SHORTCUT_ACTIONS.find(a => a.id === owner[0]);
        setConflict(t(`「${formatKey(combo, language)}」已被「${ownerLabel.zh}」占用，请换一个按键`, `"${formatKey(combo, language)}" is already used by "${ownerLabel.en}"`));
        setTimeout(() => setConflict(null), 3000);
        setRecording(null);
        return;
      }
      setShortcut(recording, combo);
      setRecording(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [recording, shortcuts, language]);

  if (!showSettings) return null;

  const tabs = [
    { id: 'general', label: t('常规', 'General'), icon: Monitor },
    { id: 'shortcuts', label: t('快捷键', 'Shortcuts'), icon: Keyboard },
    { id: 'data', label: t('数据', 'Data'), icon: Database },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-chrome glass-strong bg-white dark:bg-gray-900 w-full max-w-3xl h-[600px] rounded-2xl shadow-2xl flex overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
        
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
            {activeTab === 'general' && (
              <div className="space-y-8 max-w-md">
                <div>
                  <h3 className="text-lg font-medium mb-6 dark:text-white">{t('常规设置', 'General')}</h3>

                  {/* 外观风格：经典 / 液态玻璃 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Palette size={18} />
                      <span className="text-sm">{t('外观风格', 'Appearance')}</span>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      {[
                        { v: 'classic', label: t('经典', 'Classic') },
                        { v: 'glass', label: t('液态玻璃', 'Liquid Glass') },
                      ].map(({ v, label }) => (
                        <button
                          key={v}
                          onClick={() => setAppearance(v)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            appearance === v ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 玻璃强度（仅液态玻璃模式下显示） */}
                  {appearance === 'glass' && (
                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Sparkles size={18} />
                        <span className="text-sm">{t('玻璃强度', 'Glass Intensity')}</span>
                      </div>
                      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        {[
                          { v: 'subtle', label: t('轻盈', 'Subtle') },
                          { v: 'standard', label: t('标准', 'Standard') },
                          { v: 'strong', label: t('浓郁', 'Bold') },
                        ].map(({ v, label }) => (
                          <button
                            key={v}
                            onClick={() => setGlassIntensity(v)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              glassIntensity === v ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 缩略图质量 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Sparkles size={18} />
                      <span className="text-sm">{t('缩略图质量', 'Thumbnail Quality')}</span>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      {[
                        { v: 'low', label: t('低', 'Low'), tip: t('480px：最省内存，小卡片足够', '480px: lightest on memory, fine for small cards') },
                        { v: 'medium', label: t('中', 'Medium'), tip: t('960px：推荐，均衡清晰与内存', '960px: recommended balance') },
                        { v: 'high', label: t('高', 'High'), tip: t('1440px：大卡片/高分屏最清晰，内存占用更高', '1440px: sharpest for large cards / hi-dpi, more memory') },
                      ].map(({ v, label, tip }) => (
                        <button
                          key={v}
                          data-tip={tip}
                          onClick={() => { setThumbnailQuality(v); regenerateAllThumbnails(); }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            thumbnailQuality === v ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 快进步长 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Sparkles size={18} />
                      <span className="text-sm">{t('快进步长', 'Seek Step')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        {[1, 5, 10, 30].map(sec => (
                          <button
                            key={sec}
                            onClick={() => setSeekStep(sec)}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              seekStep === sec ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            {sec}{t('秒', 's')}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={seekStep}
                          onChange={(e) => setSeekStep(e.target.value)}
                          className="w-14 px-2 py-1.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500/50"
                        />
                        <span className="text-xs text-gray-400">{t('秒', 's')}</span>
                      </div>
                    </div>
                  </div>

                  {/* 幻灯片间隔 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Sparkles size={18} />
                      <span className="text-sm">{t('幻灯片间隔', 'Slideshow Interval')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        {[1, 3, 5, 8].map(sec => (
                          <button
                            key={sec}
                            onClick={() => setSlideshowInterval(sec)}
                            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              slideshowInterval === sec ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            {sec}{t('秒', 's')}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={slideshowInterval}
                          onChange={(e) => setSlideshowInterval(e.target.value)}
                          className="w-14 px-2 py-1.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-brand-500/50"
                        />
                        <span className="text-xs text-gray-400">{t('秒', 's')}</span>
                      </div>
                    </div>
                  </div>

                  {/* 主题模式 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                      <span className="text-sm">{t('主题模式', 'Theme')}</span>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      {[{ v: false, label: t('浅色', 'Light'), Icon: Sun }, { v: true, label: t('深色', 'Dark'), Icon: Moon }].map(({ v, label, Icon }) => (
                        <button
                          key={label}
                          onClick={() => { if (darkMode !== v) toggleDarkMode(); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            darkMode === v ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          <Icon size={14} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 界面语言 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <Languages size={18} />
                      <span className="text-sm">{t('界面语言', 'Language')}</span>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      {[{ v: 'zh', label: '中文' }, { v: 'en', label: 'English' }].map(({ v, label }) => (
                        <button
                          key={v}
                          onClick={() => { if (language !== v) setLanguage(v); }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            language === v ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 默认视图模式 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <LayoutGrid size={18} />
                      <span className="text-sm">{t('视图模式', 'View Mode')}</span>
                    </div>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      {[
                        { v: 'grid', label: t('网格', 'Grid') },
                        { v: 'masonry', label: t('瀑布流', 'Masonry') },
                        { v: 'list', label: t('列表', 'List') },
                      ].map(({ v, label }) => (
                        <button
                          key={v}
                          onClick={() => setViewMode(v)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            viewMode === v ? 'bg-white dark:bg-gray-700 shadow text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 默认排序 */}
                  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <ArrowUpDown size={18} />
                      <span className="text-sm">{t('排序方式', 'Sort By')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-xs bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1.5 text-gray-600 dark:text-gray-300 border-none outline-none cursor-pointer"
                      >
                        <option value="date">{t('日期', 'Date')}</option>
                        <option value="name">{t('名称', 'Name')}</option>
                        <option value="size">{t('大小', 'Size')}</option>
                        <option value="type">{t('类型', 'Type')}</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="text-xs bg-gray-100 dark:bg-gray-800 rounded-md px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {sortOrder === 'asc' ? t('升序 ↑', 'Asc ↑') : t('降序 ↓', 'Desc ↓')}
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 -mt-4">{t('以上设置即时生效并自动保存。切换缩略图质量会自动重建当前库内所有图片的缩略图，新导入的图片也按该档位生成。', 'Changes apply instantly and persist. Changing thumbnail quality rebuilds all thumbnails in the current library; new imports use the same level.')}</p>
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="max-w-md">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium dark:text-white">{t('键盘快捷键', 'Keyboard Shortcuts')}</h3>
                  <button
                    onClick={() => { setRecording(null); resetShortcuts(); }}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
                  >
                    <RotateCcw size={13} /> {t('恢复默认', 'Reset to Default')}
                  </button>
                </div>

                {conflict && (
                  <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                    {conflict}
                  </div>
                )}

                <div className="space-y-1">
                  {SHORTCUT_ACTIONS.map(a => (
                    <div key={a.id} className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-sm text-gray-600 dark:text-gray-300">{t(a.zh, a.en)}</span>
                      <button
                        onClick={() => setRecording(recording === a.id ? null : a.id)}
                        className={`px-2 py-1 rounded-md border text-xs font-mono shadow-sm min-w-[5rem] text-center transition-colors ${
                          recording === a.id
                            ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-400 text-brand-600 dark:text-brand-400 animate-pulse'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400'
                        }`}
                      >
                        {recording === a.id ? t('按下新按键…', 'Press a key…') : formatKey(shortcuts[a.id], language)}
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs text-gray-400 leading-relaxed">
                  {t(
                    '点击右侧按键进行修改，支持组合键（如 Ctrl+Q），按 Esc 取消录制。所有快捷键均无占用冲突时生效。',
                    'Click a key binding to change it — modifier combos (e.g. Ctrl+Q) are supported. Press Esc to cancel. All shortcuts are conflict-checked.'
                  )}
                </p>
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