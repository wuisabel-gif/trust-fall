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
