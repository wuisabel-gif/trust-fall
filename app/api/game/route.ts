import { env } from 'cloudflare:workers';
import { act, tick, view, type Room } from '../../../lib/game/engine';
const headers={'Cache-Control':'no-store'};
function db(){if(!env.DB)throw Error('The game server is unavailable. Please try again.');return env.DB;}
function nameOf(value:unknown){const name=typeof value==='string'?value.trim().slice(0,18):'';if(!name)throw Error('Enter your player name.');return name;}
function codeOf(value:unknown){return typeof value==='string'?value.trim().toUpperCase():'';}
function reply(value:unknown,status=200){return Response.json(value,{status,headers});}
async function update(code:string, token:string, operation:(r:Room,id:string,now:number)=>void,joinName?:string) {
  for(let attempt=0;attempt<8;attempt++){
    const row=await db().prepare('SELECT state, version FROM rooms WHERE code = ?').bind(code).first<{state:string;version:number}>();
    if(!row)throw Error('Room not found. Check the code.');
    const r=JSON.parse(row.state) as Room,now=Date.now();
    if(now-r.created>86400000)throw Error('This room has expired. Create a new table.');
    let player=r.players.find(p=>p.token===token);
    if(joinName&&!player){if(r.phase!=='lobby')throw Error('This match has started. Join when the host opens a rematch.');if(r.players.length>=6)throw Error('This table is full.');if(r.players.some(p=>p.name.toLowerCase()===joinName.toLowerCase()))throw Error('That name is taken at this table.');player={id:crypto.randomUUID(),token,name:joinName,score:0,ready:false,lastChat:0};r.players.push(player);if(!r.host)r.host=player.id;}
    if(!player)throw Error('Your seat could not be verified. Join the room again.');
    const before=row.state;tick(r,now);operation(r,player.id,now);
    if(JSON.stringify(r)===before)return view(r,player.id,now);
    const result=await db().prepare('UPDATE rooms SET state = ?, version = version + 1, updated_at = ? WHERE code = ? AND version = ?').bind(JSON.stringify(r),now,code,row.version).run();
    if(result.meta.changes)return view(r,player.id,now);
  }throw Error('The table is busy. Please try again.');
}
export async function GET(request:Request){try{const u=new URL(request.url);const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')??'';return reply(await update(codeOf(u.searchParams.get('code')),token,()=>{}));}catch(error){return reply({error:error instanceof Error?error.message:'Could not load the table.'},400);}}
export async function POST(request:Request){try{
  const payload=await request.json() as Record<string,unknown>,action=String(payload.action??'');
  if(action==='create'){
    const name=nameOf(payload.name),token=crypto.randomUUID(),id=crypto.randomUUID(),now=Date.now();
    for(let i=0;i<5;i++){
      const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=crypto.getRandomValues(new Uint8Array(5));const code=Array.from(bytes,x=>alphabet[x%alphabet.length]).join('');
      const r:Room={code,host:id,players:[{id,token,name,score:0,ready:false,lastChat:0}],phase:'lobby',round:0,deadline:0,choices:{},pairs:[],results:[],messages:[],history:[],created:now};
      const inserted=await db().prepare('INSERT OR IGNORE INTO rooms (code,state,version,updated_at) VALUES (?,?,0,?)').bind(code,JSON.stringify(r),now).run();
      if(inserted.meta.changes)return reply({room:view(r,id,now),token});
    }throw Error('Could not create a room. Try again.');
  }
  const code=codeOf(payload.code);
  if(action==='join'){const token=crypto.randomUUID();return reply({room:await update(code,token,()=>{},nameOf(payload.name)),token});}
  const token=request.headers.get('Authorization')?.replace(/^Bearer /,'')??'';
  return reply({room:await update(code,token,(r,id,now)=>act(r,id,action,payload,now))});
}catch(error){console.error('Game request:',error instanceof Error?error.message:error);return reply({error:error instanceof Error?error.message:'The table is unavailable. Try again.'},400);}}
