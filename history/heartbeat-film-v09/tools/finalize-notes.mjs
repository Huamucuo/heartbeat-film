import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {root} from './runtime.mjs';
const read=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const [d,r,b,m,a]=await Promise.all(['output/verification/delivery.json','output/heartbeat-v08-4k-render.json','output/verification/browser.json','output/verification/motion.json','output/verification/audio-stems.json'].map(read));
for(const v of [d,b,m,a])assert.equal(v.passed,true);
assert.equal(d.duration,340);assert.equal(r.frames,10200);
const doc=`# v08 交付记录

本次交付为《心跳 · 活着的意义》v08，5 分 40 秒，十八章。开场和档案心跳逐拍变化；三次真实迷宫回归配合变拍；九支生活短片各有旧状态、变化及余韵。没有人体模型。

## 文件

| 成片 | 尺寸 | 帧数 | 大小 |
|---|---|---|---|
${d.videos.map(v=>`| ${v.file} | ${v.width}×${v.height} | ${v.frames.toLocaleString('en-US')} | ${(v.bytes/1048576).toFixed(1)} MiB |`).join('\n')}

两份视频均为 30 fps、H.264、yuv420p、limited BT.709，音频 AAC / 48 kHz / 双声道。4K 原生画布，每帧两个时间样本，无损 PNG 中间帧，H.264 CRF ${r.crf}；1080p 由 4K 缩小。

## 实际检查

- 两份成片各自逐帧解码，时间戳连续；不是仅检查文件存在或容器长度。
- ${d.videos.map(v=>`${v.file} 有 ${v.uniqueFrameHashes} 个不同解码帧，最长相同帧连续 ${v.maxRepeatedFrames} 帧`).join('；')}。
- 从实际 4K 成片提取 ${d.extractedNative4KFrames} 张原生样帧，含十八章交界的前后帧；对应连续图在 output/verification/encoded-*.png。
- 最终音轨实测 ${d.audio.integratedLUFS} LUFS，真峰值 ${d.audio.truePeakDBTP} dBTP，响度范围 ${d.audio.loudnessRangeLU} LU。
- 本地 file:// 播放、真实播放推进、十八章跳转、原生 4K 跳转和窄屏布局检查通过。
- ${b.determinism.length} 处确定性跳转、${b.boundaries.length} 处转场边界、${m.subjectMotion.length} 处主体运动抽查通过；页面错误为零。
- 五条完整配乐分轨通过，分轨重建误差上限 ${a.stemSumMaxAbsoluteDifference}。预母带空白与迷宫高潮所选区间差 ${a.quietToMazeCrescendoRMSDifferenceDB.toFixed(4)} dB。
- 成片渲染源与母带的 SHA-256 已在交付检查时核对，匹配本版文件。

源文件、模型、音乐事件、母带、五分轨、字体许可、字幕、播放器和研究说明一并交付。ZIP 内的 manifest.json 逐项列出文件摘要；开发目录 output/verification/package.json 记录归档 CRC 与逐文件 SHA-256 核验。

最后一次独立组件复核查看 164.5、169.5、176.5 秒，确认台灯、CRT、笔记本与桌面的连接问题消除，该范围内没有剩余 Important / Critical 项。

技术检查和抽帧不等于完整主观听音或艺术水平认证。仍保留风格化面片语言，不声称写实模型、光线追踪或达到主参考的审美标准。原始记录见 delivery.json、browser.json、motion.json、audio-stems.json。
`;
await writeFile(path.join(root,'docs/delivery-v08.md'),doc,'utf8');
console.log('Saved verified delivery notes.');
