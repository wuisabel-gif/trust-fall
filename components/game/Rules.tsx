import { useLanguage } from '../../lib/i18n/language';
import { DEFAULT_SETTINGS, type MatchSettings } from '../../lib/game/settings';
import { X } from 'lucide-react';
import { modeOf } from '../../lib/game/modes/catalog';
export function Rules({ close, mode, settings = DEFAULT_SETTINGS }: {
    close: () => void;
    mode?: string;
    settings?: MatchSettings;
}) {
 const {t}=useLanguage();

    const game = modeOf(mode);
    return <div className="modal-backdrop" onClick={close}><section className="rules modal" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={e => e.stopPropagation()}><button className="close" onClick={close} aria-label={t("Close rules")}><X size={22}/></button><span className="eyebrow">{t("THE RULES OF THE TABLE")}</span><h2 id="rules-title">{t(game.name)}</h2><p>{t(game.summary)}{t(" Play with ")}{t(game.minimum ?? 2)}{t("–6 seats; AI seats count toward the minimum.")}</p><ol>{game.rules.map(rule => <li key={rule}>{t(rule)}</li>)}</ol><p><strong>{t(settings.rounds)}{t(" rounds, ")}{t(settings.negotiationSeconds)}{t(" seconds per move.")}</strong>{t(" Talk in public chat or whisper privately during negotiation, then lock a secret choice. Choices cannot change once locked. Reveal happens when all required moves arrive or time expires; the next round starts after 12 seconds.")}</p><p><strong>{t("Timeout means no move and −10 points.")}</strong>{t(" No automatic cooperation. Observers earn 0. A player who never submits a move cannot win. Highest eligible score wins; ties share the win.")}</p><p>{t("AI seats are labeled and use rule-based strategies plus public history. They cannot read your current secret choices. The host selects a game and manages AI seats in the lobby.")}</p><p>{t("These are short, independently implemented adaptations and original games inspired by social strategy tournaments. Fictional points only.")}</p><button className="primary" onClick={close}>{t("I understand")}</button></section></div>;
}
