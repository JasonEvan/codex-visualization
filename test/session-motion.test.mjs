import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from '../public/vendor/three.core.min.js';
import { createSessionMotion, syncSessionMotion, stepSessionMotion } from '../public/session-motion.js';

function setup(status='started') {
  const notices=[];
  const actor={id:'coding-agent',session:{status},home:new Vector3(-.85,4.655,.25),room:{x:0,z:0},root:{position:new Vector3(-.85,4.655,.25),rotation:{y:0}},state:'work'};
  createSessionMotion(actor,{x:7.5,z:7},0,(_id,label)=>notices.push(label));
  return {actor,notices};
}
function advance(actor,seconds){for(let i=0;i<seconds*20;i++)stepSessionMotion(actor,.05);}

test('a started session enters its project doorway, works at its desk, and never takes a timed break',()=>{
  const {actor}=setup();assert.equal(actor.state,'walking');assert.equal(actor.root.position.z,2.35);
  advance(actor,10);assert.equal(actor.state,'work');assert.ok(actor.root.position.equals(actor.home));assert.equal(actor.root.rotation.y,Math.PI);
  advance(actor,300);assert.equal(actor.state,'work');assert.ok(actor.root.position.equals(actor.home));
});
test('completion allows a café break; a new turn reverses an outgoing walk without teleporting',()=>{
  const {actor}=setup();advance(actor,10);syncSessionMotion(actor,{status:'complete'});
  advance(actor,10);const position=actor.root.position.clone(),distance=actor.sessionMotion.distance;
  syncSessionMotion(actor,{status:'started'});assert.ok(actor.root.position.equals(position));
  stepSessionMotion(actor,.05);assert.ok(actor.sessionMotion.distance<distance);assert.ok(actor.root.position.distanceTo(position)<=.95*.05+.000001);
  advance(actor,80);assert.equal(actor.state,'work');assert.ok(actor.root.position.equals(actor.home));
});
test('a session resting in the café returns through its project doorway when a new turn starts',()=>{
  const {actor}=setup('complete');advance(actor,120);assert.equal(actor.state,'break');
  const before=actor.root.position.clone();syncSessionMotion(actor,{status:'started'});assert.equal(actor.state,'walking');assert.ok(actor.root.position.equals(before));
  let passedDoor=false;
  for(let i=0;i<2400;i++){stepSessionMotion(actor,.05);if(Math.abs(actor.root.position.x)<.02&&Math.abs(actor.root.position.z-2.65)<.06)passedDoor=true;}
  assert.ok(passedDoor);assert.equal(actor.state,'work');
});
test('aborting a turn mid-return reverses continuously and rests without restarting work',()=>{
  const {actor}=setup('complete');advance(actor,120);syncSessionMotion(actor,{status:'started'});advance(actor,5);
  const before=actor.root.position.clone();syncSessionMotion(actor,{status:'aborted'});assert.ok(actor.root.position.equals(before));advance(actor,120);assert.equal(actor.state,'break');advance(actor,200);assert.equal(actor.state,'break');
});
test('unknown, stale, and disconnected sessions stop work/movement, then resume at the same position',()=>{
  for(const status of ['unknown','stale']){
    const {actor}=setup();advance(actor,1);syncSessionMotion(actor,{status});const pos=actor.root.position.clone();advance(actor,30);assert.equal(actor.state,'waiting');assert.ok(actor.root.position.equals(pos));
    syncSessionMotion(actor,{status:'started'});advance(actor,20);assert.equal(actor.state,'work');
    syncSessionMotion(actor,{status:'started'},false);advance(actor,30);assert.equal(actor.state,'waiting');assert.ok(actor.root.position.equals(actor.home));
  }
});
test('unchanged polling preserves progress and does not reset position or repeatedly announce routines',()=>{
  const {actor,notices}=setup();advance(actor,1);const before=actor.root.position.clone(),count=notices.length;
  for(let i=0;i<10;i++)syncSessionMotion(actor,{status:'started'});
  assert.ok(actor.root.position.equals(before));assert.equal(notices.length,count);advance(actor,20);assert.equal(actor.state,'work');
});
test('multiple sessions in the same project follow their own independent status',()=>{
  const working=setup('started').actor,resting=setup('complete').actor;
  advance(working,120);advance(resting,120);assert.equal(working.state,'work');assert.equal(resting.state,'break');
});
