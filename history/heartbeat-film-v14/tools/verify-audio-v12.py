"""Verify rendered sound, shared events, preserved PCM, and terminal silence.

Measurements are signal evidence, not a substitute for subjective listening.
"""
import hashlib,json,struct
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SR=48000

def read_pcm(path):
    b=path.read_bytes();assert b[:4]==b'RIFF' and b[8:12]==b'WAVE'
    offset=12;fmt=None;data=None
    while offset+8<=len(b):
        tag=b[offset:offset+4];size=struct.unpack_from('<I',b,offset+4)[0]
        if tag==b'fmt ':fmt=struct.unpack_from('<HHIIHH',b,offset+8)
        if tag==b'data':data=b[offset+8:offset+8+size]
        offset+=8+size+(size%2)
    assert fmt and data is not None
    _,channels,rate,_,_,bits=fmt
    assert channels==2 and rate==SR and bits in (16,24)
    if bits==16:a=np.frombuffer(data,dtype='<i2').astype(np.float32)/32768
    else:
        q=np.frombuffer(data,dtype='u1').reshape(-1,3).astype(np.int32)
        q=q[:,0]|(q[:,1]<<8)|(q[:,2]<<16)
        q=np.where(q>=8388608,q-16777216,q)
        a=q.astype(np.float32)/8388608
    return a.reshape(-1,2),data,bits,b

def db(x):return float(20*np.log10(max(float(x),1e-12)))
def rms(x):return float(np.sqrt(np.mean(x*x,dtype=np.float64)))

score=json.loads((ROOT/'audio/score.json').read_text(encoding='utf8'))
assert score['edition']=='v12' and score['stopTime']==194.5 and score['resonanceEnd']==195.92
n=round(score['duration']*SR);stop=round(score['stopTime']*SR);audio_end=round(score['resonanceEnd']*SR)
tracks={};trackreport={}
for name in ['pulse','melody','harmony','percussion','detail']:
    a,_,_,_=read_pcm(ROOT/f'audio/generated/stem-{name}.wav')
    assert len(a)==n and np.isfinite(a).all() and np.max(np.abs(a))<1
    assert np.count_nonzero(a[audio_end:])==0,(name,'nonzero terminal audio')
    if name!='detail':assert np.count_nonzero(a[stop:])==0,(name,'Only resonance may remain after heartbeat stop')
    tracks[name]=a;trackreport[name]={'peakDbFS':db(np.max(np.abs(a))),'rmsDbFS':db(rms(a)),'terminalNonzeroSamples':0}
raw,_,_,_=read_pcm(ROOT/'audio/generated/source-mix.wav')
reconstruction=sum(tracks.values())
error=float(np.max(np.abs(reconstruction-raw)))
assert error<.001 and np.count_nonzero(raw[audio_end:])==0
master,pcm,bits,filebytes=read_pcm(ROOT/'audio/generated/master.wav')
old,oldpcm,oldbits,_=read_pcm(ROOT.parent/'heartbeat-film-v11/audio/generated/master.wav')
assert len(master)==n and bits==oldbits==24
retained=63*SR*2*3
assert pcm[:retained]==oldpcm[:retained], 'First 63 s must preserve original PCM exactly'
assert np.count_nonzero(master[audio_end:])==0,'Final master must be exactly silent after resonance'
tails=[e for e in score['events'] if e['voice']=='resonance']
assert len(tails)==1 and tails[0]['time']==score['stopTime'] and tails[0]['terminalTail']
assert abs(tails[0]['time']+tails[0]['duration']-score['resonanceEnd'])<1e-9
tail=master[stop:audio_end].mean(axis=1)
tail_peak=db(np.max(np.abs(tail)))
assert -45<tail_peak<-18,('Resonance level outside its restrained range',tail_peak)
frequencies=np.fft.rfftfreq(65536,1/SR)
spectrum=np.abs(np.fft.rfft(tail[:24000]*np.hanning(24000),65536))
tail_frequency=float(frequencies[np.argmax(spectrum)])
assert 1700<tail_frequency<1820,('Expected musical resonance near A6',tail_frequency)
tail_drop=db(rms(tail[-9600:]))-db(rms(tail[:9600]))
assert tail_drop<-25,('Resonance must gently disappear',tail_drop)
resonance_report={'start':score['stopTime'],'end':score['resonanceEnd'],'voice':'resonance','peakDbFS':tail_peak,'dominantFrequencyHz':tail_frequency,'lastVsFirst200msRmsDb':tail_drop,'heartStemAfterStopNonzeroSamples':int(np.count_nonzero(tracks['pulse'][stop:]))}
assert np.max(np.abs(master))<.81, 'Unexpected clipping or excess peak'
assert np.count_nonzero(tracks['melody'][184*SR:])==0
assert np.count_nonzero(tracks['harmony'][184*SR:])==0
primaries=[e for e in score['events'] if e['voice']=='heart' and e.get('codeHeart') and e.get('primary')]
beatmeasure=[]
for e in primaries:
    start=round(e['time']*SR)
    x=tracks['pulse'][start:start+round(.148*SR)].mean(axis=1)
    onset=np.flatnonzero(np.abs(x)>max(.00003,float(np.max(np.abs(x)))*.025))
    assert len(onset) and onset[0]/SR<.02
    y=x[round(.021*SR):]*np.hanning(len(x)-round(.021*SR))
    spectrum=np.abs(np.fft.rfft(y,65536));frequencies=np.fft.rfftfreq(65536,1/SR)
    mask=(frequencies>=20)&(frequencies<=90)
    peak=float(frequencies[mask][np.argmax(spectrum[mask])])
    beatmeasure.append({'time':e['time'],'authoredFrequencyHz':e['freq'],'authoredStrength':e['amp'],'renderedPrimaryRmsDbFS':db(rms(x)),'renderedPeakFrequencyHz':peak,'onsetDelaySeconds':float(onset[0]/SR)})
