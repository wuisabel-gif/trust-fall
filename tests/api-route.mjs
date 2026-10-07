import ts from 'typescript';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

const out = fs.mkdtempSync(path.join(os.tmpdir(),'trust-api-'));
function compile(file) {
    const source=fs.readFileSync(file,'utf8');
    const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
        .replace("import { env } from 'cloudflare:workers';",'const env = globalThis.testEnv;')
        .replace(/from '(\.[^']+)'/g,"from '$1.mjs'");
    const target=path.join(out,file.replace(/\.ts$/,'.mjs'));
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,js);
}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else if(file.endsWith('.ts'))compile(file);}}
walk('lib/game');compile('app/api/game/route.ts');
const sqlite=new DatabaseSync(':memory:');
sqlite.exec('CREATE TABLE rooms (code TEXT PRIMARY KEY, state TEXT NOT NULL, version INTEGER NOT NULL, updated_at INTEGER NOT NULL)');
let conflicts=0;
globalThis.testEnv={DB:{prepare(sql){return {bind(...args){return {async first(){return sqlite.prepare(sql).get(...args);},async run(){if(sql.startsWith('UPDATE')&&conflicts>0){conflicts--;return {meta:{changes:0}};}return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}};}};}};}}};
const {POST,GET}=await import(path.join(out,'app/api/game/route.mjs'));
async function post(action,payload={},token,status=200){const response=await POST(new Request('https://test/api/game',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({action,...payload})}));const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));assert.equal(response.headers.get('Cache-Control'),'no-store');return data;}
async function poll(code,token,status=200){const response=await GET(new Request(`https://test/api/game?code=${code}`,{headers:{Authorization:`Bearer ${token}`}}));assert.equal(response.status,status);return response.json();}
try{
    const now=Date.now();sqlite.prepare('INSERT INTO rooms VALUES (?,?,0,?)').run('STALE','{}',now-86400001);sqlite.prepare('INSERT INTO rooms VALUES (?,?,0,?)').run('FRESH','{}',now);
    const a=await post('create',{name:'Host'}),code=a.room.code;
    assert.equal(sqlite.prepare('SELECT code FROM rooms WHERE code = ?').get('STALE'),undefined);
    assert.ok(sqlite.prepare('SELECT code FROM rooms WHERE code = ?').get('FRESH'));
    const [b,c]=await Promise.all([post('join',{code,name:'Friend'}),post('join',{code,name:'Other'})]);
    assert.equal((await poll(code,a.token)).players.length,3);
    await poll(code,'invalid-token',400);
    await post('settings',{code,rounds:3,negotiationSeconds:30},b.token,400);
    conflicts=2;await post('settings',{code,rounds:3,negotiationSeconds:30},a.token);assert.equal(conflicts,0);
    for(const p of [a,b,c])await post('ready',{code},p.token);
    await post('start',{code},a.token);
    await post('chat',{code,text:'SECRET',recipientId:b.room.you},a.token);
    const spectator=await post('join',{code,name:'Spectator'});assert.equal(spectator.room.isSpectator,true);
    for(const p of [c,spectator]){const response=JSON.stringify(await poll(code,p.token));assert.ok(!response.includes('SECRET'));assert.ok(!response.includes(a.token));assert.ok(!response.includes(spectator.token));}
    assert.equal((await poll(code,b.token)).messages[0].text,'SECRET');
    await post('choice',{code,choice:'cooperate'},spectator.token,400);
    await post('chat',{code,text:'spoiler'},spectator.token,400);
    await post('leave',{code},spectator.token);await poll(code,spectator.token,400);
    conflicts=8;await post('choice',{code,choice:'cooperate'},b.token,400);assert.equal(conflicts,0);
    console.log('PASS API SQLite cleanup, concurrent joins, CAS retries, auth, spectator/whisper privacy and no-store responses');
}finally{sqlite.close();fs.rmSync(out,{recursive:true,force:true});delete globalThis.testEnv;}
