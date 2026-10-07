import type { Result, Room } from './engine';
import { modeOf } from './modes/catalog';

type HistoryRoom = Pick<Room, 'mode' | 'history'> & { players: {id: string; name: string}[] };
export function moveLabel(room: HistoryRoom, result: Result): string {
    if (result.choice === null) return result.detail?.startsWith('Timed out') ? 'Timed out' : 'Observer';
    const player = room.players.find(p => p.id === result.choice);
    if (player) return `Chose ${player.name}`;
    if (result.choice.startsWith('attack:')) return `Attack kingdom ${Number(result.choice.split(':')[1]) + 1}`;
    return modeOf(room.mode).options.find(o => o.value === result.choice)?.label ?? result.choice;
}
export function moveTone(mode: string | undefined, choice: string | null) {
    if (choice === null) return 'idle';
    if (modeOf(mode).id === 'trust') return choice === 'cooperate' ? 'trust' : 'betray';
    if (mode === 'apples') return choice === '0' ? 'trust' : 'betray';
    return 'move';
}

export function matchAwards(room: HistoryRoom) {
    const records = room.players.map(player => {
        const moves = room.history.flatMap(h => h.results.filter(r => r.id === player.id));
        return {
            name: player.name,
            betrayals: moves.filter(r => moveTone(room.mode,r.choice) === 'betray').length,
            trusts: moves.filter(r => moveTone(room.mode,r.choice) === 'trust').length,
            submitted: moves.filter(r => r.choice !== null).length,
            swing: moves.reduce((best, r, i) => i ? Math.max(best, Math.abs(r.gain - moves[i-1].gain)) : best, 0),
        };
    });
    const award = (title: string, key: 'betrayals' | 'trusts' | 'submitted' | 'swing', unit: string) => {
        const value = Math.max(0, ...records.map(p => p[key]));
        return { title, names: value ? records.filter(p => p[key] === value).map(p => p.name).join(' & ') : 'No one this match', detail: `${value} ${unit}` };
    };
    const awards = room.mode === 'trust' || !room.mode || room.mode === 'apples'
        ? [award('Most betrayals','betrayals','betrayals'), award('Most trusting','trusts','cooperative moves')]
        : [award('Most committed','submitted','submitted moves')];
    return [...awards, award('Biggest swing','swing','points between consecutive round gains')];
}
