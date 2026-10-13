# 心跳 · 活着的意义

90 秒原创抽象音乐短片，第四版。主题是一场偏悲观的追问：生命持续发生，答案并没有随之到来。结尾保留尚未解决的和声和未闭合的心电轨迹。

2026-10-11 输出核验：4K 与 1080p 均为完整 90 秒、2700 帧；实际音轨 -15.62 LUFS、-1.90 dBTP。已检查文件全帧解码、源码对应、配乐分轨和离线播放器；详细范围见检查记录。

[参考学习内容已按作者要求省略。]

## 观看与保存

完整解压工程包后双击 `index.html`，即可离线观看、全屏、跳转九个章节。也可直接打开 MP4。

| 文件 | 内容 |
|---|---|
| `output/heartbeat-v04-4k.mp4` | 原生 3840 × 2160，30 fps，90 秒；H.264 CRF 15 / slow，BT.709 limited；AAC 320 kbps 立体声 |
| `output/heartbeat-v04-1080p.mp4` | 从上述 4K 原片用 Lanczos 缩小的观看版 |
| `audio/generated/master.wav` | 48 kHz / 24-bit 双声道原创配乐母带 |
| `audio/generated/heartbeat-score.mp3` | 256 kbps 配乐试听文件 |
| `audio/generated/stem-*.wav` | 五个 90 秒、48 kHz / 16-bit 预母带分轨，可另行混音 |
| `docs/dialogue.srt` | 字幕编辑参考；影片自身已经包含字幕 |
| `output/verification/` | 实际媒体解码、章节跳转、图像与配乐分轨检查记录 |

`style-study` 和 `benchmark` 文件若出现在开发目录中，只是早期试片，不属于最终交付，也不放入工程包。完整成片以 `heartbeat-v04-4k.mp4` 为准。4K 播放流畅度取决于设备，默认播放器使用 1080p 观看版。

## 镜头和文件

一份心电记录在画面中重复、排列、沿闭环奔赴，再成为人际网络中的记忆。网络的联系按配乐事件建立和消失，最终留下“答案没有到来。心跳仍在继续。”

- `src/scenes.mjs`：脉冲、记录墙、循环、双源波面、迷宫、空白、关系和结尾。
- `src/drawing.mjs`：透视投影、薄色面、线条、字形、局部光晕与背景。
- `src/film.mjs`：绝对时间渲染、曝光采样与最终合成。
- `src/score.mjs`：九个章节与 600 项原创音乐事件；音画共用此表。
- `audio/synthesize.py`：原创合成器及五个分轨。
- `docs/earlier-research/`：此前对用户指定的三个仓库的实际源码研究笔记。

渲染采用 Canvas 2D 与三维投影，无 PBR 材质。每帧两个时间样本，在显示颜色空间内累积半帧曝光，不是线性 HDR 合成。局部光晕由绘图层生成；另有整幅场景的低强度模糊扩散。章节标题和底部字幕在采样后绘制，图形内部的标签仍参与采样。颗粒很轻，不用于掩盖结构。

## 重建

已使用的环境：Windows、Node.js 24、Edge、Playwright 1.58.2、FFmpeg 7.1、Python 3 与 NumPy。播放已有成片不需要这些开发工具。包中不含浏览器、FFmpeg、Node.js 或第三方研究仓库；重建时自行提供对应运行时。

```powershell
npm install
$env:FFMPEG_PATH = '你的 ffmpeg.exe 完整路径'
# 如需指定浏览器：$env:HEARTBEAT_BROWSER = '你的 msedge.exe 或 chrome.exe 完整路径'
node tools/export-score.mjs
python -m pip install -r audio/requirements.txt
python audio/synthesize.py
node tools/master-audio.mjs
python tools/verify-audio.py
node tools/verify-browser.mjs
node tools/render.mjs --width 3840 --workers 3 --samples 2 --out heartbeat-v04-4k.mp4
node tools/make-viewing-copy.mjs
node tools/verify.mjs
python tools/package.py
```

只修改画面时可使用已交付母带，跳过音乐导出、合成与母带步骤。`node tools/serve.mjs` 启动本机预览服务器；`render.html` 是定帧渲染入口，`index.html` 是成片播放器。支持 `--from`、`--to` 参数导出局部，但局部试片应使用其他文件名。

字体使用 Windows 自带宋体、微软雅黑和 Times New Roman，不打包字体文件；跨平台重新渲染可能发生字体替换。已经导出的影片不受此影响。所有图形和音乐均独立创作，包中没有参考作品的画面、配乐或源码。检查结果只证明记录中明确列出的技术事实，不证明艺术质量达到参考作品，也不冒充主观听音验收。
