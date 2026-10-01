const { test } = require('node:test');
const assert = require('node:assert/strict');
const data = require('../preview-data.js');
const old = '2026-09-28T12:00:00Z', fresh = '2026-09-29T12:00:00Z';
const values = (points, time, finish=101) => [0,1].map(() => ({ place:1,points,games:2,finish,counter:0,performanceKnown:true,performanceCheckedAt:time }));

test('latest table wins irrespective of fallback source order', () => {
  const local={stamp:fresh,source:'local',values:values(6,fresh)};
  const snapshot={stamp:old,source:'snapshot',values:values(4,old)};
  for(const candidates of [[snapshot,local],[local,snapshot]]) {
    const result=data.newest(candidates);
    assert.equal(result.source,'local'); assert.equal(result.values[0].points,6);
  }
});
test('partial live table retains older performances with their original date', () => {
  const result=data.newest([{stamp:old,values:values(4,old)}, {stamp:fresh,source:'live',values:[{points:6},{points:6}]}]);
  assert.equal(result.values[0].points,6); assert.equal(result.values[0].finish,101);
  assert.equal(result.values[0].performanceCheckedAt,old); assert.equal(result.partial,true);
});
test('confirmed empty best finish and zero counter replace old performances', () => {
  const result=data.newest([{stamp:old,values:values(4,old)}, {stamp:fresh,values:values(6,fresh,null)}]);
  assert.equal(result.values[0].finish,null); assert.equal(result.values[0].counter,0); assert.equal(result.partial,false);
});
test('invalid dates and malformed snapshots cannot replace valid values', () => {
  assert.equal(data.newest([{stamp:'invalid',values:values(6,fresh)}]),null);
  assert.equal(data.newest([{stamp:fresh,values:[{points:'oops'},{}]}]),null);
  assert.equal(data.newest([{stamp:'2999-01-01',values:values(6,fresh)}]),null);
});
test('league links require a real 3K host or positive event ID', () => {
  for(const link of ['1428','https://ddv.3k-darts.com/event/1428/table','https://ddv.3k-darts.com/#/event/1428/table','https://ddv.3k-darts.com/?eventId=1428']) assert.equal(data.eventFromUrl(link),1428);
  for(const link of ['https://example.com/event/1428','https://3k-darts.com.evil.test/event/1428','0','-1','1428oops','https://ddv.3k-darts.com/event/1428oops']) assert.equal(data.eventFromUrl(link),null);
});
test('own team is matched by name, never by an old season participant ID', () => {
  assert.equal(data.ownParticipant([{id:1,displayName:'Another team'},{id:2,displayName:'FC Lachendorf Darts A'}],{own:1,ownName:'FC Lachendorf Darts A'}).id,2);
  assert.throws(()=>data.ownParticipant([{id:1,displayName:'FC Lachendorf Darts B'}],{ownName:'FC Lachendorf Darts A'}));
});
test('table tolerates numeric/string IDs and missing teams fail explicitly', () => {
  assert.equal(data.teamStats([{participantId:'12',placement:'1.',points1:6,matchCount:3}],12).place,'1');
  assert.throws(()=>data.teamStats([],12));
});
