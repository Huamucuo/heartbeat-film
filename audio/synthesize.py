"""Original piano score with attributed, locally decoded Salamander samples.
No cloud generation. Audio and picture use score.json's absolute seconds.
"""
import json,math,wave,subprocess,hashlib,os
from pathlib import Path
from functools import lru_cache
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SR=48000
TAU=2*np.pi
FFMPEG=os.environ.get('FFMPEG_PATH','ffmpeg')
LIB=ROOT/'audio/instruments/salamander'
ROOT_NOTES=list(range(33,79,3))
NAMES=['A1','C2','D#2','F#2','A2','C3','D#3','F#3','A3','C4','D#4','F#4','A4','C5','D#5','F#5']
TUNING=[-9,-9,-11,-7,-4,0,-6,-3,-3,-6,-3,0,-4,-8,-8,-5]
def write_wav(path,data):
    if not np.isfinite(data).all() or np.max(np.abs(data))>1:raise ValueError('Invalid audio')
    with wave.open(str(path),'wb') as w:
        w.setparams((2,2,SR,len(data),'NONE','not compressed'))
        w.writeframes(np.rint(data*32767).astype('<i2').tobytes())
@lru_cache(maxsize=48)
def sample(root,velocity):
    p=LIB/'Samples'/f'{NAMES[ROOT_NOTES.index(root)]}v{velocity}.flac'
    r=subprocess.run([str(FFMPEG),'-v','error','-i',str(p),'-f','f32le','-ar',str(SR),'-ac','2','-'],capture_output=True,check=True,creationflags=(0x08000000 if os.name=='nt' else 0))
    a=np.frombuffer(r.stdout,dtype='<f4').reshape(-1,2).copy()
    # Align the recorded hammer attack to the authored event, keeping its natural onset.
    peak=np.max(np.abs(a));energy=np.max(np.abs(a),axis=1)
    index=np.flatnonzero(energy>peak*.018)
    start=max(0,int(index[0])-round(.003*SR)) if len(index) else 0
    a=a[start:];a-=np.mean(a[-min(len(a),SR):],axis=0)
    # A short low-pass FIR softens close-mic brightness; the acoustic decay remains.
    cutoff=4100 if velocity==3 else 5200
    k=np.arange(41)-20;h=2*cutoff/SR*np.sinc(2*cutoff/SR*k)*np.hanning(41);h/=h.sum()
    for ch in range(2):a[:,ch]=np.convolve(a[:,ch],h,mode='same')
    ref=float(np.percentile(np.abs(a[:min(SR*2,len(a))]),99.8))
    a*=min(5,.26/max(ref,1e-5))
    return a
def piano(e):
    note=e['note'];root=min(ROOT_NOTES,key=lambda r:abs(note-r));velocity=e.get('velocity',3)
    a=sample(root,velocity);ratio=2**((note-root+TUNING[ROOT_NOTES.index(root)]/100)/12)
    seconds=e['duration']+.40;n=round(seconds*SR);idx=np.arange(n)*ratio
    sound=np.stack([np.interp(idx,np.arange(len(a)),a[:,k],left=0,right=0) for k in range(2)],axis=1).astype(np.float32)
    t=np.arange(n)/SR
    release=np.clip((seconds-t)/.46,0,1);envelope=np.minimum(t/.002,1)*np.sin(release*np.pi/2)**2
    sound*=envelope[:,None]
    return sound
