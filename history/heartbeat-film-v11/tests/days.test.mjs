import test from 'node:test';
import assert from 'node:assert/strict';
import {dayAt} from '../src/days.mjs';
import {storyTime} from '../src/timeline.mjs';
test('Visible days advance at the score beat and remain consistent after seeking',()=>{
 const at=t=>dayAt(storyTime(t));
 assert.equal(at(13.75).number,54);assert.equal(at(14.3749).number,54);
 assert.equal(at(14.375).number,55);assert.equal(at(15).number,56);
 for(const t of [14.25,15.25,21.25,24.25]){const a=at(t);at(t+4);assert.deepEqual(at(t),a);assert.equal(at(t+.625).number,a.number+1);}
});
