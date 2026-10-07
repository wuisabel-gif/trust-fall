import type { PublicRoom } from '../../lib/game/client';
import { matchAwards, moveLabel } from '../../lib/game/history';
export function MatchRecap({room}: {room: PublicRoom}) {
    const name = (id: string | null) => room.players.find(p => p.id === id)?.name;
    return <section className="match-recap" aria-labelledby="recap-title">
        <h2 id="recap-title">Match recap</h2>
        <div className="match-awards">{matchAwards(room).map(a => <div key={a.title}><h3>{a.title}</h3><strong>{a.names}</strong><small>{a.detail}</small></div>)}</div>
        <div className="recap-scroll" tabIndex={0} role="region" aria-label="Round-by-round results">
            <table><caption>Every revealed move · private whispers stay private</caption><thead><tr><th>Round</th><th>Player</th><th>Move</th><th>Partner / target</th><th>Outcome</th><th>Points</th></tr></thead>
                <tbody>{room.history.flatMap(h => h.results.map(r => <tr key={`${h.round}-${r.id}`}><td>{h.round}</td><th scope="row">{name(r.id)}</th><td>{moveLabel(room,r)}</td><td>{name(r.partner) ?? name(r.choice) ?? 'Table'}</td><td>{r.detail ?? 'Resolved'}</td><td className={r.gain < 0 ? 'negative' : 'positive'}>{r.gain >= 0 ? '+' : ''}{r.gain}</td></tr>))}</tbody>
            </table>
        </div>
    </section>;
}
