# 心跳 · 活着的意义 · v12

3 分 16 秒原创音乐短片。当前迷宫为从头至尾固定的满屏平面，墙体和岔路越出画边。240 条 RGB 路线从不同区域陆续进入，独立探索并持续加速；主线在 66–129.6 秒完成 72 次回归，中央半透明赛博黄色空心数字随回归越来越快地上下折翻，末端快到难以逐个辨认，轮廓由细小代码字符组成并置于墙体与路线之下，没有牌底、边框或中文标记。末段大量路线沿通道分批接入九组日常，再由生活对象的真实笔画聚拢、旋转，接成心脏与背景不规则心电线。尾声以楼房逐户熄灯表达繁华消退。旧版另行保留。

## 观看

完整解压后双击 index.html，可以离线观看、全屏和章节跳转，也可直接打开 MP4。

| 文件 | 内容 |
|---|---|
| output/heartbeat-v12-1080p.mp4 | 1080p 观看版，30 fps，196 秒 |
| output/heartbeat-v12-4k.mp4 | 原生 3840×2160 成片 |
| audio/generated/master.wav | 48 kHz / 24-bit 双声道母带 |
| audio/generated/stem-*.wav | 五条完整配乐分轨 |
| audio/generated/heartbeat-score.mp3 | 配乐听音文件 |
| docs/dialogue.srt | 字幕参考；成片已烧录字幕 |

当前状态：完整 4K 与 1080p 已输出并完成全帧解码、播放器及实际编码抽帧检查。最终事实与限制见 [交付记录](docs/delivery-v12.md)。194.5 秒画面停住，音乐残响至 195.92 秒后归于静音。

## 创作与编辑

[参考学习内容已按作者要求省略。]

| 入口 | 职责 |
|---|---|
| src/timeline.mjs | 全片章节、字幕、时长 |
| src/code-direction.mjs | 回归、心搏、故障、停止的共用时钟 |
| src/code-maze.mjs | 固定满屏平面迷宫、240条分散加速RGB路线、72次回归、中央数字折翻与大量路线衔接 |
| src/code-life-programs.mjs | 九组日常与年代演进的程序图形 |
| src/code-lives.mjs | 同屏刻绘、生活笔画聚拢旋转、连接代码心脏 |
| src/code-ending.mjs | 代码心脏、背景不规则心电线、楼房逐户熄灯与末尾停止 |
| src/composition-score.mjs | 原创音乐与音效事件 |
| src/film.mjs | 原生画布、时间采样、字幕与局部故障 |

旧模型和旧方案源码保留以便恢复，历史文档与试片不能作为当前版本的检查结果。

## 重建

需要 Node.js、Edge 或 Chrome、Playwright、FFmpeg；音乐需要 Python 和 NumPy。设置 FFMPEG_PATH，可选 HEARTBEAT_BROWSER。工具运行时不随工程分发。

1. npm install，然后 npm test。
2. node tools/verify-browser.mjs；node tools/verify-motion.mjs。
3. 音乐：node tools/export-score.mjs → python audio/synthesize.py → node tools/master-audio.mjs。采样、许可和完整分轨已包含；母带制作与 verify-audio-v12.py 的前段逐样本比较还需制作工作区中 v11 原母带。工程包可直接使用已附的最终母带和分轨。
4. node tools/export-subtitles.mjs。
5. node tools/render.mjs --width 3840 --workers 3 --samples 2 --crf 13 --out heartbeat-v12-4k.mp4。
6. node tools/make-viewing-copy.mjs；node tools/verify.mjs。
7. 检查实际视频与解码帧后，记录 output/verification/visual-review.json 的范围、问题及限制，再运行 node tools/finalize-notes.mjs 与 python tools/package.py。

本轮最终拼接保留 v11 的 0–61.5 秒，以及已导出且未改变的 134.6–173 秒生活段，其余部分重新渲染，再配合完整母带合成。保留区间的像素验证和最终编码验证待执行；合成再次编码，不称无损复制。上述全片命令无需旧母版；assemble-edition.mjs 仅适用于同时保留旧版的制作工作区。

抽帧、解码和信号测量不能代替完整正常速度的主观观看与听音；限制以交付记录为准。


