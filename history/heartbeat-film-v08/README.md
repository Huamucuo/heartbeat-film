# 心跳 · 活着的意义 · v08

5 分 40 秒原创音乐短片。答案没有到来，心跳仍在继续。

本版把生活段落展开为九支连续的小短片。旧电话变成触屏，书页变成深夜的电脑，房子长成高楼，自行车变成列车。一张餐桌从一只杯子变成两只，最后另一只慢慢凉下去。门框上的身高刻痕、留下的鞋、拐杖和药瓶承担人的经历；本版没有人体模型。

开场和 126 份心跳记录逐拍独立生成，间隔、振幅、宽度和形态均有变化；渲染使用固定种子，重复导出能复现同一段表演。迷宫为 31×23 格真实通路，三次经过不同曲折路线回到同一原点，镜头从贴近跟随拉到全貌。配乐随三次行走变为 5/4、7/8、3/4，并在归来后让出一段安静。

## 观看与保存

完整解压后双击 `index.html`，可离线观看、全屏、跳转十八个章节。播放器默认使用 1080p，也可以直接打开 MP4。无需安装开发工具。

| 文件 | 内容 |
|---|---|
| `output/heartbeat-v08-4k.mp4` | 原生 3840×2160，30 fps，340 秒，10,200 帧，H.264 CRF 15，BT.709 limited |
| `output/heartbeat-v08-1080p.mp4` | 从 4K 成片经 Lanczos 缩小的观看版 |
| `audio/generated/master.wav` | 48 kHz / 24-bit 双声道原创配乐母带 |
| `audio/generated/stem-*.wav` | 五个完整 340 秒、48 kHz / 16-bit 预母带分轨 |
| `audio/generated/heartbeat-score.mp3` | 原创配乐，256 kbps |
| `docs/dialogue.srt` | 字幕编辑参考；视频中已烧录字幕 |
| `output/verification/` | 主体运动、连续样帧、实际成片解码和离线播放器检查 |

最终检查见 [交付记录](docs/delivery-v08.md)。工程包包含逐文件 `manifest.json`，工作目录的 `output/verification/package.json` 记录 ZIP CRC 和 SHA-256 结果。局部试片不放入最终包，历史版本保留在原目录。

## 内容与制作

[参考学习内容已按作者要求省略。]

## 编辑入口

| 文件 | 职责 |
|---|---|
| `src/life-direction.mjs` | 九支生活短片的起止、两次状态变化、相机、速度、音色和字幕 |
| `src/timeline.mjs` | 340 秒总时间轴、十八章、迷宫三次回归和字幕 |
| `src/heart-records.mjs` | 每份记录、每次心跳的独立连续形态 |
| `src/maze-world.mjs` / `maze-scene.mjs` | 实际迷宫通路、保留的轨迹、光点、实体墙和镜头 |
| `src/life-models.mjs` / `life-props.mjs` | 桌面、家、交通、餐桌、成长、身体、生日和远行的具体物件 |
| `src/telephone.mjs` | 三代电话、拨盘、听筒、按键、屏幕及桌面 |
| `src/lived-scenes.mjs` | 九场的统一空间、连续镜头、景别和回忆窗口 |
| `src/model-kit.mjs` / `solids.mjs` | 实体面片、法向明暗、深度排序、杯口、把手等模型基础 |
| `src/archive.mjs` / `days.mjs` / `city.mjs` | 心跳阵列、逐拍日期及满屏城市 |
| `src/scenes.mjs` / `afterwards.mjs` | 开场、双节律、文字层级及结尾 |
| `src/composition-score.mjs` / `audio/` | 1,682 项音乐事件、变拍与五分轨合成 |
| `src/film.mjs` | 按绝对时间求值、字体预载、原生画布和两次曝光采样 |

`src/loom.mjs`、`vignettes.mjs`、`journeys.mjs`、旧抽象造型和旧人体 helper 保留为历史研究；它们不是 v08 生活与迷宫的渲染入口。`tests/historical/` 是历史算法样例，不计入本版测试成绩。

## 重建

开发使用 Windows、Node.js、Edge、Playwright 1.58.2、FFmpeg 7.1。重新合成音乐另需 Python 3 和 NumPy。包内不分发开发运行时或参考仓库素材；字体与 OFL 许可随包提供。

```powershell
npm install
$env:FFMPEG_PATH = '你的 ffmpeg.exe 完整路径'
# 可选：$env:HEARTBEAT_BROWSER = '浏览器 exe 完整路径'
npm test
node tools/verify-browser.mjs
node tools/verify-motion.mjs
python tools/verify-audio.py
node tools/capture.mjs 118.5 226 333
node tools/export-subtitles.mjs
node tools/render.mjs --width 3840 --workers 3 --samples 2 --crf 15 --out heartbeat-v08-4k.mp4
node tools/make-viewing-copy.mjs
node tools/verify.mjs
node tools/finalize-notes.mjs
python tools/package.py
```

`node tools/serve.mjs` 启动本地播放器。音乐重建顺序：`node tools/export-score.mjs` → 安装 `audio/requirements.txt` → `python audio/synthesize.py` → `node tools/master-audio.mjs`。未改乐谱时可直接使用已交付母带。

画面使用 Canvas 2D 与三维面片投影、哑光明暗和深度排序；不是光线追踪或镜面 PBR。两个时间样本在显示颜色空间积累，并非线性 HDR。运动与解码检查能发现冻结、断帧和实现错误，不等于对艺术水平或完整主观听音作保证。
