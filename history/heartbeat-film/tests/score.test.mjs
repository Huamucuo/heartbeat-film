import test from 'node:test';
import assert from 'node:assert/strict';
import { EXCERPTS, makeScore } from '../src/score.mjs';
import { sampleState } from '../src/state.mjs';

test('two excerpts contain 150 and 300 exact frames at 30 fps', () => {
  assert.deepEqual(EXCERPTS.map(x => (x.end - x.start) * 30), [150, 300]);
  assert.deepEqual(EXCERPTS.map(x => [x.start,x.end]), [[17.5,22.5],[55,65]]);
});
test('quiet interval has no new percussive event and arrival is singular', () => {
  const s = makeScore();
  assert.ok(s.length > 20);
  assert.deepEqual(s.filter(e => ['pulse','reply','arrival'].includes(e.voice) && e.time >= 55 && e.time < 56.875), []);
  assert.deepEqual(s.filter(e => e.voice === 'arrival').map(e=>e.time), [57.5]);
  assert.deepEqual(s.filter(e => e.id === 'echo.depart').map(e=>e.time), [56.875]);
  assert.equal(s.filter(e => e.time === 57.5 && ['pulse','arrival'].includes(e.voice)).length,1);
});
test('echo follows one old path and arrives exactly at 57.5', () => {
  assert.equal(sampleState(56.875).echoProgress,0);
  assert.equal(sampleState(57.1875).echoProgress,0.5);
  assert.equal(sampleState(57.5).echoProgress,1);
  assert.equal(sampleState(57.499).responseAge,-1);
  assert.equal(sampleState(57.5).responseAge,0);
});
test('camera is held through silence and first arrival', () => {
  const held = sampleState(55).camera;
  assert.ok(held && held.position);
  for (const t of [55.5,56.875,57.5,58]) assert.deepEqual(sampleState(t).camera,held);
});
test('arrival is visible on the first frame containing its exact sound event',()=>{
  assert.equal(sampleState(57.5-1/30).originImpulse,0);
  assert.ok(sampleState(57.5).originImpulse>0.1);
});
test('arbitrary seeking is deterministic, with persistent element identities', () => {
  const times = [17.5,18.75,22.499,55,56.9,57.5,60,64.99];
  const expected = times.map(sampleState);
  for (const t of [64.9,18,57.5,20,55,60,17.5]) sampleState(t);
  assert.deepEqual(times.map(sampleState),expected);
  for (const s of expected) {
    assert.deepEqual(s.ids,['pulse.origin','pulse.reply','trace.main','membrane.main']);
    assert.ok(Object.values(s.camera).flat().every(Number.isFinite));
  }
});
test('geometry birth has completed at 22.5 with continuous boundary values', () => {
  assert.equal(sampleState(17.5).growth,0);
  assert.equal(sampleState(22.5).growth,1);
  assert.ok(Math.abs(sampleState(22.5).growth-sampleState(22.5-1e-6).growth)<1e-5);
});
