import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestHandler } from '../server.mjs';
const fixture={connection:'readable',sessions:[{id:'fixture',projectName:'Test'}],context:{projects:[],notes:[]}};
const handler=createRequestHandler({getSnapshot:async()=>fixture});
async function request(url,options={}){
 const headers={};let status=200,body;
 await handler({url,method:options.method||'GET',headers:{host:options.host||'localhost:4173',...(options.origin?{origin:options.origin}:{})}},
 {setHeader(k,v){headers[k]=v;},writeHead(code,extra){status=code;Object.assign(headers,extra);},end(value){body=value;}});
 return {status,body:body?.toString(),headers};
}
test('API returns snapshot locally and refuses cross-origin/host access',async()=>{
 assert.deepEqual(JSON.parse((await request('/api/world')).body),fixture);
 assert.equal((await request('/api/world',{origin:'https://evil.example'})).status,403);
 assert.equal((await request('/api/world',{host:'evil.example:4173'})).status,403);
 assert.equal((await request('/api/world',{method:'POST'})).status,405);
});
test('public assets and offline modules work; source and traversal are not exposed',async()=>{
 const page=await request('/');assert.equal(page.status,200);assert.match(page.body,/Kantor Kecil/);assert.match(page.headers['Content-Security-Policy'],/connect-src 'self'/);
 const module=await request('/vendor/three.module.min.js');assert.equal(module.status,200);assert.ok(module.body.length>100000);
 const core=await request('/vendor/three.core.min.js');assert.equal(core.status,200);
 const orbit=await request('/vendor/OrbitControls.js');assert.match(orbit.body,/from '.\/three.module.min.js'/);
 assert.equal((await request('/server.mjs')).status,404);
 assert.equal((await request('/%2e%2e%2fserver.mjs')).status,403);
 assert.equal((await request('/missing.js')).status,404);
 assert.equal((await request('/',{method:'HEAD'})).body,undefined);
});
