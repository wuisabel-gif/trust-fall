import { useLanguage } from '../../lib/i18n/language';
import { useEffect, useState } from 'react';
import type { OutcomePresentation } from '../../lib/game/presentation';
function AnimatedScore({value}:{value:number}){
 const {t}=useLanguage();

 const [shown,setShown]=useState(value);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setShown(value);return;}
  setShown(0);let frame=0;const start=performance.now();
  const animate=(now:number)=>{const t=Math.min(1,(now-start)/650);setShown(Math.round(value*(1-(1-t)**3)));if(t<1)frame=requestAnimationFrame(animate);};
  frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
 },[value]);
 return <span aria-hidden="true">{t(shown>0?'+':'')}{t(shown)}</span>;
}
export function OutcomeBanner({presentation,value,final=false}:{presentation:OutcomePresentation;value:number;final?:boolean}){
 const {t}=useLanguage();

 return <div className={`outcome-banner outcome-${presentation.tone}`} data-outcome={presentation.tone}>
  <div className={`outcome-art outcome-art-${presentation.art}`} aria-hidden="true"/>
  <div className="outcome-copy"><span className="eyebrow">{t(final?'FINAL VERDICT':'YOUR ROUND RESULT')}</span><h2>{t(presentation.title)}</h2><p>{t(presentation.caption)}</p><div className="outcome-score"><span className="sr-only">{t(final?'Final score':'Round score')}: {t(value)}{t(" points")}</span>{final?<span aria-hidden="true">{t(value)}</span>:<AnimatedScore value={value}/>}<small>{t(final?'FINAL POINTS':'POINTS')}</small></div></div>
 </div>;
}
