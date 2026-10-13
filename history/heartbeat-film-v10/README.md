# 心跳 · 活着的意义 · v10

3 分 16 秒原创音乐短片。答案没有到来，心跳仍在继续。

本版按最新方向，把九段依次放大的生活短片改为同一空间里的九组迷你动画。电话、书桌、住宅、通勤、餐桌、成长、身体、生日与远行同时变化，变化时刻错开。全片由 5 分 40 秒缩短为 3 分 16 秒。

住宅经历两次完整拆散和重组；日升月落只在这组空间加速。配乐重新作曲，使用真实钢琴采样、有休止的乐句与更轻的心跳声。退场按整件物品合成，保留实体遮挡，再依次淡去。没有人体模型和装饰编号。

## 观看与保存

完整解压后双击 index.html，可离线观看、全屏、跳转九个章节。播放器默认使用 1080p，也可以直接打开 MP4。观看不需要安装开发工具。

| 文件 | 内容 |
|---|---|
| output/heartbeat-v10-4k.mp4 | 3840×2160，30 fps，196 秒，5,880 帧；原生 4K 画布来源，BT.709 limited |
| output/heartbeat-v10-1080p.mp4 | 从完整 4K 成片缩小的观看版，保留同一音轨 |
| audio/generated/master.wav | 48 kHz / 24-bit 双声道配乐母带 |
| audio/generated/stem-*.wav | 五个完整 196 秒、48 kHz / 16-bit 预母带分轨 |
| audio/generated/heartbeat-score.mp3 | 256 kbps 配乐听音文件 |
| docs/dialogue.srt | 字幕参考；视频已烧录字幕 |

最终结果见 [交付记录](docs/delivery-v10.md)。工程包含逐文件 SHA-256 清单；工作目录的 output/verification/package.json 记录 ZIP 核验。v08 原片和 v09 样片另行保留，不包含在本版包内。

## 创作和来源

[参考学习内容已按作者要求省略。]

## 编辑入口

| 文件 | 职责 |
|---|---|
| src/timeline.mjs | 196 秒全片时间轴、九章、字幕和迷宫回归 |
| src/montage-direction.mjs | 九组物件的位置、比例、各自变化时间和退场顺序 |
| src/lived-scenes.mjs | 统一镜头、整件物体淡入淡出、局部光照 |
| src/life-direction.mjs | 保留的组件内部表演时钟；不再是全片章节表 |
| src/building-assembly.mjs、dwelling-model.mjs | 住宅空间分块、散开、重排、重建 |
| src/transit-model.mjs、birthday-model.mjs | 交通与生日的实体组件 |
| src/life-models.mjs、life-props.mjs、telephone.mjs | 其他生活物件及三代电话 |
| src/heart-records.mjs | 每份记录、每次心跳的独立连续形态 |
| src/maze-world.mjs、maze-scene.mjs | 合法迷宫通路、三次不规则回归、路迹和镜头 |
| src/composition-score.mjs、audio/synthesize.py | 807 个音乐事件、采样钢琴与五分轨 |
| src/film.mjs | 绝对时间求值、原生画布、两次曝光采样、字幕后置 |

旧抽象造型和历史 helper 保留供研究；它们不是本版生活段的渲染入口。tests/historical/ 不计入本版成绩。

## 重建完整影片

使用 Node.js、Edge 或 Chrome、Playwright 1.58.2、FFmpeg；重建配乐另需 Python、NumPy。运行时不随包分发。

安装开发依赖后，设置 FFMPEG_PATH 为本机 FFmpeg 路径，可选 HEARTBEAT_BROWSER 指定浏览器。依次运行：

1. npm test
2. node tools/verify-browser.mjs
3. node tools/verify-motion.mjs
4. python tools/verify-audio.py
5. node tools/capture.mjs 118.5 144.5 160.5 179 188
6. node tools/export-subtitles.mjs
7. node tools/render.mjs --width 3840 --workers 3 --samples 2 --crf 13 --out heartbeat-v10-4k.mp4
8. node tools/make-viewing-copy.mjs
9. node tools/verify.mjs
10. node tools/finalize-notes.mjs
11. python tools/package.py

node tools/serve.mjs 启动本地播放器。音乐重建：node tools/export-score.mjs → 安装 audio/requirements.txt → python audio/synthesize.py → node tools/master-audio.mjs。所需钢琴音源和许可随包提供；无需重复联网下载。

本轮导出保留了视觉未改的 0–62 和 66–130 秒原生 4K 镜头，重渲染修改段，替换全片音乐并按帧合成。原片摘要、源文件与时钟比较、像素比较、分段来源记录在最终渲染报告中。最终合成会再次编码，不能称为全流程无损。上面的重建命令直接渲染全片，不依赖 v08；assemble-edition.mjs 和保留镜头核验工具只适用于同时具备旧版的制作工作区。

画面使用 Canvas 2D 与三维面片投影、哑光明暗和深度排序；不是光线追踪或写实 PBR。两次时间采样在显示颜色空间积累，并非线性 HDR。实际抽帧、解码和信号检查不等于完整主观听音或艺术质量认证。

