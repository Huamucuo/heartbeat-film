# 心跳 · Heartbeat

一部关于「活着的意义」的原创图形音乐短片。没有旁白，画面、文字与音乐共同讲述。制作：**Huamucuo × Codex**。

**v16 成片：161.7 秒，30 fps，原生 4K 与 1080p。** 从早期抽象图形，到生活物件、迷宫、并行的日常与代码心脏，这里公开实际留下的制作过程、最终源码、精选样片与关键帧、音乐分轨、封面和最终视频。

![封面](covers/bilibili-cover.jpg)

## 观看与下载

- [1080p 成片](https://github.com/Huamucuo/heartbeat-film/releases/download/v16.0.0/heartbeat-v16-1080p.mp4)
- [4K 成片](https://github.com/Huamucuo/heartbeat-film/releases/download/v16.0.0/heartbeat-v16-4k.mp4)
- [运行素材与精选迭代案例](https://github.com/Huamucuo/heartbeat-film/releases/tag/v16.0.0)

本次公开“最终版完整工程＋制作过程说明＋精选迭代案例”。最终视频与运行素材存放在 Releases；源码和过程记录在仓库中。全部旧版完整视频、重复截图与中间音频保留本地，不重复上传。`media-manifest.json` 只列本次发布媒体，提供路径与 SHA-256。

## 从哪里开始学习

| 入口 | 内容 |
|---|---|
| [制作过程](docs/PRODUCTION.md) | 主题如何变成场景、实际迭代及重要取舍 |
| [精选案例](docs/ITERATIONS.md) | 少量原始片段、截图及对照时间位置 |
| [实际对话](process/conversation.md) | 可用的用户反馈与助手公开回复，按发生顺序排列 |
| [实际工具指令](process/tool-calls.jsonl) | 与制作有关的实际工具输入；不是模型内部推理 |
| [历史源码](history/) | 从第一版到 v16 的现存源码快照，非事后编造的 Git 提交历史 |
| [运行与复现](docs/REPRODUCE.md) | 预览、局部渲染、整片绘制及原导出方式说明 |
| [许可和素材](THIRD_PARTY.md) | 原创内容许可及字体、钢琴、心电数据的独立许可 |
| [归档范围](docs/ARCHIVE.md) | 保存范围、脱敏和现有记录的局限 |

## 快速运行

需要 Node.js 20 或以上、Python 3.10 或以上，以及可从命令行运行的 FFmpeg。浏览器由 Playwright 安装，也可通过 `HEARTBEAT_BROWSER` 指定本机浏览器。

```sh
npm ci
npx playwright install chromium
python tools/restore-media.py --film
npm run preview
```

打开终端显示的本地地址。还原脚本从本仓库 Releases 下载运行素材，校验哈希后恢复字体、钢琴采样和已完成混音。

```sh
# 先渲染一次瞬时心电过场，避免一开始就等待全片
npm run sample

# 当前源码从零绘制全部画面
npm run render
```

**原成片包含此前版本保留的画面。** 当前源码全片重绘不承诺逐像素等同历史拼接成片；原文件可直接下载；要修改作品，请按 [复现说明](docs/REPRODUCE.md) 使用当前源码重绘。精简发行不要求下载旧版完整视频。最终原文件的哈希见 `release-assets.json`。

## 创作与许可

实际制作是多轮交互与修改，代码、音频合成和部分封面生成使用了 AI。它不是一次提示完成的作品。封面生成提示词保存在 `covers/`；历史对话中的阶段性评价不代表最终验收结论。

原创代码采用 [MIT](LICENSE)，原创影音和文字内容采用 [CC BY 4.0](CONTENT-LICENSE.md)，在作者拥有相应权利的范围内授权。第三方字体、采样、心电数据和早期 Three.js 文件分别保留其许可；复用时须同时遵守。推荐署名：`心跳 / Heartbeat — Huamucuo`，并注明改动。

红色过场来自公开的实测心电数据片段，经过加速艺术呈现；它不是实时医疗监护展示，声音是独立合成效果。