maze=[b for b in beatmeasure if 98<=b['time']<131]
life=[b for b in beatmeasure if 131<=b['time']<182]
ending=[b for b in beatmeasure if b['time']>=182]
early=life[:8];late=life[-8:]
med=lambda group,key:float(np.median([b[key] for b in group]))
assert len(maze)>=16 and len(life)>=16 and len(ending)==11,'Missing shared heart section'
mazeGain=med(maze[-8:],'renderedPrimaryRmsDbFS')-med(maze[:8],'renderedPrimaryRmsDbFS')
mazeEarlyFrequency=med(maze[:8],'renderedPeakFrequencyHz');mazeLateFrequency=med(maze[-8:],'renderedPeakFrequencyHz')
assert np.count_nonzero(tracks['pulse'][98*SR:131*SR])>0,'Maze pulse stem is silent'
assert mazeGain>3,('Maze beats must gain weight',mazeGain)
assert mazeLateFrequency<mazeEarlyFrequency*.9,('Maze beats must deepen',mazeEarlyFrequency,mazeLateFrequency)
mazeReport={'start':98,'end':131,'count':len(maze),'firstBeatSeconds':maze[0]['time'],'lastBeatSeconds':maze[-1]['time'],'firstEightMedianPeakFrequencyHz':mazeEarlyFrequency,'lastEightMedianPeakFrequencyHz':mazeLateFrequency,'lastVsFirstEightRmsDb':mazeGain,'maximumOnsetDelaySeconds':max(b['onsetDelaySeconds'] for b in maze),'sectionPulseRmsDbFS':db(rms(tracks['pulse'][98*SR:131*SR])),'sectionMasterRmsDbFS':db(rms(master[98*SR:131*SR]))}
lifeGain=med(late,'renderedPrimaryRmsDbFS')-med(early,'renderedPrimaryRmsDbFS')
earlyFrequency=med(early,'renderedPeakFrequencyHz');lateFrequency=med(late,'renderedPeakFrequencyHz')
assert lifeGain>7,('Insufficient increasing beat depth',lifeGain)
assert lateFrequency<earlyFrequency*.76,(earlyFrequency,lateFrequency)
endDrop=med(ending[-3:],'renderedPrimaryRmsDbFS')-med(ending[:3],'renderedPrimaryRmsDbFS')
assert endDrop<-12,('Insufficient terminal weakening',endDrop)
gaps=np.diff([e['time'] for e in primaries if e['time']>=182])
assert np.median(gaps[-3:])>np.median(gaps[:3])*1.5,'Ending heart must slow overall'
returns=[e for e in score['events'] if e['voice']=='return']
assert len(returns)==72
assert len([e for e in score['events'] if e['voice']=='glitch'])==3
report={'passed':True,'edition':'v12','duration':n/SR,'sampleRate':SR,'channels':2,'eventCount':len(score['events']),'stems':trackreport,'stemSumMaxAbsoluteDifference':error,'retainedMasterPCM':{'start':0,'end':63,'bitIdentical':True,'bits':bits,'bytes':retained,'crossfadeAfter63Seconds':.04},'mazeHeart':mazeReport,'lifeHeart':{'start':131,'end':182,'count':len(life),'firstEightMedianPeakFrequencyHz':earlyFrequency,'lastEightMedianPeakFrequencyHz':lateFrequency,'lastVsFirstEightRmsDb':lifeGain},'endingHeart':{'count':len(ending),'lastVsFirstThreeRmsDb':endDrop,'intervalsSeconds':gaps.tolist()},'returnAccentCount':len(returns),'glitchCount':3,'resonance':resonance_report,'terminalSilence':{'from':score['resonanceEnd'],'to':196,'masterNonzeroSamples':0,'allStemsNonzeroSamples':0},'masterPeakDbFS':db(np.max(np.abs(master))),'masterSHA256':hashlib.sha256(filebytes).hexdigest(),'measuredPrimaryBeats':beatmeasure,'scope':'Rendered waveform, event alignment, frequency and loudness trend, clipping and PCM checks only. No subjective listening claim.'}
out=ROOT/'output/verification';out.mkdir(parents=True,exist_ok=True)
(out/'audio-v12.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in report.items() if k!='measuredPrimaryBeats'},ensure_ascii=False,indent=2))
