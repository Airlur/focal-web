import { useAppStore } from '../store/useAppStore';
import { useMediaStore } from '../store/useMediaStore';

// 缩略图质量档位 → 最长边像素
export const THUMB_QUALITY = {
  low: 480,     // 低：最省内存，小卡片够用
  medium: 960,  // 中：推荐均衡
  high: 1440,   // 高：大卡片/高分屏更清晰
};

export const getCurrentThumbMax = () => {
  const q = useAppStore.getState().thumbnailQuality;
  return THUMB_QUALITY[q] || THUMB_QUALITY.medium;
};

// 后台解码生成缩略图（source 为 File/Blob），同时读出原始分辨率。
// createImageBitmap 在浏览器后台线程解码，不阻塞主线程。
export async function buildThumb(source, maxSize) {
  try {
    const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
    const width = bitmap.width;
    const height = bitmap.height;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    return { thumbUrl: URL.createObjectURL(blob), width, height };
  } catch {
    // 解码失败（如不支持的格式）时返回 null，由调用方回退到原图
    return null;
  }
}

// 质量档位变化后：从内存中的原图 blob 重建当前库内所有图片的缩略图（分批）
export async function regenerateAllThumbnails() {
  const maxSize = getCurrentThumbMax();
  const { items, updateItems } = useMediaStore.getState();
  const images = items.filter(i => i.type === 'image');
  const CHUNK = 6;
  for (let i = 0; i < images.length; i += CHUNK) {
    const chunk = images.slice(i, i + CHUNK);
    const updates = await Promise.all(chunk.map(async (item) => {
      try {
        const res = await fetch(item.url); // 原图 blob URL 可直接取回
        const blob = await res.blob();
        const thumb = await buildThumb(blob, maxSize);
        if (!thumb) return null;
        if (item.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(item.thumbUrl);
        return { id: item.id, updates: { thumbUrl: thumb.thumbUrl } };
      } catch {
        return null;
      }
    }));
    const valid = updates.filter(Boolean);
    if (valid.length) updateItems(valid);
  }
}
