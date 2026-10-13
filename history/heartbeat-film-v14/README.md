# 心跳 v14

迷宫主段由约 69 秒压为 29 秒；配乐重新安排音符密度、低频和加速过程，保留乐器原音高。

末端 88.4 秒起，在持续运动中推近、逐渐模糊迷宫，始终不露出迷宫全貌。91.1 秒起出现大幅心电波，三次心搏分别在 92.1、93.2、94.3 秒。音乐渐退，95.9–98 秒保留黑屏与静音。生活画面在 98–99.2 秒柔和进入。

总长 161.7 秒，约 2 分 42 秒。生活演变和后续心脏段保持原动作，整体前移；160.2 秒停跳，模拟监护仪长鸣至 161.62 秒。

成片：`output/heartbeat-v14-1080p.mp4`、`output/heartbeat-v14-4k.mp4`。打开 `index.html` 可在本地播放和跳转。
旧版 v13 仍完整保留。按要求没有审片、试听或审核，由用户验收。

源码使用双时间：`src/timeline.mjs` 保存原始对象动作时间，`src/pacing.mjs` 保存本版播放时间。`tools/export-v14.mjs` 重剪相邻 v13 的原生4K成片，重新渲染本版转场并合成新音乐。旧工具仅为保留源码，不是本版出口。

重新制作：`node tools/export-score-v14.mjs`，`python audio/synthesize.py`，`node tools/master-audio.mjs`，然后 `node tools/export-v14.mjs`。
素材来源与许可见 `docs/credits.md`。
