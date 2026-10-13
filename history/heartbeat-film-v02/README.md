# 心跳 / HEARTBEAT — 第二版

90 秒原创抽象音乐短片。96 BPM，36 小节，1920 × 1080，30 fps，立体声。

## 观看和保存

直接打开 `output/heartbeat-v02.mp4`，或双击 `index.html` 使用离线播放器、九段章节跳转和下载入口。播放器无需联网；请先完整解压工程包。原创配乐在 `audio/generated/heartbeat-score.mp3`。

## 这一版的视觉叙事

同一批 96 根线保留索引，经历“脉动留下圆环 → 时间的纵深记录 → 展开的织物 → 双源错拍 → 干涉 → 倾听与返回 → 立体编织 → 九节点共振 → 回到圆环”。形状、机位、脉动增益和波纹传播规则都在段落间交接。

7.5–17.5 秒改用暖纸与铜刻线，改变材料和观看状态；其余段落随叙事采用全幅声纹、双主体、局部穿行、立体结和整体织网。重点是关系的递进与不同景别，不能用粒子或线条数量替代内容。

声音由同一份事件表生成，包括原创双击心跳、拨弦、柔音、泛音、低音与空气声。两组心跳有各自节拍与声像；55 秒的回声在 57.5 秒抵达，随后九个新节点按音符依次出现，18 条连接从已经存在的端点生长。

## 参考研究与持续对照

[参考学习内容已按作者要求省略。]

[参考学习内容已按作者要求省略。]

本工程没有复制参考的场景代码、配乐、图片和字体文件。引用仓库和固定提交见 `docs/provenance.md`。并排参考图留在工作区研究目录，未放进原创交付包。

## 文件结构

- `src/film.mjs`：确定性的 Canvas 图形、3D 投影、镜头、材质、字幕和后处理。
- `src/score.mjs`：唯一时间轴与共享声画事件。
- `audio/synthesize.py`：无需声音采样的 NumPy 合成器；重新生成五轨 stems 和混音。
- `tools/render.mjs`：绝对帧号、两个时间样本、半帧快门、边界限制、字幕后叠加、FFmpeg 输出。
- `tools/verify*.mjs`：实际投影/亮度连续性、随机顺序定位、全片解码和离线播放检查。
- `output/verification/`：实测结果、独立复核及成片抽帧。

## 重新制作

需要 Node.js 22 或更新版本、Python 3.11 或更新版本、FFmpeg 7、Edge / Chromium。制作时使用 Node 24.17、Python 配套 NumPy 2.3.5、Playwright 1.58.2、FFmpeg 7.1 和 Windows Edge。不同操作系统的中文字体会影响重新渲染的字形；已输出 MP4 的文字已固化。

在工程根目录执行：

```powershell
npm install
python -m pip install -r audio/requirements.txt
node tools/export-score.mjs
python audio/synthesize.py
node tools/master-audio.mjs
python tools/verify-audio.py
node tools/verify-structure.mjs
node tools/verify-browser.mjs
node tools/render.mjs --workers 3
node tools/verify.mjs
```

FFmpeg 应在 PATH 中，也可用 `$env:FFMPEG_PATH='C:\路径\ffmpeg.exe'` 指定；浏览器可用 `$env:HEARTBEAT_BROWSER='C:\路径\chrome.exe'` 指定。已有 Windows Edge 会被自动使用；其他环境可运行 `npx playwright install chromium` 安装对应浏览器。

`npm run preview` 后访问终端显示的本机地址；`render.html` 是源码预览，`index.html` 是最终 MP4 播放器。截图执行 `node tools/capture.mjs 12 24 31 66 73 86`。部分区间可用 `node tools/render.mjs --from 7.5 --to 20 --out excerpt.mp4 --workers 3` 输出。

渲染和检查只在本机执行，不上传文件。`tools/comparison.mjs` 属于工作区研究辅助脚本，需要工程旁的参考快照，不是重新渲染原创影片的依赖。

## 验收边界

本版实际导出与检查结果见 `docs/delivery.md`；完整 MP4 为 90 秒 / 2700 帧，最终 AAC 综合响度 -15.55 LUFS，真峰值 -1.76 dBTP。成片、源码和五条同长音频分轨均包含在工程包中。

验证记录区分“文件和功能正确”与“艺术效果”。通过帧数、音频响度、连续性和播放器检查，并不表示艺术质量已达到参考片。研究中查看的是实际源码渲染的采样帧和局部连续片段，没有把未完成的人工听审或参考发行版全程观看描述为已经完成。
