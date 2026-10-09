import ts from 'typescript';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('lib/game'),out=fs.mkdtempSync(path.join(os.tmpdir(),'trust-modes-'));
function compile(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const source=path.join(dir,entry.name);if(entry.isDirectory()){compile(source);continue;}if(!source.endsWith('.ts')||source.endsWith('client.ts'))continue;const target=path.join(out,path.relative(root,source).replace(/\.ts$/,'.mjs'));fs.mkdirSync(path.dirname(target),{recursive:true});const js=ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '(\.[^']+)'/g,"from '$1.mjs'");fs.writeFileSync(target,js);}}
compile(root);
const {act,tick,view,beginRound,reveal}=await import(path.join(out,'engine.mjs'));
const {roundPresentation,finalPresentation}=await import(path.join(out,'presentation.mjs'));
const {modeChoice}=await import(path.join(out,'bots.mjs'));
const {MODES}=await import(path.join(out,'modes/catalog.mjs'));
const {optionsFor,needsChoice,pokerValue}=await import(path.join(out,'modes/runtime.mjs'));
function room(n=6){return {code:'TEST',host:'p0',players:Array.from({length:n},(_,i)=>({id:`p${i}`,token:`secret${i}`,name:`Player ${i}`,score:0,ready:false,lastChat:0})),phase:'lobby',round:0,deadline:0,choices:{},pairs:[],results:[],messages:[],history:[],created:1000};}

const {createRequire}=await import('node:module');
const require=createRequire(path.resolve('package.json'));
const translations=JSON.parse(fs.readFileSync('lib/i18n/ja.json','utf8'));
const exports={};
const compiled=ts.transpileModule(fs.readFileSync('lib/i18n/language.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
new Function('require','exports',compiled)(id=>id==='./ja.json'?translations:require(id),exports);
const t=value=>exports.translate(value,'ja');
for(const mode of MODES){
 for(const text of [mode.name,mode.summary,...mode.rules,...mode.options.map(o=>o.label)])assert.notEqual(t(text),text,`${mode.id}: ${text}`);
 const r=room(6);act(r,'p0','mode',{mode:mode.id},1000);for(const p of r.players)act(r,p.id,'ready',{},1000);act(r,'p0','start',{},1000);
 for(let round=1;round<=5;round++){
  for(const p of r.players){const v=view(r,p.id,1000);if(v.roundInfo)assert.notEqual(t(v.roundInfo),v.roundInfo,`${mode.id}: ${v.roundInfo}`);if(needsChoice(r,p.id)){const opts=optionsFor(r,p.id);act(r,p.id,'choice',{choice:opts[(round+r.players.indexOf(p))%opts.length].value},r.deadline-1000);}}
  if(r.phase==='negotiation')tick(r,r.deadline);
  for(const result of r.results){assert.notEqual(t(result.detail),result.detail,`${mode.id}: ${result.detail}`);const banner=roundPresentation(mode.id,result,r.results);assert.notEqual(t(banner.title),banner.title);assert.notEqual(t(banner.caption),banner.caption);}
  tick(r,r.deadline);
 }
}
assert.equal(exports.translate('Create a table','en'),'Create a table');
assert.equal(t('Friend (you)'),'Friend（あなた）');
assert.equal(t('Friend, give me a reason to trust you.'),'Friend、信じられる理由を聞かせて。');
assert.equal(t('Round 3 of 5'),'第3／5ラウンド');
console.log('PASS Japanese catalog, live round context, results and banners across all 22 modes; English and names preserved');
