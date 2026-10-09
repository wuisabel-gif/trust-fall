import { useLanguage } from '../../lib/i18n/language';
import type { PublicRoom } from '../../lib/game/client';
import { matchAwards, moveLabel } from '../../lib/game/history';
export function MatchRecap({room}: {room: PublicRoom}) {
 const {t}=useLanguage();

    const name = (id: string | null) => room.players.find(p => p.id === id)?.name;
    return <section className="match-recap" aria-labelledby="recap-title">
        <h2 id="recap-title">{t("Match recap")}</h2>
        <div className="match-awards">{matchAwards(room).map(a => <div key={a.title}><h3>{t(a.title)}</h3><strong>{a.names}</strong><small>{t(a.detail)}</small></div>)}</div>
        <div className="recap-scroll" tabIndex={0} role="region" aria-label={t("Round-by-round results")}>
            <table><caption>{t("Every revealed move · private whispers stay private")}</caption><thead><tr><th>{t("Round")}</th><th>{t("Player")}</th><th>{t("Move")}</th><th>{t("Partner / target")}</th><th>{t("Outcome")}</th><th>{t("Points")}</th></tr></thead>
                <tbody>{room.history.flatMap(h => h.results.map(r => <tr key={`${h.round}-${r.id}`}><td>{t(h.round)}</td><th scope="row">{name(r.id)}</th><td>{t(moveLabel(room,r))}</td><td>{t(name(r.partner) ?? name(r.choice) ?? 'Table')}</td><td>{t(r.detail ?? 'Resolved')}</td><td className={r.gain < 0 ? 'negative' : 'positive'}>{t(r.gain >= 0 ? '+' : '')}{t(r.gain)}</td></tr>))}</tbody>
            </table>
        </div>
    </section>;
}
