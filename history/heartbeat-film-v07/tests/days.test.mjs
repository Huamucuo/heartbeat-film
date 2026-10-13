import test from 'node:test';
import assert from 'node:assert/strict';
import {dayAt} from '../src/days.mjs';
test('Visible days advance at the score beat and remain consistent after seeking',()=>{
 assert.equal(dayAt(10).number,54);
 assert.equal(dayAt(10.6249).number,54);
 assert.equal(dayAt(10.625).number,55);
 assert.equal(dayAt(11.25).number,56);
 assert(dayAt(74).number>dayAt(16).number);
 for(const t of [12,15,65,74,80]){const a=dayAt(t);dayAt(t+4);assert.deepEqual(dayAt(t),a);assert(dayAt(t+.625).number>a.number);}
});
