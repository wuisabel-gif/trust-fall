import { botDialogue } from './bot-dialogue';
import type { Choice, Player, Room } from './engine';
export type BotStyle = 'friendly' | 'cautious' | 'opportunist' | 'unpredictable' | 'mirror';
const profiles: {name:string; avatar:number; style:BotStyle}[] = [
  {name:'Ren', avatar:1, style:'cautious'},
  {name:'Mika', avatar:2, style:'friendly'},
  {name:'Jules', avatar:5, style:'opportunist'},
  {name:'Ember', avatar:6, style:'unpredictable'},
  {name:'Raven', avatar:7, style:'mirror'},
];
function hash(text:string) { let value=2166136261; for(const char of text) value=Math.imul(value^char.charCodeAt(0),16777619); return value>>>0; }
export function addBot(room:Room) {
  if(room.players.length>=6) throw Error('This table is full.');
  const profile=profiles.find(x=>!room.players.some(p=>p.isBot&&p.botStyle===x.style))??profiles[0];
  let name=profile.name,index=2;
  while(room.players.some(p=>p.name.toLowerCase()===name.toLowerCase())) name=`${profile.name} ${index++}`;
  room.players.push({id:crypto.randomUUID(),token:crypto.randomUUID(),name,avatar:profile.avatar,isBot:true,botStyle:profile.style,score:0,ready:true,lastChat:0});
}
// Deliberately accept only public round history: bots cannot inspect anyone's
// current secret choice, even if a human locks in before them.
export function botChoice(history:Room['history'],round:number,bot:Player,partnerId:string):Choice {
  const previous=history.at(-1)?.results.find(r=>r.id===partnerId)?.choice;
  const roll=hash(`${bot.id}:${round}:choice`)%100;
  switch(bot.botStyle) {
    case 'friendly': return roll<85?'cooperate':'betray';
    case 'cautious': return roll<(previous==='betray'?20:70)?'cooperate':'betray';
    case 'opportunist': return roll<25?'cooperate':'betray';
    case 'mirror': return previous??'cooperate';
    default: return roll<50?'cooperate':'betray';
  }
}
export function playBots(room:Room,now:number) {
  const start=room.deadline-45000;
  for(const bot of room.players.filter(p=>p.isBot)) {
    const pair=room.pairs.find(pair=>pair.includes(bot.id));
    if(!pair||pair.length!==2) continue;
    const partnerId=pair.find(id=>id!==bot.id)!;
    const seed=hash(`${bot.id}:${room.round}`);
    if(now>=start+2000+seed%2500&&bot.lastChat<start) {
      const partner=room.players.find(p=>p.id===partnerId)!;
      room.messages.push({id:crypto.randomUUID(),name:`${bot.name} · AI`,text:botDialogue(room,bot,partner,start,seed),at:now});
      room.messages=room.messages.slice(-60);bot.lastChat=now;
    }
    if(!room.choices[bot.id]&&now>=start+8000+seed%7000) room.choices[bot.id]=botChoice(room.history,room.round,bot,partnerId);
  }
}
