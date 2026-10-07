import type { Room, Choice } from './engine';
export type PublicRoom = Omit<Room,'players'|'choices'> & {players:{id:string;name:string;avatar:number;isBot:boolean;score:number;ready:boolean;locked:boolean}[];you:string;serverNow:number;myChoice:Choice|null};
export type Session = {code:string;token:string};
export function requestGame(action:"poll",session:Session|null,payload?:Record<string,unknown>):Promise<PublicRoom>;
export function requestGame(action:string,session:Session|null,payload?:Record<string,unknown>):Promise<{room:PublicRoom;token?:string}>;
export async function requestGame(action:string,session:Session|null,payload:Record<string,unknown>={}) {
 const response=await fetch(action==='poll'?`/api/game?code=${session?.code}`:'/api/game',{method:action==='poll'?'GET':'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.token}`}:{})},...(action==='poll'?{}:{body:JSON.stringify({action,code:session?.code,...payload})})});
 const data=await response.json() as {error?:string;room:PublicRoom;token?:string} & PublicRoom;if(!response.ok)throw Error(data.error??'Connection interrupted. Try again.');return data;
}
