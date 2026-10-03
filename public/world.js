import { createSessionMotion, syncSessionMotion, stepSessionMotion } from './session-motion.js';
import * as THREE from '/vendor/three.module.min.js';
import { OrbitControls } from '/vendor/OrbitControls.js';

const PALETTE = {wood:0xd4aa82, darkWood:0x9f7659, cream:0xffedcf, lilac:0xc9b3d9, green:0x91aa82, peach:0xe7b69b, ink:0x3e3449};
const materials = new Map();
function mat(color, extra = {}) { const key = color + JSON.stringify(extra); if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness:.8, ...extra })); return materials.get(key); }
const boxGeometry = new THREE.BoxGeometry(1,1,1);
const sphereGeometry = new THREE.SphereGeometry(1,18,12);
const cylinderGeometry = new THREE.CylinderGeometry(1,1,1,16);
const coneGeometry = new THREE.ConeGeometry(1,1,4);
function mesh(parent, geometry, color, x,y,z,sx,sy,sz, extra) { const m = new THREE.Mesh(geometry,mat(color,extra)); m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; }
const box = (g,c,x,y,z,w,h,d,extra)=>mesh(g,boxGeometry,c,x,y,z,w,h,d,extra);
const ball = (g,c,x,y,z,rx,ry=rx,rz=rx)=>mesh(g,sphereGeometry,c,x,y,z,rx,ry,rz);
const cylinder=(g,c,x,y,z,r,h)=>mesh(g,cylinderGeometry,c,x,y,z,r,h,r);
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function label(parent, text, x,y,z, width=3, dark=false) {
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=144;
 const ctx=canvas.getContext('2d');ctx.fillStyle=dark?'#574964':'#fff6e8';ctx.beginPath();ctx.roundRect(3,3,762,138,25);ctx.fill();ctx.strokeStyle=dark?'#b196da':'#d8bca2';ctx.lineWidth=7;ctx.stroke();
 ctx.fillStyle=dark?'#eee0ff':'#66515b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 48px system-ui';let title=text.length>29?text.slice(0,27)+'…':text;while(ctx.measureText(title).width>690){ctx.font=`600 ${parseInt(ctx.font)-1}px system-ui`;}
 ctx.fillText(title,384,73);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sprite.position.set(x,y,z);sprite.scale.set(width,width*144/768,1);parent.add(sprite);return sprite;
}
function plant(g,x,z,scale=1,y=0) {const p=group(g,x,y,z);p.scale.setScalar(scale);cylinder(p,0xc18e73,0,.19,0,.24,.38);cylinder(p,0xdbac8c,0,.37,0,.28,.1);cylinder(p,0x657951,0,.68,0,.035,.65);for(let i=0;i<7;i++){const a=i*2.4;const leaf=ball(p,[0x839d70,0xa1b987,0x698f73][i%3],Math.cos(a)*.2,.65+i*.07,Math.sin(a)*.18,.16,.34,.095);leaf.rotation.z=Math.cos(a)*.6;leaf.rotation.x=Math.sin(a)*.6;}return p;}
function books(g,x,y,z,count=5){for(let i=0;i<count;i++){box(g,[0xcfa390,0x91ac9f,0xc0a8d0,0xe2c285,0x91a9bb][i%5],x+i*.15,y+.17,z,.12,.31+(i%3)*.05,.22);}}
function shelf(g,x,z){box(g,PALETTE.wood,x,1.05,z,1.85,2.1,.4);box(g,0xb79070,x,1.06,z+.22,1.61,1.9,.03);for(let j=0;j<3;j++){box(g,PALETTE.cream,x,.15+j*.66,z+.12,1.85,.08,.59);books(g,x-.68,.2+j*.66,z+.2,8);}plant(g,x-.5,z,.6,2.12);}
function lamp(g,x,z){cylinder(g,0x9c8665,x,.06,z,.22,.1);cylinder(g,0xb69b73,x,1.13,z,.035,2.15);mesh(g,new THREE.CylinderGeometry(.25,.42,.4,20),0xffdf9a,x,2.2,z,1,1,1,{emissive:0xffd89c,emissiveIntensity:.25});}
function desk(g,x,z,accent=0xc4aed1){const d=group(g,x,0,z);box(d,PALETTE.wood,0,.9,0,2.05,.16,.86);for(const a of [-.85,.85])for(const b of [-.3,.3])box(d,PALETTE.darkWood,a,.43,b,.08,.85,.08);box(d,0x736575,-.27,1.36,-.12,.85,.62,.08);box(d,0xabc9c7,-.27,1.36,-.063,.75,.5,.016,{emissive:0x8cc3c7,emissiveIntensity:.2});for(let i=0;i<4;i++)box(d,i%2?0xe0e9cb:0x728e9e,-.38+i*.025,1.51-i*.09,-.05,.35+(i%2)*.14,.025,.009);box(d,0x655b62,-.27,1.01,-.12,.1,.23,.12);box(d,0xe8ddca,-.23,1.0,.23,.58,.025,.18);cylinder(d,0xebd9c7,.66,1.08,.16,.09,.19);books(d,.34,1.0,-.22,3);box(d,accent,0,.52,.9,.7,.14,.62);box(d,accent,0,.85,1.16,.7,.66,.12);for(const a of [-.24,.24])box(d,PALETTE.darkWood,a,.25,1,.06,.47,.06);}
function board(g,x,z,kind='decision',count=5){box(g,PALETTE.darkWood,x,1.5,z,1.65,1.12,.07);box(g,kind==='review'?0x9eb2a1:0xe3c69c,x,1.5,z+.05,1.51,.98,.05);for(let i=0;i<Math.min(count,5);i++){const n=box(g,[0xf6e2a8,0xe9bbaa,0xc4d8cb][i%3],x-.46+(i%3)*.43,1.76-Math.floor(i/3)*.4,z+.09,.3,.29,.01);n.rotation.z=(i%2?1:-1)*.08;}}
function rug(g,c,x,z,w=3,d=2){const r=box(g,c,x,.022,z,w,.04,d);return r;}

