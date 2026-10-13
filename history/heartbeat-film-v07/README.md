# 心跳 · 活着的意义 · v07

90 秒原创抽象音乐短片。答案没有到来，心跳仍在继续。

本版加入可辨认、会演化的生活意象：拨盘电话变为按键手机和触屏，读书变为工作，自行车变为列车，孩子长大，餐桌留下空位。126 份记录长成满屏实体城市；电话近景使用独立制作的哑光三维模型。生活场景最后成为回忆中的窗，逐渐远离。

数字和文字重新建立主次：DAY 每拍递增并逐位翻动，画内只保留日期和真实回归次数，去掉装饰编号。中文采用随包提供的 Noto Serif SC，片名、章名、字幕、辅助文字分别控制字号、字重、字距和出场节奏。完整分析见 [审美学习与创作判断](docs/aesthetic-study-v07.md)。

## 观看与保存

完整解压后双击 `index.html` 离线观看，支持全屏、九章跳转。也可以直接打开 MP4。播放器默认使用 1080p。

| 文件 | 内容 |
|---|---|
| `output/heartbeat-v07-4k.mp4` | 3840×2160，30 fps，90 秒，H.264 CRF 15，BT.709 limited，AAC 320 kbps |
| `output/heartbeat-v07-1080p.mp4` | 4K 成片经 Lanczos 缩小的观看版 |
| `audio/generated/master.wav` | 48 kHz / 24-bit 双声道原创配乐母带 |
| `audio/generated/stem-*.wav` | 五个 90 秒预母带分轨 |
| `audio/generated/heartbeat-score.mp3` | 原创配乐试听 |
| `docs/dialogue.srt` | 本版字幕编辑参考，影片已有画内字幕 |
| `output/verification/` | 主体运动、连续样帧、实际成片解码、播放器及归档检查 |

成片核验见 `output/verification/delivery.json`；工程包内含逐文件 `manifest.json`，开发目录的 `output/verification/package.json` 记录 ZIP CRC 和 SHA-256 核验。局部试片不进入最终包。旧版保留在各自目录。

## 编辑入口

- `src/solids.mjs`：实体面片、法向哑光明暗、背面剔除、物件及表面排序。
- `src/city.mjs`：记录到实体城市的生长和镜头。
- `src/telephone.mjs`：拨盘电话、按键与触屏、木桌、信封和书。
- `src/vignettes.mjs`：九个生活事件、人生状态、统一空间映射。
- `src/loom.mjs`：信号分枝、近景与全貌切换、回忆窗口退场。
- `src/archive.mjs`、`days.mjs`：记录阵列、日期近景与逐拍数字。
- `src/afterwards.mjs`、`journeys.mjs`：三次不规则回归、历史空间和结尾。
- `src/scenes.mjs`、`drawing.mjs`：字幕、字体、章节、开场和双节律。
- `src/film.mjs`：绝对时间渲染、字体预载、两样本曝光合成。
- `src/score.mjs`、`audio/`：600 项原创音乐事件与五分轨；音乐 edition v04 标识保持不变。

`src/motifs.mjs` 及 `motion.mjs` 中旧 lifePoint/loomPoint 是历史造型研究，不是 v07 生活场景的渲染入口。相关旧测试只作为旧算法回归；v07 另检查 vignettes、实体和实际浏览器画面。

[参考学习内容已按作者要求省略。]

## 重建

Windows、Node.js 24、Edge、Playwright 1.58.2、FFmpeg 7.1；重新合成音乐另需 Python 3 与 NumPy。离线观看无需开发环境。包内不分发运行时或参考仓库素材。字体为 Noto Serif SC，许可和来源在 `assets/fonts/`。

```powershell
npm install
$env:FFMPEG_PATH = '你的 ffmpeg.exe 完整路径'
# 可选：$env:HEARTBEAT_BROWSER = '浏览器 exe 完整路径'
npm test
node tools/verify-browser.mjs
node tools/verify-motion.mjs
python tools/verify-audio.py
node tools/capture.mjs 74 86
node tools/render.mjs --width 3840 --workers 3 --samples 2 --out heartbeat-v07-4k.mp4
node tools/make-viewing-copy.mjs
node tools/verify.mjs
python tools/package.py
```

`node tools/serve.mjs` 启动本地播放器。重建音乐：`node tools/export-score.mjs` → 安装 `audio/requirements.txt` → `python audio/synthesize.py` → `node tools/master-audio.mjs`。也可直接使用已交付母带。

画面使用 Canvas 2D 与真正的三维面片投影，不使用镜面 PBR。两个时间样本在显示颜色空间积累，并非线性 HDR。主体运动检查排除背景星点、颗粒和后置文字；技术检查与抽帧不等同于完整主观听音或审美认证。
