# 心跳 · 活着的意义 · v06

90 秒原创抽象音乐短片。答案没有到来，心跳仍在继续。

这一版重写了画面运动和中后段结构：心电曲线本身持续流动；126 份记录展开为时间地层；两种节律形成潮汐与干涉；不规则游走留下的路径抬升为纵深空间；独立的生命曲线从同一个信号分枝，随后织合成大幅立体结构，再逐束散开。DAY 继续随节拍递增，保留三次回到同一原点，不显示图形旁意义不明的编号或单字标签。

## 观看与保存

完整解压后双击 `index.html` 离线观看，支持全屏、九章跳转。也可直接打开 MP4。播放器默认使用 1080p。

| 文件 | 内容 |
|---|---|
| `output/heartbeat-v06-4k.mp4` | 3840×2160，30 fps，90 秒，H.264 CRF 15，BT.709 limited，AAC 320 kbps |
| `output/heartbeat-v06-1080p.mp4` | 4K 成片经 Lanczos 缩小的观看版 |
| `audio/generated/master.wav` | 48 kHz / 24-bit 双声道原创配乐母带 |
| `audio/generated/stem-*.wav` | 五个 90 秒预母带分轨 |
| `audio/generated/heartbeat-score.mp3` | 原创配乐试听 |
| `docs/dialogue.srt` | 本版字幕编辑参考，影片已有画内字幕 |
| `output/verification/` | 波形、主体运动、连续样帧、全片解码和播放验证 |

完整成片以 `heartbeat-v06-4k.mp4` 为准。成片核验为 `output/verification/delivery.json`；工程包含逐文件 `manifest.json`，打包 CRC/SHA-256 检查在开发目录的 `output/verification/package.json`。局部试片不放入最终包。

## 编辑与研究

- `src/motion.mjs`：持续行进的心电信号、九种生命曲线、折叠/展开/织合/离散的统一点映射。
- `src/archive.mjs`：记录阵列、前景日期、时间地层和远景。
- `src/loom.mjs`：同源分枝、独立形态、共同织物、联系及断开。
- `src/afterwards.mjs`：不规则回归、历史空间、种子交接与结尾。
- `src/scenes.mjs`：开场、潮汐、字幕和章节；`film.mjs`：绝对时间渲染和合成。
- `src/journeys.mjs`、`days.mjs`：回归与日期状态。
- `src/motifs.mjs`：保留的 v05 造型研究，不再由 v06 渲染器调用。
- `src/score.mjs`、`audio/`：沿用原创 600 项事件与配乐，音乐 edition v04 标识保持不变。

[参考学习内容已按作者要求省略。]

## 重建

Windows，Node.js 24，Edge，Playwright 1.58.2，FFmpeg 7.1；重新合成音乐另需 Python 3 与 NumPy。播放无需开发工具，包内不分发第三方运行时或参考素材。

```powershell
npm install
$env:FFMPEG_PATH = '你的 ffmpeg.exe 完整路径'
# 可选：$env:HEARTBEAT_BROWSER = '浏览器 exe 完整路径'
npm test
node tools/verify-browser.mjs
node tools/verify-motion.mjs
node tools/capture.mjs 74 86
node tools/render.mjs --width 3840 --workers 3 --samples 2 --out heartbeat-v06-4k.mp4
node tools/make-viewing-copy.mjs
node tools/verify.mjs
python tools/package.py
```

`node tools/serve.mjs` 启动本地播放器。重建配乐步骤：`node tools/export-score.mjs` → 安装 `audio/requirements.txt` → `python audio/synthesize.py` → `node tools/master-audio.mjs` → `python tools/verify-audio.py`。画面可以直接使用已交付母带重建。

Canvas 2D 配合三维投影和薄色面，无 PBR；两个时间样本在显示颜色空间积累，不是线性 HDR。字体使用 Windows 宋体、微软雅黑和 Times New Roman，不随包分发。主体运动检查特意排除背景星点、颗粒和后置文字。技术检查与画面抽样不等同于完整主观听音或审美认证。

