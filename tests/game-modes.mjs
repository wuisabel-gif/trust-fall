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
for(const mode of MODES){
 for(const n of [2,3,5,6]){
  if(n<(mode.minimum??2))continue;
  const r=room(n);act(r,'p0','mode',{mode:mode.id},1000);tick(r,1000);assert.equal(r.modeState,undefined);assert.equal(view(r,'p0',1000).choiceOptions.length,0);assert.throws(()=>act(r,'p1','mode',{mode:'trust'},1000));
  for(const p of r.players)act(r,p.id,'ready',{},1000);act(r,'p0','start',{},1000);assert.throws(()=>act(r,'p0','mode',{mode:'trust'},1001));
  for(let round=1;round<=5;round++){
   assert.equal(r.round,round);const active=r.players.filter(p=>needsChoice(r,p.id));
   for(const [i,p]of active.entries()){
    const choices=optionsFor(r,p.id);assert.ok(choices.length,`${mode.id} empty choices`);
    assert.throws(()=>act(r,p.id,'choice',{choice:'INVALID'},r.deadline-40000));
    const chosen=choices[(round+i)%choices.length].value;act(r,p.id,'choice',{choice:chosen},r.deadline-40000);
    const publicView=view(r,p.id,1001);assert.equal(publicView.roundSeed,undefined);assert.equal(publicView.deck,undefined);assert.equal(publicView.choices,undefined);assert.ok(publicView.players.every(x=>!('token'in x)&&!('botStyle'in x)));
    if(r.phase==='negotiation'){assert.throws(()=>act(r,p.id,'choice',{choice:chosen},1001));const other=view(r,r.players[(i+1)%n].id,1001);assert.equal(other.myChoice,r.choices[other.you]??null);}
   }
   if(r.phase==='negotiation')tick(r,r.deadline);assert.equal(r.phase,'reveal');assert.equal(r.results.length,n);assert.ok(r.results.every(x=>Number.isFinite(x.gain)&&x.detail));
   tick(r,r.deadline);if(round<5)assert.equal(r.phase,'negotiation');
  }
  assert.equal(r.phase,'finished');for(const p of r.players)assert.equal(p.score,r.history.reduce((sum,h)=>sum+h.results.find(x=>x.id===p.id).gain,0));
  act(r,'p0','rematch',{},999999);assert.equal(r.mode,mode.id);assert.equal(r.modeState,undefined);assert.ok(r.players.every(p=>!p.ready&&p.score===0));
 }
 // Six-seat solo practice: all bots submit legal choices through server tick.
 const r=room(1);act(r,'p0','mode',{mode:mode.id},1000);act(r,'p0','fillBots',{},1000);act(r,'p0','ready',{},1000);act(r,'p0','start',{},1000);assert.throws(()=>act(r,r.players[1].id,'choice',{choice:'0'},1000));assert.equal(Object.keys(r.modeState.hands).length,6);
 if(mode.id!=='trust'){const bot=r.players[1];const before=modeChoice(r,bot,100);r.choices.p0='secret-irrelevant';assert.equal(modeChoice(r,bot,100),before);delete r.choices.p0;}
 for(let round=1;round<=5;round++){const start=r.deadline-45000;if(needsChoice(r,'p0'))act(r,'p0','choice',{choice:optionsFor(r,'p0')[0].value},start+1000);tick(r,start+16000);assert.equal(r.phase,'reveal',`${mode.id} bots failed`);tick(r,r.deadline);}
 assert.equal(r.phase,'finished');assert.equal(r.history.length,5);console.log(`PASS ${mode.id}: player counts, five rounds, AI, privacy, legal moves, scoring, rematch`);
}
// No-action players receive penalties, never automatic moves or bonus awards.
for(const mode of MODES){const r=room(6);r.mode=mode.id;beginRound(r,1000);const required=r.players.filter(p=>needsChoice(r,p.id)).map(p=>p.id);reveal(r,r.deadline);for(const id of required){const result=r.results.find(x=>x.id===id);assert.equal(result.choice,null);assert.equal(result.gain,-10,mode.id);assert.equal(view(r,id,1000).players.find(p=>p.id===id).eligible,false);}}
function resolve(mode,choices){const r=room(choices.length);r.mode=mode;beginRound(r,1000);r.choices=Object.fromEntries(choices.map((c,i)=>[`p${i}`,c]));reveal(r,1001);return r;}
assert.deepEqual(resolve('trust',['cooperate','betray']).results.map(x=>x.gain),[0,50]);
assert.deepEqual(resolve('minority',['0','1','1']).results.map(x=>x.gain),[40,0,0]);
assert.deepEqual(resolve('apples',['0','0','0']).results.map(x=>x.gain),[30,30,30]);
assert.deepEqual(resolve('apples',['0','0','1']).results.map(x=>x.gain),[0,0,40]);
assert.deepEqual(resolve('contraband',['2','3']).results.map(x=>x.gain),[0,40]);
assert.deepEqual(resolve('goldrush',['0','1']).results.map(x=>x.gain),[20,-10]);
assert.deepEqual(resolve('selection',['1','2']).results.map(x=>x.gain),[-20,20]);
const royal=[8,9,10,11,12],four=[0,13,26,39,1],full=[0,13,26,1,14];assert.ok(pokerValue(royal)>pokerValue(four));assert.ok(pokerValue(four)>pokerValue(full));
const skipped=room(2);beginRound(skipped,1000);skipped.choices.p1='cooperate';reveal(skipped,46000);assert.deepEqual(skipped.results.map(x=>x.gain),[-10,10]);
assert.throws(()=>act(room(3),'p0','mode',{mode:'not-a-mode'},1000));

