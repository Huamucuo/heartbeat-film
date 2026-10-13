"""Original instrumental score, synthesized from src/score.mjs's event JSON.
No samples, reference music or external instruments are used. NumPy only.
"""
import json
import math
import wave
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SR=48000
TAU=np.pi*2

def freq(m): return 440*2**((m-69)/12)
def write_wav(path,data):
    if not np.isfinite(data).all(): raise ValueError('Non-finite samples')
    if np.max(np.abs(data))>1: raise ValueError('Clipping before write')
    with wave.open(str(path),'wb') as w:
        w.setparams((2,2,SR,len(data),'NONE','not compressed'))
        w.writeframes(np.rint(data*32767).astype('<i2').tobytes())

def put(dst,sig,e,pan=None):
    start=round(e['time']*SR)
    if start<0: sig=sig[-start:];start=0
    n=min(len(sig),len(dst)-start)
    if n<=0:return
    p=e.get('pan',0) if pan is None else pan
    ang=(np.asarray(p)+1)*np.pi/4
    left,right=np.cos(ang),np.sin(ang)
    if np.ndim(left):left=left[:n];right=right[:n]
    dst[start:start+n,0]+=sig[:n]*e['amp']*left
    dst[start:start+n,1]+=sig[:n]*e['amp']*right

def softened_noise(rng,n):
    x=rng.normal(size=n)
    k=np.hanning(21);k/=k.sum()
    return np.convolve(x,k,mode='same')

def make(e,rng):
    t=np.arange(round(e['duration']*SR))/SR
    v=e['voice'];f=freq(e['note']);pan=None
    if v in ('heart','other','arrival'):
        f0=76 if v=='heart' else 99 if v=='other' else 68
        phase=TAU*(43*t+(f0-43)*.032*(1-np.exp(-t/.032)))
        s=np.sin(phase)*np.exp(-t/.16)+.22*np.sin(TAU*(129 if v=='heart' else 171)*t)*np.exp(-t/.045)
        s*= (1-np.exp(-t/.004))*.56
        if v=='arrival':s+=np.sin(TAU*110*t)*np.exp(-t/.55)*(1-np.exp(-t/.015))*.12
        return 'pulse',s,pan
    if v in ('felt','pluck','connect'):
        decay=1.45 if v=='felt' else .60
        s=np.zeros(len(t))
        for h in range(1,8):
            d=decay/(1+.30*(h-1));inh=1+.00016*h*h
            partial=np.sin(TAU*f*h*inh*t)+.35*np.sin(TAU*f*h*inh*1.0012*t+.15*h)
            s+=partial*np.exp(-t/d)/(h**(2.1 if v=='felt' else 1.6))
        s*=(1-np.exp(-t/(.008 if v=='felt' else .004)))*(.25 if v=='felt' else .15)
        return 'melody',s,pan
    if v in ('bell','bloom'):
        s=(np.sin(TAU*f*t+.65*np.sin(TAU*f*2.003*t)*np.exp(-t/.2))+.16*np.sin(TAU*f*2.71*t))*np.exp(-t/1.1)*(1-np.exp(-t/.004))*.17
        return 'detail',s,pan
    if v=='marimba':
        s=(np.sin(TAU*f*t)*np.exp(-t/.46)+.32*np.sin(TAU*f*4.01*t)*np.exp(-t/.09)+.12*np.sin(TAU*f*9.2*t)*np.exp(-t/.035))*(1-np.exp(-t/.002))*.22
        return 'melody',s,pan
    if v=='strings':
        s=np.zeros(len(t));env=np.sin(np.clip(t/.30,0,1)*np.pi/2)**2*np.sin(np.clip((e['duration']-t)/.65,0,1)*np.pi/2)**2
        for j,note in enumerate(e['notes']):
            fq=freq(note);vib=.0025*np.sin(TAU*5.1*t+j)
            for h in range(1,7):
                s+=np.sin(TAU*fq*h*t+.16*np.sin(TAU*5.1*t+j))*(.012/h**1.5)
                s+=np.sin(TAU*fq*h*1.0019*t+j*.3)*(.007/h**1.5)
        s*=env*(.9+.1*np.sin(TAU*7.3*t))
        return 'harmony',s,pan
    if v=='footstep':
        s=(softened_noise(rng,len(t))*.20+np.sin(TAU*(85*t-40*t*t))*.10)*np.exp(-t/.042)*(1-np.exp(-t/.002))
        return 'percussion',s,pan
    if v=='impact':
        env=(1-np.exp(-t/.003))*np.exp(-t/.78)
        s=(np.sin(TAU*(38*t+1.8*(1-np.exp(-t/.08))))*.32+np.sin(TAU*57*t)*.12+softened_noise(rng,len(t))*.15)*env
        return 'detail',s,pan
    if v=='bass':
        s=(np.sin(TAU*f*t)+.18*np.sin(TAU*f*2*t))*(1-np.exp(-t/.05))*np.minimum(1,np.maximum(0,(e['duration']-t)/.6))*.25
        return 'pulse',s,pan
    if v=='pad':
        s=np.zeros(len(t));env=np.sin(np.clip(t/.9,0,1)*np.pi/2)**2*np.sin(np.clip((e['duration']-t)/1.2,0,1)*np.pi/2)**2
        for j,note in enumerate(e['notes']):
            fq=freq(note)
            s+=(np.sin(TAU*fq*t+j*.42)+.4*np.sin(TAU*fq*1.0016*t+j*.42)+.13*np.sin(TAU*fq*2*t))*env*.038
        return 'harmony',s,pan
    if v in ('tick','brush'):
        noise=rng.normal(size=len(t));high=noise-np.convolve(noise,np.ones(5)/5,mode='same')
        s=high*np.exp(-t/(.017 if v=='tick' else .05))*(1-np.exp(-t/.001))*.095
        return 'percussion',s,pan
    if v=='travel':
        env=np.sin(np.pi*t/e['duration'])**1.5
        # A voiced, breath-like return, moving from the right source to the left.
        s=(np.sin(TAU*(f*t-80*t*t))*.07+softened_noise(rng,len(t))*.025)*env
        pan=np.linspace(.65,-.5,len(t));return 'detail',s,pan
    if v=='swell':
        env=(t/e['duration'])**2*np.sin(np.clip((e['duration']-t)/.08,0,1)*np.pi/2)
        s=(softened_noise(rng,len(t))*.06+np.sin(TAU*f*t)*.018)*env
        return 'detail',s,pan
    if v=='release':
        env=(1-np.exp(-t/.016))*np.exp(-t/.24)
        s=(np.sin(TAU*f*t)+.18*np.sin(TAU*f*1.414*t))*env*.08
        s+=softened_noise(rng,len(t))*env*.024
        return 'detail',s,pan
    raise ValueError(v)

