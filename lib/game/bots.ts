import { settingsOf } from './settings';
import { modeOf } from './modes/catalog';
import { needsChoice, optionsFor, faction, type PublicModeContext } from './modes/runtime';
import { botDialogue } from './bot-dialogue';
import type { Choice, Player, Room } from './engine';
export type BotStyle = 'friendly' | 'cautious' | 'opportunist' | 'unpredictable' | 'mirror';
const profiles: {
    name: string;
    avatar: number;
    style: BotStyle;
}[] = [
    { name: 'Ren', avatar: 1, style: 'cautious' },
    { name: 'Mika', avatar: 2, style: 'friendly' },
    { name: 'Jules', avatar: 5, style: 'opportunist' },
    { name: 'Ember', avatar: 6, style: 'unpredictable' },
    { name: 'Raven', avatar: 7, style: 'mirror' },
];
function hash(text: string) { let value = 2166136261; for (const char of text)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619); return value >>> 0; }
export function addBot(room: Room) {
    if (room.players.length >= 6)
        throw Error('This table is full.');
    const profile = profiles.find(x => !room.players.some(p => p.isBot && p.botStyle === x.style)) ?? profiles[0];
    let name = profile.name, index = 2;
    while (room.players.some(p => p.name.toLowerCase() === name.toLowerCase()))
        name = `${profile.name} ${index++}`;
    room.players.push({ id: crypto.randomUUID(), token: crypto.randomUUID(), name, avatar: profile.avatar, isBot: true, botStyle: profile.style, score: 0, ready: true, lastChat: 0 });
}
// Deliberately accept only public round history: bots cannot inspect anyone's
// current secret choice, even if a human locks in before them.
export function botChoice(history: Room['history'], round: number, bot: Player, partnerId: string): Choice {
    const previous = history.at(-1)?.results.find(r => r.id === partnerId)?.choice;
    const roll = hash(`${bot.id}:${round}:choice`) % 100;
    switch (bot.botStyle) {
        case 'friendly': return roll < 85 ? 'cooperate' : 'betray';
        case 'cautious': return roll < (previous === 'betray' ? 20 : 70) ? 'cooperate' : 'betray';
        case 'opportunist': return roll < 25 ? 'cooperate' : 'betray';
        case 'mirror': return previous ?? 'cooperate';
        default: return roll < 50 ? 'cooperate' : 'betray';
    }
}
export function playBots(room: Room, now: number) {
    const start = room.deadline - settingsOf(room).negotiationSeconds * 1000;
    for (const bot of room.players.filter(p => p.isBot)) {
        const pair = room.pairs.find(pair => pair.includes(bot.id));
        if (!needsChoice(room, bot.id))
            continue;
        const partnerId = pair?.find(id => id !== bot.id) ?? room.players.find(p => p.id !== bot.id)!.id;
        const seed = hash(`${bot.id}:${room.round}`);
        if (now >= start + 2000 + seed % 2500 && bot.lastChat < start) {
            const partner = room.players.find(p => p.id === partnerId)!;
            room.messages.push({ id: crypto.randomUUID(), name: `${bot.name} · AI`, text: modeOf(room.mode).id === 'trust' ? botDialogue({ ...room, messages: room.messages.filter(m => !m.recipientId) }, bot, partner, start, seed) : modeChat(room, bot, seed), at: now });
            room.messages = room.messages.slice(-60);
            bot.lastChat = now;
        }
        if (!room.choices[bot.id] && now >= start + 8000 + seed % 7000)
            room.choices[bot.id] = modeOf(room.mode).id === 'trust' ? botChoice(room.history, room.round, bot, partnerId) : modeChoice(room, bot, seed);
    }
}
function modeChat(room: Room, bot: Player, seed: number) {
    const lines = ['Let’s coordinate before we lock in.', 'A promise is only useful if you keep it.', 'I’m watching the score as well as the chat.', 'Who wants to make a pact this round?', 'I have a plan. You’ll see it at the reveal.', 'The safest choice isn’t always the winning one.', 'I remember how the last round ended.', 'Nobody gets a free alliance.'];
    const used = new Set(room.messages.filter(m => !m.recipientId && m.at >= room.deadline - settingsOf(room).negotiationSeconds * 1000).map(m => m.text));
    for (let i = 0; i < lines.length; i++) {
        const line = `${modeOf(room.mode).name}: ${lines[(seed + i) % lines.length]}`;
        if (!used.has(line))
            return line;
    }
    return `${bot.name}: I’m considering my options.`;
}
export function modeChoice(room: PublicModeContext, bot: Player, seed: number): string {
    const opts = optionsFor(room, bot.id), m = modeOf(room.mode).id, style = bot.botStyle;
    const pick = (value: string) => opts.some(o => o.value === value) ? value : opts[seed % opts.length].value;
    if (m === 'minority') {
        const last = room.history.at(-1)?.results.filter(r => r.choice === '0').length ?? 0;
        return pick(seed % 4 === 0 ? '0' : last > room.players.length / 2 ? '0' : '1');
    }
    if (m === 'apples')
        return pick(style === 'friendly' ? '0' : style === 'opportunist' ? '1' : String(seed % 3));
    if (m === 'pandemic') {
        const healthy = opts.filter(o => !room.modeState!.infected.includes(o.value));
        return (healthy[seed % Math.max(1, healthy.length)] ?? opts[0]).value;
    }
    if (m === 'auction')
        return pick(String(style === 'opportunist' ? 3 : seed % 3));
    if (m === 'kingdoms') {
        const own = faction(room, bot.id), weak = room.modeState!.kingdoms.map((lp, i) => ({ lp, i })).filter(x => x.i !== own && x.lp > 0).sort((a, b) => a.lp - b.lp)[0];
        return pick(style === 'cautious' ? 'defend' : weak ? `attack:${weak.i}` : 'rest');
    }
    if (m === 'poker17')
        return pick(style === 'cautious' ? '0' : '1');
    if (m === 'survival')
        return pick(room.modeState!.energy[bot.id] > 0 ? '1' : room.modeState!.shields[bot.id] === 1 && room.modeState!.deflect[bot.id] > 0 ? '2' : '0');
    if (m === 'election' && room.round % 2 === 0)
        return pick(room.modeState!.president === bot.id ? (style === 'opportunist' ? 'tax' : 'share') : 'support');
    if (m === 'selection')
        return pick(style === 'friendly' ? '0' : style === 'opportunist' ? '1' : '2');
    return opts[seed % opts.length].value;
}
