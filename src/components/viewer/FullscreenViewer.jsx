import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Info, ChevronLeft, ChevronRight, ZoomOut, ZoomIn, RotateCw,
  Heart, Move, Copy, Download, Trash2, X, Folder, FlipHorizontal, RotateCcw,
  Camera, Aperture, Clock, Gauge
} from 'lucide-react';
import exifr from 'exifr';
import { useMediaStore } from '../../store/useMediaStore';
import { useAppStore } from '../../store/useAppStore';

const formatBytes = (bytes) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
};

// 格式化时长为 MM:SS
const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// 多语言文本字典
const TEXT = {
  en: {
    info: 'Info', fileName: 'File Name', resolution: 'Resolution', size: 'Size', dateModified: 'Date Modified', folderPath: 'Folder Path',
    exifData: 'EXIF Data', camera: 'Camera', aperture: 'Aperture', iso: 'ISO', shutter: 'Shutter', lens: 'Lens', videoInfo: 'Video Info', duration: 'Duration', type: 'Format'
  },
  zh: {
    info: '信息', fileName: '文件名', resolution: '分辨率', size: '大小', dateModified: '修改日期', folderPath: '文件夹路径',
    exifData: 'EXIF 信息', camera: '相机', aperture: '光圈', iso: 'ISO', shutter: '快门', lens: '镜头', videoInfo: '视频信息', duration: '时长', type: '格式'
  }
};

