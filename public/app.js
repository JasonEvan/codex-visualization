let createWorld;
try { ({ createWorld } = await import('./world.js')); } catch (error) { document.getElementById('webgl-error').hidden = false; console.error('Modul 3D gagal dimuat', error); }
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emoji={fox:'🦊',rabbit:'🐰',cat:'🐱',robot:'🤖',owl:'🦉',bear:'🐻',star:'⭐'};
const cast=[{species:'fox',name:'Rubi',outfit:0x98aecb,personality:'Teliti, penasaran, dan senang merapikan hal-hal kecil.'},{species:'rabbit',name:'Mika',outfit:0xc3aad0,personality:'Tenang, suka membaca, dan selalu punya catatan baru.'},{species:'cat',name:'Mochi',outfit:0xd59c89,personality:'Kreatif, peka pada detail, dan penggemar sudut yang nyaman.'},{species:'robot',name:'Piko',outfit:0x94b4a9,personality:'Rapi, sabar, dan senang memeriksa setiap detail.'}];
const common=[
 {id:'supervisor',name:'Kantor Kamu',type:'supervisor',icon:'✦',role:'Supervisor',description:'Tempatmu mengamati proyek, membaca konteks, dan mengambil keputusan. Avatar ini mewakilimu; rutinitasnya dekoratif.'},
 {id:'library',name:'Perpustakaan',type:'library',icon:'▤',role:'Catatan & pengetahuan',description:'Rak untuk catatan yang kamu tambahkan melalui berkas konteks lokal. Buku dekoratif tidak berarti dokumen telah dibaca agent.'},
 {id:'cafe',name:'Kafe & Arcade',type:'cafe',icon:'☕',role:'Kopi, obrolan & permainan',description:'Bimo menyiapkan kopi. Agent mampir, mengobrol, lalu kembali ke meja. Semua rutinitas di sini adalah animasi.'},
 {id:'garden',name:'Taman Ide',type:'garden',icon:'❧',role:'Istirahat & ruang bermain',description:'Beanbag empuk, permainan meja, dan pohon berbunga. Ruang kecil untuk mengambil napas.'},
 {id:'den',name:'Den Koordinator',type:'den',icon:'☾',role:'Koordinasi antarproyek',description:'Sudut tenang Nara di bawah kantor. Maskot koordinator untuk melihat gambaran besar; belum terhubung ke agent koordinasi nyata.'},
];
const residents=[
 {id:'you',name:'Kamu',species:'star',outfit:0xc5a1ad,role:'Supervisor',roomId:'supervisor',personality:'Mengamati, meninjau, dan memberi arah. Avatar supervisor bisa berjalan dan beristirahat.',decorative:true},
 {id:'barista',name:'Bimo',species:'bear',outfit:0x90a58f,role:'Barista',roomId:'cafe',personality:'Hangat, suka bercerita, dan selalu ingat pesanan kopi.',decorative:true},
 {id:'coordinator',name:'Nara',species:'owl',outfit:0x957ba1,role:'Maskot koordinator',roomId:'den',personality:'Pemikir tenang yang menyusun rencana di basement. Peran ini dekoratif, bukan agent Codex yang berjalan.',decorative:true},
];
const demoProjects=[
 {id:'sample-a',name:'Proyek Contoh A',description:'Contoh ruang untuk sebuah aplikasi. Ganti dengan proyek nyata dari sesi Codex lokalmu.',notes:[{title:'Contoh: catatan arsitektur'}],decisions:[{title:'Contoh: konsep tampilan disepakati'}],reviewed:[{title:'Contoh: hasil review antarmuka'}],sample:true},
 {id:'sample-b',name:'Proyek Contoh B',description:'Contoh proyek kedua. Satu ruangan dapat menampung lebih dari satu sesi agent.',notes:[{title:'Contoh: ide dan riset awal'}],decisions:[],reviewed:[],sample:true},
];
let snapshot=null, mode='local',model,selected={type:'room',id:'den'},tour=false,tourIndex=0,world,lastShape='',initial=true,inFlight=false,requestFailed=false;
const routines=new Map();
function buildModel(){
 const projects=mode==='demo'?structuredClone(demoProjects):[];const agents=[];
 if(mode==='demo')cast.forEach((a,i)=>agents.push({...a,id:`sample-agent-${i}`,roomId:i<2?'sample-a':'sample-b',role:['Programmer','Peneliti','Desainer','Reviewer'][i],sample:true}));
 else {
 const config=snapshot?.context?.projects||[];
 const map=new Map();
 for(const p of config){const r={...p,id:'project:'+p.path,projectPath:p.path,icon:'▦',type:'project'};map.set(p.path,r);projects.push(r);}
 for(const s of [...(snapshot?.sessions||[])].sort((a,b)=>(a.projectPath+a.id).localeCompare(b.projectPath+b.id))){
 if(!map.has(s.projectPath)){const r={id:'project:'+s.projectPath,name:s.projectName,projectPath:s.projectPath,description:'Proyek dari folder kerja sesi Codex CLI. Tambahkan tujuan, keputusan, dan hasil review melalui berkas konteks lokal.',notes:[],decisions:[],reviewed:[]};map.set(s.projectPath,r);projects.push(r);}
 const hash=[...s.id].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);const appearance=cast[hash%cast.length];agents.push({...appearance,id:s.id,name:s.name==='Codex'?appearance.name+' · '+s.id.slice(0,4):s.name,role:s.role,roomId:map.get(s.projectPath).id,session:s,decorative:false});
 }
 }
 const extras=common.map(r=>({...r,notes:r.id==='library'?(mode==='demo'?[{title:'Contoh: buku ide bersama'},{title:'Contoh: panduan proyek'}]:snapshot?.context?.notes||[]):[]}));
 return {projects:projects.map(p=>({...p,type:'project',icon:'▦',role:'Ruang proyek'})),common:extras,agents:[...agents,...residents],rooms:[...projects.map(p=>({...p,type:'project',icon:'▦',role:'Ruang proyek'})),...extras]};
}
function statusText(s){if(requestFailed)return ['Koneksi pembaca terputus','Data sebelumnya ditampilkan; status saat ini tidak bisa diverifikasi.'];if(!s)return ['Belum tersedia','Tidak ada sesi Codex yang terkait dengan karakter ini.'];const d=s.marker?.at?formatDate(s.marker.at):'';return {
 complete:['Giliran selesai (log)',`Penanda selesai tercatat ${d}. Ini hanya giliran terakhir yang terbaca, bukan bukti seluruh proyek selesai.`],
 aborted:['Giliran dibatalkan (log)',`Pembatalan tercatat ${d}.`],
 started:['Giliran dimulai (log)',`Penanda mulai tercatat ${d}. Log baru tersedia, tetapi proses yang sedang berjalan tidak diverifikasi.`],
 stale:['Status saat ini tidak diketahui','Ada penanda mulai, tetapi tidak ada pembaruan log dalam 2 menit. Tidak dianggap masih bekerja.'],
 unknown:['Status tugas tidak tersedia','Metadata sesi terbaca, tetapi penanda mulai / selesai belum ditemukan pada bagian log yang dipindai.'],
 }[s.status]||['Tidak diketahui','Format status belum dikenali.'];}
