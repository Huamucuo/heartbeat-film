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

## 原成片与源码重绘的区别

当时的 v16 成片保留 v15 的 0–93 秒和 96 秒以后的画面，仅重新绘制并替换三秒过场。原操作脚本保留在 `history/heartbeat-film-v16/tools/`，用于说明真实制作方式。此次精简不分发 v15 完整视频，因此不提供依赖它的拼接复现命令。

下载 Release 中的 v16 MP4 可获得未经改动的原成片。`npm run render` 则使用当前完整源码和最终混音，从零绘制全片，不需要旧版成片；部分画面可能与历史保留区间不同。不同浏览器或编码器也可能改变像素与压缩结果，不承诺逐字节再现。原视频哈希见 `release-assets.json`。

## 音乐与分轨

`audio/score.json` 保存实际事件与配器；`audio/synthesize.py` 保存从采样和振荡器合成分轨的方法。Python 依赖在 `audio/requirements.txt`。使用 `python -m pip install -r audio/requirements.txt` 后可研究并重新合成；执行前保留原混音，因为该脚本写入 audio/generated。

最终音频实际保留旧版部分 PCM 并局部修补心搏。当前合成器可用于学习与重新编曲，但单独运行它不会逐字节等同最终修补的混音。运行包提供最终混音和分轨，使当前画面渲染不依赖旧音频版本。历史修补源码保留供理解流程，其依赖的全部中间音频不在本次发行内。

## 精选案例和历史源码

精选片段可直接下载、解压 `selected-iterations.zip`；具体文件和对照时间见 [ITERATIONS.md](ITERATIONS.md)。也可按媒体清单恢复已公开的版本案例：

```sh
python tools/restore-media.py --history --edition heartbeat-film-v05
python tools/restore-media.py --all
```

第一条只恢复该版本被选中的媒体和历史源码，不是完整旧工程媒体。`--all` 恢复本次 Release 清单内的所有文件至 `archive/workspace/`，不代表全部历史版本。默认不带这些参数时，运行素材恢复到根目录，供当前预览与渲染使用。`--only` 只接受本次 `media-manifest.json` 内列出的原始路径。

不要批量执行历史脚本：一些是一次性修补、打包或检查入口，会依赖未公开的旧版媒体。当前可运行入口以根目录 package.json 为准。此次整理不改变原成片。
