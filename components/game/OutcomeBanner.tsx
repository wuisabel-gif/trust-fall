import { useEffect, useState } from 'react';
import type { OutcomePresentation } from '../../lib/game/presentation';
function AnimatedScore({value}:{value:number}){
 const [shown,setShown]=useState(value);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setShown(value);return;}
  setShown(0);let frame=0;const start=performance.now();
  const animate=(now:number)=>{const t=Math.min(1,(now-start)/650);setShown(Math.round(value*(1-(1-t)**3)));if(t<1)frame=requestAnimationFrame(animate);};
  frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
 },[value]);
 return <span aria-hidden="true">{shown>0?'+':''}{shown}</span>;
}
export function OutcomeBanner({presentation,value,final=false}:{presentation:OutcomePresentation;value:number;final?:boolean}){
 return <div className={`outcome-banner outcome-${presentation.tone}`} data-outcome={presentation.tone}>
  <div className={`outcome-art outcome-art-${presentation.art}`} aria-hidden="true"/>
  <div className="outcome-copy"><span className="eyebrow">{final?'FINAL VERDICT':'YOUR ROUND RESULT'}</span><h2>{presentation.title}</h2><p>{presentation.caption}</p><div className="outcome-score"><span className="sr-only">{final?'Final score':'Round score'}: {value} points</span>{final?<span aria-hidden="true">{value}</span>:<AnimatedScore value={value}/>}<small>{final?'FINAL POINTS':'POINTS'}</small></div></div>
 </div>;
}
