# 心跳 · 活着的意义 · v11

3 分 16 秒原创音乐短片。答案没有到来，心跳仍在继续。

九组日常在同一空间里同时演进；住宅两次完整拆散后重组。采用采样钢琴与较轻的心搏，没有人体模型和装饰编号。

本版重做 173–182 秒：物件逐排折拢为心电波形，按原有左、中、右位置汇成同一条线。九组物件不再淡出，尾声继续已经接好的 ECG。车辆进出也改用整幅合成后的边缘遮罩，避免悬空门窗和轮子。

## 观看与保存

完整解压后双击 index.html，可离线观看、全屏与跳转九章；也可直接播放 MP4，无需开发工具。

| 文件 | 内容 |
|---|---|
| output/heartbeat-v11-4k.mp4 | 原生 3840×2160，30 fps，196 秒 |
| output/heartbeat-v11-1080p.mp4 | 由完整 4K 成片缩小的观看版 |
| audio/generated/master.wav | 48 kHz / 24-bit 双声道配乐母带 |
| audio/generated/stem-*.wav | 五条完整预母带分轨 |
| audio/generated/heartbeat-score.mp3 | 配乐听音文件 |
| docs/dialogue.srt | 字幕参考；视频已烧录字幕 |

最终事实见 [交付记录](docs/delivery-v11.md)。v10 母版与更早版本另行保留，不装入本版工程包。

## 设计与来源

[参考学习内容已按作者要求省略。]

## 编辑入口

| 文件 | 职责 |
|---|---|
| src/timeline.mjs | 全片时间、章节、字幕和迷宫回归 |
| src/montage-direction.mjs | 九组位置与变化时间 |
| src/heart-confluence.mjs | 折成波形、空间接线、尾声共享 ECG |
| src/lived-scenes.mjs | 统一空间、物体合成、通勤遮罩及局部光 |
| src/building-assembly.mjs | 住宅分块、散开和重建 |
| src/heart-records.mjs | 每份记录、每次心跳独立变化 |
| src/composition-score.mjs | 825 个音乐事件；心搏与画面共用时钟 |
| src/film.mjs | 原生画布、两个时间样本、字幕后置 |

life-direction.mjs 保存模型内部表演时钟，不是全片章节表。tests/historical 为历史研究，不计入当前成绩。

## 重建

需要 Node.js、Edge 或 Chrome、Playwright 1.58.2、FFmpeg；音乐另需 Python、NumPy。设置 FFMPEG_PATH，可选 HEARTBEAT_BROWSER。运行时不随包分发。

1. npm install，然后 npm test。
2. node tools/verify-browser.mjs；node tools/verify-motion.mjs；python tools/verify-audio.py。
3. node tools/capture.mjs 118.5 143.5 157.5 160.5 176.5 178.5 182 188。
4. node tools/export-subtitles.mjs。
5. node tools/render.mjs --width 3840 --workers 3 --samples 2 --crf 13 --out heartbeat-v11-4k.mp4。
6. node tools/make-viewing-copy.mjs；node tools/verify.mjs。
7. 直接审查视频和抽帧，将范围、问题及结论记入 output/verification/visual-review.json，实际检查后才标记 passed。
8. node tools/finalize-notes.mjs；python tools/package.py。

音乐：node tools/export-score.mjs → 安装 audio/requirements.txt → python audio/synthesize.py → node tools/master-audio.mjs。录音素材和许可随包提供，无需重新下载。

本轮保留视觉未改的 v10 0–130 秒原生 4K 镜头，重渲染 130–196 秒，再用新母带按帧合成。源文件、时钟、母版和像素比较记录在检查报告内。最终合成再次编码，不能称为无损复制。上面的完整渲染命令不依赖旧版；assemble-edition.mjs 只适用于具备旧母版的制作工作区。

采用 Canvas 2D 与三维面片投影，不是写实光线追踪。解码、抽帧和信号测量不能代替完整正常速度的主观观看与听音。