def effect(e,rng):
    t=np.arange(round(e['duration']*SR))/SR;v=e['voice']
    if v=='heart':
        if e.get('codeHeart'):
            # The shared beat frequency falls from 59 to 33 Hz in daily life.
            # A restrained octave makes the low beat legible on small speakers.
            f=e['freq'];phase=TAU*(f*t+f*.25*.030*(1-np.exp(-t/.030)))
            a=(np.sin(phase)*np.exp(-t/.15)+.20*np.sin(phase*2+.16)*np.exp(-t/.095))*(1-np.exp(-t/.007))*.43
            a*=np.minimum((e['duration']-t)/.036,1)
        else:
            phase=TAU*(44*t+29*.034*(1-np.exp(-t/.034)))
            a=(np.sin(phase)*np.exp(-t/.13)+.08*np.sin(TAU*116*t)*np.exp(-t/.035))*(1-np.exp(-t/.007))*.34
        bus='pulse'
    elif v=='flatline':
        # A centered, unwavering electronic monitor-like tone. No vibrato,
        # musical partials, reverb or exponential decay; only anti-click edges.
        envelope=np.sin(np.clip(t/.002,0,1)*np.pi/2)**2
        envelope*=np.sin(np.clip((e['duration']-t)/.008,0,1)*np.pi/2)**2
        a=np.sin(TAU*e['freq']*t)*envelope*.085;bus='detail'
    elif v=='drive':
        f=440*2**((e['note']-69)/12);phase=TAU*f*t;bright=e.get('brightness',0)
        a=(np.sin(phase)+(.12+.17*bright)*np.sin(2*phase)+.10*bright*np.sin(3*phase))*.17
        a*=np.minimum(t/.004,1)*np.exp(-t/max(.07,e['duration']*.52))
        a*=np.sin(np.clip((e['duration']-t)/.018,0,1)*np.pi/2)**2;bus='percussion'
    elif v=='cyberBreak':
        # Bounded, band-limited static with irregular dropped digital fragments.
        # Keep this dry so its written 580 ms duration is also its audible end.
        held=np.repeat(rng.normal(size=(len(t)+5)//6),6)[:len(t)]
        low=np.convolve(held,np.hanning(25)/np.hanning(25).sum(),mode='same')
        static=np.convolve(held-low,np.hanning(7)/np.hanning(7).sum(),mode='same')
        grain=np.repeat(rng.uniform(.10,1,size=(len(t)+383)//384),384)[:len(t)]
        digital=np.sin(TAU*(470*t-230*t*t))*(np.sin(TAU*83*t)>.18)
        envelope=np.minimum(t/.002,1)*np.exp(-t/.17)
        envelope*=np.sin(np.clip((e['duration']-t)/.12,0,1)*np.pi/2)**2
        a=np.tanh(static*1.9+digital*.22)*grain*envelope*.19;bus='percussion'
    elif v=='return':
        a=(np.sin(TAU*1046*t)*.10+np.sin(TAU*1568*t)*.025)*np.exp(-t/.012)*(1-np.exp(-t/.0015));bus='percussion'
    elif v=='glitch':
        carrier=np.sin(TAU*317*t)+.3*np.sin(TAU*743*t)
        grain=(np.floor(t*700)%3==0).astype(float)
        a=carrier*grain*.05*np.sin(np.pi*t/e['duration'])**2;bus='detail'
    elif v=='wood':
        noise=rng.normal(size=len(t));kernel=np.hanning(25);kernel/=kernel.sum()
        a=(np.sin(TAU*187*t)*.08+np.sin(TAU*421*t)*.025+np.convolve(noise,kernel,mode='same')*.03)*np.exp(-t/.026)*(1-np.exp(-t/.002))
        bus='percussion'
    elif v=='impact':
        a=np.sin(TAU*55*t)*np.exp(-t/.37)*(1-np.exp(-t/.020))*.13;bus='detail'
    else:raise ValueError(v)
    return np.stack([a,a],axis=1).astype(np.float32),bus
def room(x,wet,seconds=1.9):
    # Dense, dark acoustic tail rather than a sequence of audible delay copies.
    rng=np.random.default_rng(91277);n=round(seconds*SR);t=np.arange(n)/SR
    out=x.copy();size=1<<(len(x)+n-1).bit_length()
    for ch in range(2):
        ir=rng.normal(size=n).astype(np.float32)
        ir=np.convolve(ir,np.ones(19)/19,mode='same').astype(np.float32)
        ir*=np.exp(-t*5.7/seconds)*np.minimum(t/.06,1);ir[:round(.026*SR)]=0
        ir*=.44/(np.sqrt(np.sum(ir*ir))+1e-9)
        for delay,gain in [(.039,.20),(.073,.15),(.117,.095)]:ir[round((delay+ch*.0027)*SR)]+=gain
        y=np.fft.irfft(np.fft.rfft(x[:,ch],size)*np.fft.rfft(ir,size),size)[:len(x)]
        out[:,ch]+=y.astype(np.float32)*wet
    return out
def main():
    score=json.loads((ROOT/'audio/score.json').read_text(encoding='utf8'))
    seconds=score['duration'];n=round(seconds*SR);rng=np.random.default_rng(261012)
    stems={k:np.zeros((n,2),np.float32) for k in ['pulse','melody','harmony','percussion','detail','build','bridge']}
    for index,e in enumerate(score['events']):
        if e.get('terminalTail'):continue
        if e['voice']=='piano':
            sound=piano(e);bus=e.get('bus','melody')
        else:sound,bus=effect(e,rng)
        if e.get('mazeBuild'):bus='build'
        if e.get('bridgeHeart'):bus='bridge'
        start=round(e['time']*SR);count=min(len(sound),n-start)
        if count<=0:continue
        pan=e.get('pan',0);balance=np.array([math.sqrt(1-max(0,pan)),math.sqrt(1+min(0,pan))],np.float32)
        stems[bus][start:start+count]+=sound[:count]*e['amp']*e.get('mixGain',1)*balance
    stems['melody']=room(stems['melody'],.21,1.8)
    stems['harmony']=room(stems['harmony'],.12,2.2)
    stems['detail']=room(stems['detail'],.15,1.7)
    stems['build']=room(stems['build'],.15,1.5)
    time=np.arange(n)/SR
    # Let the final harmony breathe out before the first black screen.
    build_release_seconds=score.get('mazeReleaseEnd',score['mazeBreak']+.11)-score['mazeBreak']
    build_release=np.cos(np.clip((time-score['mazeBreak'])/build_release_seconds,0,1)*np.pi/2)**2
    stems['build']*=build_release.astype(np.float32)[:,None]
    if 'bridgeMusicMuteStart' in score:
        fade_start=score['bridgeMusicFadeStart'];mute_start=score['bridgeMusicMuteStart'];mute_end=score['bridgeMusicMuteEnd']
        release=np.cos(np.clip((time-fade_start)/(mute_start-fade_start),0,1)*np.pi/2)**2
        release[time>=mute_end]=1
        release[(time>=mute_start)&(time<mute_end)]=0
        for name,x in stems.items():
            if name not in ['bridge','build']:x*=release.astype(np.float32)[:,None]
        # Silence the reverb bus exactly, rather than leaving a tiny cosine tail.
        stems['build'][round(mute_start*SR):round(mute_end*SR)]=0
    # Piano releases without global end-of-film gain automation. Heartbeats retain
    # their authored strength. At stop only the separately authored flatline remains.
    piano_release_start=score.get('pianoReleaseStart',182)
    piano_release_end=score.get('pianoReleaseEnd',184)
    piano_out=np.clip((piano_release_end-time)/(piano_release_end-piano_release_start),0,1).astype(np.float32)
    stems['melody']*=piano_out[:,None];stems['harmony']*=piano_out[:,None]
    stop=round(score['stopTime']*SR)
    for x in stems.values():x[stop:]=0
    for e in score['events']:
        if not e.get('terminalTail'):continue
        sound,bus=effect(e,rng);start=round(e['time']*SR);count=min(len(sound),n-start)
        stems[bus][start:start+count]+=sound[:count]*e['amp']
    audio_end=round(score.get('resonanceEnd',score['stopTime'])*SR)
    for x in stems.values():x[audio_end:]=0
    for start,end in score.get('silenceRanges',[]):
        for x in stems.values():x[round(start*SR):round(end*SR)]=0
    if 'silenceStart' in score:
        silence_start=round(score['silenceStart']*SR);silence_end=round(score['silenceEnd']*SR)
        for x in stems.values():x[silence_start:silence_end]=0
        # The life piano emerges with the picture after the intentionally black
        # pause. This envelope affects only its opening, never the ending beats.
        fade_end=score.get('lifeFadeInEnd',score['silenceEnd'])
        if fade_end>score['silenceEnd']:
            fade_end_frame=round(fade_end*SR)
            fade=np.sin(np.linspace(0,np.pi/2,fade_end_frame-silence_end,dtype=np.float32))**2
            for x in stems.values():x[silence_end:fade_end_frame]*=fade[:,None]
    raw=sum(stems.values());gain=min(2.5,.88/max(float(np.max(np.abs(raw))),1e-9))
    env=np.clip(time/.025,0,1).astype(np.float32)
    out=ROOT/'audio/generated';out.mkdir(parents=True,exist_ok=True)
    for k,x in stems.items():
        x*=gain*env[:,None];write_wav(out/f'stem-{k}.wav',x)
    raw=sum(stems.values());write_wav(out/'source-mix.wav',raw)
    report={'seconds':seconds,'sampleRate':SR,'samples':n,'channels':2,'events':len(score['events']),'gain':gain,'seed':261012,'stems':list(stems),'sampleLibrary':'Salamander Grand Piano v3 / Alexander Holm / CC BY 3.0','processing':'Spacious 96–116 BPM maze phrases; complete music and reverb release 88.4–92.2 s. One dry isolated lub-dub at 94.25 / 94.41 s; exact silent black pause 95.8–98 s, soft life-piano entry, fixed 1000 Hz terminal flatline with 8 ms release. Original retuned acoustic pitches; life and ending retain natural acoustic lengths.','scoreSha256':hashlib.sha256((ROOT/'audio/score.json').read_bytes()).hexdigest(),'listening':'Not reviewed or auditioned, per user instruction.'}
    (out/'synthesis-report.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
