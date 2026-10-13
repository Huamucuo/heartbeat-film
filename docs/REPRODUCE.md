# 运行、改动与复现

## 环境与素材

安装 Node.js 20+、Python 3.10+、FFmpeg。项目依赖锁定 Playwright 1.58.2。执行 `npm ci`、`npx playwright install chromium`。如使用本机浏览器，通过环境变量 `HEARTBEAT_BROWSER` 指定可执行文件；FFmpeg 不在 PATH 时设置 `FFMPEG_PATH`。

执行 `python tools/restore-media.py --film` 下载并校验 v16 的运行素材和 1080p 成片。已校验的文件不会重复覆盖。也可先手动下载 Releases 文件，再用 `--local-dir 下载目录` 从本地还原。至少预留运行包、解压文件与视频所需空间。

运行 `npm run preview`，浏览器打开打印的地址：

- `/index.html` 播放已完成的原成片。
- `/preview.html` 从当前源码实时绘制，有播放和拖动时间功能；其效果与历史拼接成片可能存在局部差异。

## 局部和全片绘制

`npm run sample` 导出 93.9–95.1 秒的 1080p 心电过场。需要调整时可运行：

```sh
node tools/render.mjs --from 98 --to 102 --width 1920 --samples 2 --workers 1 --out life-sample.mp4
npm run render
```

支持 1920 或 3840 宽度，30 fps，1–4 个曝光采样，1–3 个浏览器工作进程。内存紧张时使用一个工作进程。渲染直接使用还原的最终混音，音频和画面按同一播放秒数截取。

## 还原当时最终导出方式

原 v16 成片保留 v15 的 0–93 秒和 96 秒以后的画面，仅替换三秒过场。要按相同方式重新导出：

```sh
python tools/restore-media.py
python tools/restore-media.py --only heartbeat-film-v15/output/heartbeat-v15-4k.mp4
npm run reproduce
```

此命令读取已还原的 v15 4K 文件，重新绘制当前心电区间，再使用相同分段与混音导出 1080p 和 4K。它依赖已公开的历史中间视频，这是原实际制作流程的一部分。不同浏览器或编码器版本可能改变像素和压缩结果；原视频文件的 SHA-256 是原始发行物的依据，不承诺跨平台逐字节再现。

## 音乐与分轨

`audio/score.json` 保存实际事件与配器；`audio/synthesize.py` 保存从采样和振荡器合成分轨的方法。Python 依赖在 `audio/requirements.txt`。使用 `python -m pip install -r audio/requirements.txt` 后可研究并重新合成；执行前保留原混音，因为该脚本写入 audio/generated。

最终音频实际保留了旧版的部分 PCM，再局部修补心搏。简单重新运行当前合成器不会逐字节等同最终修补文件。原有分轨、混音、增益报告及各版本修补脚本均归档。需要研究严格修补链时还原 v13、v15、v16 历史目录并读相应 README 与工具脚本。旧脚本中的环境路径只代表当时机器配置，需要改成自己的 FFmpeg／浏览器路径；这些历史快照不冒充跨平台一键工具。

## 全部历史

```sh
python tools/restore-media.py --history --edition heartbeat-film-v13
python tools/restore-media.py --all
```

源码及媒体恢复到 `archive/workspace/heartbeat-film...`。全部历史体积较大，执行前查看 `release-assets.json` 和磁盘容量。归档采用内容去重，同一媒体可能恢复到多个原始版本路径。下载 ZIP 的 SHA-256 和每个恢复文件的 SHA-256 均会检查。

不要批量执行历史工具：部分为旧版一次性修补、打包或当时的检查脚本。学习其参数与前提后再操作副本。公开整理只增加便携入口与文档，没有改变已发布的原视频。
