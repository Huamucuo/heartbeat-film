# 心跳 · HEARTBEAT

原创抽象音乐短片的第一阶段样片，2026-10-11。

这次交付两段带原创配乐的 **1920 × 1080、30 fps** 视频，共 **15 秒**。它们分别来自规划中 90 秒全片的不同位置。**90 秒全片尚未完成**，目前渲染器专门打磨的是这两个窗口；在其他时间调用渲染器，不代表对应镜头已经制作。

## 直接观看

将整个交付文件夹解压，双击 `index.html`。播放器不需要联网、不需要安装依赖，可以切换样片、播放、暂停、拖动，并下载当前视频和 WAV。也可直接播放：

| 视频 | 长度 | 原片时间 | 内容 |
|---|---:|---:|---|
| [01-emergence.mp4](output/01-emergence.mp4) | 5 秒 | 17.5–22.5 秒 | 同一轮廓生长出纤维，成为有褶皱的薄膜 |
| [02-answer.mp4](output/02-answer.mp4) | 10 秒 | 55–65 秒 | 停顿、青色回声沿旧路径返回、暖色波纹向外传播 |

建议用耳机观看。第二段 55–56.875 秒没有新的心跳，保留环境与音符的尾声；56.875 秒回声从右侧出发，57.5 秒到达左侧主脉冲。没有使用歌词、旁白或医学心电图。

## 创作方式

主脉冲为珊瑚色，远端回应为青绿色，纤维为暖象牙色。线、薄膜、两个脉冲以及回声路径保持同一组空间坐标；没有用换图或淡入淡出替代连续形变。纤维向主脉冲汇聚，回声到达后，形变和受光沿表面传播。镜头在等待与首次到达之间保持固定。

音乐为本项目独立编写的程序化原创：96 BPM、4/4，低频双脉冲、A3 / E4 / B4 动机、柔和谐波与持续氛围。画面与声音读取同一份事件谱。音频先生成完整前置时间与混响，再裁切片段，避免截掉片头已有的尾音。

[参考学习内容已按作者要求省略。]

## 可修改的位置

| 文件 | 修改内容 |
|---|---|
| `src/score.mjs` | 片段范围、精确音符与心跳事件 |
| `src/state.mjs` | 镜头、形态生长、脉冲强度、回声时序 |
| `src/geometry.mjs` | 薄膜的连续空间曲面 |
| `src/materials.mjs` | 纤维、颜色、侧光与脉冲材质 |
| `src/film.mjs` | 几何、共享曲线、节点、光晕与合成 |
| `audio/synthesize.py` | 原创音色、动机、和弦、立体声与混响 |
| `index.html` | 离线观看页，修改它不影响影片画面 |

`audio/generated/` 包含每段 24-bit / 48 kHz stereo 母带 WAV，以及 pulse、felt、air、path 四个 **16-bit / 48 kHz stereo、母带处理前**的分轨。分轨相加得到母带前混音；母带另有响度和峰值处理，因此不应期待分轨相加逐样本等于母带。

## 重新生成

观看成品无需以下步骤。修改与重新导出需要 Windows、Node.js 22+、Python 3.12、Edge 或 Chrome。开发时实际使用 Node 24.17、Python 3.12.14、NumPy 2.3.5、Three.js 0.180.0、Playwright 1.58.2、FFmpeg 7.1。

在本目录打开 PowerShell：

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
python -m pip install -r requirements.txt
python -m pip install --no-deps --target tools/python-deps imageio-ffmpeg==0.6.0
node tools/export-score.mjs
python audio/synthesize.py
node tools/master-audio.mjs
node --test tests/*.test.mjs
node tools/render.mjs
node tools/verify.mjs
node tools/verify-browser.mjs
```

播放器的成品与 Three.js 浏览器模块已包含在交付中。FFmpeg 可执行程序、Python 运行时和 `node_modules` 不放入便携压缩包。安装命令会下载固定版本依赖。

FFmpeg 可用环境变量 `FFMPEG_PATH` 指定；浏览器可用 `HEARTBEAT_BROWSER` 指定。默认检测 Edge，其次 Chrome。`tools/runtime.mjs` 在本机也能读取 Codex 已有的 Playwright，仅作为开发环境回退。

只重做某一段：

```powershell
node tools/render.mjs 01-emergence
node tools/render.mjs 02-answer
```

只修改声音：重新导出事件谱、运行音频合成和母带脚本，然后 `node tools/remux.mjs`；它保留已经编码的画面，替换音轨。

画面导出在隐藏浏览器中逐帧调用 `window.heartbeat.seek(sourceSeconds)`，通过 PNG 管道送给 FFmpeg，不依赖实际播放速度。导出中断会报错并删除本次不完整临时 MP4，保留上次已完成文件。当前设置不做跨帧累积模糊，细线使用屏幕导数过滤与 MSAA。

开发预览用 `node tools/serve.mjs`，打开 `http://127.0.0.1:4186/render.html`，在浏览器控制台调用 `heartbeat.seek(59)`。这是渲染接口页，默认显示一帧。用于日常观看的交付入口仍是 `index.html`。

## 验证记录

`output/verification/media-report.json`：最终 MP4 解码得到 150 / 300 帧，都是 1080p / 30 fps，BT.709 limited range，AAC 48 kHz stereo；两段分别测得 −15.60 / −15.88 LUFS，真峰值 −1.49 / −1.50 dBTP。

`output/verification/browser-report.json`：7 个时间点乱序跳转后像素哈希一致；回声到达处主脉冲投影没有跳变；离线播放器的播放、暂停、拖动和结束均通过；390 px 窄屏没有横向溢出。测试包括声音非静音和精确样本数量。

`output/contact/` 是直接渲染帧；`output/verification/` 中的截图来自最终 MP4 解码或播放器。做过画面抽帧检查与音频数值检查，没有把数值检查描述成主观试听。

## 下一阶段

完成开头点到线的过程、相位错开、七个新节点加入、整体呼吸和尾声标题，再进行全片镜头衔接与音乐发展。现有几何、节点 ID、事件谱和导出流程可继续使用；其余 75 秒的画面仍需实际制作与验收。

第三方库说明：`assets/THIRD-PARTY.txt`，Three.js MIT 许可证：`assets/vendor/LICENSE`。
