import { useLanguage } from '../../lib/i18n/language';
import { MODES } from '../../lib/game/modes/catalog';
const starters = ['trust', 'minority', 'apples', 'goldrush'];
const tags: Record<string,string> = {contraband:'Reading bluffs', downsizing:'Coalitions', roulette:'Push your luck', poker17:'Card strategy', stationary:'Quick play', pandemic:'Planning contacts', chairs:'Negotiation', auction:'Advanced · bidding', kingdoms:'Advanced · teams', ghostleg:'Quick play', 'human-auction':'Bidding', taboo:'Reading opponents', election:'Coalitions', survival:'Advanced · resources', mask:'Bluffing', selection:'Reading opponents', vault:'Negotiation', angels:'Planning contacts'};
export function ModePicker({value, disabled, choose}: {value:string;disabled:boolean;choose:(mode:string)=>void}) {
 const {t}=useLanguage();

    const modes = [...MODES].sort((a,b) => Number(starters.includes(b.id))-Number(starters.includes(a.id)));
    return <div className="mode-grid" role="group" aria-label={t("Game modes")}>{modes.map(m => <button type="button" key={m.id} className={`mode-card ${m.id===value?'selected':''}`} aria-pressed={m.id===value} disabled={disabled} onClick={()=>choose(m.id)}>
        <span className="mode-tag">{t(starters.includes(m.id)?'Start here':tags[m.id]??'Strategy')}</span><strong>{t(m.name)}</strong><span>{t(m.summary)}</span><small>{t(m.minimum??2)}{t("–6 seats ")}{t(m.id===value?'· SELECTED':'')}</small>
    </button>)}</div>;
}
