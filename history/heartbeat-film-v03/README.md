# 心跳 · 活着的意义

> 历史方案：用户指出亮面造型有塑料感后，本版全片导出已经停止。`output` 中的 `.rendering.mp4` 是未完成的临时文件，不能当作成片。下文保留当时的设计和输出约定；后续图形重做见相邻 `heartbeat-film-v04`。

[参考学习内容已按作者要求省略。]

## 观看与保存

完整解压工程包后双击 `index.html`，可播放、全屏和跳转九个章节。播放器默认使用 1080p 观看版；底部提供原生 4K 成片和原创配乐的保存入口。

- `output/heartbeat-v03-4k.mp4`：原生 3840×2160、30 fps、90 秒；H.264 CRF 15 / slow，BT.709 limited，AAC 320 kbps 立体声。
- `output/heartbeat-v03-1080p.mp4`：从该 4K 成片高质量缩小的观看版。
- `audio/generated/master.wav`：48 kHz / 24-bit 双声道母带。
- `audio/generated/stem-*.wav`：五个等长、可另行混音的原创预母带分轨。

不需要联网即可播放已有成片；4K 播放流畅程度取决于设备解码能力。源文件是实体三维渲染，并非将上一版 MP4 放大。

## 重建

已验证环境为 Windows、Node.js 24、Edge WebGL2、Three.js 0.180.0、Playwright 1.58.2、FFmpeg 7.1。Python 配乐合成需要 NumPy。第三方 Three.js 模块已收录于 `vendor/three`，MIT 许可证一同保留。

```powershell
npm install
node tools/export-score.mjs
python -m pip install -r audio/requirements.txt
python audio/synthesize.py
$env:FFMPEG_PATH = '你的ffmpeg.exe完整路径'
node tools/master-audio.mjs
node tools/verify-browser.mjs
node tools/render.mjs --width 3840 --workers 2 --samples 2 --out heartbeat-v03-4k.mp4
node tools/make-viewing-copy.mjs
node tools/verify.mjs
python tools/package.py
```

`HEARTBEAT_BROWSER` 可指定 Chrome / Edge 的完整路径。`FFMPEG_PATH` 不设置时查找已有工作区工具或系统 PATH。三维源文件通过本地 HTTP 服务载入：`node tools/serve.mjs`，访问控制台打印的地址；`render.html` 为确定性定帧渲染入口，`index.html` 为成片播放器。

画面参数：`src/forms.mjs` 中定义保持索引的 24 个主体层片；`materials.mjs` 定义原创反射环境与材料；`film.mjs` 管理镜头、灯光、几何、事件与文字；`lens.mjs` 和 `shutter.mjs` 处理原生分辨率景深与线性 HDR 时间采样。`src/score.mjs` 是声音和画面共享的 600 项事件表。

字幕使用 Windows 自带宋体、微软雅黑和 Times New Roman；字体文件没有打包。在其他系统重建时字体替换可能改变字形与排版。视频已固定字体外观，不受播放设备影响。

本片有意保留少量空白、重复、缺口与未解决和声；这属于新主旨的表达。几何、音乐、棚灯和表面纹理为本工程原创，参考作品源码、图像、音乐不在交付包中。没有把技术检查视为艺术质量证明；实际验收记录见 `output/verification/`。