export function createWorld(container,onSelect,onRoutine){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xece7dd);scene.fog=new THREE.Fog(0xece7dd,65,140);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;container.appendChild(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(34,1,.1,220);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=9;controls.maxDistance=95;controls.maxPolarAngle=Math.PI*.465;controls.minPolarAngle=.25;controls.target.set(0,3,1);controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};
 scene.add(new THREE.HemisphereLight(0xfff4da,0xa3a4b6,2.5));const sun=new THREE.DirectionalLight(0xffe2b4,3.5);sun.position.set(-12,25,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.5,far:80});sun.shadow.bias=-.0006;sun.shadow.normalBias=.035;scene.add(sun);const fill=new THREE.DirectionalLight(0xc5c7ff,1.1);fill.position.set(15,10,-12);scene.add(fill);
 const ground=mesh(scene,new THREE.CylinderGeometry(29,29,1,80),0xe0dccf,0,-.9,1,1,1,1);ground.receiveShadow=true;
 let content=new THREE.Group();scene.add(content);let rooms=[],actors=[],pickables=[],selected=null,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,basementLight,focusTarget=null,focusCamera=null,extent=20,model;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart;
 renderer.domElement.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};focusTarget=null;focusCamera=null;});
 renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||pointerStart.id!==e.pointerId||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6||e.button!==0)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables,true);for(const hit of hits){let o=hit.object;while(o&&!o.userData.selection)o=o.parent;if(o?.userData.selection){onSelect(o.userData.selection);break;}}});
 renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
 function disposeContent(){content.traverse(o=>{if(o.isSprite){o.material.map?.dispose();o.material.dispose();}if(o.geometry&&![boxGeometry,sphereGeometry,cylinderGeometry,coneGeometry].includes(o.geometry))o.geometry.dispose();});scene.remove(content);content=new THREE.Group();scene.add(content);}
 function makeRoom(data,x,z,y=4.6){const g=group(content,x,y,z);g.userData.selection={type:'room',id:data.id};const dark=data.type==='den';const color=dark?0x605069:[0xe6c8ac,0xdfc9bc,0xdad6bf][rooms.length%3];
 const base=box(g,dark?0x52455e:0xc7aa8a,0,-.22,0,6.5,.44,5.6);pickables.push(base);base.userData.selection=g.userData.selection;
 box(g,dark?0x766078:0xead4b6,0,.005,0,6.32,.06,5.43);
 for(let i=0;i<11;i++)box(g,dark?0x6b5671:0xd7bc98,0,.04,-2.5+i*.49,6.2,.008,.014);
 const wall=box(g,color,0,1.08,-2.65,6.5,2.2,.16);pickables.push(wall);wall.userData.selection=g.userData.selection;
 box(g,dark?0x766082:0xf1dfc7,-3.17,1.05,-.3,.16,2.1,4.7);box(g,dark?0x91749f:0xbc9471,0,2.22,-2.65,6.55,.09,.22);box(g,dark?0x91749f:0xc4a37f,-3.17,2.12,-.3,.22,.1,4.7);
 // A real opening at the front leads to a continuous walkway.
 for(const xSide of [-2,2]){box(g,dark?0x8f769c:0xdbb992,xSide,.31,2.65,2.35,.62,.12);box(g,dark?0xad90be:0xead4b3,xSide,.65,2.65,2.4,.07,.2);}
 const sign=label(g,data.name,0,2.8,-2.65,data.type==='project'?3.5:3.1,dark);sign.userData.selection=g.userData.selection;pickables.push(sign);
 const ring=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6.57,.08,5.68)),new THREE.LineBasicMaterial({color:0xb896d4,transparent:true,opacity:0}));ring.position.y=.1;g.add(ring);
 const room={...data,g,x,z,y,ring};rooms.push(room);
 if(data.type==='project'){
 rug(g,rooms.length%2?0xdcc0cf:0xb8cac1,-.6,.4,3.4,2.45);desk(g,-.7,-1.05);board(g,-1.85,-2.52,'decision',data.decisions?.length||0);board(g,.2,-2.52,'review',data.reviewed?.length||0);shelf(g,2,-2.18);plant(g,2.45,1.8,.9);lamp(g,-2.7,1.9);
 if(data.notes?.length)books(g,1.35,.12,1.8,Math.min(data.notes.length,7));
 }else if(data.type==='supervisor'){
 rug(g,0xdcc4a9,0,.2,3.8,2.7);desk(g,0,-1.05,0xd6b5a6);shelf(g,-2.03,-2.15);plant(g,2.3,1.9,1.15);lamp(g,2.5,-1.5);label(g,'Kamu · Supervisor',.2,2,-2.53,2.9);
 }else if(data.type==='library'){
 shelf(g,-1.9,-2.15);shelf(g,.18,-2.15);shelf(g,2.1,-2.15);rug(g,0xbecab0,.4,1,3.8,2.3);ball(g,0xc6b2d6,-1.8,.36,.9,.64,.38,.64);ball(g,0xe7bc9d,1.9,.36,1,.66,.4,.66);cylinder(g,PALETTE.wood,0,.52,.5,.65,.1);cylinder(g,PALETTE.darkWood,0,.25,.5,.08,.5);books(g,-.2,.6,.5,3);plant(g,-2.6,1.9,.7);lamp(g,2.55,1.9);
 }else if(data.type==='cafe'){
 rug(g,0xd6b995,0,1.2,4.4,1.8);box(g,0xb59373,-.8,.57,-1.25,3.65,1.1,.86);box(g,0xefdbc0,-.8,1.15,-1.25,3.85,.14,1);for(let i=0;i<12;i++)box(g,0x9e785b,-2.48+i*.3,.56,-.805,.035,.9,.02);box(g,0x64756f,-1.5,1.47,-1.2,.8,.58,.48);cylinder(g,0xd7d4c0,-1.4,1.56,-.93,.08,.1);cylinder(g,0xe6cfb8,.4,1.31,-1.15,.16,.17);ball(g,0xb9895e,.4,1.43,-1.15,.13,.07,.13);board(g,-1.8,-2.5,'review');label(g,'Kopi & ide',-.6,2.4,-2.59,2);plant(g,2.5,-2,.85);
 for(let x of [-1.5,.5]){cylinder(g,0xc5af8e,x,.52,.65,.34,.15);cylinder(g,0x9f7d5e,x,.24,.65,.045,.48);}
 const arcade=group(g,2.1,0,.8);box(arcade,0x9c86bd,0,.72,0,.86,1.42,.65);box(arcade,0xe4c2d3,0,1.58,0,.89,.3,.75);box(arcade,0x39384d,0,1.09,.345,.68,.6,.035);for(let i=0;i<5;i++)box(arcade,[0xf5da91,0xb6d3cf][i%2],(i%3-.8)*.18,1.2-Math.floor(i/3)*.2,.37,.09,.09,.01,{emissive:0xb8cfae,emissiveIntensity:.4});box(arcade,0xe6b3c6,0,.69,.48,.88,.1,.4);ball(arcade,0xbc637e,-.2,.8,.52,.05);label(arcade,'PLAY',0,1.58,.41,.67);
 }else if(data.type==='garden'){
 rug(g,0xa9b78b,0,0,5.9,4.6);for(const [px,pz]of[[-2.5,-2],[2.4,-1.8],[-2.4,1.8],[2.5,1.9]])plant(g,px,pz,1.1);
 cylinder(g,0xa68b6b,1.8,1.2,-1.4,.16,2.4);for(let i=0;i<6;i++)ball(g,[0xd9a6b0,0xe9b9be,0xf0c6c8][i%3],1.8+Math.cos(i*2)*.65,2.5+(i%2)*.25,-1.4+Math.sin(i*2)*.6,.8,.62,.7);
 for(const [bx,bz,c]of[[-1.8,.8,0xccb5d5],[1.8,1.3,0xe2c78e],[-.5,-1.3,0xb4c9bc]])ball(g,c,bx,.35,bz,.7,.4,.65);
 box(g,PALETTE.wood,0,.57,.5,1.55,.13,1);box(g,0x9aaf8d,0,.65,.5,1.35,.025,.8);for(const a of [-.6,.6])box(g,PALETTE.darkWood,a,.3,.5,.08,.6,.08);for(let i=0;i<5;i++){cylinder(g,i%2?0xedd6ac:0x7d6354,(i%3-.9)*.32,.69,.4+Math.floor(i/3)*.25,.06,.055);}
 }else if(dark){
 rug(g,0x786182,0,.6,3.8,2.9);desk(g,-.55,-1,0x93739f);board(g,-1.4,-2.54);shelf(g,2,-2.15);lamp(g,2.5,1.8);plant(g,-2.5,1.8,.85);basementLight=new THREE.PointLight(0xcdb0ff,8,10,1.6);basementLight.position.set(0,1.7,1.5);g.add(basementLight);label(g,'Rencana antarproyek',-.4,2,-2.55,2.6,true);
 }
 return room;
 }
 function character(data,room,index){const root=group(content,room.x,room.y,room.z);root.userData.selection={type:'agent',id:data.id};const visual=group(root);const colors={fox:0xd99958,rabbit:0xf4e6de,cat:0xd8c4b2,robot:0xc6d9d7,owl:0xa88870,bear:0xaf8a65,star:0xf4d78c};const species=data.species;const fur=colors[species]||colors.fox,cloth=data.outfit||0x9daed0;
 const body=ball(visual,cloth,0,.59,0,.28,.35,.23);const head=ball(visual,fur,0,1.07,0,.36,.33,.31);
 if(species==='rabbit'){for(const s of [-1,1]){ball(visual,fur,s*.17,1.48,0,.105,.36,.09);ball(visual,0xe7b9bd,s*.17,1.49,.073,.056,.24,.025);}}
 else if(['fox','cat','owl'].includes(species)){for(const s of [-1,1]){const ear=mesh(visual,coneGeometry,fur,s*.25,1.36,-.015,.17,.29,.15);ear.rotation.z=-s*.16;ball(visual,0xe8c2b4,s*.25,1.34,.075,.065,.07,.02);}}
 else if(species==='bear'){for(const s of [-1,1])ball(visual,fur,s*.29,1.33,0,.14,.14,.1);}
 else if(species==='robot'){box(visual,0x536777,0,1.1,.269,.5,.23,.07);cylinder(visual,0x899d9a,0,1.47,0,.035,.2);ball(visual,0xe3b993,0,1.58,0,.075);}
 else if(species==='star'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const tip=mesh(visual,coneGeometry,fur,Math.sin(a)*.31,1.08+Math.cos(a)*.31,0,.18,.28,.16);tip.rotation.z=-a;}}
 if(species==='owl'){for(const s of [-1,1]){ball(visual,0xead3ab,s*.16,1.09,.27,.18,.19,.06);const tor=new THREE.Mesh(new THREE.TorusGeometry(.165,.018,7,28),mat(0x615363));tor.position.set(s*.16,1.09,.335);visual.add(tor);}}
 else if(species!=='robot')ball(visual,0xf4dfc3,0,.95,.255,.18,.12,.065);
 for(const s of [-1,1]){ball(visual,species==='robot'?0xade0d9:0x3d3540,s*.13,1.12,.3,.035,.047,.025);if(species!=='robot'){ball(visual,0xf8f4de,s*.13-.009,1.138,.322,.01);ball(visual,0xe1a5a0,s*.23,1.01,.265,.058,.034,.022);}}
 ball(visual,species==='owl'?0xddb071:0x67514b,0,1.0,.33,.04,.031,.026);
 const arms=[];for(const s of [-1,1]){const arm=group(visual,s*.28,.77,0);ball(arm,cloth,0,-.12,0,.09,.19,.1);ball(arm,fur,0,-.28,0,.085,.09,.08);arms.push(arm);}
 const legs=[];for(const s of [-1,1]){const leg=group(visual,s*.13,.32,0);ball(leg,0x655867,0,-.13,0,.09,.17,.1);ball(leg,0xede0c8,0,-.24,.045,.105,.07,.15);legs.push(leg);}
 if(species==='fox'||species==='cat'){const tail=ball(visual,fur,.14,.46,-.37,.15,.17,.36);tail.rotation.y=-.3;ball(visual,0xf5e3ce,.23,.47,-.59,.13,.14,.13);}
 if(species==='bear'){box(visual,0x91a894,0,.55,.208,.34,.4,.035);ball(visual,0x7f9d86,0,1.37,0,.36,.09,.3);box(visual,0x7f9d86,0,1.35,.25,.5,.04,.25);}
 const book=group(visual,0,.65,.3);box(book,0x9785ae,0,0,0,.37,.27,.07);box(book,0xf0dec0,0,.01,.045,.32,.21,.01);book.visible=false;
 const halo=new THREE.Mesh(new THREE.RingGeometry(.45,.5,40),new THREE.MeshBasicMaterial({color:0xc1a2e1,side:THREE.DoubleSide,transparent:true,opacity:0}));halo.rotation.x=-Math.PI/2;halo.position.y=.075;root.add(halo);
 root.scale.setScalar(.98);pickables.push(root);const offset=(index%3-1)*.85;const home=new THREE.Vector3(room.x+offset,room.y+.055,room.z+.25+(Math.floor(index/3)%2)*.85);root.position.copy(home);root.rotation.y=Math.PI;
 const actor={...data,root,visual,arms,legs,book,halo,room,home,route:[],step:0,state:'work',timer:7+(actors.length*4)%22,routine:'Menata ide di meja',walkTime:0};actors.push(actor);if(data.session)createSessionMotion(actor,rooms.find(r=>r.type==='cafe'),index,onRoutine);return actor;
 }
 function rebuild(next){model=next;disposeContent();rooms=[];actors=[];pickables=[];basementLight=null;
 const projects=next.projects;const main=[...projects.map(p=>({...p,type:'project'})),...next.common.filter(r=>r.type!=='den')];const rows=Math.ceil(main.length/3);const spacingX=7.5,spacingZ=7;const firstZ=-(rows-1)*spacingZ/2;
 // Continuous paths between the room doors and a clear outer lane.
 const platformDepth=rows*7+.7;box(content,0xb49c82,0,4.16,.35,23.7,.38,platformDepth);box(content,0xdbc4a4,0,4.39,.35,23.6,.07,platformDepth);for(let r=0;r<rows;r++){
 const laneZ=firstZ+r*spacingZ+3.18;for(let x=-11;x<12;x+=.6)box(content,0xcbb397,x,4.44,laneZ,.014,.01,.65);}
 main.forEach((r,i)=>makeRoom(r,((i%3)-1)*spacingX,firstZ+Math.floor(i/3)*spacingZ));
 const denData=next.common.find(r=>r.type==='den');const den=makeRoom(denData,0,firstZ+(rows-1)*spacingZ+.7,.25);
 // Lower foundation and a staircase visible beneath the front edge.
 box(content,0x6e606e,0,-.05,den.z,8,.25,6.3);for(let i=0;i<12;i++)box(content,0xb3a18e,5.4,.1+i*.35,den.z+4.5-i*.48,1.3,.25+i*.01,.52);
 const roomMap=new Map(rooms.map(r=>[r.id,r]));const counts={};for(const a of next.agents){const r=roomMap.get(a.roomId);if(r)character(a,r,counts[r.id]=(counts[r.id]??-1)+1);}
 extent=Math.max(23,rows*7+7);ground.scale.set(extent/25,1,extent/25);sun.shadow.camera.bottom=-extent;sun.shadow.camera.top=extent;sun.shadow.camera.updateProjectionMatrix();reset();select(selected);
 }
 function reset(){controls.target.set(0,3.5,1);const mobile=container.clientWidth<700;const distance=extent*(mobile?1.85:1.48);camera.position.set(distance*.7,distance*.8,distance);controls.maxDistance=Math.max(95,extent*4);focusTarget=null;focusCamera=null;controls.update();}
 function select(s){selected=s;for(const room of rooms)room.ring.material.opacity=s&&(s.type==='room'?s.id===room.id:actors.find(a=>a.id===s.id)?.room.id===room.id)?1:0;for(const actor of actors)actor.halo.material.opacity=s?.type==='agent'&&s.id===actor.id?1:0;if(basementLight){const denSelected=s&&(s.type==='room'?s.id==='den':actors.find(a=>a.id===s.id)?.room.id==='den');basementLight.intensity=denSelected?22:5;}}
 function focus(id){const r=rooms.find(r=>r.id===id);if(!r)return;focusTarget=new THREE.Vector3(r.x,r.y+.8,r.z);const currentDirection=camera.position.clone().sub(controls.target).normalize();focusCamera=focusTarget.clone().add(currentDirection.multiplyScalar(container.clientWidth<600?22:17));}
 function startTrip(a){const cafe=rooms.find(r=>r.type==='cafe');if(!cafe||a.room.type==='den'||a.species==='bear'){a.state='read';a.timer=8;return;}
 const dest=new THREE.Vector3(cafe.x+(actors.indexOf(a)%3-1)*.65,cafe.y+.055,cafe.z+1.4);const lane=11.2;
 const route=[new THREE.Vector3(a.home.x,a.home.y,a.room.z+2.35),new THREE.Vector3(a.room.x,a.home.y,a.room.z+2.35),new THREE.Vector3(a.room.x,a.home.y,a.room.z+3.18),new THREE.Vector3(lane,a.home.y,a.room.z+3.18),new THREE.Vector3(lane,a.home.y,cafe.z+3.18),new THREE.Vector3(cafe.x,a.home.y,cafe.z+3.18),new THREE.Vector3(cafe.x,a.home.y,cafe.z+2.3),dest];
 // Move to the centered doorway before crossing the front wall.
 route[0]=new THREE.Vector3(a.room.x,a.home.y,a.room.z+1.8);
 a.route=route;a.step=0;a.state='walking';a.trip='out';a.returnRoute=[...route.slice(0,-1)].reverse().concat([a.home.clone()]);a.routine='Berjalan ke kafe';onRoutine(a.id,a.routine);
 }
 function updateActor(a,dt,t){a.timer-=dt;let moving=false;
 if(a.sessionMotion){moving=stepSessionMotion(a,dt);}else {
 if(a.state==='walking'){
 const target=a.route[a.step];if(target){const delta=target.clone().sub(a.root.position);if(delta.length()<.07){a.root.position.copy(target);a.step++;}else{moving=true;const move=Math.min(delta.length(),dt*.95);a.root.position.addScaledVector(delta.normalize(),move);a.root.rotation.y=Math.atan2(delta.x,delta.z);}}
 else if(a.trip==='out'){a.state='break';a.timer=8+actors.indexOf(a)%6;a.routine=actors.indexOf(a)%2?'Mengobrol sambil minum kopi':'Istirahat sejenak di kafe';a.root.rotation.y=0;onRoutine(a.id,a.routine);}
 else{a.state='work';a.timer=18+actors.indexOf(a)%12;a.root.rotation.y=Math.PI;a.routine='Menulis dan menata ide';onRoutine(a.id,a.routine);}
 }else if(a.timer<=0){if(a.state==='break'){a.route=a.returnRoute;a.step=0;a.trip='back';a.state='walking';a.routine='Kembali melewati pintu';onRoutine(a.id,a.routine);}else if(a.state==='read'){a.state='work';a.timer=15;a.routine=a.species==='bear'?'Menyiapkan kopi':'Menyusun rencana';onRoutine(a.id,a.routine);}else if(actors.indexOf(a)%2===0&&a.state==='work'&&!a.didRead){a.didRead=true;a.state='read';a.timer=10;a.routine='Membaca catatan';onRoutine(a.id,a.routine);}else{a.didRead=false;startTrip(a);}}
 }
 const phase=t*7+actors.indexOf(a);a.visual.position.y=moving?Math.abs(Math.sin(phase))*.055:Math.sin(t*1.8+actors.indexOf(a))*.012;a.legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(phase+i*Math.PI)*.45:0);a.arms.forEach((arm,i)=>{arm.rotation.x=moving?-Math.sin(phase+i*Math.PI)*.38:a.state==='read'?-.95:a.state==='work'?-.6+Math.sin(t*4+i)*.08:a.state==='waiting'?0:Math.sin(t*2+i)*.12;});a.book.visible=a.state==='read';
 }
 const clock=new THREE.Clock();let elapsed=0;let frame;
 function render(){frame=requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.05);if(!paused&&!document.hidden){elapsed+=dt;for(const a of actors)updateActor(a,dt,elapsed);}if(focusTarget){controls.target.lerp(focusTarget,.08);camera.position.lerp(focusCamera,.08);if(controls.target.distanceTo(focusTarget)<.01)focusTarget=null;}controls.update();renderer.render(scene,camera);}
 const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}});resize.observe(container);render();
 function syncSessions(next,connected=true){const byId=new Map(next.map(a=>[a.id,a]));for(const actor of actors){if(actor.sessionMotion)syncSessionMotion(actor,byId.get(actor.id)?.session,connected);}}
 return {rebuild,syncSessions,select,focus,reset,zoom(factor){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},rotate(){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),Math.PI/4);camera.position.copy(controls.target).add(offset);controls.update();},pause(value){paused=value;},get paused(){return paused;},get rooms(){return rooms;},dispose(){cancelAnimationFrame(frame);resize.disconnect();controls.dispose();renderer.dispose();}};
}
