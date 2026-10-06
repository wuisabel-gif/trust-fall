import { CHARACTERS } from '../../lib/game/characters';
export function CharacterPicker({value,onChange,disabled=false}:{value:number;onChange:(value:number)=>void;disabled?:boolean}) {
  return <div className="character-picker" role="group" aria-label="Choose your character">{CHARACTERS.map((name,index)=><button key={name} type="button" className={`character-option ${value===index?'chosen':''}`} aria-label={`Choose ${name}`} aria-pressed={value===index} disabled={disabled} onClick={()=>onChange(index)}><span className={`character-image portrait-${index}`} aria-hidden="true"/><span>{name}</span></button>)}</div>;
}
