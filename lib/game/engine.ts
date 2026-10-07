import { addBot, playBots, type BotStyle } from './bots';
import { modeOf, MODES } from './modes/catalog';
import { initializeMode, needsChoice, optionsFor, resolveMode, roundDetails, type ModeState } from './modes/runtime';
import { characterIndex } from './characters';
export type Choice = string;
export type Player = {
    id: string;
    token: string;
    name: string;
    avatar?: number;
    isBot?: boolean;
    botStyle?: BotStyle;
    score: number;
    ready: boolean;
    lastChat: number;
};
export type Message = {
    senderId?: string;
    recipientId?: string;
    id: string;
    name: string;
    text: string;
    at: number;
};
export type Result = {
    id: string;
    partner: string | null;
    choice: Choice | null;
    otherChoice: Choice | null;
    gain: number;
    detail?: string;
};
export type Room = {
    mode?: string;
    modeState?: ModeState;
    roundSeed?: number;
    deck?: number[];
    code: string;
    host: string;
    players: Player[];
    phase: 'lobby' | 'negotiation' | 'reveal' | 'finished';
    round: number;
    deadline: number;
    choices: Record<string, Choice>;
    pairs: string[][];
    results: Result[];
    messages: Message[];
    history: {
        round: number;
        results: Result[];
    }[];
    created: number;
};
export function pairPlayers(players: Player[], round: number) {
    const ids: (string | null)[] = players.map(p => p.id);
    if (ids.length % 2)
        ids.push(null);
    for (let i = 0; i < (round - 1) % (ids.length - 1); i++)
        ids.splice(1, 0, ids.pop()!);
    const pairs: string[][] = [];
    for (let i = 0; i < ids.length / 2; i++)
        pairs.push([ids[i], ids[ids.length - 1 - i]].filter((x): x is string => x !== null));
    return pairs;
}
export function beginRound(r: Room, now: number) { if (!r.modeState)
    initializeMode(r); r.roundSeed = crypto.getRandomValues(new Uint32Array(1))[0]; r.round++; r.phase = 'negotiation'; r.deadline = now + 45000; r.choices = {}; r.results = []; r.pairs = pairPlayers(r.players, r.round); }