const FullscreenViewer = ({ item, items, onClose, onNavigate }) => {
  const [showInfo, setShowInfo] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const { deleteItem, toggleFavorite, updateItem } = useMediaStore();
  const { language } = useAppStore();
  const t = TEXT[language] || TEXT.en;

  // 关键修复：从 items 列表中实时获取最新的 item 对象
  // 这样当 Exif 或视频元数据解析完成更新 Store 后，组件能立即响应并显示
  const currentItem = items.find(i => i.id === item.id) || item;

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlip(false);
    setOffset({ x: 0, y: 0 });
  };

  // --- Task 5: 核心逻辑 - 元数据解析 ---
  
  // 1. 图片 Exif 解析
  useEffect(() => {
    // 如果是图片且尚未解析过 Exif
    if (currentItem.type === 'image' && !currentItem.meta?.parsed) {
      // 修复：使用全量解析，不传 specific filters，以兼容更多设备（如 Huawei P60）
      exifr.parse(currentItem.url).then(output => {
        updateItem(currentItem.id, {
          meta: {
            ...currentItem.meta,
            parsed: true,
            // 优先组合厂商(Make)和型号(Model)
            camera: output?.Make && output?.Model ? `${output.Make} ${output.Model}` : (output?.Model || 'Unknown'),
            lens: output?.LensModel || '',
            iso: output?.ISO,
            f: output?.FNumber,
            // 格式化快门速度，如果小于1秒显示为分数 (1/xx)
            exposure: output?.ExposureTime ? (output.ExposureTime >= 1 ? output.ExposureTime : `1/${Math.round(1/output.ExposureTime)}`) : '',
            date: output?.DateTimeOriginal || currentItem.date
          }
        });
      }).catch(err => {
        // 解析失败也标记为已处理，避免死循环重复解析
        // console.warn("Exif parse warning:", err); // 可选：关闭警告
        updateItem(currentItem.id, { meta: { ...currentItem.meta, parsed: true, camera: 'No Exif' } });
      });
    }
  }, [currentItem.id, currentItem.type, currentItem.meta?.parsed, updateItem]); 

  // 2. 视频元数据加载回调 (从 Video 标签获取)
  const handleVideoMetadata = (e) => {
    const v = e.target;
    // 获取文件后缀名作为格式显示 (如 MP4, MKV)
    const ext = currentItem.name.split('.').pop().toUpperCase();
    
    // 修复：放宽判断条件，只要是视频就尝试更新，确保分辨率和时长被捕获
    // 这样可以解决第一次打开不显示信息的问题
    updateItem(currentItem.id, {
      width: v.videoWidth,
      height: v.videoHeight,
      meta: {
        ...currentItem.meta,
        duration: formatDuration(v.duration), 
        codec: ext || 'VIDEO' 
      }
    });
  };

  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        switch(key) {
          case 'arrowright': handleNavigate('next'); break;
          case 'arrowleft': handleNavigate('prev'); break;
          case 'escape': onClose(); break;
          case 'delete': handleDelete(); break;
          case ' ': e.preventDefault(); handleReset(); break; // 空格复原
          case 'i': setShowInfo(prev => !prev); break; // I键开关信息
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, items, onClose, deleteItem]);

  useEffect(() => { handleReset(); }, [item.id]);

  const handleDelete = () => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    if (items.length > 1) {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) nextIndex = currentIndex - 1;
        onNavigate(items[nextIndex]);
        deleteItem(item.id);
    } else {
        deleteItem(item.id);
        onClose();
    }
  };

  const handleNavigate = (direction) => {
    const currentIndex = items.findIndex(i => i.id === item.id);
    if (currentIndex === -1) return;
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= items.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = items.length - 1;
    onNavigate(items[nextIndex]);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 5));
  };

  useEffect(() => {
    const node = containerRef.current;
    if (node) node.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (node) node.removeEventListener('wheel', handleWheel); };
  }, []);

  const isImg = currentItem.type === 'image';

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none outline-none overflow-hidden" tabIndex={-1} autoFocus ref={containerRef}>
      {/* 导航箭头 (Fixed定位) */}
      <button onClick={(e) => { e.stopPropagation(); handleNavigate('prev'); }} className="fixed left-4 top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all outline-none z-[60]"><ChevronLeft size={40} /></button>
      <button onClick={(e) => { e.stopPropagation(); handleNavigate('next'); }} className="fixed right-4 top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all outline-none z-[60]"><ChevronRight size={40} /></button>

      <div className="absolute inset-0 flex">
        {/* 主展示区 */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black" onClick={() => handleReset()}>
          {isImg ? (
             <div className="relative transition-transform duration-200 ease-out origin-center" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flip ? -1 : 1})` }} onClick={(e) => e.stopPropagation()}>
               <img src={currentItem.url} className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl cursor-grab active:cursor-grabbing" draggable={false} alt={currentItem.name} />
             </div>
          ) : (
             <video 
                src={currentItem.url} 
                controls 
                autoPlay 
                className="max-w-[90%] max-h-[90%] shadow-2xl outline-none" 
                onClick={(e) => e.stopPropagation()}
                onLoadedMetadata={handleVideoMetadata} // 核心：加载元数据
             />
          )}
        </div>

        {/* 右侧信息面板 */}
        <div className={`absolute right-0 top-0 bottom-0 w-80 bg-[#111]/95 backdrop-blur-md border-l border-white/10 flex flex-col z-[70] transition-transform duration-300 ease-in-out ${showInfo ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}>
           <div className="p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
              <h4 className="text-white font-semibold">{t.info}</h4>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-5 text-sm space-y-6 text-gray-300">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.fileName}</label>
                 <div className="text-white break-words select-text font-mono text-xs">{currentItem.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.resolution}</label>
                    <div className="text-white font-mono">{currentItem.width > 0 ? `${currentItem.width} × ${currentItem.height}` : '-'}</div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.size}</label>
                    <div className="text-white font-mono">{formatBytes(currentItem.size)}</div>
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.dateModified}</label>
                 <div className="text-white">{new Date(currentItem.date).toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.folderPath}</label>
                 <div className="text-white flex items-center gap-2 break-all text-xs">
                    <Folder size={14} className="text-brand-500 shrink-0" />
                    {currentItem.folder}
                 </div>
              </div>

              {/* 真实 Exif 数据展示 */}
              {isImg && currentItem.meta?.parsed && (
                 <div className="pt-4 border-t border-white/10 space-y-4">
                    <label className="text-xs font-bold text-brand-500 uppercase tracking-wider block">{t.exifData}</label>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                      <div className="col-span-2">
                         <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Camera size={12} /> {t.camera}</div>
                         <div className="text-white truncate" title={currentItem.meta.camera}>{currentItem.meta.camera}</div>
                      </div>
                      <div><div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Aperture size={12} /> {t.aperture}</div><div className="text-white">{currentItem.meta.f ? `f/${currentItem.meta.f}` : '-'}</div></div>
                      <div><div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Gauge size={12} /> {t.iso}</div><div className="text-white">{currentItem.meta.iso || '-'}</div></div>
                      <div><div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Clock size={12} /> {t.shutter}</div><div className="text-white">{currentItem.meta.exposure ? `${currentItem.meta.exposure}s` : '-'}</div></div>
                    </div>
                    
                    {currentItem.meta.lens && (
                      <div>
                         <div className="text-xs text-gray-500 mb-1">{t.lens}</div>
                         <div className="text-white text-xs">{currentItem.meta.lens}</div>
                      </div>
                    )}
                 </div>
              )}

              {/* 视频信息 */}
              {!isImg && (
                 <div className="pt-4 border-t border-white/10 space-y-3">
                    <label className="text-xs font-bold text-brand-500 uppercase tracking-wider block">{t.videoInfo}</label>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{t.duration}</span> 
                      <span className="text-white font-mono">{currentItem.meta?.duration || '00:00'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{t.type}</span>
                      <span className="text-white font-mono">{currentItem.meta?.codec || 'VIDEO'}</span>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-[60] pointer-events-none">
         <button onClick={onClose} className="pointer-events-auto text-white/80 hover:text-white p-2 rounded-full bg-black/20 hover:bg-white/10 backdrop-blur-sm transition-colors"><ArrowLeft size={24} /></button>
         <div className="flex items-center gap-2 pointer-events-auto">
             {isImg && (
               <div className="flex bg-black/40 backdrop-blur-md rounded-lg p-1 text-white/80 mr-4 border border-white/10">
                 <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-white/20 rounded tooltip"><ZoomOut size={18} /></button>
                 <span className="px-2 text-xs flex items-center font-mono w-10 justify-center">{Math.round(zoom * 100)}%</span>
                 <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} className="p-1.5 hover:bg-white/20 rounded tooltip"><ZoomIn size={18} /></button>
                 <div className="w-px h-4 bg-white/20 mx-1 my-auto"></div>
                 <button onClick={() => setRotation(r => r + 90)} className="p-1.5 hover:bg-white/20 rounded tooltip"><RotateCw size={18} /></button>
                 <button onClick={() => setFlip(f => !f)} className={`p-1.5 hover:bg-white/20 rounded tooltip ${flip ? 'text-brand-400' : ''}`} title="Mirror"><FlipHorizontal size={18} /></button>
                 <div className="w-px h-4 bg-white/20 mx-1 my-auto"></div>
                 <button onClick={handleReset} className="p-1.5 hover:bg-white/20 rounded tooltip"><RotateCcw size={18} /></button>
               </div>
             )}
             <button onClick={() => setShowInfo(!showInfo)} className={`pointer-events-auto text-white p-2 rounded-full transition-colors ${showInfo ? 'bg-white/20' : 'hover:bg-white/10'}`}><Info size={24} /></button>
         </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/70 backdrop-blur-md rounded-full flex items-center gap-6 border border-white/10 shadow-2xl z-[60] opacity-0 hover:opacity-100 transition-all duration-300 translate-y-4 hover:translate-y-0 pointer-events-auto">
         <button onClick={() => toggleFavorite(item.id)} className={`${item.isFavorite ? 'text-red-500' : 'text-white/80'} hover:scale-110 transition hover:text-white`}><Heart size={20} className={item.isFavorite ? 'fill-current' : ''} /></button>
         <div className="w-px h-4 bg-white/20"></div>
         <button className="text-white/80 hover:text-brand-400 transition"><Move size={20} /></button>
         <button className="text-white/80 hover:text-brand-400 transition"><Copy size={20} /></button>
         <button className="text-white/80 hover:text-green-400 transition"><Download size={20} /></button>
         <div className="w-px h-4 bg-white/20"></div>
         <button onClick={() => { deleteItem(item.id); onClose(); }} className="text-white/80 hover:text-red-500 transition"><Trash2 size={20} /></button>
      </div>
    </div>
  );
};

export default FullscreenViewer;