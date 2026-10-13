# 来源与许可

[参考学习内容已按作者要求省略。]

钢琴录音：**Salamander Grand Piano v3 — Alexander Holm**，Yamaha C5 采样。

- 来源：https://github.com/sfzinstruments/SalamanderGrandPiano
- 固定提交：3382bf9496bba2486f5ab0de55a264d1dfc38404
- 许可证：Creative Commons Attribution 3.0 Unported，https://creativecommons.org/licenses/by/3.0/
- 本项目的修改：选取音区及力度层、对齐录音起音、按上游数据调音、变调采样、低通滤波、时值包络、混响和原创乐句混音。并非采样作者参与或认可本片。
- 下载文件、SHA-256 与确切地址见 audio/instruments/salamander/provenance.json；完整许可随同提供。

字体：Noto Serif SC，SIL Open Font License；随 assets/fonts 提供原许可证。

[参考学习内容已按作者要求省略。]

## v15 实测心电
93.3–95.8 秒的红色心电图使用 **MIT-BIH Arrhythmia Database (version 1.0.0), record 100, MLII** 的单个实测心搏。
- 作者：George Moody、Roger Mark (2005)，PhysioNet，https://doi.org/10.13026/C2F305
- 数据集：https://physionet.org/content/mitdb/1.0.0/
- 许可：Open Data Commons Attribution License v1.0，https://opendatacommons.org/licenses/by/1-0/
- This work contains information from the MIT-BIH Arrhythmia Database, which is made available here under the Open Data Commons Attribution License (ODC-By) v1.0.
- 处理：截取 MLII 单次心搏，去除线性端点基线，保留原始 360 Hz 采样时间；显示为红色扫线，两侧延伸水平基线。不是拟合或手绘波峰，没有重复该搏动。心搏声音为另行合成的声音效果，并非由心电图测得的心音。
- 原始文件及许可保存在 assets/ecg；精确样本范围和 SHA-256 见 provenance.json。数据作者不为本片背书。
- 原始论文：Moody GB, Mark RG. The impact of the MIT-BIH Arrhythmia Database. IEEE Engineering in Medicine and Biology 20(3):45–50 (2001). https://doi.org/10.1109/51.932724
- PhysioNet 平台引用：Pollard T et al. (2026). PhysioNet as a global platform for biomedical research. Nature Health. https://doi.org/10.1038/s44360-026-00096-z

v16 更新：同一段实测样本的空间形状保留，扫线播放压缩为 0.4 秒，增加自发光和拖影；这是加速艺术呈现，并非实时监护速度。v15 的“原始采样时间”仅指所引用的数据，不再描述本版的播放速度。
