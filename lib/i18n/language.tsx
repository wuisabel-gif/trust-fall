'use client';
import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import japanese from './ja.json';
export type Language = 'en' | 'ja';
const dictionary: Record<string,string> = japanese;
const templates = Object.entries(dictionary).filter(([key])=>key.includes('{')).map(([key,value])=>{
 const names:string[]=[];
 const pattern=key.split(/(\{\w+\})/).map(part=>/^\{\w+\}$/.test(part)?(names.push(part.slice(1,-1)),'(.+?)'):part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('');
 return {pattern:new RegExp(`^${pattern}$`),value,names};
});
export function translate<T>(value:T,language:Language):T {
 if(language==='en'||typeof value!=='string')return value;
 if(dictionary[value])return dictionary[value] as T;
 const text=value.trim(), padding=value.match(/^\s*/)?.[0]??'',tail=value.match(/\s*$/)?.[0]??'';
 if(dictionary[text])return (padding+dictionary[text]+tail) as T;
 for(const item of templates){const match=text.match(item.pattern);if(match)return (padding+item.value.replace(/\{(\w+)\}/g,(_,name)=>(['move','chair'].includes(name)?translate(match[item.names.indexOf(name)+1]??'',language):match[item.names.indexOf(name)+1]??''))+tail) as T;}
 if(text.startsWith('Selected '))return ('選択：'+translate(text.slice(9),language)) as T;
 if(text.includes(': ')){const [prefix,...rest]=text.split(': ');if(dictionary[prefix])return (dictionary[prefix]+'：'+translate(rest.join(': '),language)) as T;}
 if(text.includes(' · '))return text.split(' · ').map(part=>translate(part,language)).join('・') as T;
 return value;
}
const Context=createContext({language:'en' as Language,t:<T,>(v:T):T=>v,setLanguage:(_language:Language)=>{}});
export function LanguageProvider({children}:{children:ReactNode}){
 const [language,setValue]=useState<Language>('en');
 useEffect(()=>{const query=new URLSearchParams(location.search).get('lang');let saved:string|null=null;try{saved=localStorage.getItem('trust-fall-language');}catch{}setValue(query==='ja'||query==='en'?query:saved==='ja'?'ja':'en');},[]);
 useEffect(()=>{document.documentElement.lang=language;},[language]);
 function setLanguage(next:Language){setValue(next);try{localStorage.setItem('trust-fall-language',next);}catch{}const url=new URL(location.href);url.searchParams.set('lang',next);history.replaceState(null,'',url);}
 return <Context.Provider value={{language,setLanguage,t:<T,>(v:T)=>translate(v,language)}}>{children}</Context.Provider>;
}
export const useLanguage=()=>useContext(Context);
export function LanguageSwitch(){const {language,setLanguage}=useLanguage();return <select className="language-switch" aria-label="Language / 言語" value={language} onChange={e=>setLanguage(e.target.value as Language)}><option value="en">English</option><option value="ja">日本語</option></select>;}
