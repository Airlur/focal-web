# Focal

一个纯前端的本地媒体库应用：把文件夹里的图片 / 视频拖进浏览器，即可获得带缩略图、EXIF 信息、全屏预览的浏览体验。所有数据处理都在本地浏览器内完成，不上传任何文件。

![Tech](https://img.shields.io/badge/React-19-61dafb) ![Tech](https://img.shields.io/badge/Vite-7-646cff) ![Tech](https://img.shields.io/badge/TailwindCSS-3-38bdf8)

## 功能特性

### 媒体库
- **导入文件 / 文件夹**：通过原生文件选择器批量导入（单次上限 3000 个）
- **高性能缩略图**：导入时用 `createImageBitmap` 在后台线程分批（8 张/批）解码生成 ≤640px 缩略图，不阻塞主线程；原图分辨率同步读出
- **三种视图**：虚拟网格（VirtuosoGrid）/ 瀑布流 / 虚拟列表，可调列数
- **排序与筛选**：按日期 / 名称 / 大小 / 类型排序，支持升降序
- **收藏与文件夹管理**：收藏视图、侧边栏文件夹分组、移除文件夹（自动释放 blob URL，无内存泄漏）
- **右键菜单**：打开 / 收藏 / 删除
- **搜索**：`Alt+F` 快速聚焦，实时过滤
- **中英双语 + 浅色 / 深色主题**，即时切换并持久化

### 全屏预览
- 缩放（滚轮 / 按钮）、拖拽平移、顺 / 逆时针旋转、镜像翻转
- **实际大小 (100%)**：一键切到 1:1 像素级查看，再点恢复适应窗口
- **幻灯片自动播放**（3 秒 / 张）
- 信息面板：文件名、分辨率、大小、文件夹，图片自动解析 **EXIF**（相机 / 光圈 / ISO / 快门 / 镜头），视频读取时长与格式
- 键盘导航，**所有快捷键可在设置中自定义**（带冲突检测）

### 设置中心
- **常规**：主题模式、界面语言、视图模式、排序方式（即时生效并持久化）
- **快捷键**：可视化改键、冲突提示、一键恢复默认
- **数据**：媒体库统计与清空

## 技术栈

- React 19 + Vite 7
- Zustand（状态管理 + persist 持久化）
- react-virtuoso 4（网格 / 列表虚拟滚动）
- Tailwind CSS 3 + lucide-react 图标
- exifr（EXIF 解析）

## 快速开始

```bash
npm install
npm run dev      # 开发服务器（端口可在 vite.config.js 调整）
npm run build    # 生产构建
npm run preview  # 预览生产构建
```

要求 Node.js ≥ 18。

## 项目结构

```
src/
├── components/
│   ├── common/        # SettingsModal（常规 / 快捷键 / 数据）
│   ├── layout/        # Sidebar / TopBar / MainContent（三视图渲染 + 右键菜单）
│   ├── media/         # MediaCard（memo 化卡片）
│   └── viewer/        # FullscreenViewer（缩放 / 平移 / 旋转 / 幻灯片 / EXIF）
├── hooks/             # useFilteredMedia（筛选排序）、useMedia 等
└── store/
    ├── useAppStore.js   # 界面状态、视图配置、快捷键（persist）
    └── useMediaStore.js # 媒体条目 CRUD（批量更新 + blob URL 生命周期管理）
```

## 默认快捷键（可在 设置 → 快捷键 自定义）

| 按键 | 功能 |
| --- | --- |
| `←` / `→` | 上一张 / 下一张 |
| `Esc` | 关闭预览 |
| `空格` | 复位视图 |
| `I` | 开关信息面板 |
| `Delete` | 删除当前媒体 |
| `Alt+F` | 聚焦搜索（固定） |

## 开发诊断

`public/file-dialog-test.html` 是一个零依赖的裸文件选择器诊断页（`/file-dialog-test.html`），用于区分"文件弹窗打开慢"是应用问题还是浏览器环境问题。

## 已知限制

- 媒体数据基于 blob URL，**刷新页面后库会清空**（浏览器限制，持久化需接入 File System Access API 或后端，暂未实现）
- Masonry 视图未做虚拟化，数千张以上时建议使用网格 / 列表视图
