"""Original procedural score. No samples, reference audio or external synths.

Generate with the shared JSON event score, keeping preroll and reverb before
cropping source intervals. NumPy is the only non-standard Python dependency.
"""
import json
import math
import wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RATE = 48000
DURATION = 92

def midi(note):
    return 440 * 2 ** ((note - 69) / 12)

def pan_gains(pan):
    angle = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.cos(angle), np.sin(angle)

def write_wav(path, samples):
    if not np.isfinite(samples).all():
        raise ValueError('Non-finite audio')
    if np.abs(samples).max() > 0.999:
        raise ValueError(f'Would clip {path}')
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as f:
        f.setparams((2, 2, RATE, len(samples), 'NONE', 'not compressed'))
        f.writeframes(np.rint(samples * 32767).astype('<i2').tobytes())

def place(stem, signal, when, amp, pan):
    start = round(when * RATE)
    n = min(len(signal), len(stem) - start)
    if n <= 0:
        return
    left, right = pan_gains(pan)
    if np.ndim(left):
        left, right = left[:n], right[:n]
    stem[start:start+n, 0] += signal[:n] * amp * left
    stem[start:start+n, 1] += signal[:n] * amp * right

def pulse(event, rng):
    t = np.arange(round(event['duration']*RATE), dtype=np.float64)/RATE
    is_reply = event['voice'] == 'reply'
    # A rounded chest-like double impulse, without a sharp drum-machine click.
    f0 = 90 if is_reply else 67
    phase = 2*np.pi*(f0*t + 16*.026*(1-np.exp(-t/.026)))
    body = np.sin(phase) * np.exp(-t/.135)
    wood = np.sin(2*np.pi*(143 if is_reply else 116)*t+.3)*np.exp(-t/.040)*.19
    env = 1-np.exp(-t/.004)
    signal = (body+wood)*env*.45
    if event['voice'] == 'arrival':
        signal += np.sin(2*np.pi*110*t)*np.exp(-t/.65)*(1-np.exp(-t/.009))*.12
    return signal.astype(np.float32)

def felt(event):
    t=np.arange(round(event['duration']*RATE))/RATE
    freq=midi(event['note'])
    signal=np.zeros(len(t),dtype=np.float64)
    for h,amp,decay in [(1,1,1.45),(2,.23,.95),(3,.065,.52),(4,.017,.28)]:
        signal += amp*np.sin(2*np.pi*freq*h*(1+.0001*h)*t)*np.exp(-t/decay)
    signal += .12*np.sin(2*np.pi*(freq+.7)*t)*np.exp(-t/1.7)
    signal *= (1-np.exp(-t/.011))*.22
    return signal.astype(np.float32)

def room(dry, wet=.3):
    out=dry.copy()
    # Unequal prime-like delay taps provide a reproducible, soft stereo room.
    for i,delay in enumerate([.071,.113,.179,.239,.307,.397,.503,.631,.797,.983,1.211,1.487,1.811,2.171,2.563]):
        shift=round(delay*RATE)
        gain=wet*math.exp(-delay/1.0)*(.51 if i<5 else .34)
        src=dry[:-shift, ::-1] if i%2 else dry[:-shift]
        out[shift:] += src*gain
    return out

def generate():
    score=json.loads((ROOT/'audio/score.json').read_text(encoding='utf-8'))
    n=DURATION*RATE
    stems={name:np.zeros((n,2),np.float32) for name in ['pulse','felt','air','path']}
    rng=np.random.default_rng(241011)
    for e in score['events']:
        if e['voice'] in ['pulse','reply','arrival']:
            place(stems['pulse'],pulse(e,rng),e['time'],e['amp'],e['pan'])
        elif e['voice']=='felt':
            place(stems['felt'],felt(e),e['time'],e['amp'],e['pan'])
        elif e['voice']=='path':
            t=np.arange(round(e['duration']*RATE))/RATE
            env=np.sin(np.pi*t/e['duration'])**1.4
            carrier=np.sin(2*np.pi*(440*t-64*t*t))+.23*np.sin(2*np.pi*880*t)
            signal=(carrier*env*.075).astype(np.float32)
            place(stems['path'],signal,e['time'],e['amp'],np.linspace(.62,-.21,len(t)))

    # Long breaths, not beat-triggered brightness. No pad reset at the excerpts.
    for start,end,chord in [(0,33,[45,52,59,60]),(30,50,[48,55,59,64]),(47,60,[45,52,59]),(57,92,[45,52,59,62])]:
        length=round((end-start)*RATE)
        t=np.arange(length,dtype=np.float64)/RATE
        envelope=np.minimum(np.clip(t/3,0,1),np.clip((end-start-t)/4,0,1))
        envelope=np.sin(envelope*np.pi/2)**2
        for k,note in enumerate(chord):
            freq=midi(note)
            signal=(np.sin(2*np.pi*freq*t+.3*k)+.3*np.sin(2*np.pi*freq*2*t+.9*k))
            signal+=.33*np.sin(2*np.pi*(freq+.19)*t)
            signal*=envelope*(.82+.18*np.sin(t*.7+k))*.013
            place(stems['air'],signal.astype(np.float32),start,1,(-.58 if k%2 else .58))
    # Low, diffuse breath noise is quiet enough to make the missing beat audible.
    for start in range(0,DURATION,4):
        count=min(4*RATE,n-start*RATE)
        knots=rng.normal(0,1,max(4,count//240+2))
        noise=np.interp(np.arange(count)/240,np.arange(len(knots)),knots)
        env=np.sin(np.pi*np.arange(count)/count)**2
        noise=(noise*env*.00075).astype(np.float32)
        place(stems['air'],noise,start,1,0)

    stems['pulse']=room(stems['pulse'],.12)
    stems['felt']=room(stems['felt'],.43)
    stems['path']=room(stems['path'],.22)
    # A shared gain for both excerpts preserves their dramatic level difference.
    raw=sum(stems.values())
    gain=min(1.45,.80/float(np.abs(raw).max()))
    raw*=gain
    report={'rate':RATE,'sourceDuration':DURATION,'gain':gain,'seed':241011,'clips':[]}
    out=ROOT/'audio/generated'
    out.mkdir(parents=True,exist_ok=True)
    write_wav(out/'source-mix.wav',raw)
    for ex in score['excerpts']:
        a,b=round(ex['start']*RATE),round(ex['end']*RATE)
        part=raw[a:b].copy()
        # Only excerpt edges get a tiny anti-click taper; events retain exact positions.
        fade=np.linspace(0,1,240,dtype=np.float32)
        part[:240]*=fade[:,None];part[-240:]*=fade[::-1,None]
        write_wav(out/(ex['id']+'.wav'),part)
        for name,data in stems.items():
            write_wav(out/(ex['id']+'-'+name+'.wav'),data[a:b]*gain)
        report['clips'].append({'id':ex['id'],'samples':len(part),'seconds':len(part)/RATE,'peakDbFS':20*math.log10(float(np.abs(part).max())),'rmsDbFS':20*math.log10(float(np.sqrt(np.mean(part**2))))})
    (out/'synthesis-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print(json.dumps(report,indent=2))

if __name__=='__main__':
    generate()