export function reveal(r: Room, now: number) {
    r.results = resolveMode(r);
    for (const p of r.players)
        p.score += r.results.find(x => x.id === p.id)!.gain;
    r.history.push({ round: r.round, results: r.results });
    r.phase = 'reveal';
    r.deadline = now + 12000;
}
export function tick(r: Room, now: number) {
    if (r.phase !== 'lobby' && !r.modeState)
        initializeMode(r);
    if (r.phase === 'negotiation') {
        playBots(r, now);
        if (now >= r.deadline || r.players.filter(p => needsChoice(r, p.id)).every(p => r.choices[p.id] !== undefined))
            reveal(r, now);
    }
    if (r.phase === 'reveal' && now >= r.deadline) {
        if (r.round === 5) {
            r.phase = 'finished';
            r.deadline = 0;
        }
        else
            beginRound(r, now);
    }
}
export function view(r: Room, id: string, now: number) {
    const { roundSeed, deck, choices, ...publicState } = r;
    return { ...publicState, messages: r.messages.filter(m => !m.recipientId || m.senderId === id || m.recipientId === id), mode: modeOf(r.mode).id, choiceOptions: r.phase === 'negotiation' ? optionsFor(r, id) : [], roundInfo: r.phase === 'negotiation' ? roundDetails(r, id) : '', canChoose: r.phase === 'negotiation' && needsChoice(r, id), players: r.players.map(({ token, lastChat, botStyle, ...p }, index) => ({ ...p, avatar: p.avatar ?? index % 4, isBot: !!p.isBot, eligible: r.history.some(h => h.results.some(x => x.id === p.id && x.choice !== null)), locked: r.choices[p.id] !== undefined })), choices: undefined, myChoice: r.choices[id] ?? null, you: id, serverNow: now };
}
export function act(r: Room, id: string, action: string, payload: Record<string, unknown>, now: number) {
    const p = r.players.find(x => x.id === id);
    if (!p)
        throw Error('Your seat is no longer available. Join again.');
    if (p.isBot)
        throw Error('AI seats are controlled by the game server.');
    if (action === 'ready' && r.phase === 'lobby')
        p.ready = !p.ready;
    else if (action === 'addBot' || action === 'fillBots' || action === 'removeBot') {
        if (id !== r.host || r.phase !== 'lobby')
            throw Error('Only the host can change AI seats in the waiting room.');
        if (action === 'removeBot') {
            if (!r.players.some(player => player.id === payload.playerId && player.isBot))
                throw Error('That AI seat is unavailable.');
            r.players = r.players.filter(player => player.id !== payload.playerId);
        }
        else if (action === 'fillBots') {
            while (r.players.length < 6)
                addBot(r);
        }
        else
            addBot(r);
    }
    else if (action === 'mode') {
        if (id !== r.host || r.phase !== 'lobby')
            throw Error('Only the host can choose a mode in the lobby.');
        if (!MODES.some(m => m.id === payload.mode))
            throw Error('Unknown game mode.');
        r.mode = String(payload.mode);
        r.modeState = undefined;
        r.history = [];
        r.results = [];
        for (const player of r.players) {
            player.ready = !!player.isBot;
            player.score = 0;
        }
    }
    else if (action === 'avatar') {
        if (r.phase !== 'lobby')
            throw Error('Change your character in the waiting room.');
        p.avatar = characterIndex(payload.avatar);
        p.ready = false;
    }
    else if (action === 'start') {
        if (id !== r.host)
            throw Error('Only the host can start.');
        if (r.phase !== 'lobby' || r.players.length < (modeOf(r.mode).minimum ?? 2) || !r.players.every(x => x.ready))
            throw Error(`This mode needs ${modeOf(r.mode).minimum ?? 2} ready players. Add AI seats if needed.`);
        initializeMode(r);
        beginRound(r, now);
    }
    else if (action === 'choice') {
        if (r.phase !== 'negotiation')
            throw Error('This round is closed.');
        if (!needsChoice(r, id))
            throw Error('You are observing this round.');
        if (r.choices[id])
            throw Error('Your choice is already locked.');
        if (!optionsFor(r, id).some(o => o.value === payload.choice))
            throw Error('Choose one of the available moves.');
        r.choices[id] = String(payload.choice);
        if (r.players.filter(p => needsChoice(r, p.id)).every(p => r.choices[p.id] !== undefined))
            reveal(r, now);
    }
    else if (action === 'chat') {
        const message = typeof payload.text === 'string' ? payload.text.trim().slice(0, 280) : '';
        if (!message)
            throw Error('Write a message first.');
        if (now - p.lastChat < 800)
            throw Error('Wait a moment before sending again.');
        const recipientId = typeof payload.recipientId === 'string' && payload.recipientId ? payload.recipientId : undefined;
        if (recipientId) {
            if (r.phase !== 'negotiation') throw Error('Whispers are available during negotiation only.');
            if (recipientId === id || !r.players.some(player => player.id === recipientId)) throw Error('Choose another player to whisper to.');
        }
        p.lastChat = now;
        r.messages.push({ id: crypto.randomUUID(), senderId: id, recipientId, name: p.name, text: message, at: now });
        r.messages = r.messages.slice(-60);
    }
    else if (action === 'rematch') {
        if (id !== r.host || r.phase !== 'finished')
            throw Error('The host can open a rematch after the game.');
        r.modeState = undefined;
        r.deck = undefined;
        r.roundSeed = undefined;
        r.phase = 'lobby';
        r.round = 0;
        r.deadline = 0;
        r.choices = {};
        r.results = [];
        r.history = [];
        r.pairs = [];
        for (const player of r.players) {
            player.score = 0;
            player.ready = !!player.isBot;
        }
    }
    else if (action === 'leave') {
        if (r.phase !== 'lobby' && r.phase !== 'finished')
            throw Error('Keep your seat until the match ends.');
        r.players = r.players.filter(x => x.id !== id);
        if (r.host === id)
            r.host = r.players.find(player => !player.isBot)?.id ?? '';
    }
    else
        throw Error('That action is unavailable right now.');
}
