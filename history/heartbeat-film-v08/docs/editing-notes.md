# v08 编辑与重建

## 时间和叙事入口

影片按绝对秒数求值，任何帧可以直接跳到，不依赖播放过的前一帧。总长 `timeline.mjs:DURATION` 为 340。旧开场场景保留虚拟时钟，通过 `realTime` 与 `storyTime` 显式双向转换；迷宫、独立心跳、生活物件和音乐使用真实影片时间。不要把两个时钟混用。

九支生活短片统一在 `life-direction.mjs:LIFE_SHOTS`。其中 start/end 决定章长，p/q 为两个演化区间，scale/pitch/yaw 是近景相机参数，bpm/key/voice 是音乐配置，line 是字幕。改变时长要保留早期、中期、晚期各自可见的停留，随后重新生成配乐、字幕并更新播放器章点。

迷宫三个回归的唯一时间源是 `timeline.mjs:MAZE_RUNS`。路线数据在 `maze-world.mjs`，屏幕变化在 `maze-scene.mjs`。修改中心建筑后要检查通路净空；不能仅让一条发光线从墙面上穿过去。

## 独立心跳

`heart-records.mjs` 为每份记录建立独立固定种子，再为各次跳动生成间隔、强度、宽度及 P/Q/R/S/T 形态。固定种子是为了复现渲染，不表示画内循环播放同一拍。开场/末尾为 0 号，主档案近景为 53 号，阵列是 0–125 号，双节律为 0/1 号。

如果延长总时长，必须连同 record 的生成时间上限一起延长。脉冲的音画事件来自同一条 record；不能单独把音乐恢复成等距循环。DAY 从 13.75 秒开始，每 0.625 秒递增一次，它是日期意象而非真实医疗记录。

## 实体和组件

所有当前生活片段经 `lived-scenes.mjs` 调用 `life-models.mjs`，电话走 `telephone.mjs`。小物件在 `life-props.mjs`，实体基础在 `model-kit.mjs` / `solids.mjs`。旧 loom、vignettes、journeys 和 person helper 没有用于当前生活/迷宫画面。

三维投影后的绘制先区分物件组，再对组内面片排序。桌面上的杯与餐具必须在桌面之后绘制；后方门板要在前景箱子之前。仅凭平均深度的单一排序无法处理所有交叉遮挡，改动后要查看早、中、晚和跨阶段透明混合帧。

模型接触点使用场景坐标表达。桌面为 y=7；生活场景的地面约为 y=99。鞋、箱子轮子、椅腿、杯底与 CRT 支架应检查实际投影接触，不能只看几何尺寸合理。形态转变期间允许有设计上的渐显和穿越空间，完成状态要落稳。

## 音频

`composition-score.mjs` 导出 1,682 个事件，`tools/export-score.mjs` 写入 `audio/score.json`。`audio/synthesize.py` 合成五个 340 秒分轨及 source-mix，`tools/master-audio.mjs` 生成 24-bit 母带与 MP3。五分轨是预母带；不能直接相加当作已经过响度处理的 master。

迷宫 96 / 112 / 132 BPM 三次变奏、每段生活各自的 BPM 和音色都由绝对区间控制。修改后必须检查边界处有没有切掉尾音、无意重叠或过长空白。自动检查只验证信号与事件，不替代实际听音。

## 预览、输出、核验

1. 行为检查：`npm test`。
2. 任意跳转与镜头连续性：`node tools/verify-browser.mjs`。
3. 主体运动和连续图：`node tools/verify-motion.mjs`。
4. 音频分轨与事件：`python tools/verify-audio.py`。
5. 任意近景：`node tools/capture.mjs 164.5 169.5 176.5`。
6. 渲染：`node tools/render.mjs --width 3840 --workers 3 --samples 2 --crf 15`。
7. 观看副本：`node tools/make-viewing-copy.mjs`。
8. 实际编码检查：`node tools/verify.mjs`，包含逐帧解码、时间戳、原生样帧和离线播放器。
9. `node tools/finalize-notes.mjs` 根据通过的结果更新交付报告；`python tools/package.py` 对每个归档文件校验 CRC 和 SHA-256。

字幕由 `node tools/export-subtitles.mjs` 从当前时间轴导出；视频内的淡入淡出由渲染器决定，SRT 作为可编辑文本参考。

渲染器通过三个浏览器按精确帧号取图，以无损 PNG 输入 FFmpeg；每帧两个半帧曝光采样。最终 H.264 为有损编码，但没有前置 JPEG 帧损失。它是原生 4K 画布，1080p 观看版从 4K 缩小；不会把低清图片拉伸后标成原生 4K。

渲染开始时记录源文件和母带的 SHA-256。完成后若改变这些文件，最终校验会拒绝旧视频。修订应创建下一版本或重新完整导出，不要混用新源与旧媒体。

## 可迁移性

离线播放只需完整解压。重建需安装 `package.json` 指定的 Playwright、系统浏览器和 FFmpeg；可设置 `HEARTBEAT_BROWSER`、`FFMPEG_PATH`。脚本在制作机上能复用相邻历史工程运行时；不应依赖这些相邻路径在另一台机器上也存在。音乐重建另装 `audio/requirements.txt`。

`docs/earlier-research/` 是历史记录，里面的旧版本路径、时长及完成情况不适用于 v08。当前时间轴、说明和报告以本目录的 v08 文档为准。
