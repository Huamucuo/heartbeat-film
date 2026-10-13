"""Check score export and the five same-length compositing stems."""
import json
from pathlib import Path
import wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SR=48000
DURATION=196

def read_stereo(p):
    with wave.open(str(p),'rb') as w:
        assert w.getframerate()==SR and w.getnchannels()==2
        assert w.getnframes()==SR*DURATION and w.getsampwidth()==2
        return np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(np.float32)/32768

def db(v):return float(20*np.log10(max(float(v),1e-12)))

def main():
    (ROOT/'output/verification').mkdir(parents=True,exist_ok=True)
    score=json.loads((ROOT/'audio/score.json').read_text(encoding='utf8'))
    tracks={name:read_stereo(ROOT/f'audio/generated/stem-{name}.wav') for name in ['pulse','melody','harmony','percussion','detail']}
    raw=read_stereo(ROOT/'audio/generated/source-mix.wav')
    reconstruction=sum(tracks.values())
    # The mix removes a tiny DC offset before quantization. Preserve that
    # distinction; stems are editable pre-master buses, not a mastered sum.
    max_delta=float(np.max(np.abs(reconstruction-raw)))
    assert max_delta<.001,('Stem reconstruction mismatch',max_delta)
    track_report={k:{'peakDBFS':db(np.max(np.abs(x))),'rmsDBFS':db(np.sqrt(np.mean(x*x))),'seconds':DURATION,'sampleRate':SR,'channels':2} for k,x in tracks.items()}
    assert all(v['peakDBFS']<0 and v['rmsDBFS']>-65 for v in track_report.values())
    sections=[]
    for ch in score['chapters']:
        x=raw[round(ch['start']*SR):round(ch['end']*SR)]
        sections.append({'title':ch['zh'],'start':ch['start'],'end':ch['end'],'rmsDBFS':db(np.sqrt(np.mean(x*x)))})
    quiet=raw[125*SR:130*SR];chorus=raw[107*SR:118*SR]
    difference=db(np.sqrt(np.mean(chorus*chorus)))-db(np.sqrt(np.mean(quiet*quiet)))
    assert difference>6,'Listening passage should create audible dynamic room'
    assert all(not (119<=e['time']<131) for e in score['events'] if e['voice'] in ['heart','other'])
    assert [s['bpm'] for s in score['tempoSections'][1:4]]==[96,112,132]
    report={'passed':True,'duration':DURATION,'tempoSections':score['tempoSections'],'stems':track_report,'preMasterSections':sections,'quietToMazeCrescendoRMSDifferenceDB':difference,'stemSumMaxAbsoluteDifference':max_delta,'note':'Signal and alignment checks only; no claim of subjective music listening.'}
    (ROOT/'output/verification/audio-stems.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps(report,ensure_ascii=False,indent=2))

if __name__=='__main__':main()

