const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

test('table renders seven manual rows, highlights its club and uses shared export',async()=>{
  const nodes=new Map(),drawn=[],exported=[];
  class Element {
    constructor(){this.dataset={};this.classList={toggle(){}};this.value='';this.children=[];this.events={};this.error='';}
    set id(value){this._id=value;nodes.set(value,this)} get id(){return this._id}
    get options(){return this.children}
    replaceChildren(){this.children=[]}
    setAttribute(){} add(option){this.children.push(option)}
    append(...items){items.forEach(item=>{item.parent=this;this.children.push(item)})}
    addEventListener(event,fn){this.events[event]=fn}
    setCustomValidity(message){this.error=message}
    checkValidity(){return !this.error && (!this.required || this.value!=='')}
    closest(){return this.parent?.parent?.parent} focus(){} reportValidity(){}
    querySelectorAll(){return [...nodes.values()].filter(e=>e.required)}
  }
  for(const id of ['tableCanvas','tableRows','tableForm','tableMatchday','tableDownload','tableStatus','tableSource','tableManual','tableTool','tableRefresh','tablePhoto','tablePhotoPosition','tablePhotoRemove','tablePhotoZoom','tablePhotoX','tablePhotoLabel','tablePhotoAdjust','tablePreviewTitle','tablePreviewSize']) {const e=new Element();e.id=id;}
  nodes.get('tableTool').hidden=true;
  const buttons=['a','b'].map(team=>{const e=new Element();e.dataset.tableTeam=team;return e});
  const formats=['story','post'].map(format=>{const e=new Element();e.dataset.tableFormat=format;return e});
  const canvas=nodes.get('tableCanvas');canvas.width=1080;canvas.height=1920;
  const ctx={clearRect(){drawn.length=0},fillRect(...args){drawn.push({kind:'box',color:this.fillStyle,args})},drawImage(image,...args){drawn.push({kind:"image",src:image.src,args})},measureText(value){return{width:value.length*Number.parseFloat(this.font)*.7}},fillText(value,x,y,max){drawn.push({kind:'text',value,x,y,max,color:this.fillStyle,font:this.font})}};
  canvas.getContext=()=>ctx;
  const env={LEAGUE_CONFIG:{a:{clubName:"FC Lachendorf A",logo:"own-a.png",opponents:[]},b:{clubName:"FC Lachendorf B",logo:"own-b.png",opponents:[]}},DartTableData:require('../table-data.js'),AbortController,setTimeout,clearTimeout,
    fetch:async url=>({ok:true,json:async()=>url.includes('3k-leagues')?{leagues:{a:{event:1428,ownName:'FC Lachendorf Darts A'},b:{event:1422,ownName:'FC Lachendorf Darts B'}}}:{tableEntries:[{tableEntries:Array.from({length:7},(_,i)=>({placement:(i+1)+'.',participant:{displayName:i===0?'FC Lachendorf Darts A':`Opponent ${i}`},matchCount:4,points1:8-i,sets1:24,sets2:12,legs1:80,legs2:60}))}]}}),MutationObserver:class{observe(){}},document:{querySelectorAll:selector=>selector.includes("data-table-team")?buttons:formats,getElementById:id=>nodes.get(id),createElement:()=>new Element(),fonts:{add(){}}},Image:class{constructor(){this.width=64;this.height=64} get src(){return this.path} set src(v){this.path=v;queueMicrotask(()=>this.onload())}},FontFace:class{async load(){return this}},Option:class{constructor(text,value){this.text=text;this.value=value}},window:{exportCanvasPng:async(c,name)=>exported.push({width:c.width,height:c.height,name})},console};
  vm.runInNewContext(fs.readFileSync(require.resolve('../table.js'),'utf8'),env);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(nodes.get('tableRows').children.length,7);
  assert.equal(nodes.get('table-1-team').value,'FC Lachendorf A');
  buttons[1].events.click();
  await new Promise(resolve=>setImmediate(resolve));
  await nodes.get('tableDownload').events.click();assert.equal(exported.length,0);
  nodes.get('tableMatchday').value='12';
  for(let i=0;i<7;i++)for(const [key,value] of Object.entries({games:'12',points:String(i*2),sets:'84:60',legs:'250:200'})) nodes.get(`table-${i}-${key}`).value=value;
  await nodes.get('tableDownload').events.click();
  assert.deepEqual(exported,[{width:1080,height:1920,name:'tabelle-team-b-spieltag-12-story.png'}]);
  const clubs=drawn.filter(d=>d.kind==='text'&&/Bulls Eye|Lachendorf|Südseite/.test(d.value));
  assert.equal(clubs[0].value,'Bulls Eye C'); // Points never reorder the rows.
  assert.equal(clubs[2].value,'Team Utd. Südseite C');
  assert.equal(clubs[2].y-clubs[1].y,2*118);
  assert.ok(Number.parseFloat(clubs[2].font)<38); // Long name shrinks.
  assert.equal(drawn.filter(d=>d.kind==='box'&&d.color==='#d7d7db').length,1);
  nodes.get('table-1-team').value=nodes.get('table-0-team').value;
  await nodes.get('tableDownload').events.click();assert.equal(exported.length,1);
  nodes.get('table-0-points').events.input(); // Retain a manual B draft across switches.
  buttons[0].events.click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(nodes.get('table-0-team').value,'FC Lachendorf Darts A');
  assert.ok(nodes.get('tableSource').textContent.endsWith('/Ost'));
  nodes.get('tableMatchday').value='5';
  await nodes.get('tableDownload').events.click();
  assert.equal(exported.at(-1).name,'tabelle-team-a-spieltag-5-story.png');
  assert.equal(drawn.find(d=>d.kind==='text' && d.value==='5').color,'#cc2331');
  assert.ok(drawn.some(d=>d.kind==='image' && d.src==='own-a.png'));
  formats[1].events.click();
  await nodes.get('tableDownload').events.click();
  assert.equal(exported.at(-1).height,1350);
  assert.equal(exported.at(-1).name,'tabelle-team-a-spieltag-5-post.png');
  assert.ok(drawn.some(d=>d.kind==='image' && d.src.includes('/post/overlaya.png')));
  assert.equal(new Set(drawn.filter(d=>d.kind==='text' && ['PLATZ','MANNSCHAFT','SP.','PKT.','SETS','LEGS'].includes(d.value)).map(d=>d.font)).size,1);
  formats[0].events.click();
  assert.equal(canvas.height,1920);
  const pending=nodes.get('tableRefresh').events.click();
  buttons[1].events.click();
  await pending;
  assert.equal(nodes.get('tableMatchday').value,'12');
  assert.equal(nodes.get('table-0-team').value,'Bulls Eye C');
  assert.match(nodes.get('tableSource').textContent,/Manuell bearbeitet/);
  const layout=vm.runInNewContext(fs.readFileSync(require.resolve('../table.js'),'utf8').split('(() =>')[0]+'; TABLE_STORY_LAYOUT');
  assert.equal(layout.columns.place.x-layout.rowBox.x,layout.rowBox.x+layout.rowBox.width-layout.columns.legs.x);

});

