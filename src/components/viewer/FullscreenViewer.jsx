import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Info, ChevronLeft, ChevronRight, ZoomOut, ZoomIn,
  RotateCw, RotateCcw, FlipHorizontal, RefreshCw, Maximize, Play, Pause,
  X, Folder,
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
    exifData: 'EXIF Data', camera: 'Camera', aperture: 'Aperture', iso: 'ISO', shutter: 'Shutter', lens: 'Lens', videoInfo: 'Video Info', duration: 'Duration', type: 'Format',
    zoomIn: 'Zoom In', zoomOut: 'Zoom Out', rotateCw: 'Rotate Clockwise', rotateCcw: 'Rotate Counterclockwise',
    mirror: 'Mirror', reset: 'Reset View', oneToOne: 'Actual Size (100%)',
    playSlideshow: 'Play Slideshow', pauseSlideshow: 'Pause Slideshow',
    prev: 'Previous', next: 'Next', back: 'Back'
  },
  zh: {
    info: '信息', fileName: '文件名', resolution: '分辨率', size: '大小', dateModified: '修改日期', folderPath: '文件夹路径',
    exifData: 'EXIF 信息', camera: '相机', aperture: '光圈', iso: 'ISO', shutter: '快门', lens: '镜头', videoInfo: '视频信息', duration: '时长', type: '格式',
    zoomIn: '放大', zoomOut: '缩小', rotateCw: '顺时针旋转', rotateCcw: '逆时针旋转',
    mirror: '镜像翻转', reset: '复位视图', oneToOne: '实际大小 (100%)',
    playSlideshow: '播放幻灯片', pauseSlideshow: '暂停幻灯片',
    prev: '上一张', next: '下一张', back: '返回'
  }
};

