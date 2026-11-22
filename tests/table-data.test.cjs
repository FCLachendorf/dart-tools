const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../table-data.js');
const rows=()=>Array.from({length:7},(_,i)=>({team:i===3?'FC Lachendorf Darts B':`Team ${i}`,place:i+1,games:5,points:10-i,sets:'42:18',legs:'151:85'}));
test('live standings use official placement and top-level sets and legs',()=>{
  const table={tableEntries:[{tableEntries:rows().reverse().map(r=>({placement:r.place+'.',participant:{displayName:r.team,tableSets1:0},matchCount:r.games,points1:r.points,sets1:42,sets2:18,legs1:151,legs2:85}))}]};
  const result=D.live(table,'FC Lachendorf Darts B');
  assert.deepEqual(result,rows());
});
test('partial data, wrong league and duplicate places never replace a complete table',()=>{
  assert.throws(()=>D.validate(rows().slice(1),'FC Lachendorf Darts B'));
  assert.throws(()=>D.validate(rows(),'Other club'));
  const duplicate=rows();duplicate[1].place=1;assert.throws(()=>D.validate(duplicate,'FC Lachendorf Darts B'));
  const missing=rows();delete missing[1].legs;assert.throws(()=>D.validate(missing,'FC Lachendorf Darts B'));
});
test('snapshots retain their source date and reject old snapshots without sets/legs',()=>{
  const event={checkedAt:'2026-11-22T10:00:00Z',participants:Object.fromEntries(rows().map((r,i)=>[i,{...r,displayName:r.team}]))};
  assert.equal(D.snapshot({events:{1422:event}},1422,'FC Lachendorf Darts B').stamp,event.checkedAt);
  delete event.participants[0].sets;
  assert.throws(()=>D.snapshot({events:{1422:event}},1422,'FC Lachendorf Darts B'));
});
