const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const elements={};const document={getElementById(id){return elements[id]||={value:'PSA',appendChild(){},addEventListener(){},removeAttribute(){}};},createElement(){return{};}};
const context=vm.createContext({document,window:{addEventListener(){}},console,Blob,TextEncoder,AbortController,setTimeout,clearTimeout,URL:{},fetch:null});
vm.runInContext(fs.readFileSync(__dirname+'/../generate_ot_deep_study.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1],context);
const run=s=>vm.runInContext(s,context), plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{
  const actual=plain(run(`reconcileReader(convertChapter({1:[['😀 God','H430'],[' speaks.',null]]}),{1:'😀  God speaks.'})`));
  assert.equal(actual.annotations[1][0].end,7);assert.equal(actual.verseTexts[1].slice(0,7),'😀  God');
  const mismatch=plain(run(`reconcileReader(convertChapter({1:[['God speaks','H430']]}),{1:'God said'})`));
  assert.deepEqual(mismatch.annotations[1],[]);assert.equal(mismatch.coverage.withheldAnnotations,1);
  const source={eng:{2:[['God','H430']]}};
  const reader={book:{id:'GEN'},chapter:{number:1,content:[{type:'verse',number:1,content:['One']},{type:'verse',number:2,content:['God']}]},numberOfVerses:2};
  context.fetch=async url=>({ok:true,json:async()=>url.includes('/BSB/')?reader:source});
  await assert.rejects(()=>run("processBook({id:'GEN',name:'Genesis',chapters:1},()=>{})"),/verse sets differ/);
  source.eng={1:[['One','H99999']],2:[['God','H430']]};
  await assert.rejects(()=>run("processBook({id:'GEN',name:'Genesis',chapters:1},()=>{})"),/invalid English/);
  reader.chapter.content[1].number=1;
  await assert.rejects(()=>run("processBook({id:'GEN',name:'Genesis',chapters:1},()=>{})"),/duplicate/);
  // Mid-request cancellation propagates to fetch and never permits a partial result.
  reader.chapter.content[1].number=2;
  context.fetch=async (url,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));
  await assert.rejects(()=>run("(()=>{const c=new AbortController();const p=processBook({id:'GEN',name:'Genesis',chapters:1},()=>{},true,c.signal);setTimeout(()=>c.abort(),1);return p;})()"),/aborted/);
  console.log('PASS: UTF-16/whitespace offsets, wording mismatch withholding, unknown mapping gap, out-of-range Strong ID, duplicate verse, mid-request cancellation.');
})().catch(e=>{console.error(e);process.exitCode=1});
