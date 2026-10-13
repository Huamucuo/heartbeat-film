import test from 'node:test';
import assert from 'node:assert/strict';
import {surfaceHeight} from '../src/geometry.mjs';
import {sampleState} from '../src/state.mjs';
test('arrival does not teleport the nucleus or the membrane before its wave begins',()=>{
  const t=57.5;
  for(const [x,z] of [[-1.35,.18],[-1,.18],[0,0],[2.45,-.44]]){
    const a=surfaceHeight(x,z,t-1e-6,sampleState(t-1e-6));
    const b=surfaceHeight(x,z,t,sampleState(t));
    assert.ok(Math.abs(a-b)<.003,`discontinuous at ${x},${z}: ${a} -> ${b}`);
  }
});
