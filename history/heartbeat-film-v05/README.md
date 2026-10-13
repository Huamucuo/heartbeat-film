# 心跳 · 活着的意义 · v05

90 秒原创抽象音乐短片。生命仍在发生，答案并没有随之到来。影片保留偏悲观的追问、未解决的和声和未闭合的心电轨迹。

本轮修改：三条不同的不规则路线最终回到同一原点；九个网络节点拥有不同结构和运动；移除节点旁编号与单字名称；所有 DAY 日期按 96 BPM 节拍递增，并带轻微跳动。前四章保留构图和衔接，只有日期显示随之更新。原版未被覆盖。

## 观看与保存

完整解压后双击 `index.html`，即可离线观看、全屏和跳转九章。也可以直接打开 MP4。默认使用 1080p，以便普通设备播放。

| 文件 | 内容 |
|---|---|
| `output/heartbeat-v05-4k.mp4` | 原生 3840×2160，30 fps，90 秒，H.264 CRF 15，BT.709 limited；AAC 320 kbps 双声道 |
| `output/heartbeat-v05-1080p.mp4` | 从 4K 原片以 Lanczos 缩小的观看版 |
| `audio/generated/master.wav` | 原创配乐母带，48 kHz / 24-bit 双声道 |
| `audio/generated/heartbeat-score.mp3` | 原创配乐试听文件 |
| `audio/generated/stem-*.wav` | 五个 90 秒预母带分轨 |
| `docs/dialogue.srt` | 字幕编辑参考；影片内已含字幕 |
| `output/verification/` | 行为测试、像素对照、实际成片解码与播放器验证 |

开发目录中的 `revision-preview` 是局部试片，不放入最终工程包。完整成片以 `heartbeat-v05-4k.mp4` 为准。两份 MP4 各 2700 帧完整解码通过，已查看 49 张实际 4K 编码画面并检查离线播放、九章跳转和 4K 切换。成片核验记录为 `output/verification/delivery.json`；工程包的逐文件 CRC/SHA-256 结果在开发目录的 `output/verification/package.json`，包内附有 `manifest.json`。

## 源码和研究

- `src/scenes.mjs`：前四章和全片字幕、章节排版。
- `src/afterwards.mjs`：不规则游走、沉默、关系网络与结尾。
- `src/journeys.mjs`：三条弧长采样路线、出发/到达和返回计数。
- `src/motifs.mjs`：九种独立图形及各自运动规则。
- `src/days.mjs`：所有日期的共享节拍状态。
- `src/drawing.mjs`、`film.mjs`：投影、绘图、两个时间样本和最终合成。
- `src/score.mjs`、`audio/synthesize.py`：600 项原创音乐事件、合成器和五个分轨。

[参考学习内容已按作者要求省略。]

新增 B 站链接仅成功查看正确视频约 20.6 秒的暂停画面；接口受限且连续媒体读取超时。没有声称看过整片，也没有依据标题认定其制作过程。

## 重建

环境：Windows，Node.js 24，Edge，Playwright 1.58.2，FFmpeg 7.1，Python 3 与 NumPy。播放成片不需要开发工具。工程包不包含第三方运行时和参考仓库。

```powershell
npm install
$env:FFMPEG_PATH = '你的 ffmpeg.exe 完整路径'
# 可选：$env:HEARTBEAT_BROWSER = '你的浏览器 exe 完整路径'
npm test
node tools/verify-browser.mjs
node tools/capture.mjs 74 86
node tools/render.mjs --width 3840 --workers 3 --samples 2 --out heartbeat-v05-4k.mp4
node tools/make-viewing-copy.mjs
node tools/verify.mjs
python tools/package.py
```

已交付母带可直接重建画面。若修改音乐，再依次执行 `node tools/export-score.mjs`、`python -m pip install -r audio/requirements.txt`、`python audio/synthesize.py`、`node tools/master-audio.mjs`、`python tools/verify-audio.py`。

`tools/verify-revision.mjs` 是开发期新旧版对照工具，需同级 `heartbeat-film-v04`；独立解压工程无需运行它，本轮结果已经收录。`node tools/serve.mjs` 启动本地预览服务器。局部渲染可用 `--from`、`--to` 和其他输出文件名。

Canvas 2D 配合三维投影，不使用 PBR。半帧曝光在显示颜色空间累积，不是线性 HDR 合成；章节与字幕后置保持清晰。字体用 Windows 自带宋体、微软雅黑和 Times New Roman，不随包分发，跨平台重建可能有字形替换。全部画面和音乐独立实现，未收录参考作品素材。技术验证不等同于主观审美或完整听音评审。

