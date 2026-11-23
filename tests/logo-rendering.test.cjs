const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
test('logos are reduced progressively with smoothing, cached and drawn at the original position',()=>{
  const stages=[],calls=[];
  const env={window:{},document:{getElementById:()=>({addEventListener(){}}),createElement:()=>{
    const canvas={width:0,height:0};
    const target={drawImage(){assert.equal(this.imageSmoothingEnabled,true);assert.equal(this.imageSmoothingQuality,'high');stages.push([canvas.width,canvas.height])}};
    canvas.getContext=()=>target;return canvas;
  }}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),env);
  const ctx={save(){calls.push('save')},restore(){calls.push('restore')},drawImage(image,...args){calls.push(args);assert.equal(this.imageSmoothingQuality,'high')}};
  const image={width:1080,height:1080};
  env.window.drawLogoSmooth(ctx,image,144,738,64,64);
  assert.deepEqual(stages,[[540,540],[270,270],[135,135],[67,67],[64,64]]);
  assert.deepEqual(calls,['save',[144,738,64,64],'restore']);
  env.window.drawLogoSmooth(ctx,image,144,856,64,64);
  assert.equal(stages.length,5);
  env.window.drawLogoSmooth(ctx,{width:800,height:400},0,0,200,100);
  assert.deepEqual(stages.slice(-2),[[400,200],[200,100]]);
});
