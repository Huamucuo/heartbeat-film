"""Tighten only the isolated transition heartbeat; retain the v15 mastered PCM.

No remix, loudness pass, listening pass or review. The original oscillator,
pitch, level and attack are reused. A shorter primary release and a closer
secondary beat fit the new fleeting ECG sweep.
"""
import hashlib
import importlib.util
import json
import struct
import subprocess
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
PREVIOUS = ROOT.parent / 'heartbeat-film-v15'
OUT = ROOT / 'audio/generated'
SR = 48000
PATCH_START, PATCH_END = 93.3, 95.8
PRIMARY, SECONDARY = 94.25, 94.39
FFMPEG = ROOT.parent / 'heartbeat-film/tools/python-deps/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'


def pcm_data(wav, bits):
    if wav[:4] != b'RIFF' or wav[8:12] != b'WAVE':
        raise ValueError('Expected a PCM WAV source')
    p, fmt, data = 12, None, None
    while p + 8 <= len(wav):
        tag, size = wav[p:p + 4], struct.unpack_from('<I', wav, p + 4)[0]
        if tag == b'fmt ':
            fmt = (struct.unpack_from('<H', wav, p + 10)[0],
                   struct.unpack_from('<I', wav, p + 12)[0],
                   struct.unpack_from('<H', wav, p + 22)[0])
        elif tag == b'data':
            data = (p + 8, size)
        p += 8 + size + (size % 2)
    if fmt != (2, SR, bits) or data is None:
        raise ValueError('Unexpected WAV format for a direct PCM patch')
    return data


def patch_file(name, segment, bits):
    source = PREVIOUS / 'audio/generated' / name
    wav = bytearray(source.read_bytes())
    offset, size = pcm_data(wav, bits)
    stride = 2 * bits // 8
    start = offset + round(PATCH_START * SR) * stride
    end = offset + round(PATCH_END * SR) * stride
    if len(segment) != end - start or end > offset + size:
        raise ValueError('Bridge PCM length does not match its replacement span')
    wav[start:end] = segment
    (OUT / name).write_bytes(wav)
    return wav


spec = importlib.util.spec_from_file_location('heartbeat_synthesis', ROOT / 'audio/synthesize.py')
synth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(synth)
score = json.loads((PREVIOUS / 'audio/score.json').read_text(encoding='utf8'))
score['edition'] = 'v16'
bridge = [e for e in score['events'] if e.get('bridgeHeart')]
if len(bridge) != 2:
    raise ValueError('Expected the single existing two-component lub-dub')
for event in bridge:
    if event.get('primary'):
        event.update(time=PRIMARY, duration=.45)
    else:
        event.update(time=SECONDARY, duration=.26)
score['events'].sort(key=lambda e: (e['time'], e['id']))
score['bridgeHeartbeat'] = PRIMARY
score['bridgeSecondaryHeartbeat'] = SECONDARY
score['bridgeHeartbeatEnd'] = PRIMARY + .45
score['arrangement'] = score['arrangement'].replace('94.25 / 94.41', '94.25 / 94.39')
score['arrangement'] += ' v16 retains all v15 music. Only the isolated bridge lub-dub is tightened to 450 ms / 260 ms, with the second component at 94.39 s; original sound and fixed gain retained.'
(ROOT / 'audio/score.json').write_text(json.dumps(score, indent=2, ensure_ascii=False), encoding='utf8')

old_synthesis = json.loads((PREVIOUS / 'audio/generated/synthesis-report.json').read_text(encoding='utf8'))
old_master = json.loads((PREVIOUS / 'audio/generated/master-report.json').read_text(encoding='utf8'))
segment = np.zeros((round((PATCH_END - PATCH_START) * SR), 2), np.float32)
rng = np.random.default_rng(261012)
for event in bridge:
    sound, _ = synth.effect(event, rng)
    start = round((event['time'] - PATCH_START) * SR)
    segment[start:start + len(sound)] += sound * event['amp'] * event.get('mixGain', 1)
segment *= old_synthesis['gain']
pcm16 = np.rint(segment * 32767).astype('<i2').tobytes()
patch_file('stem-bridge.wav', pcm16, 16)
patch_file('source-mix.wav', pcm16, 16)

# Apply exactly the previously established constant mastering gain to this
# segment alone. The rest of the v15 24-bit master is copied byte for byte.
conversion = subprocess.run([
    str(FFMPEG), '-hide_banner', '-nostdin', '-v', 'error',
    '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', 'pipe:0',
    '-af', f"volume={old_master['gainDB']}dB", '-c:a', 'pcm_s24le',
    '-f', 's24le', 'pipe:1'
], input=pcm16, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
   check=True, creationflags=0x08000000)
master = patch_file('master.wav', conversion.stdout, 24)
subprocess.run([
    str(FFMPEG), '-hide_banner', '-nostdin', '-v', 'error', '-y',
    '-i', str(OUT / 'master.wav'), '-c:a', 'libmp3lame', '-b:a', '256k',
    str(OUT / 'heartbeat-score.mp3')
], check=True, creationflags=0x08000000)

report = {
    **old_master,
    'edition': 'v16',
    'processing': 'Only the dry isolated bridge heartbeat is shortened: 94.25 s primary lasts 450 ms; 94.39 s secondary lasts 260 ms. Original oscillator, pitches, attacks, amplitudes and fixed mastering gain retained. No other music or audio edits.',
    'preservation': {
        'source': str(PREVIOUS / 'audio/generated/master.wav'),
        'method': 'Original RIFF bytes copied; only the named PCM span replaced.',
        'unchangedPCMRangesSeconds': [[0, PATCH_START], [PATCH_END, score['duration']]],
        'patchRangeSeconds': [PATCH_START, PATCH_END]
    },
    'bridgePrimary': {'time': PRIMARY, 'duration': .45},
    'bridgeSecondary': {'time': SECONDARY, 'duration': .26},
    'masterSHA256': hashlib.sha256(master).hexdigest(),
    'review': 'No listening, audit or review pass, per user instruction.'
}
(OUT / 'master-report.json').write_text(json.dumps(report, indent=2), encoding='utf8')
old_synthesis.update(
    edition='v16',
    processing=report['processing'],
    scoreSha256=hashlib.sha256((ROOT / 'audio/score.json').read_bytes()).hexdigest(),
    regeneration='Only bridge stem and matching source-mix span were replaced; other v15 stems retained.'
)
(OUT / 'synthesis-report.json').write_text(json.dumps(old_synthesis, indent=2), encoding='utf8')
print(json.dumps({'master': str(OUT / 'master.wav'), 'music': 'v15 preserved',
                  'primary': PRIMARY, 'secondary': SECONDARY, 'audibleEnd': 94.7,
                  'patchRange': [PATCH_START, PATCH_END], 'gainDB': old_master['gainDB']}))
