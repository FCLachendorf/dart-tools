const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

test('table renders seven manual rows, highlights its club and uses shared export',async()=>{
  const nodes=new Map(),drawn=[],exported=[];
  class Element {
    constructor(){this.value='';this.children=[];this.events={};this.error='';}
    set id(value){this._id=value;nodes.set(value,this)} get id(){return this._id}
    setAttribute(){} add(option){this.children.push(option)}
    append(...items){items.forEach(item=>{item.parent=this;this.children.push(item)})}
    addEventListener(event,fn){this.events[event]=fn}
    setCustomValidity(message){this.error=message}
    checkValidity(){return !this.error && (!this.required || this.value!=='')}
    closest(){return this.parent?.parent?.parent} focus(){} reportValidity(){}
    querySelectorAll(){return [...nodes.values()].filter(e=>e.required)}
  }
  for(const id of ['tableCanvas','tableRows','tableForm','tableMatchday','tableDownload','tableStatus']) {const e=new Element();e.id=id;}
  const canvas=nodes.get('tableCanvas');canvas.width=1080;canvas.height=1920;
  const ctx={clearRect(){drawn.length=0},fillRect(...args){drawn.push({kind:'box',color:this.fillStyle,args})},drawImage(){},measureText(value){return{width:value.length*Number.parseFloat(this.font)*.7}},fillText(value,x,y,max){drawn.push({kind:'text',value,x,y,max,font:this.font})}};
  canvas.getContext=()=>ctx;
  const env={document:{getElementById:id=>nodes.get(id),createElement:()=>new Element(),fonts:{add(){}}},Image:class{set src(v){queueMicrotask(()=>this.onload())}},FontFace:class{async load(){return this}},Option:class{constructor(text,value){this.text=text;this.value=value}},window:{exportCanvasPng:async(c,name)=>exported.push({width:c.width,height:c.height,name})},console};
  vm.runInNewContext(fs.readFileSync(require.resolve('../table.js'),'utf8'),env);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(nodes.get('tableRows').children.length,7);
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
});
