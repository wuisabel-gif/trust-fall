import type { Result } from './engine';
export type OutcomeTone = 'victory' | 'betrayal' | 'setback' | 'stalemate';
export type OutcomePresentation = {tone:OutcomeTone;title:string;caption:string;art:number};
const outcome=(tone:OutcomeTone,title:string,caption:string):OutcomePresentation=>({tone,title,caption,art:{victory:0,betrayal:1,setback:2,stalemate:3}[tone]});
export function roundPresentation(mode:string,result:Result|undefined,results:Result[]):OutcomePresentation{
 if(!result)return outcome('stalemate','THE REVEAL','Waiting for the table’s verdict.');
 if(result.choice===null)return result.detail?.startsWith('Timed out')?outcome('setback','TIME RAN OUT','No move was submitted.'):outcome('stalemate','WATCH & LEARN','Your next move is still ahead.');
 if(mode==='trust'){
  if(result.choice==='cooperate'&&result.otherChoice==='cooperate')return outcome('victory','PACT HONORED','For one round, trust paid off.');
  if(result.choice==='cooperate'&&result.otherChoice==='betray')return outcome('betrayal','TRUST SHATTERED','Your partner broke the promise.');
  if(result.choice==='betray'&&result.otherChoice==='cooperate')return outcome('victory','THE PERFECT BLUFF','You took the reward. They took the risk.');
  if(result.choice==='betray'&&result.otherChoice==='betray')return outcome('betrayal','DOUBLE CROSS','Neither side trusted the other.');
 }
 if(mode==='apples'&&result.choice==='0'&&result.gain===0)return results.some(r=>r.choice==='1'||r.choice==='2')?outcome('betrayal','PACT BROKEN','Someone chose ambition over the alliance.'):outcome('stalemate','PACT INCOMPLETE','The whole table did not commit.');
 if(mode==='minority'&&result.gain===40)return outcome('victory','MINORITY WINS','You stayed on the smaller side.');
 if(mode==='minority'&&result.gain===0)return outcome('setback','OUTNUMBERED','The larger bloc missed the reward.');
 if(result.gain<0)return outcome('setback','THE PRICE PAID','This round cost you points.');
 if(result.gain>0)return outcome('victory','POINTS SECURED','Your move earned its reward.');
 return outcome('stalemate',mode==='auction'?'BID REVEALED':'MOVE RESOLVED','The table’s choices are now public.');
}
export function finalPresentation(me:{score:number;eligible:boolean},winners:{score:number;id:string}[],you:string):OutcomePresentation{
 if(!winners.length)return outcome('stalemate','NO CONTEST','No one submitted a move.');
 if(!me.eligible)return outcome('setback','NO MOVES, NO CROWN','Submit a move to compete for the win.');
 if(winners.some(p=>p.id===you))return winners.length>1?outcome('victory','VICTORY SHARED','The crown belongs to more than one player.'):outcome('victory','VICTORY','You leave the table on top.');
 return outcome('setback','OUTPLAYED','One match ends. Another alliance begins.');
}