const FullscreenViewer = ({ item, items, onClose, onNavigate }) => {
  const [showInfo, setShowInfo] = useState(false); // 默认不自动打开信息面板
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // 适应窗口的缩放比例：zoom=1 时图片显示宽度占原始像素的比例。
  // 百分比按"相对原始像素"展示（1:1 时正好 100%），大图适应窗口时会显示如 25%
  const [fitScale, setFitScale] = useState(1);

  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const dragRef = useRef(null); // { startX, startY, baseX, baseY }
  const { deleteItem, updateItem } = useMediaStore();
  const { language, shortcuts } = useAppStore();
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

  // 计算 fitScale：img 受 max-w-[90vw]/max-h-[90vh] 约束后的显示宽度 ÷ 原始宽度
  const computeFitScale = () => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return 1;
    const w = img.naturalWidth, h = img.naturalHeight;
    const fitW = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9 * (w / h), w);
    return fitW / w;
  };
  // 图片加载完成 / 窗口尺寸变化时重算
  useEffect(() => {
    const onResize = () => setFitScale(computeFitScale());
    window.addEventListener('resize', onResize);
    const img = imgRef.current;
    if (img?.complete) onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [currentItem.id, currentItem.type]);

  // --- 拖拽平移 ---
  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.baseX + e.clientX - dragRef.current.startX,
      y: dragRef.current.baseY + e.clientY - dragRef.current.startY,
    });
  };
  const handlePointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  // 实际大小 (100%)：切到 1:1 像素；已是 1:1 时再点恢复适应窗口
  const handleOneToOne = () => {
    if (Math.abs(zoom * fitScale - 1) < 0.02) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      return;
    }
    setZoom(Math.min(1 / fitScale, 12));
  };

  // --- 幻灯片自动播放（每 3 秒下一张） ---
  const navigateRef = useRef(null);
  navigateRef.current = () => handleNavigate('next');
  useEffect(() => {
    if (!isPlaying || currentItem.type !== 'image') return;
    const id = setInterval(() => navigateRef.current(), 3000);
    return () => clearInterval(id);
  }, [isPlaying, currentItem.type]);

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

  // 键盘事件监听（快捷键可在 设置-快捷键页 自定义）
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      // 单字符键统一小写匹配（如 'I'/'i'），功能键保留原名（ArrowLeft 等）
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === shortcuts.next) handleNavigate('next');
      else if (key === shortcuts.prev) handleNavigate('prev');
      else if (key === shortcuts.close) onClose();
      else if (key === shortcuts.delete) handleDelete();
      else if (key === shortcuts.reset) { e.preventDefault(); handleReset(); }
      else if (key === shortcuts.info) setShowInfo(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, items, onClose, deleteItem, shortcuts]);

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
    setZoom(prev => Math.min(Math.max(0.2, prev + delta), 12));
  };

  useEffect(() => {
    const node = containerRef.current;
    if (node) node.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (node) node.removeEventListener('wheel', handleWheel); };
  }, []);

  const isImg = currentItem.type === 'image';

  return (
    <div className="group fixed inset-0 z-50 bg-black flex items-center justify-center select-none outline-none overflow-hidden" tabIndex={-1} autoFocus ref={containerRef}>
      {/* 导航箭头 (Fixed定位) */}
      <button data-tip={t.prev} onClick={(e) => { e.stopPropagation(); handleNavigate('prev'); }} className="fixed left-4 top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all outline-none z-[60]"><ChevronLeft size={40} /></button>
      <button data-tip={t.next} onClick={(e) => { e.stopPropagation(); handleNavigate('next'); }} className="fixed right-4 top-1/2 -translate-y-1/2 p-4 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-all outline-none z-[60]"><ChevronRight size={40} /></button>

      <div className="absolute inset-0 flex">
        {/* 主展示区 */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black" onClick={() => handleReset()}>
          {isImg ? (
             <div
               className={`relative origin-center ${isDragging ? '' : 'transition-transform duration-200 ease-out'}`}
               style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flip ? -1 : 1})`, touchAction: 'none' }}
               onClick={(e) => e.stopPropagation()}
               onPointerDown={handlePointerDown}
               onPointerMove={handlePointerMove}
               onPointerUp={handlePointerUp}
               onPointerCancel={handlePointerUp}
             >
               <img ref={imgRef} src={currentItem.url} onLoad={() => setFitScale(computeFitScale())} className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl cursor-grab active:cursor-grabbing" draggable={false} alt={currentItem.name} />
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

        {/* 右侧信息面板（top-16：从顶部工具栏下方开始，不遮挡工具栏按钮） */}
        <div className={`absolute right-0 top-16 bottom-0 w-80 bg-[#111]/95 backdrop-blur-md border-l border-white/10 flex flex-col z-[70] transition-transform duration-300 ease-in-out ${showInfo ? 'translate-x-0' : 'translate-x-full'} rounded-tl-xl`} onClick={(e) => e.stopPropagation()}>
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

      {/* 顶部工具栏（统一 18px 图标 + 同款玻璃容器） */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-[60] pointer-events-none">
         <button data-tip={t.back} onClick={onClose} className="pointer-events-auto text-white/80 hover:text-white p-2 rounded-full bg-black/40 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-colors"><ArrowLeft size={18} /></button>
         <div className="flex items-center gap-2 pointer-events-auto">
             {isImg && (
               <div className="flex bg-black/40 backdrop-blur-md rounded-lg p-1 text-white/80 border border-white/10">
                 <button data-tip={t.zoomOut} data-tip-pos="bottom" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 hover:bg-white/20 rounded"><ZoomOut size={18} /></button>
                 <span className="px-1 text-xs flex items-center font-mono w-10 justify-center" title="相对原始像素的缩放比例">{Math.round(zoom * fitScale * 100)}%</span>
                 <button data-tip={t.zoomIn} data-tip-pos="bottom" onClick={() => setZoom(z => Math.min(12, z + 0.1))} className="p-1.5 hover:bg-white/20 rounded"><ZoomIn size={18} /></button>
                 <div className="w-px h-4 bg-white/20 mx-1 my-auto"></div>
                 <button data-tip={t.rotateCcw} data-tip-pos="bottom" onClick={() => setRotation(r => r - 90)} className="p-1.5 hover:bg-white/20 rounded"><RotateCcw size={18} /></button>
                 <button data-tip={t.rotateCw} data-tip-pos="bottom" onClick={() => setRotation(r => r + 90)} className="p-1.5 hover:bg-white/20 rounded"><RotateCw size={18} /></button>
                 <button data-tip={t.mirror} data-tip-pos="bottom" onClick={() => setFlip(f => !f)} className={`p-1.5 hover:bg-white/20 rounded ${flip ? 'text-brand-400' : ''}`}><FlipHorizontal size={18} /></button>
                 <div className="w-px h-4 bg-white/20 mx-1 my-auto"></div>
                 <button data-tip={t.oneToOne} data-tip-pos="bottom" onClick={handleOneToOne} className="p-1.5 hover:bg-white/20 rounded"><Maximize size={18} /></button>
                 <button data-tip={isPlaying ? t.pauseSlideshow : t.playSlideshow} data-tip-pos="bottom" onClick={() => setIsPlaying(p => !p)} className={`p-1.5 hover:bg-white/20 rounded ${isPlaying ? 'text-brand-400' : ''}`}>{isPlaying ? <Pause size={18} /> : <Play size={18} />}</button>
                 <div className="w-px h-4 bg-white/20 mx-1 my-auto"></div>
                 <button data-tip={t.reset} data-tip-pos="bottom" onClick={handleReset} className="p-1.5 hover:bg-white/20 rounded"><RefreshCw size={18} /></button>
               </div>
             )}
             <div className="flex bg-black/40 backdrop-blur-md rounded-lg p-1 text-white/80 border border-white/10">
               <button data-tip={t.info} data-tip-pos="bottom" onClick={() => setShowInfo(!showInfo)} className={`p-1.5 rounded transition-colors ${showInfo ? 'bg-white/20 text-white' : 'hover:bg-white/20'}`}><Info size={18} /></button>
             </div>
         </div>
      </div>
    </div>
  );
};

export default FullscreenViewer;