def room(x,wet):
    y=x.copy()
    for j,delay in enumerate([.073,.109,.173,.239,.317,.431,.571,.739,.937,1.177,1.459,1.799,2.179]):
        shift=round(delay*SR);gain=wet*np.exp(-delay/1.1)*(.48 if j<5 else .30)
        y[shift:]+=x[:-shift,::-1 if j%2 else 1]*gain
    return y

def main():
    score=json.loads((ROOT/'audio/score.json').read_text(encoding='utf8'))
    seconds=float(score['duration']);n=round(seconds*SR);rng=np.random.default_rng(260211)
    stems={k:np.zeros((n,2),np.float32) for k in ['pulse','melody','harmony','percussion','detail']}
    for e in score['events']:
        bus,sig,pan=make(e,rng);put(stems[bus],sig.astype(np.float32),e,pan)
    # The sustained voice briefly yields to the physical pulse. Both envelopes
    # derive from the score; changes in export speed cannot move an onset.
    duck=np.zeros(n,np.float32)
    for e in score['events']:
        if e['voice'] not in ['heart','arrival']:continue
        start=round(e['time']*SR);count=min(round(.4*SR),n-start)
        if count>0:duck[start:start+count]=np.maximum(duck[start:start+count],e['amp']*.26*np.exp(-np.arange(count)/SR/.12))
    stems['harmony']*= (1-duck[:,None])
    stems['pulse']=room(stems['pulse'],.09)
    stems['melody']=room(stems['melody'],.47)
    stems['harmony']=room(stems['harmony'],.35)
    stems['detail']=room(stems['detail'],.48)
    raw=sum(stems.values());raw-=np.mean(raw,axis=0)
    gain=min(1.2,.88/float(np.max(np.abs(raw))))
    envelope=np.minimum(np.arange(n)/SR/.04,(seconds-np.arange(n)/SR)/2.3).clip(0,1).astype(np.float32)
    out=ROOT/'audio/generated';out.mkdir(parents=True,exist_ok=True)
    for k,x in stems.items():write_wav(out/f'stem-{k}.wav',x*gain*envelope[:,None])
    raw*=gain*envelope[:,None];write_wav(out/'source-mix.wav',raw)
    report={'seconds':seconds,'sampleRate':SR,'samples':n,'channels':2,'events':len(score['events']),'peakDbFS':20*np.log10(float(np.max(np.abs(raw)))),'rmsDbFS':20*np.log10(float(np.sqrt(np.mean(raw*raw)))),'gain':gain,'seed':260211,'stems':list(stems)}
    (out/'synthesis-report.json').write_text(json.dumps(report,indent=2),encoding='utf8');print(json.dumps(report,indent=2))

if __name__=='__main__':main()
