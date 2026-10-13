# 来源、许可与署名

## Salamander Grand Piano v3

作者 **Alexander Holm**，Yamaha C5 钢琴录音。上游：https://github.com/sfzinstruments/SalamanderGrandPiano ，固定版本 `3382bf9496bba2486f5ab0de55a264d1dfc38404`。

许可 **CC BY 3.0 Unported**：https://creativecommons.org/licenses/by/3.0/ 。原许可、素材地址和 SHA-256 保存在 `audio/instruments/salamander/`。本项目使用部分力度层与音域，进行起音对齐、调音、变调、包络、滤波、混响和原创乐句混音。采样作者没有参与或认可本片。

## Noto Serif SC

原始字体采用 **SIL Open Font License 1.1**，未修改。字体和完整许可位于 `assets/fonts/`，来源：https://github.com/google/fonts/tree/main/ofl/notoserifsc 。早期工程还使用系统字体；这些系统字体文件未分发，历史重新渲染的字形可能取决于本机字体。

## MIT-BIH Arrhythmia Database

George Moody、Roger Mark（2005），版本 1.0.0，record 100，MLII。https://doi.org/10.13026/C2F305 ，数据：https://physionet.org/content/mitdb/1.0.0/ 。许可 **Open Data Commons Attribution License v1.0**：https://opendatacommons.org/licenses/by/1-0/ 。

This work contains information from the MIT-BIH Arrhythmia Database, which is made available here under the Open Data Commons Attribution License (ODC-By) v1.0.

本片截取一次心搏，去除线性端点基线并加速显示，添加红色发光和拖影。数据采样为 360 Hz，成片扫线约 0.4 秒，不是实时监护速度。心搏声音另行合成，不能当成由该心电记录测得的心音。原文件、范围、处理与校验记录位于 `assets/ecg/`。

论文：Moody GB, Mark RG. The impact of the MIT-BIH Arrhythmia Database. IEEE Engineering in Medicine and Biology 20(3):45–50 (2001). https://doi.org/10.1109/51.932724 。数据作者不为本片背书。

## 软件

- 历史第一版包含 Three.js 0.180.0，MIT，原文件与许可位于 `history/heartbeat-film/assets/vendor/`。
- Playwright 1.58.2，Apache-2.0，作为安装依赖使用。
- NumPy 2.3.5，用于原创声音合成，作为安装依赖使用。
- FFmpeg 与浏览器作为外部运行工具，不随仓库分发二进制；按所安装发行版的许可使用。

本项目自己的源码、媒体与过程文档的许可范围分别见 LICENSE 和 CONTENT-LICENSE.md。历史文件中的旧素材说明对应当时版本，应结合本文件理解后续增加的素材。
