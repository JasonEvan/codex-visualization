import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parseSession, readCodex, readContext } from '../codex-reader.mjs';
const at='2026-10-02T10:00:00Z';
const row=(type,payload,timestamp=at)=>JSON.stringify({type,payload,timestamp});
const meta=(id='one',cwd='/work/project-a')=>row('session_meta',{id,cwd,timestamp:at});
const event=(type,timestamp=at)=>row('event_msg',{type},timestamp);

test('only log markers determine task status; raw prompts and tool output are not exposed',()=>{
 const s=parseSession([meta(),event('task_started'),row('response_item',{type:'message',content:'PRIVATE PROMPT'}),row('event_msg',{type:'agent_message',message:'SECRET'})].join('\n'),'',Date.parse(at)+5000);
 assert.equal(s.status,'started');assert.equal(s.projectName,'project-a');assert.equal(JSON.stringify(s).includes('PRIVATE PROMPT'),false);assert.equal(JSON.stringify(s).includes('SECRET'),false);
});
test('old start becomes unknown-current-status, completion remains a historical event',()=>{
 assert.equal(parseSession(meta()+'\n'+event('task_started'),'',Date.parse(at)+130000).status,'stale');
 const s=parseSession([meta(),event('task_started'),event('task_complete','2026-10-02T10:05:00Z')].join('\n'),'',Date.parse(at)+900000);
 assert.equal(s.status,'complete');assert.equal(s.history.length,2);
});
test('aborted, malformed, unsupported, and Windows sessions are handled honestly',()=>{
 assert.equal(parseSession(meta()+'\n'+event('turn_aborted')).status,'aborted');
 assert.equal(parseSession(meta()+'\n{incomplete').status,'unknown');
 assert.equal(parseSession(event('task_started')),null);
 assert.equal(parseSession(meta('win','C:\\Users\\me\\project-b')).projectName,'project-b');
});
test('filesystem scan groups session metadata, ignores symlinks, handles missing directory',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'kantor-reader-'));
 try {
  assert.equal((await readCodex(root)).connection,'missing');
  const dir=path.join(root,'sessions','2026','10','02');await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,'a.jsonl'),meta('a')+'\n'+event('task_complete'));
  await writeFile(path.join(dir,'b.jsonl'),meta('b','/work/project-b'));
  await writeFile(path.join(dir,'bad.jsonl'),'broken');
  await symlink(path.join(dir,'a.jsonl'),path.join(dir,'link.jsonl'));
  const result=await readCodex(root);assert.equal(result.connection,'readable');assert.equal(result.sessions.length,2);assert.equal(result.skipped,1);assert.deepEqual(new Set(result.sessions.map(s=>s.projectName)),new Set(['project-a','project-b']));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('large log reads metadata and final marker without returning content',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'kantor-large-'));
 try{await mkdir(path.join(root,'sessions'));const logs=[meta(),event('task_started'),row('response_item',{text:'x'.repeat(600000)}),event('task_complete')].join('\n');await writeFile(path.join(root,'sessions','big.jsonl'),logs);const data=await readCodex(root);assert.equal(data.sessions[0].status,'complete');assert.ok(JSON.stringify(data).length<2000);}finally{await rm(root,{recursive:true,force:true});}
});
test('context sanitizes external links and rejects malformed config gracefully',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'kantor-config-'));const file=path.join(root,'context.json');
 try{await writeFile(file,JSON.stringify({projects:[{path:'/p',name:'P',notes:[{title:'Unsafe',url:'javascript:alert(1)'},{title:'Valid',url:'https://example.com'}]}],notes:['Personal note']}));const c=await readContext(file);assert.equal(c.projects[0].notes[0].url,undefined);assert.equal(c.projects[0].notes[1].url,'https://example.com/');assert.equal(c.notes[0].title,'Personal note');await writeFile(file,'{bad');assert.ok((await readContext(file)).warning);}finally{await rm(root,{recursive:true,force:true});}
});
