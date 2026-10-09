import { useLanguage } from '../../lib/i18n/language';
import { modeOf } from '../../lib/game/modes/catalog';
import { CHARACTERS, CHARACTER_PROFILES } from '../../lib/game/characters';
export function CharacterPicker({value,onChange,disabled=false}:{value:number;onChange:(value:number)=>void;disabled?:boolean}) {
 const {t}=useLanguage();

  const profile=CHARACTER_PROFILES[value];
  return <><div className="character-picker" role="group" aria-label={t("Choose your character")}>{CHARACTERS.map((name,index)=><button key={name} type="button" className={`character-option ${value===index?'chosen':''}`} aria-label={t(`Choose ${name}`)} aria-pressed={value===index} disabled={disabled} onClick={()=>onChange(index)}><span className={`character-image portrait-${index}`} aria-hidden="true"/><span>{t(name)}</span></button>)}</div><section key={value} className="character-profile" aria-live="polite" aria-label={t(`${CHARACTERS[value]} character profile`)}><h3>{t(CHARACTERS[value])}</h3><p>{t(profile.intro)}</p><dl><div><dt>{t("Strength")}</dt><dd>{t(profile.strength)}</dd></div><div><dt>{t("Weakness")}</dt><dd>{t(profile.weakness)}</dd></div><div><dt>{t("Best-fit games")}</dt><dd>{t(profile.games.map(id=>modeOf(id).name).join(' · '))}</dd></div></dl><p className="character-tip">{t(profile.tip)}</p><small>{t("Playstyle guide. Every character uses the same scoring rules.")}</small></section></>;
}
