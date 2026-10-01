const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const data=require('../preview-data.js');

function harness() {
  const nodes=new Map(), storage=new Map();
  const ctx={save(){},restore(){},clearRect(){},fillRect(){},fillText(){},measureText(){return {width:20}}};
  function element(id) {
    if(!nodes.has(id)) nodes.set(id,{value:'',checked:false,hidden:true,textContent:'',dataset:{},disabled:false,setAttribute(){},getContext:()=>ctx});
    return nodes.get(id);
  }
  const subject={id:'eschede',name:'TuS Eschede A'};
  const env={document:{getElementById:element},LEAGUE_CONFIG:{a:{opponents:[subject]},b:{opponents:[]}},DartPreviewData:data,AbortController,URL,Date,console,setTimeout,clearTimeout,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
  let behavior=async()=>{throw new TypeError('offline')};
  env.fetch=(...args)=>behavior(...args);
  env.globalThis=env;
  const source=fs.readFileSync(require.resolve('../preview.js'),'utf8').replace('  initConfiguration();','  globalThis.api={loadStats,clearStats,state,readLocalCache,fetchDocument,fetchRoster};');
  vm.runInNewContext(source,env);
  element('previewCompare').checked=true;
  element('previewOpponent').value='eschede';
  return {api:env.api,element,storage,setFetch:fn=>behavior=fn};
}
const t1='2026-09-28T12:00:00Z',t2='2026-09-29T12:00:00Z';
const row=(points,time)=>({place:1,points,games:2,finish:101,counter:0,performanceKnown:true,performanceCheckedAt:time});

test('live outage prefers newer local data over website snapshot and clears loading state',async()=>{
  const h=harness();
  h.storage.set('fcl-darts-preview-3k-v3',JSON.stringify({'a:1428:eschede':{updatedAt:t2,values:[row(6,t2),row(6,t2)]}}));
  const snapshot={events:{1428:{checkedAt:t1,updatedAt:t1,participants:{1:{displayName:'FC Lachendorf Darts A',...row(4,t1)},2:{displayName:'TuS Eschede A',...row(4,t1)}}}}};
  h.setFetch(async url=>{if(String(url).includes('3k-cache.json'))return{ok:true,json:async()=>snapshot};throw new TypeError('offline')});
  await h.api.loadStats(true);
  assert.equal(h.element('previewStat-points-own').value,6);
  assert.equal(h.api.state.source,'local');
  assert.equal(h.element('previewRefresh').disabled,false);
  assert.equal(h.api.state.controller,null);
});
test('pre-update local cache remains available if all remote sources fail',async()=>{
  const h=harness();
  h.storage.set('fcl-darts-preview-3k-v2',JSON.stringify({'a:1428:eschede':{updatedAt:t2,values:[row(6,t2),row(6,t2)]}}));
  await h.api.loadStats(true);
  assert.equal(h.element('previewStat-points-own').value,6);
  assert.equal(h.api.state.source,'local');
});
test('team change during an outstanding fallback cannot apply the old comparison',async()=>{
  const h=harness();let release;
  // Use a shared pending response so both snapshot URLs finish together.
  const pending=new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>({events:{}})})});
  h.setFetch(url=>String(url).includes('3k-cache.json')?pending:Promise.reject(new TypeError('offline')));
  const loading=h.api.loadStats(true);
  h.api.clearStats();h.element('previewStat-points-own').value='99';
  release();await loading;
  assert.equal(h.element('previewStat-points-own').value,'99');
});
test('timed-out fallback request aborts instead of blocking the controls indefinitely',async()=>{
  const h=harness();
  h.setFetch((url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error('timeout'),{name:'AbortError'})))));
  await assert.rejects(h.api.fetchDocument('https://example.test/data',null,5),{name:'AbortError'});
});