function formatDate(iso){if(!iso)return 'belum tersedia';return new Intl.DateTimeFormat('id-ID',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso));}
function contextList(title,items){if(!items?.length)return '';return `<div class="context-section"><h3>${title} <span>(${items.length})</span></h3><ul>${items.map(x=>`<li>${x.url?`<a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.title)}</a>`:escape(x.title)}</li>`).join('')}</ul></div>`;}
function select(item,{focus=false}={}){selected=item;world?.select(item);renderDetail();renderRooms();if(focus){const room=item.type==='room'?item.id:model.agents.find(a=>a.id===item.id)?.roomId;world?.focus(room);}}
function renderDetail(){if(!model)return;const isAgent=selected.type==='agent';let data=isAgent?model.agents.find(a=>a.id===selected.id):model.rooms.find(r=>r.id===selected.id);if(!data){selected={type:'room',id:'den'};data=model.rooms.find(r=>r.id==='den');}
 const room=isAgent?model.rooms.find(r=>r.id===data.roomId):data;const occupants=model.agents.filter(a=>a.roomId===room.id);const mascot=isAgent?data:occupants[0];const species=mascot?.species|| (room.type==='library'?'rabbit':room.type==='garden'?'cat':'star');
 let state,explanation;
 if(data.sample||room.sample){state='Data contoh';explanation='Karakter, catatan, dan proyek ini fiktif. Tidak mewakili sesi atau tugas Codex.';}
 else if(isAgent&&data.session){[state,explanation]=statusText(data.session);}
 else if(!isAgent&&room.type==='project'){const sessions=occupants.filter(a=>a.session);state=requestFailed?'Status tidak tersedia':`${sessions.length} sesi tercatat`;explanation=requestFailed?'Pembaca lokal tidak dapat dijangkau. Data sebelumnya mungkin sudah berubah.':'Jumlah sesi bukan jumlah proses yang aktif. Pilih karakter untuk melihat penanda tugas terakhir.';}
 else{state='Tidak ada tugas terhubung';explanation=room.type==='den'?'Nara adalah maskot koordinator. Belum ada agent koordinasi nyata yang dikaitkan.':'Ruangan dan penghuninya dekoratif. Tidak menunjukkan pekerjaan agent yang terverifikasi.';}
 const routine=mascot?routines.get(mascot.id)||'Menata ide di meja':'Sudut nyaman untuk membaca';
 $('detail').innerHTML=`<div class="detail-heading"><span class="eyebrow soft">${isAgent?'KENALAN DENGAN AGENT':'DI BALIK PINTU INI'}</span><span class="pill">${data.sample||room.sample?'Contoh':isAgent&&data.session?'Sesi lokal':'Ruang bersama'}</span></div>
 <div class="portrait"><span class="sparkle">✧</span><span class="emoji">${emoji[species]}</span><span class="sparkle">✦</span><span class="portrait-label">${isAgent?'KARAKTER PILIHANMU':'SUDUT KECIL, BANYAK IDE'}</span></div>
 <div class="detail-title"><h2>${escape(data.name)}</h2><span class="room-icon">${room.icon||'▦'}</span></div><p class="role-line">${escape(data.role)}${isAgent?' · '+escape(room.name):''}</p><p class="description">${escape(isAgent?data.personality:data.description)}</p>
 <div class="status-card"><div class="card-label"><span>⌁</span> Aktivitas terverifikasi</div><strong>${escape(state)}</strong><p>${escape(explanation)}</p></div>
 <div class="routine-card"><span class="routine-icon">☕</span><div><strong id="routine-text">${escape(routine)}</strong><small>Rutinitas dekoratif · ${world?.paused?'dijeda':'bukan status tugas'}</small></div></div>
 ${isAgent&&data.session?`<div class="context-section"><h3>Sesi Codex</h3><p>Nama karakter dan kepribadian adalah tampilan visual.</p><div class="path">${escape(data.session.id)}</div><p>Event terakhir: ${escape(formatDate(data.session.lastEventAt))}</p>${data.session.parentId?`<p>Subagent dari sesi ${escape(data.session.parentId)}</p>`:''}${contextList('Penanda terakhir',data.session.history.map(h=>({title:h.label+' · '+formatDate(h.at)})))}</div>`:''}
 ${room.projectPath?`<div class="path">${escape(room.projectPath)}</div>`:''}
 ${!isAgent&&occupants.length?`<div class="context-section"><h3>Penghuni ruangan</h3><div class="agent-list">${occupants.map(a=>`<button class="agent-chip" data-agent="${escape(a.id)}">${emoji[a.species]} ${escape(a.name)}</button>`).join('')}</div></div>`:''}
 ${contextList('Catatan',room.notes)}${contextList('Papan keputusan',room.decisions)}${contextList('Hasil yang sudah direview',room.reviewed)}
 ${room.type==='project'&&!room.notes?.length&&!room.decisions?.length&&!room.reviewed?.length?'<div class="context-section"><p>Belum ada konteks tambahan. Isi catatan, keputusan, dan hasil review di workspace.local.json untuk melengkapi ruangan.</p></div>':''}
 ${room.type==='library'&&!room.notes?.length?'<div class="context-section"><p>Rak pengetahuan belum diisi. Tambahkan judul dan tautan catatan melalui berkas konteks lokal.</p></div>':''}`;
 $('detail').querySelectorAll('[data-agent]').forEach(b=>b.addEventListener('click',()=>select({type:'agent',id:b.dataset.agent})));
}
function renderRooms(){if(!model)return;const active=selected.type==='room'?selected.id:model.agents.find(a=>a.id===selected.id)?.roomId;$('room-count').textContent=`${model.rooms.length} ruang`;$('room-list').innerHTML=model.rooms.map(r=>`<button class="room-row ${active===r.id?'active':''}" data-room="${escape(r.id)}" aria-pressed="${active===r.id}"><span class="room-symbol">${r.icon||'▦'}</span><span><strong>${escape(r.name)}</strong><small>${r.sample?'Proyek contoh':escape(r.role)}</small></span><span class="arrow">›</span></button>`).join('');$('room-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>select({type:'room',id:b.dataset.room},{focus:tour})));}
function updateWorld(){model=buildModel();const shape=JSON.stringify({projects:model.projects,agents:model.agents.map(a=>({id:a.id,roomId:a.roomId,species:a.species})),notes:model.common.find(r=>r.id==='library').notes,mode});const shapeChanged=shape!==lastShape;if(shapeChanged){lastShape=shape;world?.rebuild(model);}world?.select(selected);renderDetail();renderRooms();updateIndicators();if(tour&&shapeChanged){tourIndex=Math.min(tourIndex,model.rooms.length-1);showTour();}}
function updateIndicators(){const connected=!requestFailed&&snapshot?.connection==='readable';$('local-mode').classList.toggle('selected',mode==='local');$('demo-mode').classList.toggle('selected',mode==='demo');$('local-mode').setAttribute('aria-pressed',mode==='local');$('demo-mode').setAttribute('aria-pressed',mode==='demo');$('data-label').textContent=mode==='demo'?'Data contoh · bukan aktivitas nyata':connected?'Metadata lokal · hanya baca':'Data lokal belum tersedia';$('data-label').classList.toggle('real',mode==='local'&&connected);$('connection-title').textContent=requestFailed?'Pembaca terputus':connected?'Log Codex terbaca':'Codex belum terbaca';$('connection-subtitle').textContent=requestFailed?'Pastikan npm start tetap berjalan':connected?`${snapshot.sessions.length} sesi · periksa tiap 5 detik`:'Buka panduan koneksi untuk mulai';$('connection-icon').textContent=connected?'⌘':'⌁';
 const source=requestFailed?'Server lokal tidak dapat dijangkau.':snapshot?.message||'Menghubungkan pembaca lokal…';$('footer-status').textContent=source+(snapshot?.limited?' Pemindaian dibatasi ke 80 file terbaru.':'')+(snapshot?.skipped?` ${snapshot.skipped} file/folder dilewati.`:'')+(snapshot?.context?.warning?' '+snapshot.context.warning:'');}
async function refresh(){if(inFlight)return;inFlight=true;$('refresh').disabled=true;try{const response=await fetch('/api/world',{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('server');snapshot=await response.json();requestFailed=false;if(initial&&!snapshot.sessions.length&&!snapshot.context.projects.length){mode='demo';}initial=false;updateWorld();}catch{requestFailed=true;initial=false;if(!model)updateWorld();else{updateIndicators();renderDetail();}}finally{inFlight=false;$('refresh').disabled=false;}}
try{if(!createWorld)throw Error('Modul 3D belum tersedia');world=createWorld($('world-canvas'),item=>select(item),(id,routine)=>{routines.set(id,routine);const active=selected.type==='agent'?selected.id:model?.agents.find(a=>a.roomId===selected.id)?.id;if(active===id&&$('routine-text'))$('routine-text').textContent=routine;});}catch(error){$('webgl-error').hidden=false;console.error('WebGL tidak tersedia',error);}
updateWorld();refresh();setInterval(refresh,5000);
$('local-mode').onclick=()=>{initial=false;mode='local';updateWorld();};$('demo-mode').onclick=()=>{initial=false;mode='demo';updateWorld();};$('refresh').onclick=refresh;
$('zoom-out').onclick=()=>world?.zoom(1.15);$('zoom-in').onclick=()=>world?.zoom(.87);$('rotate').onclick=()=>world?.rotate();$('reset').onclick=()=>world?.reset();
function syncPause(){const p=world?.paused??true;$('pause').setAttribute('aria-pressed',p);$('pause').textContent=p?'▶':'Ⅱ';$('pause').setAttribute('aria-label',p?'Lanjutkan animasi':'Jeda animasi');}
$('pause').onclick=()=>{world?.pause(!world.paused);syncPause();renderDetail();};syncPause();
function showTour(){const room=model.rooms[tourIndex];$('tour-step').textContent=`LANGKAH ${tourIndex+1} DARI ${model.rooms.length}`;$('tour-title').textContent=room.name;select({type:'room',id:room.id},{focus:true});$('tour-prev').disabled=tourIndex===0;$('tour-next').disabled=tourIndex===model.rooms.length-1;}
function setTour(value){tour=value;$('tour-bar').hidden=!value;$('world-tab').classList.toggle('active',!value);$('tour-tab').classList.toggle('active',value);$('world-tab').setAttribute('aria-pressed',!value);$('tour-tab').setAttribute('aria-pressed',value);if(value)showTour();else world?.reset();}
$('world-tab').onclick=()=>setTour(false);$('tour-tab').onclick=()=>setTour(true);$('tour-close').onclick=()=>setTour(false);$('tour-prev').onclick=()=>{if(tourIndex>0){tourIndex--;showTour();}};$('tour-next').onclick=()=>{if(tourIndex<model.rooms.length-1){tourIndex++;showTour();}};
$('help-open').onclick=()=>$('help-dialog').showModal();$('sound-open').onclick=()=>$('sound-dialog').showModal();
// Optional procedural audio: no network media, no autoplay, separate toggles.
let audioContext,master,music=false,office=false,musicTimer,officeTimer,noteIndex=0;
function audio(){if(!audioContext){audioContext=new AudioContext();master=audioContext.createGain();master.gain.value=Number($('volume').value)/100*.2;master.connect(audioContext.destination);}audioContext.resume();return audioContext;}
function tone(frequency,duration=.8,type='sine',gain=.2){const c=audioContext;if(!c||c.state!=='running')return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(gain,c.currentTime+.03);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g);g.connect(master);o.start();o.stop(c.currentTime+duration+.05);o.onended=()=>{o.disconnect();g.disconnect();};}
function musicStep(){if(!music||document.hidden)return;const chords=[[130.81,164.81,196,246.94],[110,130.81,164.81,196],[87.31,110,130.81,164.81],[98,123.47,146.83,196]];const chord=chords[Math.floor(noteIndex/8)%4];if(noteIndex%8===0)chord.forEach(f=>tone(f,3.2,'sine',.16));tone(chord[noteIndex%4]*2,.7,'triangle',.09);if(noteIndex%2===0)tone(60,.16,'sine',.25);noteIndex++;}
function setAudio(){clearInterval(musicTimer);clearInterval(officeTimer);music=$('music-toggle').checked;office=$('office-toggle').checked;if(music||office){try{audio();}catch{music=office=false;$('music-toggle').checked=false;$('office-toggle').checked=false;}}
 if(music){musicStep();musicTimer=setInterval(musicStep,560);}if(office)officeTimer=setInterval(()=>{if(document.hidden)return;tone(1250,.06,'triangle',.06);setTimeout(()=>{if(office)tone(1580,.09,'sine',.035);},110);},14000);if(!music&&!office)audioContext?.suspend();$('sound-label').textContent=music||office?'Suara aktif':'Suara mati';}
$('music-toggle').onchange=setAudio;$('office-toggle').onchange=setAudio;$('volume').oninput=()=>{if(master)master.gain.value=Number($('volume').value)/100*.2;};$('mute-all').onclick=()=>{$('music-toggle').checked=false;$('office-toggle').checked=false;setAudio();};document.addEventListener('visibilitychange',()=>{if(document.hidden)audioContext?.suspend();else if(music||office)audioContext?.resume();});
// Optional browser agent accessibility, feature-detected; changes only local view state.
if(document.modelContext?.registerTool){try{document.modelContext.registerTool({name:'pilih_ruangan',description:'Pilih ruangan di Kantor Kecil; hanya mengubah tampilan, tidak menjalankan tugas.',inputSchema:{type:'object',properties:{roomId:{type:'string'}},required:['roomId']},execute:async(input)=>{const roomId=input?.roomId;if(typeof roomId!=='string'||!model.rooms.some(r=>r.id===roomId))return {content:[{type:'text',text:'Ruangan tidak ditemukan.'}]};select({type:'room',id:roomId},{focus:true});return {content:[{type:'text',text:'Ruangan dipilih.'}]};}});}catch{}}
