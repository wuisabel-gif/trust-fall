import { Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Message } from '../../lib/game/engine';

type ChatPlayer = { id: string; name: string; isBot: boolean };
export function Chat({ messages, players, you, negotiating, send, busy }: {
    messages: Message[];
    players: ChatPlayer[];
    you: string;
    negotiating: boolean;
    send: (text: string, recipientId?: string) => Promise<boolean>;
    busy: boolean;
}) {
    const [text, setText] = useState('');
    const [recipient, setRecipient] = useState('');
    const end = useRef<HTMLDivElement>(null);
    // Keep a draft's audience explicit across phase changes; never turn a
    // private draft into a public message when negotiation ends.
    const whisperClosed = !!recipient && !negotiating;
    useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }); }, [messages.length]);
    return <aside className="chat">
        <h2>TABLE TALK <span>LIVE</span></h2>
        <div className="messages" aria-live="polite">
            {!messages.length && <p className="chat-empty">Talk to the table, or whisper during negotiation.</p>}
            {messages.map(m => <div className={`message ${m.recipientId ? 'whisper' : ''}`} key={m.id}>
                <div><strong>{m.name}</strong><time>{new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
                {m.recipientId && <small>Private · {m.senderId === you ? `to ${players.find(p => p.id === m.recipientId)?.name ?? 'former player'}` : 'to you'}</small>}
                <p>{m.text}</p>
            </div>)}
            <div ref={end}/>
        </div>
        <div className="chat-audience">
            <label htmlFor="chat-recipient">Send to</label>
            <select id="chat-recipient" value={recipient} onChange={e => setRecipient(e.target.value)}>
                <option value="">Everyone</option>
                {players.filter(p => p.id !== you).map(p => <option key={p.id} value={p.id} disabled={!negotiating}>{p.name}{p.isBot ? ' · AI' : ''} (private)</option>)}
            </select>
            <small>{whisperClosed ? 'Whispers reopen next negotiation. Draft kept private.' : recipient ? 'Only you and this player can see it. AI seats do not reply.' : 'Visible to everyone at the table.'}</small>
        </div>
        <form onSubmit={async e => { e.preventDefault(); if (!whisperClosed && await send(text, recipient || undefined)) setText(''); }}>
            <input suppressHydrationWarning aria-label="Table chat message" placeholder={recipient ? 'Whisper…' : 'Type a message…'} maxLength={280} value={text} onChange={e => setText(e.target.value)}/>
            <button aria-label="Send message" disabled={busy || !text.trim() || whisperClosed}><Send size={20}/></button>
        </form>
    </aside>;
}