const result=(choice,otherChoice,gain,detail='resolved')=>({id:'p0',partner:'p1',choice,otherChoice,gain,detail});
assert.equal(roundPresentation('trust',result('cooperate','cooperate',30),[]).title,'PACT HONORED');
assert.equal(roundPresentation('trust',result('cooperate','betray',0),[]).tone,'betrayal');
assert.equal(roundPresentation('trust',result('betray','cooperate',50),[]).title,'THE PERFECT BLUFF');
assert.equal(roundPresentation('trust',result('betray','betray',5),[]).title,'DOUBLE CROSS');
assert.equal(roundPresentation('trust',result(null,null,-10,'Timed out · no move'),[]).tone,'setback');
assert.equal(roundPresentation('trust',result(null,null,0,'Observer'),[]).title,'WATCH & LEARN');
assert.equal(roundPresentation('kingdoms',result('defend',null,0),[]).title,'MOVE RESOLVED');
assert.equal(roundPresentation('minority',result('0',null,0),[]).tone,'setback');
assert.equal(roundPresentation('auction',result('0',null,0),[]).title,'BID REVEALED');
assert.equal(finalPresentation({score:30,eligible:true},[{score:30,id:'p0'}],'p0').title,'VICTORY');
assert.equal(finalPresentation({score:30,eligible:true},[{score:30,id:'p0'},{score:30,id:'p1'}],'p0').title,'VICTORY SHARED');
assert.equal(finalPresentation({score:0,eligible:false},[{score:30,id:'p1'}],'p0').title,'NO MOVES, NO CROWN');
assert.equal(finalPresentation({score:0,eligible:true},[{score:30,id:'p1'}],'p0').tone,'setback');
assert.equal(finalPresentation({score:-50,eligible:false},[],'p0').title,'NO CONTEST');

fs.rmSync(out,{recursive:true,force:true});console.log(`PASS ${MODES.length} modes and payoff / timeout boundary checks.`);

// Whispers never cross the viewer boundary, including after the reveal.
const whisperRoom=room(3);beginRound(whisperRoom,1000);
act(whisperRoom,'p0','chat',{text:'Secret pact',recipientId:'p1'},2000);
act(whisperRoom,'p0','chat',{text:'Public greeting'},3000);
for(const id of ['p0','p1'])assert.equal(view(whisperRoom,id,3000).messages.length,2);
assert.deepEqual(view(whisperRoom,'p2',3000).messages.map(m=>m.text),['Public greeting']);
assert.equal(JSON.stringify(view(whisperRoom,'p2',3000)).includes('Secret pact'),false);
assert.throws(()=>act(whisperRoom,'p0','chat',{text:'x',recipientId:'missing'},4000));
assert.throws(()=>act(whisperRoom,'p0','chat',{text:'x',recipientId:'p0'},4000));
reveal(whisperRoom,5000);
assert.throws(()=>act(whisperRoom,'p0','chat',{text:'x',recipientId:'p1'},6000));
assert.equal(view(whisperRoom,'p2',6000).messages.length,1);

// All modes honor 3/5/7 rounds, including deferred final scoring.
for(const mode of MODES)for(const rounds of [3,5,7]){
 const r=room(6);act(r,'p0','mode',{mode:mode.id},1000);
 act(r,'p0','settings',{rounds,negotiationSeconds:90},1000);
 assert.throws(()=>act(r,'p1','settings',{rounds:3,negotiationSeconds:30},1000));
 assert.throws(()=>act(r,'p0','settings',{rounds:4,negotiationSeconds:30},1000));
 for(const p of r.players)act(r,p.id,'ready',{},1000);act(r,'p0','start',{},1000);
 assert.equal(r.deadline,91000);assert.throws(()=>act(r,'p0','settings',{rounds:3,negotiationSeconds:30},1001));
 while(r.phase!=='finished'){
  assert.ok(r.round<=rounds);
  if(r.phase==='negotiation'){for(const p of r.players.filter(p=>needsChoice(r,p.id)))r.choices[p.id]=optionsFor(r,p.id)[0].value;reveal(r,r.deadline-1);}
  tick(r,r.deadline);
 }
 assert.equal(r.history.length,rounds);
 if(mode.id==='auction')assert.ok(r.results.some(r=>r.gain>0),'auction payout at selected final round');
}
console.log('PASS custom match lengths across all 22 modes and host-only settings');
