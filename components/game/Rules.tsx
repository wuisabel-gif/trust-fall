import { DEFAULT_SETTINGS, type MatchSettings } from '../../lib/game/settings';
import { X } from 'lucide-react';
import { modeOf } from '../../lib/game/modes/catalog';
export function Rules({ close, mode, settings = DEFAULT_SETTINGS }: {
    close: () => void;
    mode?: string;
    settings?: MatchSettings;
}) {
    const game = modeOf(mode);
    return <div className="modal-backdrop" onClick={close}><section className="rules modal" role="dialog" aria-modal="true" aria-labelledby="rules-title" onClick={e => e.stopPropagation()}><button className="close" onClick={close} aria-label="Close rules"><X size={22}/></button><span className="eyebrow">THE RULES OF THE TABLE</span><h2 id="rules-title">{game.name}</h2><p>{game.summary} Play with {game.minimum ?? 2}–6 seats; AI seats count toward the minimum.</p><ol>{game.rules.map(rule => <li key={rule}>{rule}</li>)}</ol><p><strong>{settings.rounds} rounds, {settings.negotiationSeconds} seconds per move.</strong> Talk in public chat or whisper privately during negotiation, then lock a secret choice. Choices cannot change once locked. Reveal happens when all required moves arrive or time expires; the next round starts after 12 seconds.</p><p><strong>Timeout means no move and −10 points.</strong> No automatic cooperation. Observers earn 0. A player who never submits a move cannot win. Highest eligible score wins; ties share the win.</p><p>AI seats are labeled and use rule-based strategies plus public history. They cannot read your current secret choices. The host selects a game and manages AI seats in the lobby.</p><p>These are short, independently implemented adaptations and original games inspired by social strategy tournaments. Fictional points only.</p><button className="primary" onClick={close}>I understand</button></section></div>;
}
