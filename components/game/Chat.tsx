import { Send } from 'lucide-react';
import { useEffect,useRef,useState } from 'react';
import type { Message } from '../../lib/game/engine';
export function Chat({messages,send,busy}:{messages:Message[];send:(text:string)=>Promise<boolean>;busy:boolean}){
 const [text,setText]=useState(''),end=useRef<HTMLDivElement>(null);
 useEffect(()=>{end.current?.scrollIntoView({block:'nearest'});},[messages.length]);
 return <aside className="chat"><h2>TABLE TALK <span>{messages.length?'LIVE':'ALL PLAYERS'}</span></h2><div className="messages" aria-live="polite">{!messages.length&&<p className="chat-empty">Make a promise.<br/>See who keeps it.</p>}{messages.map(m=><div className="message" key={m.id}><div><strong>{m.name}</strong><time>{new Date(m.at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</time></div><p>{m.text}</p></div>)}<div ref={end}/></div><form onSubmit={async e=>{e.preventDefault();if(await send(text))setText('');}}><input style={{minWidth:0}} aria-label="Table chat message" placeholder="Type a message…" maxLength={280} value={text} onChange={e=>setText(e.target.value)}/><button aria-label="Send message" disabled={busy||!text.trim()}><Send size={20}/></button></form></aside>
}
