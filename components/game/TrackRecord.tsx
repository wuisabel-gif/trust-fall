import type { PublicRoom } from '../../lib/game/client';
import { moveLabel, moveTone } from '../../lib/game/history';
export function TrackRecord({room, playerId}: {room: PublicRoom; playerId: string}) {
    if (!room.history.length) return null;
    return <div className="track-record" aria-label="Revealed move history">{room.history.map(h => {
        const r = h.results.find(r => r.id === playerId);
        if (!r) return null;
        const label = `Round ${h.round}: ${moveLabel(room,r)} (${r.gain >= 0 ? '+' : ''}${r.gain})`;
        return <span key={h.round} className={`record-dot record-${moveTone(room.mode,r.choice)}`} title={label} aria-label={label} tabIndex={0}><span className="record-tooltip">{label}</span></span>;
    })}</div>;
}
