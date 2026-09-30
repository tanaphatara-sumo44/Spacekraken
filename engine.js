(function(){"use strict";
// ================= utilities =================
const $=s=>document.querySelector(s), R=n=>1+Math.floor(Math.random()*n), d6=()=>R(6), d20=()=>R(20);
const esc=s=>{const d=document.createElement('div');d.textContent=s==null?'':String(s);return d.innerHTML};
const clone=o=>JSON.parse(JSON.stringify(o));
const PRICE=[0,2,5,12,30,70,150];
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('s');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('s'),2200)}
const SPECIES=['Kraken','Grey','Insectoids','Lost','Beasts','Renegades'];
const SPMAP={Kraken:'Kraken',Grey:'Grey',Insectoids:'Insectoid',Lost:'Lost',Beasts:'Beasts',Renegades:'Renegades'};
const TYPES=['Space Station','Overland','Underground','Mining Station','In Space','Core Planet'];
const DIFF={sim:['Just a Simulation',0.5],adv:['Adventurer',1],real:['Real Life',2],hard:['Hardcore',3]};
const TTAB={ // d20 -> N nothing C cash I item W weapon A ammo P prototype
'Space Station':'NCCCCIIICWWWIAAAAPPP','Overland':'NCCCCIIIIWWWWAAAPPPP','Underground':'NCCCIIIIWWWWWAAAAPPP',
'Mining Station':'NCCCCIIIIWWWAAAAAPPP','In Space':'NCCCCIIICWWWAAAAAPPP','Core Planet':'NCCCCIIIIWWWWAAAPPPP'};
// ================= gear parsing =================
function parseWeapon(n,hit,dmg,am,ty,g){
  const w={k:'W',n:n.replace(/ﬁ/g,'fi').replace(/\s*\(\d\)\s*/,' ').trim(),g:g||1,hit:hit,ty:ty,str:0,cnt:1,dmg:0,f:[],am:0,a:0,jam:0};
  const s=n.match(/\((\d)\)/);if(s)w.str=+s[1];
  const m=String(dmg).match(/(\d+)x(\d+)/);if(m){w.cnt=+m[1];w.dmg=+m[2]}else{const k=String(dmg).match(/(\d+)/);w.dmg=k?+k[1]:1}
  ['AP','IS','IA','EX','EMP','T2','Fire','Ice','Toxic'].forEach(t=>{if(new RegExp('\\b'+t+'\\b').test(dmg))w.f.push(t)});
  const wk=String(dmg).match(/Weaken (\d)/);if(wk)w.weaken=+wk[1];
  const a=String(am).match(/A(\d+)/);if(a){w.am=+a[1];w.a=w.am}
  return w;
}
function parseItem(n,e,g){
  const it={k:'I',n:n.replace(/ﬁ/g,'fi').trim(),e:e.trim(),g:g||1,uses:-1};
  const u=e.match(/^U(\d*):/);if(u)it.uses=u[1]?+u[1]:1;
  let m;
  if(m=e.match(/Regenerate (\d+) HP/))it.heal=+m[1];
  if(/full HP|entire HP/.test(e))it.heal=99;
  if(/each Hero|everybody/.test(e))it.all=1;
  if(m=e.match(/^Armor ([\d.,]+)/))it.arm=parseFloat(m[1].replace(',','.'));
  if(m=e.match(/(Flash|Energy) Shield ([AB])-(\d+)\/(\d+)/))it.sh={t:m[2],c:+m[3],r:+m[4]};
  if(m=e.match(/Stores up to (\w+) O2/))it.o2={two:2,four:4,five:5,six:6}[m[1]]||2;
  if(m=e.match(/Regenerate (\w+) O2/))it.o2r=5;
  if(m=e.match(/Restore (\d) [Ss]hield/))it.chg=+m[1];
  return it;
}
const CAT={W:[],I:[]};
GEAR.W.forEach(w=>CAT.W.push(Object.assign(parseWeapon(w.n,w.hit,w.dmg,w.am,w.ty,w.g),{d6:w.d6,s:w.s})));
GEAR.I.forEach(i=>CAT.I.push(Object.assign(parseItem(i.n,i.e,i.g),{d6:i.d6,s:i.s})));
function findGear(str){
  str=str.replace(/ﬁ/g,'fi').replace(/ﬂ/g,'fl').replace(/fi /g,'fi').replace(/fl e/g,'fle');
  const nm=str.split(/ \/ | RG | ML /)[0].replace(/\(\d\)/,'').trim().toLowerCase();
  const w=CAT.W.find(x=>x.n.toLowerCase()===nm);if(w)return clone(w);
  const i=CAT.I.find(x=>x.n.toLowerCase()===nm);if(i)return clone(i);
  let m=str.match(/^(.+?)\s(RG|ML)\s(\d)\+,\s*([^,(]+?)(?:,\s*(A\d+))?\s*\((\d+)¢/);
  if(m)return parseWeapon(m[1],+m[3],m[4],m[5]||'',m[2],1);
  m=str.match(/^(.+?) \/ (.+?)\s*\(/);if(m)return parseItem(m[1],m[2],1);
  return null;
}
function gearPrice(it){return PRICE[it.g]||2}
// ================= crew =================
function makeCrew(t){
  const c={id:'c'+Math.random().toString(36).slice(2,8),name:t.name,role:t.role,story:t.story,at:Object.assign({},t.at),lv:1,
    traits:(t.traits||[]).filter(x=>x&&x!=='SKILLS'&&x.length<24).slice(0,4),inv:{},psi:0,psiEx:0};
  const pm=c.traits.join(' ').match(/PSI Powers LV(\d)/);if(pm)c.psi=+pm[1];
  c.max=Math.min(14,c.at.str*2);c.hp=c.max;
  let cost=0;
  Object.entries(t.items||{}).forEach(([slot,s])=>{const g=findGear(s);if(g){const p=s.match(/\((\d+)¢/);cost+=p?+p[1]:0;c.inv[slot]=g}});
  c.cost=cost;return c;
}
function slots(c){const n=Math.floor(c.at.str/2)+(Object.values(c.inv).some(i=>i&&/^Backpack/.test(i.n))?1:0);return['L','R'].concat(Array.from({length:Math.min(6,n)},(_,i)=>String(i+1)))}
function armorOf(c){let a=0;Object.values(c.inv).forEach(i=>{if(i&&i.arm)a+=i.arm});if(c.at.str>8)a+=(c.at.str-8)*0.5;return Math.min(8,a)}
function shieldOf(c){let best=null;Object.values(c.inv).forEach(i=>{if(i&&i.sh&&(!best||i.sh.c>best.c))best=i.sh});return best}
function alive(c){return c.hp>-4&&!c.dead}function awake(c){return !c.dead&&c.hp>0}
// ================= state & storage =================
let db=null,userCap=null,myId=null,code=null,S=null,unsub=null,secret=null,unsubSec=null,local=false;
let ROLE='gm',myName='',unsubCmd=null;let ui={tab:'play',sel:{},shopTab:'W',th:true,trBusy:{},trFail:{}};let sampleCap=null;const TR={};window.__S=()=>S;
function blankState(o){return Object.assign({v:2,turn:1,step:'setup',credits:100,xp:0,o2:25,crew:[],cargo:[],ship:null,lines:[],inter:{},locs:[],log:[],members:[],roles:{},ev:null,votes:{},dun:null,cmb:null,sp:null,shop:null,lg:null,rec:false,skipped:-1},o)}
function log(m,k){S.log.push({m:m,k:k||''});if(S.log.length>80)S.log.splice(0,S.log.length-80)}
let saving=null,pending=false;
async function save(){render();if(ROLE!=='gm')return;if(local){try{localStorage.setItem('sk_local_'+code,JSON.stringify(S))}catch(e){}return}
  if(saving){pending=true;return}saving=true;
  try{await db.collection('games').doc(code).set(toFS(JSON.parse(JSON.stringify(S))))}catch(e){toast('บันทึกไม่สำเร็จ: '+(e.code||e.message))}
  saving=false;if(pending){pending=false;save()}}
async function boot(){db=window.FBDB||null;try{myId=localStorage.getItem('sk_uid')}catch(e){}if(!myId){myId='u'+Math.random().toString(36).slice(2,10);try{localStorage.setItem('sk_uid',myId)}catch(e){}}
  try{myName=localStorage.getItem('sk_name')||''}catch(e){}skyLoop();wireGuide();lobby();
  const q=new URLSearchParams(location.search);if(q.get('room')&&q.get('role')==='table')joinAs('table',q.get('room').toUpperCase())}
function lobbyOld(){
  code=null;S=null;if(unsub)unsub();if(unsubSec)unsubSec();
  $('#top').innerHTML='<div class="top"><span>SPACE<b>KRAKEN</b></span><span class="dim">ภารกิจล่าคราเคน</span></div>';
  let last='';try{last=localStorage.getItem('sk_last')||''}catch(e){}
  $('#app').innerHTML=`<h2>เริ่มภารกิจ</h2>
  <div class="c"><h3>สร้างห้องใหม่</h3><div class="row"><input id="nm" placeholder="ชื่อทีม" style="flex:1"></div>
  <div class="row" style="margin-top:8px"><select id="df">${Object.entries(DIFF).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select>
  <input id="set" type="number" min="1" max="49" placeholder="Story Set (สุ่ม)" style="width:150px"></div>
  <div class="row" style="margin-top:8px"><button class="bt pr" id="mk">${db?'สร้างห้องออนไลน์':'เริ่มเล่นคนเดียว'}</button>${db?'<button class="bt" id="solo">เล่นคนเดียว (ออฟไลน์)</button>':''}</div></div>
  ${db?`<div class="c"><h3>เข้าร่วมห้องเพื่อน</h3><div class="row"><input id="jc" placeholder="รหัสห้อง" maxlength="6" style="text-transform:uppercase;width:140px"><button class="bt pr" id="jn">เข้าร่วม</button></div></div>`:''}
  ${last?`<div class="c"><button class="bt" id="rs">↺ กลับเข้าห้องล่าสุด ${esc(last)}</button></div>`:''}
  <p class="dim">เนื้อเรื่อง ตาราง CGM แผนที่ ศัตรู อาวุธ ไอเทม และยาน ถูกแปลงจากไฟล์เกมของคุณทั้งหมด ทุกการทอยเต๋าและผลลัพธ์ซิงก์ให้ทุกคนในห้องเห็นพร้อมกัน</p>`;
  $('#mk').onclick=()=>create(!db);
  if($('#solo'))$('#solo').onclick=()=>create(true);
  if($('#jn'))$('#jn').onclick=()=>join($('#jc').value.trim().toUpperCase());
  if($('#rs'))$('#rs').onclick=()=>last.startsWith('L:')?openLocal(last.slice(2)):join(last);
}
function storySet(n){const ROW=[["1HH","1NA","1EZ","1CD","1NH","1NU","1NC"],["1PT","1FU","1NF","1SA","1JU","1VX","1NG"],["1RX","1NB","1PQ","1FF","1CW","1XE","1LL"],["1JS","1AW","1NP","1BU","1NE","1EV","1PR"]];
  const i=(n-1)%7,b=Math.floor((n-1)/7);return ROW.map((r,k)=>r[(i+k*b)%7])}
async function create(solo){
  const n=+$('#set').value||R(49);const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';for(let i=0;i<5;i++)c+=A[R(A.length)-1];
  S=blankState({name:$('#nm').value.trim()||'Void Runners',diff:$('#df').value,set:n,members:myId?[myId]:[],host:myId});
  S.lines=storySet(n).map(p=>({pos:p,vars:{},ended:false})).concat([null,null]);
  log('เริ่มแคมเปญ Story Set '+n,'ok');
  if(solo){local=true;code=c;try{localStorage.setItem('sk_last','L:'+c)}catch(e){}openLocal(c,S);return}
  local=false;code=c;
  try{await db.collection('games').doc(c).set(toFS(JSON.parse(JSON.stringify(S))));openRemote(c)}catch(e){toast('สร้างห้องไม่ได้ เล่นออฟไลน์แทน');local=true;openLocal(c,S)}
}
function openLocal(c,st){local=true;code=c;if(!st){try{st=JSON.parse(localStorage.getItem('sk_local_'+c))}catch(e){}}if(!st){toast('ไม่พบเซฟ');return lobby()}S=st;try{localStorage.setItem('sk_last','L:'+c)}catch(e){}render()}
async function join(c){if(!c)return;try{const s=await db.collection('games').doc(c).get();if(!s.exists){toast('ไม่พบห้อง '+c);return}
  const d=s.data();if(myId&&ROLE==='player'&&!(d.members||[]).includes(myId)){d.members=(d.members||[]).concat(myId);try{await db.collection('games').doc(c).update({members:d.members})}catch(e){}}openRemote(c)}catch(e){toast('เข้าห้องไม่ได้')}}
function openRemote(c){local=false;code=c;if(ROLE==='gm')listenCmds(c);try{localStorage.setItem('sk_last',c)}catch(e){}
  unsub=db.collection('games').doc(c).onSnapshot(s=>{if(!s.exists)return;if(s.metadata.hasPendingWrites&&S)return;S=fromFS(s.data());render()},e=>toast('ซิงก์หลุด'));
  if(myId){const ref=db.doc('secrets/'+myId+'_'+c);unsubSec=ref.onSnapshot(s=>{secret=s.exists?s.data():null;if(ui.tab==='team')render()},()=>{})}}
// ================= rendering shell =================
function render(){if(!S)return;const gb=document.getElementById('gbtn');if(gb)gb.style.display='block';if(ROLE==='table')return renderTable();if(ROLE==='player')return renderPlayer();renderGM()}
function renderGM(){
  if(!S)return;
  const cr=S.crew;
  $('#top').innerHTML=`<div class="top"><button class="bt sm" id="bk">←</button><span>SPACE<b>KRAKEN</b></span>
   <span class="pill">${local?'ออฟไลน์':'ห้อง '+esc(code)}</span><span class="pill">เทิร์น ${S.turn}</span>
   <span class="pill cr">${S.credits}¢</span><span class="pill xp">${S.xp} XP</span><span class="pill o2">O₂ ${S.o2}/${o2Max()}</span></div>`;
  $('#bk').onclick=lobby;
  const tabs=[['play','เกม'],['crew','ลูกเรือ'],['ship','ยาน'],['story','เส้นเรื่อง'],['team','ทีม'],['log','บันทึก']];
  let h=`<div class="tabs">${tabs.map(t=>`<button class="bt sm ${ui.tab===t[0]?'on':''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>`;
  if(ui.tab==='play')h+=viewPlay();else if(ui.tab==='crew')h+=viewCrew();else if(ui.tab==='ship')h+=viewShip();
  else if(ui.tab==='story')h+=viewStory();else if(ui.tab==='team')h+=viewTeam();else h+=viewLog(80);
  $('#app').innerHTML=h;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ui.tab=b.dataset.tab;render()});
  document.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(b.dataset.a,b.dataset));
  document.querySelectorAll('[data-in]').forEach(b=>b.onchange=()=>act(b.dataset.in,Object.assign({val:b.value},b.dataset)));
}
function viewLog(n){return `<div class="log">${S.log.slice(-n).reverse().map(l=>`<div class="${l.k}">${esc(l.m)}</div>`).join('')}</div>`}
function btn(a,label,cls,data,dis){return `<button class="bt ${cls||''}" data-a="${a}" ${Object.entries(data||{}).map(([k,v])=>`data-${k}="${esc(v)}"`).join(' ')} ${dis?'disabled':''}>${label}</button>`}
function o2Max(){let m=25;S.crew.forEach(c=>Object.values(c.inv).forEach(i=>{if(i&&i.o2)m+=i.o2}));return m}
function pic(k,n,sz){const dir={crew:'crew',en:'enemies'}[k]||k;const hue=[...(n||'?')].reduce((a,c)=>a+c.charCodeAt(0),0)%360;
 return `<div class="av" style="width:${sz}px;height:${sz}px;background:linear-gradient(135deg,hsl(${hue} 45% 32%),hsl(${(hue+50)%360} 40% 16%));font-size:${Math.round(sz*.38)}px">${esc((n||'?').split(' ').map(w=>w[0]).join('').slice(0,2))}<img ${imgAttr(dir+'/'+slug(n)+'.jpg')} alt=""></div>`}
function shipPic(n){return `<img ${imgAttr('ships/'+slug(n)+'.jpg')} alt="" style="display:block;width:100%;max-height:200px;object-fit:contain;margin:0 auto 6px">`}
function shipView(){if(!S.ship)return '';const W=shipWeapons().map(w=>w.n.split(/[,.]/)[0]);const SH=S.ship.sys.filter(x=>/shield/i.test(x.n)).map(x=>x.n);const OT=S.ship.sys.filter(x=>!/shield/i.test(x.n)&&!shipWeapons().includes(x)).map(x=>x.n);
 const bar=(v,m,c)=>`<div class="bar" style="height:8px"><i style="width:${Math.min(100,100*v/Math.max(1,m))}%;background:${c}"></i></div>`;
 return `<div class="c" style="text-align:center">${shipPic(S.ship.name)}<b>${esc(S.ship.name)}</b><div style="text-align:left;margin-top:6px"><span class="dim">โครงสร้าง SP ${shipSP()}</span>${bar(shipSP(),60,'var(--g)')}<span class="dim">โล่ ${shipSh().c} (ชาร์จ +${shipSh().r}/รอบ)</span>${bar(shipSh().c,20,'var(--b)')}<span class="dim">เกราะ ${shipArmor()}</span>${bar(shipArmor(),4,'var(--y)')}</div>
 <div style="margin-top:6px">${W.map(n=>`<span class="tag" style="color:var(--r)">🔫 ${esc(n)}</span>`).join('')}${SH.map(n=>`<span class="tag" style="color:var(--b)">🛡️ ${esc(n)}</span>`).join('')}${OT.map(n=>`<span class="tag">⚙️ ${esc(n)}</span>`).join('')}${!S.ship.sys.length?'<span class="dim">ยังไม่มีระบบติดตั้ง — ยานเปล่า</span>':''}</div></div>`}
function trKey(k){return k.replace(/[^A-Za-z0-9_-]/g,'_').slice(0,120)}
async function gtx(text){const parts=[];let buf='';text.split('\n').forEach(p=>{if(buf&&(buf+'\n'+p).length>1300){parts.push(buf);buf=p}else buf=buf?buf+'\n'+p:p});if(buf)parts.push(buf);
 const out=[];for(const p of parts){const r=await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q='+encodeURIComponent(p));const j=await r.json();out.push(j[0].map(x=>x[0]).join(''))}return out.join('\n')}
async function translate(key,text){const k=trKey(key);if(TR[k]||ui.trBusy[k]||ui.trFail[k])return;ui.trBusy[k]=1;
 try{if(!local&&db){const s=await db.collection('tr').doc(k).get();if(s.exists&&s.data().th){TR[k]=s.data().th;ui.trBusy[k]=0;render();return}}else{const c=localStorage.getItem('sk_tr_'+k);if(c){TR[k]=c;ui.trBusy[k]=0;render();return}}}catch(e){}
 try{TR[k]=await gtx(text);try{if(!local&&db)db.collection('tr').doc(k).set({th:TR[k]});else localStorage.setItem('sk_tr_'+k,TR[k])}catch(e){}}catch(e){ui.trFail[k]=1}
 ui.trBusy[k]=0;render()}
function evText(key,text){const k=trKey(key),th=TR[k];if(ui.th&&!th)setTimeout(()=>translate(key,text),0);
 const fail=ui.trFail[k]?` <a href="https://translate.google.com/?sl=en&tl=th&op=translate&text=${encodeURIComponent(text.slice(0,4500))}" target="_blank" rel="noopener">แปลไม่ได้ · เปิด Google Translate</a>`:'';
 return `<div class="row">${btn('thtog',ui.th?'🇹🇭 ภาษาไทย · แตะดูต้นฉบับ':'🇬🇧 English · แตะเพื่อแปลไทย','sm on')}${ui.th&&!th?`<span class="dim">${ui.trBusy[k]?'กำลังแปล…':''}${fail}</span>`:''}</div><div class="ev">${esc(ui.th&&th?th:text)}</div>`}
// ================= PLAY view dispatcher =================
function viewPlay(){
  switch(S.step){
    case 'setup':return vSetup();case 'buy':return vShop(true);case 'p1':return vPhase1();case 'event':return vEvent();
    case 'p3':return vPhase3();case 'flight':return vFlight();case 'space':return vSpace();case 'locgen':return vLocGen();
    case 'dun':return vDungeon();case 'cmb':return vCombat();case 'loot':return vLoot();case 'shop':return vShop(false);
    case 'over':return `<div class="c"><h2>ภารกิจจบลง</h2><p>${esc(S.overMsg||'')}</p>${btn('newgame','กลับหน้าแรก','pr')}</div>`+viewLog(30);
  }
  return '';
}
// ================= SETUP =================
function vSetup(){
  const picked=S.crew.map(c=>c.name);
  let h=`<h2>เลือกลูกเรือ (${S.crew.length}/4)</h2><p class="dim">ค่าอุปกรณ์เริ่มต้นของลูกเรือจะหักจากเครดิต 100¢ ตอนยืนยัน</p>`;
  CREW.forEach((t,i)=>{const on=picked.includes(t.name.split(' ')[0])||picked.includes(t.name);
    h+=`<div class="crew">${pic('crew',t.name,72)}<div class="row"><b>${esc(t.name)}</b><span class="tag">${esc(t.role)}</span>${(t.traits||[]).filter(x=>x!=='SKILLS'&&x.length<24).slice(0,4).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>
    <div class="dim">STR ${t.at.str} AGI ${t.at.agi} MEL ${t.at.mel} RAN ${t.at.ran} TEC ${t.at.tec} CHA ${t.at.cha} · ${Object.values(t.items||{}).map(esc).join(' · ')}</div>
    ${ui.story===i?evText('crew_'+t.name,t.story):btn('showstory','📖 อ่านประวัติ','sm',{i:i})}
    ${btn(on?'unpick':'pick',on?'เอาออก':'เลือก',on?'dg sm':'sm',{i:i},!on&&S.crew.length>=4)}<div style="clear:both"></div></div>`});
  h+=btn('setupdone','ยืนยันลูกเรือ → ไปซื้อยาน','pr',{},S.crew.length<1);
  return h;
}
// ================= SHOP =================
function shopGrade(){return S.shop?S.shop.grade:99}
function vShop(start){
  const g=shopGrade();let h=`<h2>${start?'เตรียมภารกิจ: ซื้อยานและอุปกรณ์':'ร้านค้า (เกรดไม่เกิน '+g+')'}</h2>
  <div class="row">${['SHIP','W','I','AMMO','SELL','HIRE'].map(t=>`<button class="bt sm ${ui.shopTab===t?'on':''}" data-a="stab" data-t="${t}">${{SHIP:'ยาน',W:'อาวุธ',I:'ไอเทม',AMMO:'กระสุน',SELL:'ขายของ',HIRE:'จ้างลูกเรือ'}[t]}</button>`).join('')}</div>`;
  const who=`<select data-in="buywho" style="margin:6px 0">${['cargo'].concat(S.crew.filter(alive).map(c=>c.id)).map(id=>`<option value="${id}" ${ui.buyTo===id?'selected':''}>${id==='cargo'?'ส่งเข้าคลังยาน':'ให้ '+esc(S.crew.find(c=>c.id===id).name)}</option>`).join('')}</select>`;
  if(ui.shopTab==='SHIP'){
    if(!S.ship){h+=`<p class="dim">ต้องซื้อ Hull ก่อน 1 ลำ</p>`;SHIPS.forEach((s,i)=>{const hull=s.sys[0];h+=`<div class="crew">${shipPic(s.name)}<b>${esc(s.name)}</b> <span class="dim">${esc(hull.d)}</span><br>${btn('buyhull','ซื้อ '+hull.c+'¢','sm pr',{i:i},S.credits<hull.c)}</div>`})}
    else{const def=SHIPS.find(s=>s.name===S.ship.name);h+=shipView()+`<p>ยาน <b>${esc(S.ship.name)}</b> · SP ${shipSP()} · โล่ ${shipSh().c}/${shipSh().r} · เกราะ ${shipArmor()}</p><table>`;
      def.sys.slice(1).forEach((s,i)=>{const own=S.ship.sys.filter(x=>x.n===s.n).length;const multi=/Hull expansion/.test(s.n)?def.sys.filter(x=>x.n===s.n).length:(/^(Laser|Missile|Ion|Heavy laser|Torpedo|Autocannon|Twin|Railgun|Swarm|EMP|Gauss)/.test(s.n)?4:1);
        h+=`<tr><td>${esc(s.n)}<div class="dim">${esc(s.d)}</div></td><td>${s.c}¢</td><td>${own?'✓×'+own:''}</td><td>${btn('buysys','ซื้อ','sm',{i:i+1},S.credits<s.c||own>=multi)}</td></tr>`});
      h+='</table>'}
  }else if(ui.shopTab==='W'||ui.shopTab==='I'){
    h+=who+'<table>';CAT[ui.shopTab].filter(x=>x.g<=g).forEach((x,i)=>{const p=PRICE[x.g];
      h+=`<tr><td>${esc(x.n)} <span class="tag">G${x.g}</span><div class="dim">${ui.shopTab==='W'?wDesc(x):esc(x.e)}</div></td><td>${p}¢</td><td>${btn('buy','ซื้อ','sm',{k:ui.shopTab,i:CAT[ui.shopTab].indexOf(x)},S.credits<p)}</td></tr>`});h+='</table>';
  }else if(ui.shopTab==='AMMO'){
    h+='<p class="dim">ซื้อแม็กกาซีนราคาเท่าเกรดอาวุธ เติมกระสุนเต็มทันที</p><table>';allGear().filter(o=>o.it.k==='W'&&o.it.am).forEach(o=>{
      h+=`<tr><td>${esc(o.it.n)} <span class="dim">(${esc(o.where)})</span></td><td>${o.it.a}/${o.it.am}</td><td>${btn('ammo','เติม '+o.it.g+'¢','sm',{w:o.key},S.credits<o.it.g||o.it.a>=o.it.am)}</td></tr>`});h+='</table>';
  }else if(ui.shopTab==='SELL'){
    h+='<p class="dim">ขายได้ครึ่งราคา</p><table>';allGear().forEach(o=>{h+=`<tr><td>${esc(o.it.n)} <span class="dim">(${esc(o.where)})</span></td><td>${btn('sell','ขาย '+Math.floor(PRICE[o.it.g]/2)+'¢','sm',{w:o.key})}</td></tr>`});h+='</table>';
  }else if(ui.shopTab==='HIRE'){
    h+=`<p class="dim">จ้างลูกเรือ Lv1 ราคา 10¢ (มีได้สูงสุด 4 คน)</p>`;CREW.filter(t=>!S.crew.some(c=>c.name===t.name)).forEach(t=>{h+=`<div class="row">${esc(t.name)} <span class="tag">${esc(t.role)}</span>${btn('hire','จ้าง 10¢','sm',{n:t.name},S.credits<10||S.crew.filter(alive).length>=4)}</div>`});
  }
  h+=`<div style="margin-top:12px">${start?btn('startgame','ออกเดินทาง! เริ่มเทิร์น 1','pr',{},!S.ship):btn('leaveshop','ออกจากร้าน','pr')}</div>`;
  return h;
}
function wDesc(w){return `${w.ty} ${w.hit}+ · ${w.cnt>1?w.cnt+'x':''}${w.dmg} ${w.f.join(' ')}${w.weaken?' Weaken '+w.weaken:''}${w.am?' · A'+w.am:''}${w.str?' · STR '+w.str:''}`}
function allGear(){const o=[];S.cargo.forEach((it,i)=>o.push({it,where:'คลัง',key:'cargo:'+i}));S.crew.forEach(c=>Object.entries(c.inv).forEach(([s,it])=>{if(it)o.push({it,where:c.name+' '+s,key:c.id+':'+s})}));return o}
function gearAt(key){const[a,b]=key.split(':');if(a==='cargo')return S.cargo[+b];const c=S.crew.find(x=>x.id===a);return c&&c.inv[b]}
function removeGear(key){const[a,b]=key.split(':');if(a==='cargo')return S.cargo.splice(+b,1)[0];const c=S.crew.find(x=>x.id===a);const it=c.inv[b];delete c.inv[b];return it}
function giveTo(who,it){if(who&&who!=='cargo'){const c=S.crew.find(x=>x.id===who);const free=slots(c).find(s=>!c.inv[s]);if(free){c.inv[free]=it;return c.name}}S.cargo.push(it);return 'คลังยาน'}
// ship
function shipSys(n){return S.ship?S.ship.sys.filter(s=>s.n.indexOf(n)===0&&!s.x):[]}
function shipSP(){if(!S.ship)return 0;const def=SHIPS.find(s=>s.name===S.ship.name);let sp=+(def.sys[0].d.match(/(\d+) SP/)||[0,20])[1];
  S.ship.sys.forEach(s=>{if(/Hull expansion/.test(s.n)){const m=(def.sys.find(x=>x.n===s.n&&/\d/.test(x.d))||{d:'+8'}).d.match(/\+(\d+)/);sp+=m?+m[1]:8}});return sp}
function shipSh(){let c=0,r=0;shipSys('Primary').forEach(()=>{c+=5;r+=2});shipSys('Secondary').forEach(()=>{c+=4;r+=2});shipSys('Dynamic').forEach(()=>{c+=4;r+=2});return{c,r}}
function shipArmor(){return shipSys('Armor').length+2*shipSys('Heavy Armor').length}
function shipWeapons(){return S.ship?S.ship.sys.filter(s=>/^(Laser|Missile|Ion|Heavy laser|Torpedo|Autocannon|Twin|Railgun|Swarm|EMP|Gauss)/.test(s.n)):[]}
function parseShipW(n){const m=n.match(/^([^,.]+)[,.]\s*(\d+)/);const w={n:m?m[1]:n,dmg:m?+m[2]:3,emp:/EMP/.test(n),he:/HE/.test(n),oc:/OC/.test(n),am:0};const a=n.match(/A(\d)/);if(a)w.am=+a[1];return w}
function has(n){return shipSys(n).length>0}
// ================= TURN / PHASE 1 =================
function vPhase1(){
  let h=`<h2>เทิร์น ${S.turn} · เฟส 1: เดินเส้นเรื่อง</h2><div class="c">`;
  S.lines.forEach((l,i)=>{if(!l)return;h+=`<div class="row"><span class="tag">L${i+1}</span><b style="color:var(--b)">${l.ended?'จบแล้ว':esc(l.pos)}</b><span class="dim">${Object.entries(l.vars).filter(e=>e[1]).map(e=>e[0]+':'+e[1]).join(' ')}</span>${l.standby?'<span class="tag">STANDBY</span>':''}</div>`});
  const can=S.lines.map((l,i)=>l&&!l.ended&&!l.done?i:-1).filter(i=>i>=0);
  h+=`</div><p class="dim">ข้ามได้ 1 ไลน์ต่อเทิร์น (ห้ามข้ามไลน์เดิมติดกัน)</p><div class="row">`;
  if(can.length){h+=btn('runline','▶ รันไลน์ '+(can[0]+1),'pr',{i:can[0]});if(S.skipped!==can[0]&&!S.skipThis)h+=btn('skipline','ข้ามไลน์ '+(can[0]+1),'sm',{i:can[0]})}
  else h+=btn('p1done','ไปเฟส 2-3 →','pr');
  return h+'</div>'+viewLog(12);
}
function cell(co){if(!co||co.length<3)return null;const r=(CGM[co[0]]||{})[co.slice(1)];return r?{k:r[0],v:r.slice(1)}:null}
const shift=(co,n)=>co[0]+String.fromCharCode(co.charCodeAt(1)+n)+co[2];
function gv(l,t){if(/^-?\d+$/.test(t))return +t;return('ABCDEFGH'.includes(t)?l.vars[t]:S.inter[t])||0}
function sv(l,t,v){if('ABCDEFGH'.includes(t))l.vars[t]=v;else S.inter[t]=v}
function runLine(i){const l=S.lines[i];let hop=0;
  while(hop++<90){const c=cell(l.pos);
    if(!c){log('L'+(i+1)+': ไม่พบช่อง '+l.pos+' (หยุดไลน์)','x');l.done=1;return}
    if(c.v==='/'){log('L'+(i+1)+': เส้นเรื่องจบสมบูรณ์','ok');S.lines[i]=null;return}
    if(/^\d[A-Z]{2}$/.test(c.v)){if(c.k==='R'){l.pos=c.v;l.done=1;log('L'+(i+1)+' หยุดที่ '+c.v);return}l.pos=c.v;continue}
    if(c.v[0]==='!'){const id=c.v.slice(1);S.ev={line:i,id:id,at:l.pos,text:EVT[id]||'(ไม่พบข้อความเหตุการณ์ '+id+')'};S.votes={};
      S.ev.choice=/(^|\n)A:/.test(S.ev.text)&&/(^|\n)B:/.test(S.ev.text);S.step='event';log('เหตุการณ์ '+id+' (L'+(i+1)+')','k');return}
    if(c.v[0]==='%'){const n=+c.v.slice(1),r=d20();log('L'+(i+1)+' สุ่ม d20='+r+' ต้อง '+n+'+','k');l.pos=shift(l.pos,r>=n?1:2);continue}
    const m=c.v.match(/^([A-Z]|\d+)([+\-<>=])([A-Z]|\d+)$/);
    if(m){const a=gv(l,m[1]),b=gv(l,m[3]);if(m[2]==='+'||m[2]==='-'){sv(l,m[1],a+(m[2]==='+'?b:-b));l.pos=shift(l.pos,1)}
      else{const t=m[2]==='>'?a>b:m[2]==='<'?a<b:a===b;l.pos=shift(l.pos,t?1:2)}continue}
    log('ช่องไม่รู้จัก '+c.v,'x');l.done=1;return}
  l.done=1;log('L'+(i+1)+' วนซ้ำเกิน หยุดไว้','x');
}
// ================= EVENT =================
function vEvent(){const e=S.ev;const ids=S.members||[];const v=S.votes||{};const cnt={A:0,B:0};Object.values(v).forEach(x=>cnt[x]=(cnt[x]||0)+1);
  let h=`<h2>เหตุการณ์ ${esc(e.id)}</h2>${evText('ev_'+e.id,e.text)}`;
  h+=quickFx();
  if(e.choice){h+=`<div class="c"><h3>ตัดสินใจ (โหวต A ${cnt.A} · B ${cnt.B})</h3><div class="row">${btn('vote','โหวต A','',{c:'A'})}${btn('vote','โหวต B','',{c:'B'})}</div>
  <div class="row" style="margin-top:6px">${btn('evdone','ยืนยันเลือก A','pr',{c:'A'})}${btn('evdone','ยืนยันเลือก B','pr',{c:'B'})}</div></div>`}
  else h+=`<div class="row">${btn('evdone','ดำเนินเรื่องต่อ →','pr',{c:'A'})}${btn('standby','พักเหตุการณ์ (STANDBY)','sm')}</div>`;
  return h+viewLog(8);
}
function quickFx(){
  return `<details class="c"><summary>⚙️ ปรับผลของเหตุการณ์ (ทำตามที่ข้อความบอก)</summary>
  <div class="row" style="margin-top:8px">เครดิต ${btn('fx','-5','sm',{f:'credits',v:-5})}${btn('fx','-1','sm',{f:'credits',v:-1})}${btn('fx','+1','sm',{f:'credits',v:1})}${btn('fx','+5','sm',{f:'credits',v:5})}${btn('fx','+10','sm',{f:'credits',v:10})}</div>
  <div class="row">XP ${btn('fx','-1','sm',{f:'xp',v:-1})}${btn('fx','+1','sm',{f:'xp',v:1})}${btn('fx','+5','sm',{f:'xp',v:5})}${btn('fx','+10','sm',{f:'xp',v:10})}</div>
  <div class="row">O₂ ${btn('fx','-1','sm',{f:'o2',v:-1})}${btn('fx','+5','sm',{f:'o2',v:5})}</div>
  ${S.crew.filter(alive).map(c=>`<div class="row">${esc(c.name)} HP ${c.hp}/${c.max} ${btn('hp','-1','sm',{c:c.id,v:-1})}${btn('hp','-3','sm',{c:c.id,v:-3})}${btn('hp','+1','sm',{c:c.id,v:1})}${btn('hp','+3','sm',{c:c.id,v:3})}${btn('kill','ตาย','sm dg',{c:c.id})}</div>`).join('')}
  <div class="row">เช็คค่า: <select data-in="chkc">${S.crew.filter(awake).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
   <select data-in="chka">${['str','agi','mel','ran','tec','cha'].map(a=>`<option ${ui.chka===a?'selected':''}>${a}</option>`).join('')}</select>${btn('check','ทอย d6+ค่า','sm')}</div>
  <div class="row">ต่อสู้: เลเวล <input id="fxlv" type="number" value="${S.dun?S.dun.dif:2}" style="width:60px"> <select id="fxsp">${SPECIES.map(s=>`<option>${s}</option>`).join('')}</select>${btn('fxcmb','เริ่มต่อสู้','sm dg')}${btn('fxcmb','ซุ่มโจมตี','sm dg',{amb:1})}</div>
  <div class="row">ร้านค้าเกรด <input id="fxsg" type="number" value="2" style="width:60px">${btn('fxshop','เปิดร้าน','sm')} ${btn('fxloot','รับ Treasure','sm',{})}</div>
  <div class="row">ตัวแปร <input id="fxvar" placeholder="เช่น A หรือ N" style="width:70px"><input id="fxval" type="number" style="width:70px">${btn('fxvar','ตั้งค่า','sm')}</div>
  <div class="row">สถานที่ใหม่จากเหตุการณ์: ${btn('fxloc','สร้าง Location','sm')}</div></details>`;
}
// ================= PHASE 3 =================
function recover(){S.crew.forEach(c=>{if(c.dead)return;if(c.hp<=0)c.hp=3;else c.hp=Math.min(c.max,c.hp+3+3*shipSys('Med Bay').length+3*shipSys('Advanced Med Bay').length);c.psiEx=0});S.o2=o2Max();S.rec=true;log('ฟื้นฟู: +3 HP, ออกซิเจนเต็ม','ok')}
function vPhase3(){
  let h=`<h2>เทิร์น ${S.turn} · เฟส 3: เลือกหนึ่งการกระทำ</h2><div class="c">
  ${btn('goflight','🚀 บินหาสถานที่ใหม่','pr')}<br>`;
  S.locs.forEach((L,i)=>h+=btn('land','🛬 ลงจอด: '+L.type+' D'+L.dif+' ('+L.species+')','',{i:i})+`<span class="dim">${L.solved?'สำรวจครบแล้ว':''}</span><br>`);
  S.lines.forEach((l,i)=>{if(l&&!l.ended)h+=btn('forceline','📜 กระตุ้นไลน์ '+(i+1)+' อีกครั้ง','sm',{i:i})});
  h+=`<br>${btn('g5shop','🏪 ร้านเกรด 5','sm')}${btn('endturn','จบเทิร์น (ฟื้นฟู)','sm')}</div>`;
  return h+viewLog(10);
}
function endTurn(){if(!S.rec)recover();S.rec=false;S.turn++;S.step='p1';S.lines.forEach(l=>{if(l){l.done=0}});S.skipThis=0;log('— เริ่มเทิร์น '+S.turn+' —','ok')}
// ================= FLIGHT & SPACE COMBAT =================
function vFlight(){const f=S.fl||(S.fl={dif:2,opt:{}});const fd=flightDif();
  const O=[['risky','ทางลัดเสี่ยง (+1, ปรับเต๋า 2)'],['danger','ทางลัดอันตราย (+2, ปรับเต๋า 3)'],['smuggle','ขนของเถื่อน (+2, +15¢)'],['pay','จ้างนำทาง (-1, จ่าย 5¢)'],['safe','ปลอดภัยไว้ก่อน (ไม่ต่อสู้, ลงจอดเทิร์นหน้า)']];
  return `<h2>บินหาสถานที่ใหม่</h2><div class="c">ความยากสถานที่ ${[1,2,3,4,5].map(n=>btn('fdif',n,'sm '+(f.dif===n?'on':''),{n:n})).join('')}
  <h3>ตัวเลือกการบิน</h3>${O.map(o=>btn('fopt',o[1],'sm '+(f.opt[o[0]]?'on':''),{o:o[0]})).join('<br>')}
  <p>ความยากการบิน: <b>${fd}</b>${has('Stealth')?' (Stealth skin -3 แล้ว)':''}</p>
  ${btn('fly','ออกบิน!','pr')}${btn('p3back','ยกเลิก','sm')}</div>`}
function flightDif(){const f=S.fl;let d=f.dif+(f.opt.risky?1:0)+(f.opt.danger?2:0)+(f.opt.smuggle?2:0)-(f.opt.pay?1:0);if(has('Stealth'))d-=3;return Math.max(1,d)}
function startFlight(){const f=S.fl;if(f.opt.pay){S.credits-=5}f.mods=(f.opt.risky?2:0)+(f.opt.danger?3:0)+(f.opt.safe?2:0)+2*shipSys('Long range').length+2*shipSys('Drone').length;
  if(f.opt.safe||has('Nano skin')){log('บินอย่างปลอดภัย ไม่เจอการต่อสู้','ok');f.noLand=!!f.opt.safe;return genLoc()}
  const fd=flightDif(),r=d6();log('พยายามหลบการต่อสู้: d6='+r+' ต้อง ≥'+fd,'k');
  if(r!==1&&r>=fd){log('หลบสำเร็จ!','ok');return genLoc()}
  let no=Math.min(19,Math.max(3,fd*2+Math.ceil(d6()/2)));const F=FLIGHT[no];
  const sh=shipSh();S.sp={no,name:F.name,tl:F.tl,t:0,ob:F.ob.slice(),en:F.en.map(e=>Object.assign({},e,{csh:e.sh,hp:e.sp})),sp:shipSP(),sh:sh.c,esc:0,used:{},ammo:shipWeapons().map(w=>parseShipW(w.n).am)};
  S.step='space';log('การต่อสู้ในอวกาศ #'+no+' '+F.name+'!','x');
}
function vSpace(){const s=S.sp;const tlc=s.tl[s.t]||'.';const TL={A:'ศัตรูโจมตีทันที',B:'กำลังเสริมมาแทนยานที่ถูกทำลาย',C:'ศัตรูพยายามบุกขึ้นยาน',E:'ศัตรูหลบหลีก (ยิงยากขึ้น 1)',G:'ถ้าเทิร์นนี้ไม่ชนะ = ยานระเบิด!',I:'ศัตรูไม่ยิง',S:'โล่ศัตรูล่ม',T:'หมดเวลา ต้องถอยตอนจบเทิร์น',V:'ศัตรูถอย คุณชนะ','.':'-'};
  let h=`<h2>🚀 ${esc(s.name)} · รอบ ${s.t+1}</h2><div class="c">ยาน SP <b>${s.sp}</b>/${shipSP()} · โล่ ${s.sh}/${shipSh().c} · ไทม์ไลน์: <b>${esc(TL[tlc])}</b>
  ${s.ob.length?`<h3>เป้าหมายที่ต้องทำ (ตามลำดับ)</h3>${s.ob.map((o,i)=>`<span class="tag">${o}</span>`).join('')}<div class="row">${btn('spob','ลองทำเป้าหมาย '+s.ob[0]+' ด้วยลูกเรือที่ว่าง','sm')}</div>`:''}
  <h3>ศัตรู</h3>${s.en.map((e,i)=>`<div class="en">${esc(e.n)} ${e.hp>0?`SP ${e.hp}/${e.sp} · โล่ ${e.csh}/${e.sh} · ดาเมจ ${e.dmg}${e.cr?' · ลูกเรือ '+e.cr:''}`:'💥 ถูกทำลาย'}</div>`).join('')}
  <h3>อาวุธยาน (ยิงได้สูงสุด 4)</h3>${shipWeapons().slice(0,4).map((w,i)=>`<span class="tag">${esc(w.n)}${s.ammo[i]?' A'+s.ammo[i]:''}</span>`).join('')||'<span class="dim">ไม่มีอาวุธ!</span>'}
  <div class="row" style="margin-top:8px">${btn('spround','ยิง! (รันรอบนี้)','pr')}${btn('spesc','พยายามหนี (d20+Tech)','sm')}</div></div>`;
  return h+viewLog(14);
}
function spaceRound(escape){const s=S.sp;const tl=s.tl[s.t]||'.';s.t++;const crew=S.crew.filter(awake);let used=0;
  if(tl==='B')s.en.forEach(e=>{if(e.hp<=0){e.hp=e.sp;e.csh=e.sh}});
  const enemyFire=()=>{s.en.filter(e=>e.hp>0).forEach(e=>{const r=d6();if(r<4){log(e.n+' ยิงพลาด');return}
    if(has('Maneuver')&&!s.evaded&&crew.length){const t=crew.slice(0,2).reduce((a,c)=>a+c.at.tec,0);const ev=Math.floor(t/2+.5)+d6();s.evaded=1;if(ev>=8){log('หลบกระสุนสำเร็จ!','ok');return}}
    let dm=e.dmg+(r===6?3:0);if(e.emp){s.sh=Math.max(0,s.sh-dm);log(e.n+' ยิง EMP โล่ -'+dm);return}const ab=Math.min(s.sh,dm);s.sh-=ab;dm-=ab;dm=Math.max(0,dm-shipArmor());s.sp-=dm;log(e.n+' ยิงโดน! ดาเมจยาน '+dm+(r===6?' (คริติคอล)':''),dm?'x':'')})};
  // objectives
  if(tl==='A')enemyFire();
  if(escape){const tec=crew.reduce((a,c)=>a+c.at.tec,0);const r=d20()+tec;const need=s.esc?15:20;s.esc=1;log('หนี: d20+Tech='+r+' ต้อง '+need+'+','k');if(r>=need){log('หนีรอด! (ลงจอดได้เทิร์นหน้า)','ok');S.fl.noLand=1;S.fl.mods=0;S.sp=null;return genLoc()}}
  else{const tgt=s.en.find(e=>e.hp>0);shipWeapons().slice(0,4).forEach((sw,i)=>{const w=parseShipW(sw.n);if(w.am&&s.ammo[i]<=0)return;const t=has('Target')?s.en.find(e=>e.hp>0):tgt;if(!t)return;
      let oc=w.oc&&(s.ammo[i]||0)>=3;if(w.am)s.ammo[i]-=oc?3:1;let need=(has('Combat bridge')?3:4)+(tl==='E'?1:0);let r=d6();if(r<need&&crew.length){r=d6()}
      if(r<need){log(w.n+' ยิงพลาด');return}let dm=w.dmg*(oc?2:1);const shOn=tl!=='S'&&t.csh>0;
      if(w.emp){t.csh=Math.max(0,t.csh-dm);log(w.n+' EMP โล่ศัตรู -'+dm);return}
      if(w.he){if(shOn){log(w.n+' HE ไม่ทะลุโล่');return}if(r===6)dm*=2;t.hp-=dm}else{if(shOn){const a=Math.min(t.csh,dm);t.csh-=a;dm-=a}t.hp-=dm}
      log(w.n+' โดน '+t.n+' ดาเมจ '+dm+(t.hp<=0?' 💥ทำลาย!':''),t.hp<=0?'ok':'')})}
  // objectives auto-attempt
  if(s.pendingOb){s.pendingOb=0}
  if(tl!=='I')enemyFire();s.evaded=0;
  const win=(s.ob.length===0&&s.en.every(e=>e.hp<=0))||tl==='V'||(s.obDone&&s.ob.length===0&&FLIGHT[s.no].ob.length);
  if(s.sp<=0)return gameOver('ยานถูกทำลายในอวกาศ');
  if(win){const x=FLIGHT[s.no].xp;S.xp+=x;S.credits+=x+(S.fl.opt.smuggle?15:0);log('ชนะการต่อสู้ในอวกาศ! +'+x+' XP +'+x+'¢','ok');S.sp=null;return genLoc()}
  if(tl==='G')return gameOver('ไม่อาจเอาชนะได้ทันเวลา ยานระเบิด');
  if(tl==='T'){log('หมดเวลา ต้องถอย (ลงจอดได้เทิร์นหน้า)','x');S.fl.noLand=1;S.fl.mods=0;S.sp=null;return genLoc()}
  const shr=shipSh().r;s.sh=Math.min(shipSh().c,s.sh+shr);s.en.forEach(e=>{if(e.hp>0)e.csh=Math.min(e.sh,e.csh+e.rc)});
}
function spaceObjective(){const s=S.sp;if(!s.ob.length)return;const o=s.ob[0];const need=+o.replace(/\D/g,'');const t=o[0];
  const at=c=>t==='T'?c.at.tec:t==='C'?c.at.cha:t==='A'?Math.max(c.at.mel,c.at.ran):Math.max(c.at.tec,c.at.cha,c.at.mel,c.at.ran);
  const cs=S.crew.filter(awake).sort((a,b)=>at(b)-at(a));let sum=0,used=[];for(const c of cs){sum+=at(c);used.push(c.name);if(sum+3.5>=need)break}
  const r=d6();const ok=r!==1&&sum+r>=need;log('เป้าหมาย '+o+': '+used.join('+')+' '+sum+'+d6('+r+')='+(sum+r)+(ok?' สำเร็จ':' ล้มเหลว'),ok?'ok':'x');
  if(ok){s.ob.shift();if(!s.ob.length){s.obDone=1;const x=FLIGHT[s.no].xp;S.xp+=x;S.credits+=x;log('ทำเป้าหมายครบ! +'+x+' XP/¢','ok');S.sp=null;genLoc();return}}
  spaceRound(false);
}
// ================= LOCATION GEN =================
function genLoc(){const f=S.fl||{dif:2,mods:0};const ty=d6(),sp=d6(),ao=d6(),ai=d6(),dp=d6(),te=d6(),spc=d6();
  S.lg={dif:f.dif,mods:f.mods||0,noLand:!!f.noLand,r:{type:ty,ao:ao,ai:ai,depth:dp,tele:te,special:spc,species:sp}};S.step='locgen';log('ค้นพบสถานที่ใหม่!','ok')}
function locFrom(r,dif){const t=TYPES[r.type-1];let ao=r.ao<=2?'YES':r.ao<=4?'NO':'HELL';const ai=r.ai<=2?'YES':r.ai<=5?'NO':'HELL';
  if((t==='Space Station'||t==='In Space')&&ao==='YES')ao='NO';const depth=3+r.depth;
  return{type:t,dif:dif,ao,ai,depth,tele:Math.ceil(r.tele/2),special:r.special<=4?'-':r.special===5?'One-way':'Self-destruct',species:SPECIES[r.species-1],maps:Array.from({length:depth},()=>d20()),cleared:[]}}
function vLocGen(){const g=S.lg;const L=locFrom(g.r,g.dif);const names={type:'ประเภท',ao:'บรรยากาศนอก',ai:'บรรยากาศใน',depth:'ความลึก',tele:'ระยะเทเลพอร์ต',special:'พิเศษ',species:'เผ่าศัตรู'};
  const val={type:L.type,ao:L.ao,ai:L.ai,depth:L.depth+' แผนที่',tele:L.tele,special:L.special,species:L.species};
  return `<h2>สถานที่ใหม่ (ความยาก ${g.dif})</h2><div class="c"><p class="dim">ปรับเต๋าได้อีก ${g.mods} ครั้ง (ทอยใหม่ / +1 / -1)</p><table>${Object.keys(names).map(k=>`<tr><td>${names[k]}</td><td><b>${esc(val[k])}</b> <span class="dim">(🎲${g.r[k]})</span></td><td>${g.mods?btn('lgm','↻','sm',{k:k,m:'r'})+btn('lgm','-1','sm',{k:k,m:-1})+btn('lgm','+1','sm',{k:k,m:1}):''}</td></tr>`).join('')}</table>
  ${btn('lgsave','บันทึกสถานที่'+(g.noLand?' (ลงจอดเทิร์นหน้า)':' และลงจอดเลย'),'pr')}</div>`}
// ================= DUNGEON =================
function mapGrid(L,no){const id=L.maps[no-1];return (MAPS[L.type]||{})[id]}
function cellInfo(g,r,c){if(r<0||c<0||r>11||c>11)return null;const s=g[r][c];const[bg,lab]=s.split('|');let red=false,l=lab||'';if(l.endsWith('*')){red=true;l=l.slice(0,-1)}return{bg:bg[0],lab:l,red}}
function walk(ci){return ci&&ci.bg!=='.'&&ci.bg!=='#'}
function feature(ci){if(!ci||!ci.lab)return null;const l=ci.lab.replace(/O/g,'0').replace(/^0(?=\d)/,'O');let m;
  if(l==='>'||l==='<')return{t:'in'};if(/^EX$/.test(ci.lab)||/^E[X]/.test(ci.lab))return{t:'ex'};if(l==='/')return{t:'out'};
  if(m=ci.lab.match(/^E(\d|\?)?$/)){return{t:'en',n:m[1]==='?'?'?':+(m[1]||0)}}
  if(m=ci.lab.match(/^B(\d|\?)?$/)){if(ci.red)return{t:'boss',n:m[1]==='?'?'?':+(m[1]||0)};return{t:'bh',n:m[1]==='?'?'?':+(m[1]||0)}}
  if(/^SB/.test(ci.lab))return{t:'sb'};if(m=ci.lab.match(/^S(\d|\?)?$/))return{t:'shop',n:m[1]==='?'?'?':+(m[1]||0)};
  if(m=ci.lab.match(/^T(\d|\?)?$/))return{t:'tr',n:m[1]==='?'?'?':+(m[1]||0)};if(m=ci.lab.match(/^M(\d|\?)?$/))return ci.bg==='G'&&!ci.red?{t:'mod'}:{t:'mine',n:m[1]==='?'?'?':+(m[1]||0)};
  if(m=ci.lab.match(/^L(\d|\?)?$/))return{t:'laser',n:m[1]==='?'?'?':+(m[1]||0)};if(/^LT/.test(ci.lab))return{t:'lt'};
  if(/^A\d?/.test(ci.lab))return{t:'ammo',n:+(ci.lab[1]||0)};if(ci.lab==='Q')return{t:'quest'};if(ci.lab==='G')return{t:'gam'};if(ci.lab==='C')return{t:'clone'};
  if(ci.lab==='+')return{t:'med'};if(/^O2|^02|^0$/.test(ci.lab))return{t:'o2'};if(ci.lab==='D')return{t:'door'};if(ci.lab==='H')return{t:'hull'};if(ci.lab==='V')return{t:'ev'};
  if(ci.lab==='X')return{t:'obs'};if(/^[1-6]$/.test(ci.lab))return{t:'port',n:+ci.lab};return{t:'?'}}
function rq(n,D){if(n==='?'){const k='q'+D.no;if(D.q==null)D.q={};if(D.q[k]==null)D.q[k]=Math.ceil(d6()/2);return D.q[k]}return n||0}
function isOutside(D,r,c,ci){return ci.bg==='p'||r===0||c===0||r===11||c===11}
function atmCost(D,r,c){const L=S.locs[D.loc];const g=mapGrid(L,D.no);const ci=cellInfo(g,r,c);const a=isOutside(D,r,c,ci)?L.ao:L.ai;return a==='YES'?0:a==='NO'?1:2}
function enterMap(li,no,fromBack){const L=S.locs[li];const g=mapGrid(L,no);if(!g){log('ไม่พบข้อมูลแผนที่','x');return}
  let pos=null;for(let r=0;r<12&&!pos;r++)for(let c=0;c<12;c++){const f=feature(cellInfo(g,r,c));if(f&&f.t===(fromBack?'ex':'in')){pos=[r,c];break}}
  if(!pos)for(let r=0;r<12&&!pos;r++)for(let c=0;c<12;c++)if(walk(cellInfo(g,r,c))){pos=[r,c];break}
  S.dun={loc:li,no:no,r:pos[0],c:pos[1],done:{},bh:{},q:{},med:0,dif:L.dif,back:!!fromBack};S.step='dun';log('เข้าสู่แผนที่ '+no+'/'+L.depth+' ('+L.type+' #'+L.maps[no-1]+')','k')}
function vDungeon(){const D=S.dun,L=S.locs[D.loc],g=mapGrid(L,D.no);const cleared=L.cleared.includes(D.no);
  let h=`<h2>${esc(L.type)} · แผนที่ ${D.no}/${L.depth}${cleared?' (เคลียร์แล้ว)':''}</h2><p class="dim">นอก: ${L.ao} · ใน: ${L.ai} · ศัตรู: ${L.species} · ความยาก ${L.dif}${L.special!=='-'?' · '+L.special:''}</p><div class="grid">`;
  for(let r=0;r<12;r++)for(let c=0;c<12;c++){const ci=cellInfo(g,r,c);const adj=Math.abs(r-D.r)+Math.abs(c-D.c)===1&&walk(ci);
    const cls=ci.bg==='.'?'e':ci.bg==='#'?'w':ci.bg==='b'?'bl':ci.bg;const me=r===D.r&&c===D.c;const done=D.done[r+'_'+c];
    h+=`<button class="cl ${cls} ${ci.red?'red':''} ${me?'me':''} ${adj?'adj':''} ${done?'done':''}" ${adj?`data-a="mv" data-r="${r}" data-c="${c}"`:''}>${me?'🧑‍🚀':esc(ci.lab)}</button>`}
  h+=`</div><div class="row" style="margin-top:8px">${btn('dunact','ใช้ช่องนี้อีกครั้ง','sm')}${has('Teleporter')&&D.no<=L.tele&&!D.disr?btn('tele','เทเลพอร์ตกลับยาน','sm'):''}${btn('showmap','ดูแผนที่ต้นฉบับ','sm')}</div>
  ${ui.showmap?`<img class="mp" ${imgAttr('maps/'+TYPES.indexOf(L.type)+'_'+L.maps[D.no-1]+'.jpg')} alt="">`:''}
  <p class="dim">แตะช่องที่ขอบฟ้าเพื่อเดิน · ทุกการกระทำใช้ O₂ ตามบรรยากาศ</p>${teamStrip()}`;
  return h+viewLog(10);}
function teamStrip(){return S.crew.filter(c=>!c.dead).map(c=>`<span class="tag">${esc(c.name)} ${Math.max(0,c.hp)}/${c.max}${c.hp<=0?' 💤':''}</span>`).join('')}
function spendO2(n){if(!n)return true;if(S.o2>=n){S.o2-=n;return true}S.o2=0;const c=S.crew.find(awake);if(c){c.hp=0;log('ออกซิเจนหมด! '+c.name+' หมดสติ','x')}if(!S.crew.some(awake)){gameOverOrShip('ทีมทั้งหมดขาดอากาศ');return false}return true}
function gameOverOrShip(m){log(m,'x');S.crew.forEach(c=>{if(c.hp<=0&&!c.dead){c.dead=1}});if(!S.crew.some(c=>!c.dead))return gameOver(m);leaveLoc(false)}
function move(r,c){const D=S.dun,L=S.locs[D.loc],g=mapGrid(L,D.no);const ci=cellInfo(g,r,c);const f=feature(ci);
  if(!spendO2(atmCost(D,r,c)))return;
  if(f&&f.t==='bh'&&!D.bh[r+'_'+c+'ok']){const tries=D.bh[r+'_'+c]||0;if(tries>=3){log('ประตูกันลมล็อกแล้ว','x');return}
    const tc=S.crew.filter(awake).sort((a,b)=>b.at.tec-a.at.tec)[0];const bonus=bestItemBonus(/Bulkhead opening/);const need=10+rq(f.n,D);const roll=d6()+d6()+tc.at.tec+bonus;D.bh[r+'_'+c]=tries+1;
    log('เปิด Bulkhead: '+tc.name+' 2d6+Tech'+(bonus?'+'+bonus:'')+' = '+roll+' ต้อง '+need+'+',roll>=need?'ok':'x');if(roll<need)return;D.bh[r+'_'+c+'ok']=1}
  if(f&&f.t==='sb'&&bossAlive()){log('Safety Bulkhead เปิดไม่ได้จนกว่าบอสจะตาย','x');return}
  D.r=r;D.c=c;trigger(r,c,true)}
function bestItemBonus(re){let b=0;S.crew.forEach(c=>Object.values(c.inv).forEach(i=>{if(i&&re.test(i.e||'')){const m=i.e.match(/\+(\d)/);if(m)b=Math.max(b,+m[1])}}));return b}
function bossAlive(){const D=S.dun,g=mapGrid(S.locs[D.loc],D.no);for(let r=0;r<12;r++)for(let c=0;c<12;c++){const f=feature(cellInfo(g,r,c));if(f&&f.t==='boss'&&!D.done[r+'_'+c])return true}return false}
function areaCells(g,r,c){const ci=cellInfo(g,r,c);if(!ci||(ci.bg!=='g'&&ci.bg!=='p'))return[[r,c]];const out=[],seen={},st=[[r,c]];
  while(st.length){const[a,b]=st.pop();const k=a+'_'+b;if(seen[k])continue;seen[k]=1;const x=cellInfo(g,a,b);if(!x||x.bg!==ci.bg)continue;const f=feature(x);if(f&&!['en','boss','mine','hull','tr'].includes(f.t)&&!(a===r&&b===c))continue;out.push([a,b]);[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>st.push([a+d[0],b+d[1]]))}return out}
function trigger(r,c,entering){const D=S.dun,L=S.locs[D.loc],g=mapGrid(L,D.no),cl=L.cleared.includes(D.no);
  const cells=areaCells(g,r,c);const feats=[];cells.forEach(([a,b])=>{const ci=cellInfo(g,a,b);const f=feature(ci);if(f&&(a===r&&b===c||ci.red||f.t==='tr'))feats.push([a,b,f])});
  feats.sort((x,y)=>(x[2].t==='mine'?0:1)-(y[2].t==='mine'?0:1));
  for(const[a,b,f] of feats){const k=a+'_'+b;const here=a===r&&b===c;
    if(['en','boss','tr'].includes(f.t)&&(D.done[k]||cl))continue;if(['mine'].includes(f.t)&&D.done[k])continue;
    switch(f.t){
      case 'mine':{D.done[k]=1;const dmg=L.dif+rq(f.n,D);S.crew.filter(awake).forEach(cm=>{const x=d6()+cm.at.agi;if(x>=8)log(cm.name+' หลบระเบิดได้ ('+x+')','ok');else{hurt(cm,dmg,true);log('💥 กับระเบิด! '+cm.name+' -'+dmg+' HP','x')}});break}
      case 'laser':{const dmg=L.dif+rq(f.n,D);S.crew.filter(awake).forEach(cm=>{hurt(cm,dmg,true)});log('⚡ แนวเลเซอร์ ทุกคน -'+dmg+' HP (หักเกราะ)','x');break}
      case 'tr':if(here||entering){D.done[k]=1;S.pendingLoot=(S.pendingLoot||[]).concat([{g:Math.min(6,L.dif+rq(f.n,D))}]);log('✨ พบสมบัติเกรด '+Math.min(6,L.dif+rq(f.n,D)),'ok')}break;
      case 'en':case 'boss':D.done[k]=1;D.lastCell=k;startCombat(L.dif+rq(f.n,D),L.species,f.t==='boss',false,true);return;
      case 'shop':if(here)openShop(rq(f.n,D)+L.dif,true);return;
      case 'ammo':if(here){openShop(rq(f.n,D)+L.dif+1,true);ui.shopTab='AMMO'}return;
      case 'mod':if(here)log('Modder: เพิ่มดาเมจ +1 ให้อาวุธได้ในแท็บลูกเรือ (จ่ายราคาเกรด)','k');ui.modder=1;break;
      case 'gam':if(here)log('Gambler: แลกของได้ในแท็บลูกเรือ','k');ui.gambler=1;break;
      case 'clone':if(here&&!D.clone){D.clone=1;S.crew.forEach(cm=>{if(!cm.dead)heal(cm,4)});log('Clone station: ทุกคน +4 HP','ok')}break;
      case 'med':if(here&&D.med<3){const cm=S.crew.filter(x=>!x.dead).sort((a,b)=>(a.hp-a.max)-(b.hp-b.max))[0];D.med++;heal(cm,4);log('Med-station: '+cm.name+' +4 HP','ok')}break;
      case 'o2':if(here&&!D.o2){D.o2=1;S.o2=o2Max();log('เติมออกซิเจนเต็ม','ok')}break;
      case 'quest':if(here)log('Quest Master: ระบบเควสจะมาในอัปเดตถัดไป','k');break;
      case 'lt':if(here&&!D.done[k]){D.done[k]=1;const slot=S.lines.findIndex(x=>!x);if(slot>=0){const co='1A'+String.fromCharCode(64+d20());S.lines[slot]={pos:co,vars:{},ended:false};log('เส้นเรื่องใหม่เริ่มที่ '+co,'k');runLine(slot);if(S.step==='event'){S.ev.fromDun=1;return}}}break;
      case 'hull':if(here)log('รอยรั่วตัวถัง (ปิดได้ด้วย Welding torch)','k');break;
      case 'port':if(here){let t=null;for(let x=0;x<12;x++)for(let y=0;y<12;y++){const q=feature(cellInfo(g,x,y));if(q&&q.t==='port'&&q.n===f.n&&!(x===r&&y===c))t=[x,y]}if(!t){const n=d6();for(let x=0;x<12;x++)for(let y=0;y<12;y++){const q=feature(cellInfo(g,x,y));if(q&&q.t==='port'&&q.n===n)t=[x,y]}}if(t){D.r=t[0];D.c=t[1];log('เทเลพอร์ต!','k')}}break;
      case 'ex':if(here)return nextMap();break;
      case 'out':if(here)return leaveLoc(false);break;
      case 'in':if(here&&!entering)break;if(here&&D.no===1&&entering&&D.moved)return leaveLoc(false);if(here&&D.no>1&&D.moved){L.cleared.includes(D.no)||L.cleared.push(D.no);D.goneBack=1;enterMap(D.loc,D.no-1,true);S.dun.goneBack=1;return}break;
      case 'ev':if(here)log('ช่องเหตุการณ์ (V): เป้าหมายของเควส/เนื้อเรื่อง','k');break;
    }}
  D.moved=1;if(S.pendingLoot&&S.pendingLoot.length&&S.step==='dun')startLoot();
  if(!S.crew.some(awake))gameOverOrShip('ทีมสำรวจหมดสติทั้งหมด');
}
function nextMap(){const D=S.dun,L=S.locs[D.loc];if(!L.cleared.includes(D.no))L.cleared.push(D.no);
  if(D.goneBack){log('ย้อนกลับมาแล้ว ไปต่อข้างหน้าไม่ได้ในการสำรวจนี้','x');return}
  if(D.no>=L.depth){L.solved=1;const x=L.depth*L.dif*2;S.xp+=x;log('🏆 พิชิตสถานที่! +'+x+' XP และสมบัติ 4 ชิ้น','ok');S.pendingLoot=[1,2,3,4].map(()=>({g:Math.min(6,L.dif+1)}));S.afterLoot='leave';if(L.special==='Self-destruct')L.gone=1;return startLoot()}
  enterMap(D.loc,D.no+1)}
function leaveLoc(tele){const D=S.dun;if(D){const L=S.locs[D.loc];if(!L.cleared.includes(D.no))L.cleared.push(D.no);if(L.special==='Self-destruct'||L.gone)S.locs.splice(D.loc,1)}
  S.dun=null;S.step='p3';S.crew.forEach(c=>Object.values(c.inv).forEach(i=>{if(i)i.jam=0}));log('กลับขึ้นยาน','ok');recover()}
// ================= COMBAT =================
function pickEnemy(sp,lv){lv=Math.max(1,Math.min(6,lv));const pool=ENEMIES.filter(e=>e.sp===SPMAP[sp]&&e.lv===lv);return pool.length?clone(pool[R(pool.length)-1]):clone(ENEMIES.find(e=>e.lv===lv)||ENEMIES[0])}
function mkEnemy(e,lv,minion){const bonus=lv>6?lv-6:0;const x={base:e.name,id:'e'+Math.random().toString(36).slice(2,6),n:e.name+(minion?' (ลูกสมุน)':''),sp:e.sp,lv:e.lv,ag:+e.ag||1,ar:+e.ar||0,es:+e.es||0,shT:e.shT==='-'?'':e.shT,sh:e.sh||0,csh:e.sh||0,wk:(e.wk||'-').split(/,\s*/),rs:(e.rs||'-').split(/,\s*/),
  xp:+e.xp||1,tr:parseInt(e.tr)||0,act:e.act,tr2:e.sp2||'',hp:e.hp||5,max:e.hp||5,minion:minion,bonus:bonus};return x}
function tv(e,name){const m=(e.tr2||'').match(new RegExp(name+'\\s*(\\d+)?','i'));return m?(m[1]?+m[1]:1):0}
function startCombat(lv,sp,boss,amb,fromDun){const mapNo=S.dun?S.dun.no:1;let prim=pickEnemy(sp,lv);if(boss&&lv>=6&&d6()===6){const h=ENEMIES.filter(e=>e.sp==='Hell');prim=clone(h[R(h.length)-1])}
  const en=[mkEnemy(prim,lv,false)];const C={en,round:1,boss,amb,xp:0,log:[],acted:{},cover:{},primCount:1,fromDun,lv,escTries:0};
  if(d6()<mapNo){en.push(mkEnemy(pickEnemy(SPECIES[d6()-1],lv),lv,false));C.primCount=2}
  if(lv>1){const n=d6()+mapNo;let mc=n>=11?2:n>=6?1:0;if(boss&&mc<1)mc=1;for(let i=0;i<mc;i++)en.push(mkEnemy(pickEnemy(SPECIES[d6()-1],lv-1),lv-1,true))}
  S.cmb=C;S.step='cmb';
  const react=amb?0:d6();if(react>=4)C.react=1;
  const low=S.crew.filter(awake).reduce((a,c)=>Math.min(a,c.at.agi),99),elow=en.reduce((a,e)=>Math.min(a,e.ag),99);
  const lone=S.crew.filter(awake).length===1;const pi=low+d6()+bestItemBonus(/initiative/),ei=elow+d6();
  C.first=amb?'enemy':(lone||pi>=ei)?'crew':'enemy';
  log((boss?'👹 บอส! ':'⚔️ ต่อสู้! ')+en.map(e=>e.n+' LV'+lv).join(', ')+(amb?' (ถูกซุ่มโจมตี)':'')+' · ฝ่ายที่เริ่มก่อน: '+(C.first==='crew'?'ทีมเรา':'ศัตรู'),'x');
  if(C.react)log('ตอบสนองทัน! ได้โจมตีโบนัส 1 ครั้ง (กดโจมตีได้เลย)','ok');
  if(C.first==='enemy')enemyTurn();
}
function vCombat(){const C=S.cmb;let h=`<h2>${C.boss?'👹 ต่อสู้บอส':'⚔️ ต่อสู้'} · รอบ ${C.round}</h2>`;
  C.en.forEach((e,i)=>{if(e.gone)return;h+=`<div class="en">${pic('en',e.base,60)}<div class="row"><b>${esc(e.n)}</b><span class="tag">${esc(e.sp)} LV${e.lv}</span>${e.hp<=0?'<span class="tag">💀</span>':''}</div>
  <div class="bar"><i style="width:${Math.max(0,100*e.hp/e.max)}%;background:var(--r)"></i></div>
  <div class="dim">HP ${e.hp}/${e.max}${e.shT?' · โล่ '+e.shT+' '+e.csh:''}${e.ar?' · เกราะ '+e.ar:''} · AGI ${e.ag} · อ่อน: ${e.wk.join(',')} · ต้าน: ${e.rs.join(',')}${e.tr2?' · '+esc(e.tr2):''}</div><div style="clear:both"></div></div>`});
  if(C.dunLv===undefined&&!C.over){h+=`<h3>ทีมของคุณ</h3>`;S.crew.filter(c=>!c.dead).forEach(c=>{const acted=C.acted[c.id];const wpn=['L','R'].map(s=>c.inv[s]).filter(i=>i&&i.k==='W');
    h+=`<div class="crew">${pic('crew',c.name,40)}<div class="row"><b>${esc(c.name)}</b> HP ${Math.max(0,c.hp)}/${c.max}${C.cover[c.id]?' 🛡️':''}${acted?' <span class="tag">ทำแล้ว</span>':''}</div><div class="bar"><i style="width:${Math.max(0,100*c.hp/c.max)}%"></i></div>`;
    if(awake(c)&&!acted){h+=`<div class="row">${(wpn.length?wpn:[{n:'หมัด',fist:1}]).map((w,wi)=>C.en.filter(e=>e.hp>0&&!e.gone).map((e,ei)=>btn('atk',(w.jam?'🔧แก้ติดขัด ':'🗡️ ')+esc(w.n)+(w.am?' ('+w.a+')':'')+' → '+esc(e.n.split(' ')[0]),'sm',{c:c.id,w:w.fist?'fist':(c.inv.L===w?'L':'R'),e:e.id})).join('')).join('')}
      ${btn('cover','หลบกำบัง','sm',{c:c.id})}${S.crew.filter(awake).length>1&&!C.flanked?btn('flank','โอบล้อม (+3)','sm',{c:c.id}):''}${healItems(c)}</div>`}
    h+='<div style="clear:both"></div></div>'})}
  h+=`<div class="row">${btn('endround','จบเทิร์นทีม → ศัตรูเล่น','pr')}${!C.boss?btn('cesc','หนี!','sm dg'):''}</div>`;
  if(C.fromDun&&C.round===1&&!C.boss&&!C.triedAvoid)h+=`<div class="c"><h3>หลีกเลี่ยงการต่อสู้</h3>${btn('avoid','วิ่ง (AGI)','sm',{m:'run'})}${btn('avoid','พรางตัว (Tech)','sm',{m:'cam'})}${btn('avoid','เจรจา (CHA)','sm',{m:'cha'})}${btn('avoid','ข่มขวัญ','sm',{m:'int'})}</div>`;
  return h+viewLog(14)}
function healItems(c){const its=Object.entries(c.inv).filter(([s,i])=>i&&i.heal&&i.uses!==0);return its.map(([s,i])=>btn('useitem','💊 '+esc(i.n),'sm',{c:c.id,s:s})).join('')}
function boost(c,w){const pts=Math.floor((w.ty==='ML'?c.at.mel:c.at.ran)/2);let hit=w.hit,dmg=0,p=pts;while(p>0&&hit>3){hit--;p--}dmg=p;return{hit:Math.max(2,hit),dmg}}
function mult(e,f){let wk=0,rs=0;f.forEach(t=>{if(e.wk.includes(t))wk++;if(e.rs.includes(t))rs++});const n=wk-rs;return n>=2?3:n===1?2:n===0?1:n===-1?0.5:0}
function attack(c,slot,eid){const C=S.cmb;const e=C.en.find(x=>x.id===eid);let w=slot==='fist'?{n:'หมัด',ty:'ML',hit:4,dmg:1,cnt:1,f:[],am:0}:c.inv[slot];
  if(w.jam){const r=d6()+bestItemBonus(/unjam/);const need=w.jam>1?6:8;if(r>=need){w.jam=0;log(c.name+' แก้อาวุธติดขัดสำเร็จ','ok')}else{w.jam++;log(c.name+' แก้ไม่สำเร็จ ('+r+')','x');if(w.jam>3){delete c.inv[slot];log(w.n+' พังแล้ว!','x')}}C.acted[c.id]=1;return}
  if(w.am&&w.a<=0){log(w.n+' กระสุนหมด!','x');return}if(w.str&&c.at.str<w.str)log(c.name+' แรงไม่พอใช้ '+w.n+' (เล่นต่อได้แต่ควรเปลี่ยน)','x');
  const b=boost(c,w);let flank=C.flanking===c.id?3:0;C.flanking=null;const smoke=w.ty==='RG'?Math.max(0,...C.en.filter(x=>x.hp>0).map(x=>tv(x,'Smoke'))):0;const parry=w.ty==='ML'&&!c.traits.includes('Blind fighting')?tv(e,'Parry'):0;
  const tank=C.en.find(x=>x.hp>0&&/Tank/.test(x.tr2));const targets=w.f.includes('EX')?C.en.filter(x=>x.hp>0&&!x.gone):[(w.ty==='RG'&&tank)?tank:e];
  let jammed=false,fired=false;const over=Object.keys(c.inv).length>slots(c).length?1:0;
  for(let k=0;k<w.cnt&&!jammed;k++){for(const t of targets){const r=d6();if(r===1&&(k===0&&t===targets[0])){jammed=true;if(slot!=='fist')w.jam=1;log(c.name+' ทอย 1 — '+w.n+' ติดขัด!','x');break}fired=true;
      const need=b.hit+smoke+parry+over;if(r<need){log(c.name+' พลาด ('+r+' ต้อง '+need+'+)');continue}
      if(/Evade/.test(t.tr2)&&!t.evaded){t.evaded=1;if(d6()<5){log(t.n+' หลบได้!');continue}}
      let dm=w.dmg+(k===0?b.dmg+flank:0)+(r===6?1:0);dealEnemy(t,dm,w,c)}}
  if(fired&&w.am)w.a--;if(w.f.includes('T2'))w.jam=w.jam||0;C.acted[c.id]=1;if(w.ty==='ML')C.melee=Object.assign(C.melee||{},{[c.id]:1});else C.ranged=Object.assign(C.ranged||{},{[c.id]:1});checkEnd()}
function dealEnemy(t,dm,w,c){if(w.f.includes('EMP')){t.csh=Math.max(0,t.csh-dm);log(w.n+' EMP โล่ '+t.n+' -'+dm);return}
  if(t.csh>0&&!w.f.includes('IS')&&(t.shT==='B'||w.ty==='RG')){const a=Math.min(t.csh,dm);t.csh-=a;dm-=a}
  let ar=w.f.includes('IA')?0:w.f.includes('AP')?Math.floor(t.ar/2):t.ar;ar+=Math.max(0,...C_guard(t));dm=Math.max(0,dm-ar);
  dm=Math.floor(dm*mult(t,w.f.concat([w.ty==='ML'?'Melee':'Ranged'])));const tough=tv(t,'Tough');if(tough)dm=Math.min(dm,tough);
  if(/Ethereal/.test(t.tr2))dm=0;t.hp-=dm;const z=tv(t,'Zombie');if(z&&t.hp<0&&t.hp>-z)t.hp=0;
  if(w.weaken&&dm>0)t.ar=Math.max(0,t.ar-w.weaken);
  log((c?c.name+' ':'')+'โจมตี '+t.n+' ดาเมจ '+dm+(t.hp<=0?' 💀':''),t.hp<=0?'ok':'');
  if(t.hp<=0&&w.ty==='ML'&&c){const ex=tv(t,'Explosive');if(ex){hurt(c,ex);log('มันระเบิดใส่ '+c.name+' -'+ex,'x')}}
  if(w.ty==='ML'&&c){const bu=tv(t,'Burning');if(bu){c.hp-=bu;log(c.name+' โดนไฟลวก -'+bu,'x')}}}
function C_guard(t){return S.cmb.en.filter(x=>x!==t&&x.hp>0).map(x=>tv(x,'Guard'))}
function hurt(c,dm,noShield,type){if(!noShield&&c.csh>0){const a=Math.min(c.csh,dm);c.csh-=a;dm-=a}dm=Math.max(0,Math.round((dm-armorOf(c)-(S.cmb&&S.cmb.cover[c.id]?1:0))*2)/2);dm=Math.ceil(dm);c.hp-=dm;if(c.hp<=-4&&!c.dead){c.dead=1;log('☠️ '+c.name+' เสียชีวิต','x')}else if(c.hp<=0)log(c.name+' หมดสติ','x');return dm}
function heal(c,n){if(c.dead)return;const L=S.dun&&S.locs[S.dun.loc];if(L&&L.ao==='HELL')n=Math.ceil(n/2);if(c.hp<=0)c.hp=0;c.hp=Math.min(c.max,c.hp+n+(c.traits.includes('Medic')?0:0))}
function enemyTurn(){const C=S.cmb;
  C.en.forEach(e=>{if(e.hp<=0||e.gone)return;const acts=/2 Actions/.test(e.tr2)?2:1;
    if(e.es&&e.hp<=e.es&&!C.boss){if(d6()>=4){e.gone=1;log(e.n+' หลบหนีไป!','k');if(/Theft/.test(e.tr2))log('มันขโมยอุปกรณ์ไป 1 ชิ้น (ลบเองในแท็บลูกเรือ)','x');return}}
    for(let k=0;k<acts;k++){const r=d6();const row=e.act.find(a=>{const m=a[0].match(/(\d)(?:-(\d))?/);return r>=+m[1]&&r<=+(m[2]||m[1])});if(!row)continue;const txt=row[1];
      let m=txt.match(/(ML|RG)\s*(\d)\+,\s*(\d+)(?:x(\d+))?\s*(.*)/);
      if(m){const ty=m[1],hit=+m[2]+(e.confuse?1:0);let cnt=1,dmg=+m[3];if(m[4]){cnt=+m[3];dmg=+m[4]}const fl=m[5]||'';dmg+=e.bonus||0;
        const ex=/EX/.test(fl);const pool=S.crew.filter(awake);if(!pool.length)return;
        const pri=pool.filter(c=>C.melee&&C.melee[c.id]);const pri2=pool.filter(c=>C.ranged&&C.ranged[c.id]);const tg=ex?pool:[(pri.length?pri:pri2.length?pri2:pool)[R((pri.length?pri:pri2.length?pri2:pool).length)-1]];
        for(let q=0;q<cnt;q++){let stop=false;for(const t of tg){const rr=d6();if(rr===1&&!ex){stop=true;break}const need=hit+(C.cover[t.id]?1:0)+(e.smoked?e.smoked:0);if(rr<need){log(e.n+': '+txt.split(':')[0]+' พลาด '+t.name);continue}
          let dm=dmg+(rr===6?1:0);if(/EMP/.test(fl)){t.csh=Math.max(0,(t.csh||0)-dm);log(e.n+' EMP โล่ '+t.name);continue}
          let noSh=/IS/.test(fl)||(ty==='ML'&&(shieldOf(t)||{}).t==='A');if(ex&&C.cover[t.id])dm-=2;const got=/IA/.test(fl)?(t.hp-=dm,dm):hurt(t,dm,noSh);
          if(/IA/.test(fl)){if(t.hp<=-4)t.dead=1}log(e.n+': '+txt.split(':')[0]+' โดน '+t.name+' -'+got+' HP','x');
          if(/Vampire/.test(e.tr2))e.hp=Math.min(e.max,e.hp+got);if(/Predator/.test(e.tr2)&&ty==='ML'&&t.hp<=0&&!ex){t.dead=1;log('☠️ '+t.name+' ถูกกินทั้งตัว!','x')}}if(stop)break}
        if(/Kamikaze/.test(e.tr2))e.hp=0}
      else if(m=txt.match(/Recover (\d+) HP/)){if(e.hp>=e.max){k--;continue}e.hp=Math.min(e.max,e.hp+ +m[1]);log(e.n+' ฟื้น '+m[1]+' HP')}
      else if(m=txt.match(/Recover (\d+) Shield/)){e.csh=Math.min(e.sh||+m[1],e.csh+ +m[1]);log(e.n+' ชาร์จโล่')}
      else log(e.n+': '+txt)}
    const rg=tv(e,'Regen');if(rg)e.hp=Math.min(e.max,e.hp+rg);const su=tv(e,'Shields up');if(su)e.csh=Math.min(Math.max(e.sh,su),e.csh+su);
    if(/Parasite/.test(e.tr2))S.o2=Math.max(0,S.o2-1)});
  checkEnd();}
function endRound(){const C=S.cmb;if(C.first==='crew')enemyTurn();if(S.step!=='cmb')return;
  C.round++;C.acted={};C.cover={};C.flanked=0;C.melee={};C.ranged={};C.en.forEach(e=>e.evaded=0);
  S.crew.forEach(c=>{const sh=shieldOf(c);if(sh){c.csh=Math.min(sh.c,(c.csh==null?sh.c:c.csh)+sh.r+Object.values(c.inv).reduce((a,i)=>Math.max(a,i&&i.chg||0),0))}});
  if(S.dun){const L=S.locs[S.dun.loc];const ci=cellInfo(mapGrid(L,S.dun.no),S.dun.r,S.dun.c);const a=isOutside(S.dun,S.dun.r,S.dun.c,ci)?L.ao:L.ai;if(a!=='YES')spendO2(1)}
  if(C.first==='enemy'&&S.step==='cmb')enemyTurn();}
function checkEnd(){const C=S.cmb;if(!S.crew.some(awake)){S.crew.forEach(c=>{if(c.hp<=-4)c.dead=1});C.over=1;log('ทีมพ่ายแพ้...','x');if(C.fromDun)return gameOverOrShip('ทีมสำรวจพ่ายแพ้');return gameOver('ลูกเรือทั้งหมดพ่ายแพ้')}
  if(C.en.every(e=>e.hp<=0||e.gone)){let xp=0;const loot=[];C.en.forEach(e=>{xp+=e.xp;if(!e.minion&&!e.gone&&e.hp<=0)loot.push({g:Math.min(6,e.tr||1)})});if(C.boss)xp*=2;S.xp+=xp;
    log('🏅 ชนะ! +'+xp+' XP','ok');C.over=1;S.cmb=null;S.pendingLoot=(S.pendingLoot||[]).concat(loot);if(S.pendingLoot.length)return startLoot();afterCombat()}}
function afterCombat(){S.crew.forEach(c=>Object.values(c.inv).forEach(i=>{if(i)i.jam=0}));if(S.dun){S.step='dun'}else{S.step=S.ev?'event':'p3'}}
function avoid(m){const C=S.cmb;C.triedAvoid=1;const cr=S.crew.filter(awake);const lv=C.lv;let ok=false,msg='';
  if(m==='run'){const a=cr.map(c=>c.at.agi);const r=d6()+Math.min(...a)+Math.max(...a);ok=r>=lv+9;msg='วิ่ง '+r+' vs '+(lv+9)}
  if(m==='cam'){ok=cr.every(c=>d6()+c.at.tec>=lv+2);msg='พรางตัว (ทุกคนต้องผ่าน '+(lv+2)+')'}
  if(m==='cha'){const r=d6()+cr.reduce((a,c)=>a+c.at.cha,0);ok=r>=lv*3+5;msg='เจรจา '+r+' vs '+(lv*3+5)}
  if(m==='int'){const lvs=cr.map(c=>c.lv).sort((a,b)=>a-b);ok=lv<(lvs[1]||lvs[0]);msg='ข่มขวัญ'}
  log(msg+(ok?' สำเร็จ! หลีกเลี่ยงได้':' ล้มเหลว'),ok?'ok':'x');if(ok){const D=S.dun;if(D&&D.lastCell)delete D.done[D.lastCell];S.cmb=null;afterCombat()}}
function combatEscape(){const C=S.cmb;const cr=S.crew.filter(awake).filter(c=>!C.acted[c.id]);const sac=S.crew.filter(awake).filter(c=>C.acted[c.id]);if(!cr.length){log('ต้องมีลูกเรือที่ยังไม่ได้ทำอะไรในเทิร์นนี้','x');return}
  const r=d6()+Math.min(...cr.map(c=>c.at.agi))+3*sac.length+2*C.escTries+bestItemBonus(/escape/)-2*C.en.filter(e=>e.hp>0&&/Tentacles/.test(e.tr2)).length;const need=Math.max(...C.en.filter(e=>e.hp>0).map(e=>e.ag));C.escTries++;
  log('หนี: '+r+' vs '+need,r>=need?'ok':'x');if(r>=need){sac.forEach(c=>{c.dead=1;log(c.name+' ถูกทิ้งไว้เบื้องหลัง...','x')});const D=S.dun;if(D&&D.lastCell)delete D.done[D.lastCell];S.cmb=null;afterCombat()}else{sac.forEach(c=>c.hp-=2);C.acted=Object.fromEntries(S.crew.map(c=>[c.id,1]))}}
// ================= LOOT =================
function startLoot(){S.step='loot';S.loot=S.pendingLoot.shift();S.loot.phase='bonus'}
function vLoot(){const L=S.loot;const loc=S.dun?S.locs[S.dun.loc].type:'Space Station';let h=`<h2>✨ สมบัติเกรด ${L.g}</h2><div class="c">`;
  if(L.phase==='bonus')h+=`<p>เลือกโบนัส</p>${btn('lb','รับ '+L.g+'¢','',{c:'cr'})}${btn('lb','รับ Stimpack','',{c:'st'})}`;
  else if(L.phase==='roll')h+=btn('lroll','ทอย d20 บนตารางสมบัติ ('+loc+')','pr');
  else if(L.phase==='pick'){h+=`<p>${esc(L.msg)}</p>`+L.opts.map((o,i)=>`<div class="crew">${esc(o.n)} <span class="dim">${o.k==='W'?wDesc(o):esc(o.e)}</span><br>${btn('lpick','เลือก','sm pr',{i:i})}</div>`).join('')}
  else h+=`<p>${esc(L.msg)}</p>${btn('lnext','ต่อไป','pr')}`;
  return h+`</div>${S.pendingLoot&&S.pendingLoot.length?'<p class="dim">เหลืออีก '+S.pendingLoot.length+' ชิ้น</p>':''}`}
function lootRoll(){const L=S.loot;const loc=S.dun?S.locs[S.dun.loc].type:'Space Station';let r=d20();let k=TTAB[loc][r-1];
  if(k==='P'){while(k==='P'||k==='N'||k==='C'||k==='A'){r=d20();k=TTAB[loc][r-1]}L.proto=1}
  log('ตารางสมบัติ d20='+r+' → '+{N:'ไม่มีอะไร',C:'เงิน',I:'ไอเทม',W:'อาวุธ',A:'กระสุน'}[k],'k');
  if(k==='N'){L.phase='done';L.msg='ว่างเปล่า...'}
  if(k==='C'){const x=d6()===6?PRICE[L.g]:Math.floor(PRICE[L.g]/2);S.credits+=x;L.phase='done';L.msg='ได้เงิน '+x+'¢'}
  if(k==='A'){L.phase='done';const w=allGear().filter(o=>o.it.k==='W'&&o.it.am&&o.it.g<=L.g);if(w.length){w.sort((a,b)=>(a.it.a/a.it.am)-(b.it.a/b.it.am));w[0].it.a=w[0].it.am;L.msg='เติมกระสุน '+w[0].it.n+' เต็ม'}else{S.credits+=L.g;L.msg='ไม่มีอาวุธที่ใช้ได้ แปลงเป็น '+L.g+'¢'}}
  if(k==='I'||k==='W'){const d=d6();L.opts=CAT[k].filter(x=>x.g===L.g&&x.d6===d).map(clone);L.phase='pick';L.msg=(L.proto?'[ต้นแบบ] ':'')+'d6='+d+' เลือก 1 ชิ้น';if(!L.opts.length){L.phase='done';L.msg='ไม่พบ'}}}
function lootNext(){if(S.pendingLoot&&S.pendingLoot.length)return startLoot();S.loot=null;if(S.afterLoot==='leave'){S.afterLoot=null;return leaveLoc(false)}afterCombat()}
// ================= VIEWS: crew / ship / story / team =================
function viewCrew(){let h=`<h2>ลูกเรือ</h2><p class="dim">XP กองกลาง ${S.xp} · เลเวลอัปราคา (เลเวลถัดไป)² XP</p>`;
  S.crew.forEach(c=>{const sl=slots(c);h+=`<div class="crew">${pic('crew',c.name,64)}<div class="row"><b>${esc(c.name)}</b><span class="tag">${esc(c.role)}</span><span class="tag">LV ${c.lv}</span>${c.owner?'<span class="tag">👾 '+esc(ownerName(c.owner))+'</span>':''}${c.dead?'<span class="tag">☠️ เสียชีวิต</span>':''}${c.traits.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
    <div class="bar"><i style="width:${Math.max(0,100*c.hp/c.max)}%"></i></div><div class="dim">HP ${Math.max(0,c.hp)}/${c.max} · เกราะ ${armorOf(c)}${shieldOf(c)?' · โล่ '+shieldOf(c).t+shieldOf(c).c:''}${c.psi?' · PSI '+c.psi:''}</div>
    <div class="dim">${['str','agi','mel','ran','tec','cha'].map(a=>a.toUpperCase()+' '+c.at[a]+(S.xp>=(c.lv+1)**2&&!c.dead&&c.at[a]<8?btn('lvup','+','sm',{c:c.id,a:a}):'')).join(' · ')}</div>
    <table>${sl.map(s=>{const it=c.inv[s];return `<tr><td>${s==='L'?'มือซ้าย':s==='R'?'มือขวา':'เป้ '+s}</td><td>${it?esc(it.n)+'<div class="dim">'+(it.k==='W'?wDesc(it)+(it.am?' · เหลือ '+it.a:''):esc(it.e))+(it.jam?' · ติดขัด':'')+'</div>':'<span class="dim">ว่าง</span>'}</td><td>${it?(it.heal?btn('useitem','ใช้','sm',{c:c.id,s:s}):'')+btn('tocargo','เก็บ','sm',{k:c.id+':'+s})+(ui.modder&&it.k==='W'&&!it.mod?btn('mod','ม็อด+1 ('+PRICE[it.g]+'¢)','sm',{k:c.id+':'+s},S.credits<PRICE[it.g]):''):''}</td></tr>`}).join('')}</table>
    ${S.cargo.length&&!c.dead?`<select data-in="equip" data-c="${c.id}"><option value="">+ หยิบจากคลังยาน…</option>${S.cargo.map((it,i)=>`<option value="${i}">${esc(it.n)}</option>`).join('')}</select>`:''}</div>`});
  return h}
function viewShip(){if(!S.ship)return '<p class="dim">ยังไม่มียาน</p>';
  return `<h2>${esc(S.ship.name)}</h2>${shipView()}<div class="c">SP ${shipSP()} · โล่ ${shipSh().c} (+${shipSh().r}/รอบ) · เกราะ ${shipArmor()}<h3>ระบบ</h3>${S.ship.sys.map(s=>`<span class="tag">${esc(s.n)}</span>`).join('')}
  <h3>คลังยาน (${S.cargo.length})</h3>${S.cargo.map((it,i)=>`<div class="row">${esc(it.n)} <span class="dim">G${it.g}</span></div>`).join('')||'<span class="dim">ว่าง</span>'}
  <h3>สถานที่ที่บันทึกไว้</h3>${S.locs.map(L=>`<div class="dim">${esc(L.type)} D${L.dif} · ${L.species} · ${L.depth} แผนที่ · นอก ${L.ao} ใน ${L.ai} · เคลียร์ ${L.cleared.length}${L.solved?' · พิชิตแล้ว':''}</div>`).join('')||'<span class="dim">ยังไม่มี</span>'}</div>`}
function viewStory(){return `<h2>CGM Line Tracker</h2><div class="c">${S.lines.map((l,i)=>`<div class="row"><span class="tag">L${i+1}</span>${l?`<b style="color:var(--b)">${esc(l.pos)}</b> <span class="dim">${Object.entries(l.vars).filter(e=>e[1]).map(e=>e[0]+':'+e[1]).join(' ')}</span>`:'<span class="dim">ว่าง</span>'}</div>`).join('')}
  <h3>Interlink I–Z</h3><div class="dim">${Object.entries(S.inter).filter(e=>e[1]).map(e=>e[0]+':'+e[1]).join(' · ')||'-'}</div></div>`}
const ROLE_TXT={mascot:'The Mascot — ช่วยผู้เล่นหลัก ต้องให้อาหารด้วย PP (ร้านค้า 2¢/PP) หิวมากจะกินของ/ลูกเรือ ชนะร่วมกับทีม',brokenAI:'The Broken AI — ทอย 3 เป้าหมายชีวิต (ลับ) ถูก Reset ได้ท้ายเทิร์น ถ้า Reset ล้มเหลวต้องแกล้งทำเป็นลบชีท',mindSlug:'The Mind Slug — ศัตรูตัวจริง ชนะเมื่อผู้เล่นหลักแพ้ ใช้ PP ทำให้ศัตรูโหดขึ้น เก็บ PP ได้สูงสุด 5'};
function viewTeam(){const ids=S.members||[];const my=Object.keys(S.roles||{}).find(r=>S.roles[r]===myId);
  let h=`<h2>ทีม</h2><div class="c">${local?'โหมดออฟไลน์ (คนเดียว)':'รหัสห้อง <b>'+esc(code)+'</b> · ผู้เล่นเปิดเว็บเดียวกันแล้วเลือก 👾 ผู้เล่น · iPad เลือก 📺 จอกลางโต๊ะ'}<p class="dim">สมาชิก ${ids.length} คน</p></div><div class="c"><h3>ใครเล่นตัวไหน</h3>${S.crew.filter(c=>!c.dead).map(c=>`<div class="row">${esc(c.name)} <select data-in="owner" data-c="${c.id}"><option value="">— GM คุมเอง —</option>${ids.map(id=>`<option value="${id}" ${c.owner===id?'selected':''}>${esc(ownerName(id))}</option>`).join('')}</select></div>`).join('')}</div>`;
  if(!local){h+=`<div class="c"><h3>บทบาทลับ (มัลติเพลเยอร์)</h3>`;['mascot','brokenAI','mindSlug'].forEach(r=>{h+=`<div style="margin:6px 0"><div class="dim">${ROLE_TXT[r]}</div><select data-in="role" data-r="${r}"><option value="">— ไม่มี —</option>${ids.map((id,i)=>`<option value="${id}" ${S.roles[r]===id?'selected':''}>${esc(ownerName(id))}${id===myId?' (คุณ)':''}</option>`).join('')}</select></div>`});h+='</div>';
    if(my){h+=`<div class="c secret"><h3>🔒 ชีทลับของคุณ: ${esc(my)}</h3><p class="dim">${ROLE_TXT[my]}</p>PP <input id="pp" type="number" value="${secret&&secret.pp!=null?secret.pp:1}" style="width:80px">
      <textarea id="snote" rows="5" style="width:100%;margin-top:6px" placeholder="สกิลที่ปลดล็อก / เป้าหมายลับ">${esc(secret&&secret.notes||'')}</textarea>
      <div class="row">${btn('ssave','บันทึกชีทลับ','sm pr')}${my==='brokenAI'?btn('goals','ทอยเป้าหมายชีวิต 3d6','sm'):''}</div>${secret&&secret.goals?'<p>เป้าหมาย: '+secret.goals.join(', ')+'</p>':''}</div>`}}
  return h}
// ================= actions =================
function act(a,d){const c=d.c?S.crew.find(x=>x.id===d.c):null;
  switch(a){
  case 'thtog':ui.th=!ui.th;return render();case 'showstory':ui.story=+d.i;return render();case 'owner':{const cm=S.crew.find(x=>x.id===d.c);if(cm)cm.owner=d.val||null;break}case 'newgame':return lobby();
  case 'pick':{const t=CREW[+d.i];if(S.crew.length<4)S.crew.push(makeCrew(t));break}
  case 'unpick':{const t=CREW[+d.i];S.crew=S.crew.filter(x=>x.name!==t.name);break}
  case 'setupdone':{const cost=S.crew.reduce((a,c)=>a+c.cost,0);S.credits-=cost;log('ลูกเรือพร้อม · จ่ายค่าอุปกรณ์เริ่มต้น '+cost+'¢','ok');S.step='buy';ui.shopTab='SHIP';S.o2=o2Max();break}
  case 'stab':ui.shopTab=d.t;return render();
  case 'buywho':ui.buyTo=d.val;return;
  case 'buyhull':{const s=SHIPS[+d.i];S.credits-=s.sys[0].c;S.ship={name:s.name,sys:[]};log('ซื้อยาน '+s.name,'ok');break}
  case 'buysys':{const def=SHIPS.find(s=>s.name===S.ship.name);const s=def.sys[+d.i];S.credits-=s.c;S.ship.sys.push({n:s.n});log('ติดตั้ง '+s.n,'ok');break}
  case 'buy':{const it=clone(CAT[d.k][+d.i]);S.credits-=PRICE[it.g];log('ซื้อ '+it.n+' → '+giveTo(ui.buyTo,it),'ok');break}
  case 'ammo':{const it=gearAt(d.w);S.credits-=it.g;it.a=it.am;break}
  case 'sell':{const it=removeGear(d.w);S.credits+=Math.floor(PRICE[it.g]/2);log('ขาย '+it.n);break}
  case 'hire':{const t=CREW.find(x=>x.name===d.n);S.credits-=10;const nc=makeCrew(t);nc.inv={};S.crew.push(nc);log('จ้าง '+t.name,'ok');break}
  case 'startgame':S.step='p1';recover();S.rec=false;log('— เทิร์น 1 —','ok');break;
  case 'leaveshop':{const back=S.shop&&S.shop.back;S.shop=null;S.step=back||'p3';break}
  case 'runline':runLine(+d.i);if(S.step==='p1'){S.lines[+d.i]&&(S.lines[+d.i].done=1)}break;
  case 'skipline':S.lines[+d.i].done=1;S.skipped=+d.i;S.skipThis=1;log('ข้ามไลน์ '+(+d.i+1));break;
  case 'p1done':if(S.skipThis!==1)S.skipped=-1;S.step='p3';log('เฟส 2-3');break;
  case 'vote':if(!local&&myId){db.collection('games').doc(code).update({votes:{[myId]:d.c}}).catch(()=>{});S.votes[myId]=d.c;return render()}S.votes.me=d.c;return render();
  case 'evdone':case 'standby':{const e=S.ev;const l=S.lines[e.line];S.ev=null;S.votes={};
    if(a==='standby'){l.standby=1;l.done=1;log('พักเหตุการณ์ '+e.id);S.step=e.fromDun?'dun':e.force?'p3':'p1';break}
    if(l){l.pos=shift(e.at,d.c==='B'?2:1);if(e.choice)log('เลือก '+d.c,'k');S.step='p1';runLine(e.line);if(S.step==='p1'&&S.lines[e.line])S.lines[e.line].done=1}
    if(S.step==='p1'&&e.fromDun)S.step='dun';if(S.step==='p1'&&e.force)S.step='p3';if(S.step==='event'){S.ev.fromDun=e.fromDun;S.ev.force=e.force}break}
  case 'fx':S[d.f]=Math.max(0,S[d.f]+ +d.v);log((d.f==='credits'?'เครดิต':d.f==='xp'?'XP':'O₂')+' '+(+d.v>0?'+':'')+d.v);break;
  case 'hp':c.hp=Math.min(c.max,c.hp+ +d.v);if(c.hp<=-4)c.dead=1;log(c.name+' HP '+(+d.v>0?'+':'')+d.v);break;
  case 'kill':c.dead=1;log(c.name+' เสียชีวิต','x');break;
  case 'chkc':ui.chkc=d.val;return;case 'chka':ui.chka=d.val;return;
  case 'check':{const cm=S.crew.find(x=>x.id===ui.chkc)||S.crew.find(awake);const at=ui.chka||'str';const r=d6();log('เช็ค '+cm.name+' '+at.toUpperCase()+': d6('+r+')+'+cm.at[at]+' = '+(r+cm.at[at]),'k');break}
  case 'fxcmb':startCombat(+$('#fxlv').value||2,$('#fxsp').value,false,!!d.amb,!!S.dun);break;
  case 'fxshop':openShop(+$('#fxsg').value||2,false);S.shop.back='event';break;
  case 'fxloot':S.pendingLoot=(S.pendingLoot||[]).concat([{g:Math.min(6,S.dun?S.dun.dif+1:2)}]);S.lootBack='event';startLoot();break;
  case 'fxvar':{const v=$('#fxvar').value.trim().toUpperCase();if(/^[A-Z]$/.test(v)){const l=S.lines[S.ev.line];sv(l,v,+$('#fxval').value||0);log('ตั้ง '+v+'='+$('#fxval').value)}break}
  case 'fxloc':S.fl={dif:+prompt('ความยากของสถานที่ (1-5)','2')||2,opt:{},mods:0};genLoc();S.lgBack='event';break;
  case 'goflight':S.fl={dif:2,opt:{}};S.step='flight';break;
  case 'fdif':S.fl.dif=+d.n;break;
  case 'fopt':{const o=S.fl.opt;o[d.o]=!o[d.o];if(o[d.o]){if(d.o==='risky')o.danger=0;if(d.o==='danger')o.risky=0;if(d.o==='smuggle')o.pay=0;if(d.o==='pay')o.smuggle=0;if(d.o==='safe'){S.fl.opt={safe:1}}else o.safe=0}break}
  case 'p3back':S.step='p3';break;
  case 'fly':startFlight();break;
  case 'spround':spaceRound(false);break;case 'spesc':spaceRound(true);break;case 'spob':spaceObjective();break;
  case 'lgm':{const g=S.lg;g.mods--;const max={depth:6}[d.k]||6;if(d.m==='r')g.r[d.k]=d6();else g.r[d.k]=Math.max(1,Math.min(max,g.r[d.k]+ +d.m));break}
  case 'lgsave':{const L=locFrom(S.lg.r,S.lg.dif);const cap=2+4*shipSys('HyperNav').length;if(S.locs.length>=cap)S.locs.shift();S.locs.push(L);log('บันทึกสถานที่: '+L.type+' ('+L.species+')','ok');const nl=S.lg.noLand,back=S.lgBack;S.lg=null;S.lgBack=null;
    if(back==='event'){S.step='event';break}if(nl){S.step='p3';break}enterMap(S.locs.length-1,1);break}
  case 'land':enterMap(+d.i,1);break;
  case 'forceline':{runLine(+d.i);if(S.step==='event')S.ev.force=1;break}
  case 'g5shop':openShop(5,false);break;
  case 'endturn':endTurn();break;
  case 'mv':move(+d.r,+d.c);break;
  case 'dunact':spendO2(atmCost(S.dun,S.dun.r,S.dun.c));trigger(S.dun.r,S.dun.c,false);break;
  case 'tele':log('เทเลพอร์ตกลับยาน','ok');leaveLoc(true);break;
  case 'showmap':ui.showmap=!ui.showmap;return render();
  case 'atk':{if(d.w!=='fist'&&c.inv[d.w]&&c.inv[d.w].jam){attack(c,d.w,d.e);break}attack(c,d.w,d.e);break}
  case 'cover':S.cmb.cover[c.id]=1;S.cmb.acted[c.id]=1;log(c.name+' หลบกำบัง');break;
  case 'flank':{S.cmb.flanked=1;if(S.dun)spendO2(atmCost(S.dun,S.dun.r,S.dun.c)?1:0);const r=d6()+c.at.agi;if(r>=8){S.cmb.flanking=c.id;log(c.name+' โอบล้อมสำเร็จ! การโจมตีถัดไป +3','ok')}else log(c.name+' โอบล้อมพลาด','x');break}
  case 'useitem':{const it=c.inv[d.s];const tgts=it.all?S.crew.filter(x=>!x.dead):[S.crew.filter(x=>!x.dead).sort((a,b)=>(a.hp-a.max)-(b.hp-b.max))[0]];tgts.forEach(t=>heal(t,it.heal+(c.traits.includes('Medic')?(it.all?1:2):0)));
    log(c.name+' ใช้ '+it.n+' รักษา '+tgts.map(t=>t.name).join(', '),'ok');if(it.uses>0){it.uses--;if(!it.uses)delete c.inv[d.s]}if(S.cmb)S.cmb.acted[c.id]=1;break}
  case 'endround':endRound();break;
  case 'cesc':combatEscape();break;
  case 'avoid':avoid(d.m);break;
  case 'lb':{if(d.c==='cr'){S.credits+=S.loot.g}else{const st=clone(CAT.I.find(i=>/^Stimpack/.test(i.n)));log('ได้ Stimpack → '+giveTo(null,st))}S.loot.phase='roll';break}
  case 'lroll':lootRoll();break;
  case 'lpick':{const it=S.loot.opts[+d.i];if(S.loot.proto){it.n='★'+it.n;if(it.k==='W')it.dmg+=1}log('ได้ '+it.n+' → '+giveTo(null,it),'ok');S.loot.phase='done';S.loot.msg='เก็บเข้าคลังยานแล้ว (ย้ายให้ลูกเรือได้ในแท็บลูกเรือ)';break}
  case 'lnext':{lootNext();if(S.lootBack&&!S.loot&&S.step!=='loot'){S.step=S.lootBack;S.lootBack=null}break}
  case 'lvup':{const cost=(c.lv+1)**2;S.xp-=cost;c.lv++;c.at[d.a]++;if(d.a==='str'){const nm=Math.min(14,c.at.str*2);c.hp+=nm-c.max;c.max=nm}log(c.name+' เลเวลอัปเป็น '+c.lv+' ('+d.a.toUpperCase()+'+1)','ok');break}
  case 'tocargo':{const it=removeGear(d.k);S.cargo.push(it);break}
  case 'equip':{if(d.val==='')return;const cm=S.crew.find(x=>x.id===d.c);const it=S.cargo.splice(+d.val,1)[0];const free=slots(cm).find(s=>!cm.inv[s]);if(free)cm.inv[free]=it;else{S.cargo.push(it);toast('ช่องเต็ม')}break}
  case 'mod':{const it=gearAt(d.k);S.credits-=PRICE[it.g];it.dmg++;it.mod=1;it.n+='*';log('ม็อด '+it.n+' ดาเมจ +1','ok');break}
  case 'role':{S.roles[d.r]=d.val||null;break}
  case 'ssave':{if(!myId)return;const s={pp:+$('#pp').value||0,notes:$('#snote').value,goals:secret&&secret.goals||null};db.doc('secrets/'+myId+'_'+code).set(s).then(()=>toast('บันทึกแล้ว')).catch(()=>toast('บันทึกไม่ได้'));return}
  case 'goals':{const s=Object.assign({pp:1,notes:''},secret||{},{goals:[d6(),d6(),d6()]});db.doc('secrets/'+myId+'_'+code).set(s).catch(()=>{});secret=s;return render()}
  }
  save();
}
function openShop(g,back){S.shop={grade:g,back:S.dun?'dun':back?'p3':'p3'};if(S.dun&&!S.dun.shopBonus){S.dun.shopBonus=1;const ch=Math.max(...S.crew.filter(awake).map(c=>c.at.cha))-2;if(ch>0){S.credits+=ch;log('ขายของเก่าได้ '+ch+'¢','ok')}}S.step='shop';ui.shopTab='W';log('เข้าร้านค้าเกรด '+g)}
function gameOver(m){S.step='over';S.overMsg=m;log('GAME OVER: '+m,'x')}
// ======================= MULTI-DEVICE LAYER =======================

function imgFb(el){const c=(el.dataset.c||'').split('|').filter(Boolean);const n=c.shift();if(!n){el.remove();return}el.dataset.c=c.join('|');el.src=n}
function imgAttr(rel,alts){const a=[rel];const png=rel.replace(/\.jpg$/,'.png'),jpg=rel.replace(/\.png$/,'.jpg');const list=[rel,'img/'+rel];if(alts){list.push(png===rel?jpg:png);list.push('img/'+(png===rel?jpg:png))}
  const first=list.shift();return `src="${first}" data-c="${list.join('|')}" onerror="imgFb(this)"`}
const STEPNAME={setup:'เลือกลูกเรือ',buy:'เตรียมยาน',p1:'เดินเรื่อง',event:'เหตุการณ์',p3:'เลือกการกระทำ',flight:'ออกบิน',space:'สู้ในอวกาศ',locgen:'สถานที่ใหม่',dun:'สำรวจสถานที่',cmb:'ต่อสู้',loot:'สมบัติ',shop:'ร้านค้า',over:'จบภารกิจ'};
const slug=n=>String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function itemPic(n){return `<img class="ip" ${imgAttr('items/'+slug(String(n).replace(/^★|\*$/g,''))+'.png',1)} alt="">`}
function ownerName(id){return id?((S&&S.names||{})[id]||'ผู้เล่น'):'—'}
function toFS(o){if(Array.isArray(o))return o.map(v=>Array.isArray(v)?{__arr:toFS(v)}:toFS(v));if(o&&typeof o==='object'){const r={};for(const k in o){if(o[k]!==undefined)r[k]=toFS(o[k])}return r}return o}
function fromFS(o){if(Array.isArray(o))return o.map(fromFS);if(o&&typeof o==='object'){const ks=Object.keys(o);if(ks.length===1&&ks[0]==='__arr')return fromFS(o.__arr);const r={};for(const k of ks)r[k]=fromFS(o[k]);return r}return o}
const pb=(label,obj,cls,dis)=>`<button class="bt ${cls||''}" data-p='${JSON.stringify(obj).replace(/'/g,"&#39;")}' ${dis?'disabled':''}>${label}</button>`;

// ---------- command queue: players -> GM ----------
function sendCmd(m){if(!db||local||!code)return;m.from=myId;m.t=Date.now();
  db.collection('games').doc(code).collection('cmd').add(JSON.parse(JSON.stringify(m))).then(()=>toast('ส่งแล้ว ✓')).catch(()=>toast('ส่งไม่สำเร็จ'))}
function listenCmds(c){if(unsubCmd)unsubCmd();
  unsubCmd=db.collection('games').doc(c).collection('cmd').onSnapshot(q=>{q.docChanges().forEach(ch=>{if(ch.type!=='added')return;const m=ch.doc.data();ch.doc.ref.delete().catch(()=>{});
    if(!m||m.t<Date.now()-180000)return;try{handleCmd(m)}catch(e){console.error(e)}})},()=>{})}
const PLAYER_ACTS=['atk','cover','flank','useitem','avoid','cesc','lvup','equip'];
function handleCmd(m){if(!S)return;const f=m.from;S.names=S.names||{};S.votes=S.votes||{};
  switch(m.a){
    case 'hello':S.names[f]=m.name||'ผู้เล่น';if(!(S.members||[]).includes(f))S.members=(S.members||[]).concat(f);log('👾 '+S.names[f]+' เข้าร่วม','ok');break;
    case 'vote':if(!S.ev)return;S.votes[f]=m.c;break;
    case 'pick':{if(S.step!=='setup')return;const t=CREW[+m.i];if(!t||S.crew.length>=4||S.crew.some(c=>c.name===t.name))return;const c=makeCrew(t);c.owner=f;S.crew.push(c);log(ownerName(f)+' เลือก '+t.name,'ok');break}
    case 'unpick':{if(S.step!=='setup')return;const t=CREW[+m.i];S.crew=S.crew.filter(c=>!(c.name===t.name&&c.owner===f));break}
    case 'claim':{const c=S.crew.find(x=>x.id===m.c);if(!c||c.owner)return;c.owner=f;log(ownerName(f)+' รับบท '+c.name,'ok');break}
    case 'give':{const cid=String(m.k).split(':')[0];const c=S.crew.find(x=>x.id===cid);if(!c||c.owner!==f)return;const it=removeGear(m.k);if(!it)return;
      const to=S.crew.find(x=>x.id===m.to);log('🎁 '+c.name+' ส่ง '+it.n+' → '+giveTo(m.to,it),'ok');
      if(to&&to.owner&&to.owner!==f)S.gifts=Object.assign(S.gifts||{},{[to.owner]:{n:it.n,from:c.name,t:Date.now()}});break}
    case 'pbuy':{if(S.step!=='shop'&&S.step!=='buy')return;const it=CAT[m.k]&&CAT[m.k][+m.i];if(!it||it.g>shopGrade()||S.credits<PRICE[it.g])return;
      const c=S.crew.find(x=>x.id===m.c);if(c&&c.owner&&c.owner!==f)return;S.credits-=PRICE[it.g];log('🛒 '+ownerName(f)+' ซื้อ '+it.n+' → '+giveTo(m.c,clone(it)),'ok');break}
    case 'act':{if(!PLAYER_ACTS.includes(m.name))return;const d=m.d||{};
      if(d.c){const c=S.crew.find(x=>x.id===d.c);if(!c||(c.owner&&c.owner!==f))return}
      if(['atk','cover','flank','avoid','cesc'].includes(m.name)&&S.step!=='cmb')return;
      act(m.name,d);return}
    default:return}
  save()}

// ---------- lobby ----------
function lobby(){code=null;S=null;[unsub,unsubSec,unsubCmd].forEach(u=>{try{u&&u()}catch(e){}});unsub=unsubSec=unsubCmd=null;ROLE='gm';document.body.className='';
  const gb=document.getElementById('gbtn');if(gb)gb.style.display='none';
  let last='';try{last=localStorage.getItem('sk_last')||''}catch(e){}const nm=localStorage.getItem('sk_name')||'';
  $('#top').innerHTML='<div class="top"><span>SPACE<b>KRAKEN</b></span><span class="dim">เลือกบทบาทของเครื่องนี้</span></div>';
  $('#app').innerHTML=`${!db?'<div class="c warn">⚠️ ยังไม่ได้ตั้งค่า Firebase ใน firebase-config.js ตอนนี้เล่นได้เฉพาะโหมดคนเดียว (วิธีตั้งอยู่ใน README)</div>':''}
  <div class="roles">
  <div class="c role"><h3>🎮 GM</h3><p class="dim">เครื่องที่ GM ถือ คุมทุกอย่าง เห็นข้อมูลทุกคน สิ่งที่กดจะขึ้นที่จอกลางและมือถือทุกคน</p>
   <input id="nm" placeholder="ชื่อทีม"><div class="row"><select id="df">${Object.entries(DIFF).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select><input id="set" type="number" min="1" max="49" placeholder="Story Set (สุ่ม)" style="width:150px"></div>
   <button class="bt pr" id="mk" ${db?'':'disabled'}>สร้างห้องใหม่</button>
   <div class="row"><input id="gc" placeholder="รหัสห้อง" maxlength="6" class="code-in" style="width:130px"><button class="bt" id="gj" ${db?'':'disabled'}>กลับมาคุมห้องเดิม</button></div></div>
  <div class="c role"><h3>📺 จอกลางโต๊ะ</h3><p class="dim">iPad วางกลางโต๊ะ แสดงยาน แผนที่ ศัตรู และเนื้อเรื่องแบบจอใหญ่</p>
   <div class="row"><input id="tc" placeholder="รหัสห้อง" maxlength="6" class="code-in" style="width:130px"><button class="bt pr" id="tj" ${db?'':'disabled'}>เปิดจอกลาง</button></div></div>
  <div class="c role"><h3>👾 ผู้เล่น</h3><p class="dim">มือถือแต่ละคน เห็นการ์ดตัวเอง โหวต เลือก Action ส่งของให้เพื่อน</p>
   <input id="pn" placeholder="ชื่อของคุณ" value="${esc(nm)}"><div class="row"><input id="pc" placeholder="รหัสห้อง" maxlength="6" class="code-in" style="width:130px"><button class="bt pr" id="pj" ${db?'':'disabled'}>เข้าร่วม</button></div></div>
  <div class="c role"><h3>🧑‍🚀 เล่นคนเดียว</h3><p class="dim">ออฟไลน์ในเครื่องนี้เครื่องเดียว คุมทีมทั้งหมดเอง</p>
   <button class="bt pr" id="solo">เริ่มเกมใหม่</button>${last.startsWith('L:')?'<button class="bt" id="solor">เล่นต่อจากเซฟ</button>':''}</div></div>`;
  const v=id=>(($('#'+id)||{}).value||'').trim().toUpperCase();
  $('#mk').onclick=()=>{ROLE='gm';document.body.className='role-gm';create(false)};
  $('#solo').onclick=()=>{ROLE='gm';document.body.className='role-gm';create(true)};
  if($('#solor'))$('#solor').onclick=()=>{ROLE='gm';document.body.className='role-gm';openLocal(last.slice(2))};
  $('#gj').onclick=()=>joinAs('gm',v('gc'));$('#tj').onclick=()=>joinAs('table',v('tc'));
  $('#pj').onclick=()=>{myName=($('#pn').value||'').trim()||'ผู้เล่น';try{localStorage.setItem('sk_name',myName)}catch(e){}joinAs('player',v('pc'))};
  if(last&&!last.startsWith('L:'))['gc','tc','pc'].forEach(id=>{if($('#'+id))$('#'+id).value=last});
  const q=new URLSearchParams(location.search);if(q.get('room')){['tc','pc'].forEach(id=>$('#'+id).value=q.get('room').toUpperCase())}
}
async function joinAs(role,c){if(!c){toast('ใส่รหัสห้องก่อน');return}if(!db){toast('ยังไม่ได้ตั้งค่า Firebase');return}
  ROLE=role;document.body.className='role-'+role;if(role==='player'&&!myName)myName=localStorage.getItem('sk_name')||'ผู้เล่น';
  await join(c);if(role==='player'&&code)sendCmd({a:'hello',name:myName})}

// ---------- shared helpers ----------
function mapView(){const D=S.dun,L=S.locs[D.loc],g=mapGrid(L,D.no);if(!g)return '<div class="dim">ไม่พบแผนที่</div>';let h='<div class="grid">';
  for(let r=0;r<12;r++)for(let c=0;c<12;c++){const ci=cellInfo(g,r,c);const cls=ci.bg==='.'?'e':ci.bg==='#'?'w':ci.bg==='b'?'bl':ci.bg;const me=r===D.r&&c===D.c;
    h+=`<div class="cl ${cls} ${ci.red?'red':''} ${me?'me':''} ${D.done[r+'_'+c]?'done':''}">${me?'🧑‍🚀':esc(ci.lab)}</div>`}return h+'</div>'}
function timelineHtml(){const s=S.sp;if(!s)return '';const TL={A:'โจมตีทันที',B:'กำลังเสริม',C:'บุกขึ้นยาน',E:'หลบหลีก',G:'ยานระเบิด!',I:'ไม่ยิง',S:'โล่ล่ม',T:'หมดเวลา',V:'ถอยทัพ','.':''};
  return `<div class="tl">${[...s.tl].map((ch,i)=>`<div class="tlc ${i===s.t?'now':i<s.t?'past':''}"><b>รอบ ${i+1}</b><span>${ch==='.'?'·':ch}</span><small>${TL[ch]||''}</small></div>`).join('')}</div>`}
function shipBars(sp,spm,sh,shm){return `<div class="dim">โครงสร้าง ${Math.max(0,sp)}/${spm}</div><div class="bar big"><i style="width:${Math.max(0,100*sp/Math.max(1,spm))}%"></i></div>
  <div class="dim">โล่ ${sh}/${shm}</div><div class="bar big"><i style="width:${Math.max(0,100*sh/Math.max(1,shm))}%;background:var(--b)"></i></div>`}
function crewMini(){return S.crew.filter(c=>!c.dead).map(c=>`<div class="mini">${pic('crew',c.name,44)}<b>${esc(c.name)}</b> <span class="dim">${c.owner?'👾 '+esc(ownerName(c.owner)):''}</span>
  <div class="bar"><i style="width:${Math.max(0,100*c.hp/c.max)}%"></i></div><div class="dim">HP ${Math.max(0,c.hp)}/${c.max}${c.hp<=0?' 💤':''}</div><div style="clear:both"></div></div>`).join('')||'<div class="dim">ยังไม่มีลูกเรือ</div>'}

// ---------- TABLE VIEW (iPad) ----------
function renderTable(){
  $('#top').innerHTML=`<div class="top"><button class="bt sm" id="bk">←</button><span>SPACE<b>KRAKEN</b></span><span class="pill">ห้อง ${esc(code)}</span><span class="pill">เทิร์น ${S.turn}</span>
   <span class="pill cr">${S.credits}¢</span><span class="pill xp">${S.xp} XP</span><span class="pill o2">O₂ ${S.o2}/${o2Max()}</span><span class="pill now">${STEPNAME[S.step]||S.step}</span></div>`;
  const st=S.step;let main='';
  if(st==='setup'||st==='buy'){main=`<h1 class="big">เตรียมภารกิจ</h1><div class="joinbox"><div id="qr"></div><div><div class="dim">ผู้เล่นสแกน QR หรือเลือก 👾 ผู้เล่น แล้วใส่รหัส</div><div class="code">${esc(code)}</div>
    <div class="dim">${Object.values(S.names||{}).map(esc).join(' · ')||'ยังไม่มีผู้เล่นเข้าห้อง'}</div></div></div>`+(S.ship?`<div class="c">${shipView()}</div>`:'')}
  else if(st==='event'&&S.ev){const v=S.votes||{},cnt={A:0,B:0};Object.values(v).forEach(x=>cnt[x]=(cnt[x]||0)+1);
    main=`<div class="dim">เหตุการณ์ ${esc(S.ev.id)}</div><div class="evbig">${evText('ev_'+S.ev.id,S.ev.text)}</div>`+(S.ev.choice?`<div class="votebar"><div class="va" style="flex:${cnt.A||0.001}">A · ${cnt.A}</div><div class="vb" style="flex:${cnt.B||0.001}">B · ${cnt.B}</div></div>`:'')}
  else if(st==='p1'){main=`<h1 class="big">เส้นเรื่อง (CGM)</h1>`+S.lines.map((l,i)=>l?`<div class="lineb"><span class="tag">L${i+1}</span> <b style="color:var(--b)">${esc(l.pos)}</b>${l.done?' ✓':''}</div>`:'').join('')}
  else if(st==='p3'||st==='flight'||st==='space'){main=`<canvas id="sky" class="sky"></canvas>`;
    if(st==='space'&&S.sp)main+=`<h2>${esc(S.sp.name)}</h2>${timelineHtml()}<div class="twocol"><div><h3>ยานของเรา</h3>${shipBars(S.sp.sp,shipSP(),S.sp.sh,shipSh().c)}</div><div><h3>ศัตรู</h3>${S.sp.en.map(e=>`<div class="en"><b>${esc(e.n)}</b> ${e.hp<=0?'💥':''}<div class="bar"><i style="width:${Math.max(0,100*e.hp/e.sp)}%;background:var(--r)"></i></div><div class="dim">SP ${Math.max(0,e.hp)}/${e.sp} · โล่ ${e.csh}</div></div>`).join('')}</div></div>`;
    else if(st==='flight')main+='<h2>กำลังวางเส้นทางบิน…</h2>';
    else main+=`<h2>ยานลอยอยู่ในอวกาศ</h2>${S.locs.map(L=>`<div class="lineb">📍 ${esc(L.type)} · D${L.dif} · ${esc(L.species)}${L.solved?' ✅':''}</div>`).join('')}${S.ship?shipView():''}`}
  else if(st==='locgen'&&S.lg){const L=locFrom(S.lg.r,S.lg.dif);const kv=(a,b)=>`<div class="kv"><span>${a}</span><b>${esc(b)}</b></div>`;
    main=`<h1 class="big">ค้นพบสถานที่ใหม่</h1><div class="c">${kv('ประเภท',L.type)}${kv('ศัตรู',L.species)}${kv('ความลึก',L.depth+' แผนที่')}${kv('อากาศภายนอก',L.ao)}${kv('อากาศภายใน',L.ai)}${kv('พิเศษ',L.special)}</div>`}
  else if(st==='dun'&&S.dun){const L=S.locs[S.dun.loc];main=`<div class="twocol"><div>${mapView()}</div><div><h2>${esc(L.type)}</h2><div class="dim">แผนที่ ${S.dun.no}/${L.depth} · ${esc(L.species)} · D${L.dif}<br>อากาศนอก ${L.ao} · ใน ${L.ai}</div>
    <img class="mp" ${imgAttr('maps/'+TYPES.indexOf(L.type)+'_'+L.maps[S.dun.no-1]+'.jpg')} alt=""></div></div>`}
  else if(st==='cmb'&&S.cmb){main=`<h1 class="big">${S.cmb.boss?'👹 บอส!':'⚔️ ต่อสู้'} · รอบ ${S.cmb.round}</h1><div class="foes">${S.cmb.en.filter(e=>!e.gone).map(e=>`<div class="foe ${e.hp<=0?'dead':''}">${pic('en',e.base,130)}<b>${esc(e.n)}</b>
    <div class="bar big"><i style="width:${Math.max(0,100*e.hp/e.max)}%;background:var(--r)"></i></div><div class="dim">HP ${Math.max(0,e.hp)}/${e.max}${e.csh?' · โล่ '+e.csh:''}${e.ar?' · เกราะ '+e.ar:''}</div></div>`).join('')}</div>`}
  else if(st==='loot'&&S.loot){main=`<h1 class="big">✨ สมบัติเกรด ${S.loot.g}</h1><div class="c">${esc(S.loot.msg||'กำลังเปิดหีบ…')}</div>${(S.loot.opts||[]).map(o=>`<div class="c">${itemPic(o.n)}<b>${esc(o.n)}</b><div class="dim">${o.k==='W'?wDesc(o):esc(o.e)}</div></div>`).join('')}`}
  else if(st==='shop'){main=`<h1 class="big">🏪 ร้านค้า เกรด ${shopGrade()}</h1><p class="dim">ผู้เล่นซื้อของจากมือถือของตัวเอง</p>`}
  else if(st==='over'){main=`<h1 class="big">ภารกิจจบลง</h1><p>${esc(S.overMsg||'')}</p>`}
  $('#app').innerHTML=`<div class="tvgrid"><div class="tvmain">${main}</div><div class="tvside"><h3>ลูกเรือ</h3>${crewMini()}<h3>ล่าสุด</h3>${viewLog(8)}</div></div>`;
  $('#bk').onclick=lobby;document.querySelectorAll('[data-a="thtog"]').forEach(b=>b.onclick=()=>{ui.th=!ui.th;render()});
  const q=document.getElementById('qr');if(q&&window.QRCode){q.innerHTML='';try{new QRCode(q,{text:location.origin+location.pathname+'?room='+code,width:150,height:150})}catch(e){}}}

// ---------- PLAYER VIEW (phone) ----------
function renderPlayer(){const mine=S.crew.filter(c=>c.owner===myId);
  const g=(S.gifts||{})[myId];if(g){if(ui.giftSeen===undefined)ui.giftSeen=g.t;else if(g.t>ui.giftSeen){ui.giftSeen=g.t;toast('🎁 ได้รับ '+g.n+' จาก '+g.from)}}
  $('#top').innerHTML=`<div class="top"><button class="bt sm" id="bk">←</button><span>👾 <b>${esc(myName||'ผู้เล่น')}</b></span><span class="pill">ห้อง ${esc(code)}</span><span class="pill">เทิร์น ${S.turn}</span><span class="pill cr">${S.credits}¢</span><span class="pill o2">O₂ ${S.o2}</span></div>`;
  let h=`<div class="c phase"><b>${STEPNAME[S.step]||S.step}</b> <span class="dim">· ภาพใหญ่อยู่ที่จอกลางโต๊ะ · กด ❓ ดูวิธีเล่นเฟสนี้</span></div>`;
  if(S.step==='setup')h+=pSetup();else{if(!mine.length)h+=pClaim();h+=pPhase(mine);mine.forEach(c=>h+=pCard(c))}
  h+=pSecret()+viewLog(6);$('#app').innerHTML=h;$('#bk').onclick=lobby;
  document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{try{sendCmd(JSON.parse(b.dataset.p))}catch(e){}});
  document.querySelectorAll('[data-pgive]').forEach(s=>s.onchange=()=>{if(s.value){sendCmd({a:'give',k:s.dataset.pgive,to:s.value});s.value=''}});
  document.querySelectorAll('[data-a="thtog"]').forEach(b=>b.onclick=()=>{ui.th=!ui.th;render()});
  document.querySelectorAll('[data-lsel]').forEach(s=>s.onchange=()=>{ui.buyFor=s.value;render()});
  document.querySelectorAll('[data-pst]').forEach(b=>b.onclick=()=>{ui.pShopTab=b.dataset.pst;render()});
  const ss=document.getElementById('ssave');if(ss)ss.onclick=()=>db.doc('secrets/'+myId+'_'+code).set({pp:+$('#pp').value||0,notes:$('#snote').value,goals:secret&&secret.goals||null}).then(()=>toast('บันทึกแล้ว')).catch(()=>toast('บันทึกไม่ได้'))}
function pSetup(){let h=`<h2>เลือกตัวละครของคุณ</h2><p class="dim">ทีมมีได้สูงสุด 4 คน · เลือกแล้ว ${S.crew.length}/4 · GM จะกดยืนยันเมื่อทุกคนพร้อม</p>`;
  CREW.forEach((t,i)=>{const got=S.crew.find(c=>c.name===t.name);const me=got&&got.owner===myId;
    h+=`<div class="crew ${got&&!me?'taken':''}">${pic('crew',t.name,60)}<div class="row"><b>${esc(t.name)}</b><span class="tag">${esc(t.role)}</span>${got?`<span class="tag">${me?'ของคุณ':'👾 '+esc(ownerName(got.owner))}</span>`:''}</div>
    <div class="dim">STR ${t.at.str} · AGI ${t.at.agi} · MEL ${t.at.mel} · RAN ${t.at.ran} · TEC ${t.at.tec} · CHA ${t.at.cha}</div>
    ${me?pb('ยกเลิก',{a:'unpick',i},'dg sm'):got?'':pb('เลือกคนนี้',{a:'pick',i},'pr sm',S.crew.length>=4)}<div style="clear:both"></div></div>`});return h}
function pClaim(){const free=S.crew.filter(c=>!c.owner&&!c.dead);if(!free.length)return '<div class="c dim">คุณยังไม่มีตัวละคร ให้ GM จ้างลูกเรือเพิ่มหรือมอบตัวละครให้ในแท็บ "ทีม"</div>';
  return `<div class="c"><h3>เลือกตัวละครที่คุณจะเล่น</h3>${free.map(c=>`<div class="row">${pic('crew',c.name,36)}<b>${esc(c.name)}</b>${pb('เล่นตัวนี้',{a:'claim',c:c.id},'sm pr')}</div>`).join('')}</div>`}
function pPhase(mine){const st=S.step;let h='';
  if(st==='event'&&S.ev){const v=S.votes||{},cnt={A:0,B:0};Object.values(v).forEach(x=>cnt[x]=(cnt[x]||0)+1);const my=v[myId];
    h+=`<div class="c">${evText('ev_'+S.ev.id,S.ev.text)}${S.ev.choice?`<div class="row" style="margin-top:8px">${pb('โหวต A'+(my==='A'?' ✓':''),{a:'vote',c:'A'},my==='A'?'pr':'')}${pb('โหวต B'+(my==='B'?' ✓':''),{a:'vote',c:'B'},my==='B'?'pr':'')}<span class="dim">A ${cnt.A} · B ${cnt.B}</span></div>`:''}</div>`}
  else if(st==='cmb'&&S.cmb){const C=S.cmb;
    h+=`<div class="c"><h3>⚔️ รอบ ${C.round}</h3>${C.en.filter(e=>!e.gone).map(e=>`<div class="en">${pic('en',e.base,40)}<b>${esc(e.n)}</b> ${e.hp<=0?'💀':''}<div class="bar"><i style="width:${Math.max(0,100*e.hp/e.max)}%;background:var(--r)"></i></div>
      <div class="dim">HP ${Math.max(0,e.hp)}/${e.max}${e.csh?' · โล่ '+e.shT+' '+e.csh:''}${e.ar?' · เกราะ '+e.ar:''} · อ่อน ${e.wk.join(',')}</div><div style="clear:both"></div></div>`).join('')}`;
    mine.filter(awake).forEach(c=>{if(C.acted[c.id]){h+=`<div class="dim">✓ ${esc(c.name)} ทำ Action แล้วในรอบนี้</div>`;return}
      const wpn=['L','R'].map(s=>[s,c.inv[s]]).filter(x=>x[1]&&x[1].k==='W');const tg=C.en.filter(e=>e.hp>0&&!e.gone);
      h+=`<h3>${esc(c.name)} · เลือก 1 Action</h3><div class="row">${(wpn.length?wpn:[['fist',{n:'หมัด'}]]).map(([s,w])=>tg.map(e=>pb((w.jam?'🔧 แก้ '+esc(w.n):'⚔️ '+esc(w.n)+(w.am?' ('+w.a+')':''))+' → '+esc(e.n.split(' ')[0]),{a:'act',name:'atk',d:{c:c.id,w:s,e:e.id}},'sm')).join('')).join('')}
      ${pb('🛡️ กำบัง',{a:'act',name:'cover',d:{c:c.id}},'sm')}${S.crew.filter(awake).length>1&&!C.flanked?pb('↪️ โอบล้อม',{a:'act',name:'flank',d:{c:c.id}},'sm'):''}</div>`});
    if(C.fromDun&&C.round===1&&!C.boss&&!C.triedAvoid)h+=`<h3>หรือหลีกเลี่ยงการต่อสู้ (ทั้งทีม)</h3><div class="row">${pb('🏃 วิ่งหนี',{a:'act',name:'avoid',d:{m:'run'}},'sm')}${pb('🫥 พรางตัว',{a:'act',name:'avoid',d:{m:'cam'}},'sm')}${pb('💬 เจรจา',{a:'act',name:'avoid',d:{m:'cha'}},'sm')}</div>`;
    h+='</div>'}
  else if(st==='dun'&&S.dun)h+=`<div class="c"><h3>${esc(S.locs[S.dun.loc].type)} · แผนที่ ${S.dun.no}</h3>${mapView()}<p class="dim">GM เป็นคนพาทีมเดิน บอก GM ว่าอยากไปทางไหน</p></div>`;
  else if(st==='space'&&S.sp)h+=`<div class="c"><canvas id="sky" class="sky sm"></canvas>${timelineHtml()}${shipBars(S.sp.sp,shipSP(),S.sp.sh,shipSh().c)}</div>`;
  else if((st==='shop'||st==='buy')&&mine.length)h+=pShop(mine);
  else if(st==='loot'&&S.loot)h+=`<div class="c">✨ สมบัติเกรด ${S.loot.g} · ${esc(S.loot.msg||'รอ GM เปิดหีบ')}</div>`;
  else if(st==='over')h+=`<div class="c"><h2>ภารกิจจบ</h2><p>${esc(S.overMsg||'')}</p></div>`;
  return h}
function pShop(mine){const g=shopGrade();const who=ui.buyFor&&mine.some(c=>c.id===ui.buyFor)?ui.buyFor:mine[0].id;const tab=ui.pShopTab||'W';
  return `<div class="c"><h3>🛒 ร้านค้า${g<99?' (เกรด ≤ '+g+')':''} · ซื้อให้ <select data-lsel>${mine.map(c=>`<option value="${c.id}" ${c.id===who?'selected':''}>${esc(c.name)}</option>`).join('')}</select></h3>
  <div class="row">${['W','I'].map(k=>`<button class="bt sm ${tab===k?'on':''}" data-pst="${k}">${k==='W'?'อาวุธ':'ไอเทม'}</button>`).join('')}</div>
  <table>${CAT[tab].filter(x=>x.g<=g).map(x=>`<tr><td>${itemPic(x.n)}${esc(x.n)} <span class="tag">G${x.g}</span><div class="dim">${x.k==='W'?wDesc(x):esc(x.e)}</div></td><td>${PRICE[x.g]}¢</td><td>${pb('ซื้อ',{a:'pbuy',k:tab,i:CAT[tab].indexOf(x),c:who},'sm',S.credits<PRICE[x.g])}</td></tr>`).join('')}</table></div>`}
function pCard(c){const sl=slots(c);const others=S.crew.filter(x=>x.id!==c.id&&!x.dead);const sh=shieldOf(c);const cost=(c.lv+1)**2;
  return `<div class="crew">${pic('crew',c.name,72)}<div class="row"><b>${esc(c.name)}</b><span class="tag">${esc(c.role)}</span><span class="tag">LV ${c.lv}</span>${c.dead?'<span class="tag">☠️ เสียชีวิต</span>':c.hp<=0?'<span class="tag">💤 หมดสติ</span>':''}</div>
  <div class="bar big"><i style="width:${Math.max(0,100*c.hp/c.max)}%"></i></div><div class="dim">HP ${Math.max(0,c.hp)}/${c.max} · เกราะ ${armorOf(c)}${sh?' · โล่ '+sh.t+' '+(c.csh!=null?c.csh:sh.c)+'/'+sh.c:''}</div>
  <div style="clear:both"></div><div class="stats">${['str','agi','mel','ran','tec','cha'].map(a=>`<div class="st"><b>${c.at[a]}</b>${a.toUpperCase()}${S.xp>=cost&&!c.dead&&c.at[a]<8?pb('+',{a:'act',name:'lvup',d:{c:c.id,a}},'sm mini'):''}</div>`).join('')}</div>
  ${S.xp>=cost&&!c.dead?`<div class="dim">XP กองกลางพอเลเวลอัป (ใช้ ${cost} XP) กด + ที่ค่าที่อยากเพิ่ม</div>`:''}
  <table>${sl.map(s=>{const it=c.inv[s];return `<tr><td class="dim">${s==='L'?'มือซ้าย':s==='R'?'มือขวา':'เป้ '+s}</td><td>${it?itemPic(it.n)+'<b>'+esc(it.n)+'</b><div class="dim">'+(it.k==='W'?wDesc(it)+(it.am?' · เหลือ '+it.a:''):esc(it.e))+(it.jam?' · ติดขัด':'')+'</div>':'<span class="dim">ว่าง</span>'}</td>
   <td>${it?(it.heal&&it.uses!==0?pb('💊 ใช้',{a:'act',name:'useitem',d:{c:c.id,s}},'sm'):'')+(others.length?`<select data-pgive="${c.id}:${s}" class="give"><option value="">🎁 ส่งให้…</option>${others.map(o=>`<option value="${o.id}">${esc(o.name)}${o.owner&&o.owner!==myId?' ('+esc(ownerName(o.owner))+')':''}</option>`).join('')}</select>`:''):''}</td></tr>`}).join('')}</table>
  ${S.cargo.length?`<details><summary class="dim">📦 หยิบของจากคลังยาน (${S.cargo.length})</summary>${S.cargo.map((it,i)=>`<div class="row">${itemPic(it.n)}${esc(it.n)} ${pb('หยิบ',{a:'act',name:'equip',d:{c:c.id,val:String(i)}},'sm')}</div>`).join('')}</details>`:''}</div>`}
function pSecret(){const my=Object.keys(S.roles||{}).find(r=>S.roles[r]===myId);if(!my)return '';
  return `<div class="c secret"><h3>🔒 บทบาทลับ: ${esc(my)}</h3><p class="dim">${ROLE_TXT[my]}</p>PP <input id="pp" type="number" value="${secret&&secret.pp!=null?secret.pp:1}" style="width:80px">
  <textarea id="snote" rows="4" style="width:100%;margin-top:6px" placeholder="สกิล / เป้าหมายลับ">${esc(secret&&secret.notes||'')}</textarea><button class="bt sm pr" id="ssave">บันทึก</button></div>`}

// ---------- contextual guide ----------
const GUIDE={
 setup:['ผู้เล่นแต่ละคนเลือกตัวละคร 1 คน (ทีมรวมสูงสุด 4 คน)','ค่าอุปกรณ์เริ่มต้นของลูกเรือหักจากเงินกองกลาง 100¢','STR = พลัง: HP = STR×2, ช่องเป้ = STR÷2 · AGI = ความไว: หลบ/เริ่มก่อน/หนี','MEL = ต่อสู้ประชิด · RAN = ยิงระยะไกล · TEC = เทคนิค: เปิดประตู/ซ่อม · CHA = เสน่ห์: เจรจา/ต่อรอง'],
 buy:['ต้องซื้อตัวยาน (Hull) 1 ลำก่อน แล้วค่อยติดอาวุธ โล่ เกราะ','ผู้เล่นซื้ออาวุธ/ไอเทมให้ตัวเองได้จากมือถือ ใช้เงินกองกลาง','เก็บเงินไว้บ้าง ร้านค้าในด่านจะมีของดีกว่า'],
 p1:['เกมมีเส้นเรื่องได้ถึง 6 เส้น ทุกเทิร์นระบบ CGM เดินทุกเส้นตามตารางลับ','เจอเหตุการณ์ = อ่านเนื้อเรื่องบนจอกลาง แล้วทำตาม','ข้ามได้ 1 เส้นต่อเทิร์น แต่ห้ามข้ามเส้นเดิมสองเทิร์นติด'],
 event:['อ่านเนื้อเรื่องบนจอกลาง (สลับไทย/อังกฤษได้)','ถ้ามีทางเลือก A/B ทุกคนโหวตจากมือถือ แล้ว GM กดยืนยัน','ผลของเหตุการณ์ เช่น ได้เงิน เสีย HP เข้าต่อสู้ GM เป็นคนกดตามที่ข้อความเขียน'],
 p3:['เลือก 1 อย่างต่อเทิร์น: บินหาสถานที่ใหม่ · ลงจอดสถานที่ที่รู้จัก · กระตุ้นเส้นเรื่องซ้ำ · ร้านค้าเกรด 5','จบเทิร์น = ทุกคน +3 HP, คนหมดสติฟื้นที่ 3 HP, ออกซิเจนเต็ม'],
 flight:['เลือกความยากสถานที่ 1–5 ยิ่งยาก ศัตรูยิ่งแรงแต่ของยิ่งดี','ทางลัด = บินยากขึ้นแต่ได้แต้มปรับลูกเต๋าตอนสร้างสถานที่','ทอย d6 ≥ ความยากการบินเพื่อหลบการต่อสู้ (ทอย 1 = ไม่รอดเสมอ)'],
 space:['แถบไทม์ไลน์บอกว่าศัตรูจะทำอะไรในแต่ละรอบ','อาวุธยานยิงเองทั้งหมด ต้องทอย 4+ (3+ ถ้ามี Combat bridge)','ดาเมจที่โดน: โล่ดูดซับก่อน → เกราะหักออก → ที่เหลือลดโครงสร้าง (SP)','ถ้ามีเป้าหมาย (Objective) ต้องทำครบถึงชนะ ใช้ลูกเรือเช็คค่า','T = หมดเวลาต้องถอย · G = ถ้ายังไม่ชนะรอบนี้ ยานระเบิด · V = ศัตรูถอย'],
 locgen:['ค่าสถานที่สุ่มจากลูกเต๋า ใช้แต้มปรับเพื่อทอยใหม่หรือ ±1','อากาศ YES = หายใจได้ · NO = ใช้ O₂ 1 ต่อการกระทำ · HELL = ใช้ 2 และรักษาได้แค่ครึ่ง','ความลึก = จำนวนแผนที่ที่ต้องผ่านเพื่อพิชิตสถานที่'],
 dun:['เดินได้ทีละช่อง ทุกก้าวใช้ O₂ ตามอากาศ (ช่องสีม่วงหรือขอบแผนที่ = ภายนอก)','E = ศัตรู (ตัวเลข = เลเวลเพิ่ม) · B แดง = บอส · B เทา = Bulkhead เช็ค 2d6+TEC ≥ 10+เลข ลองได้ 3 ครั้ง','M = กับระเบิด ทอย d6+AGI ≥ 8 เพื่อหลบ · L = เลเซอร์ โดนทุกคน · T = สมบัติ','S = ร้าน · + = Med station · O2 = เติมอากาศ · C = Clone station','EX = แผนที่ถัดไป · / = ออกจากสถานที่ · > = ทางเข้า'],
 cmb:['แต่ละรอบ ลูกเรือทุกคนเลือก 1 Action จากมือถือ แล้ว GM กดจบรอบให้ศัตรูเล่น','⚔️ โจมตี: ทอย d6 ≥ ค่า Hit ของอาวุธ · ครึ่งหนึ่งของ MEL/RAN ช่วยลด Hit หรือเพิ่มดาเมจให้อัตโนมัติ','ทอย 6 = ดาเมจ +1 · ทอย 1 = อาวุธติดขัด (รอบหน้ากดแก้)','🛡️ กำบัง: ศัตรูยิงยากขึ้น 1 และเกราะ +1 รอบนี้','↪️ โอบล้อม: ทอย d6+AGI ≥ 8 แล้วการโจมตีครั้งถัดไป +3 ดาเมจ','🏃 หนี: d6 + AGI ต่ำสุดของทีม ≥ AGI สูงสุดของศัตรู (หนีบอสไม่ได้)','โล่ A กันเฉพาะการยิง · โล่ B กันทุกอย่าง · AP = เกราะเหลือครึ่ง · IA = ทะลุเกราะ · IS = ทะลุโล่ · EX = โดนทุกตัว · EMP = ทำลายโล่เท่านั้น','จุดอ่อน = ดาเมจ ×2 · ต้านทาน = ดาเมจ ×½ · HP 0 = หมดสติ · HP −4 = ตาย'],
 loot:['เลือกโบนัสก่อน: เงินเท่าเกรด หรือ Stimpack','ทอย d20 บนตารางสมบัติของสถานที่: เงิน / ไอเทม / อาวุธ / กระสุน / ต้นแบบ','ของเข้าคลังยาน ผู้เล่นกด "หยิบของจากคลังยาน" ที่การ์ดตัวเองได้'],
 shop:['ซื้อได้ไม่เกินเกรดของร้าน','ราคา: G1 2¢ · G2 5¢ · G3 12¢ · G4 30¢ · G5 70¢ · G6 150¢','ขายได้ครึ่งราคา · เติมกระสุนราคาเท่าเกรดอาวุธ'],
 over:['ภารกิจจบ กลับหน้าแรกเพื่อเริ่มใหม่ได้']};
const GEN=['เลเวลอัป: ใช้ XP กองกลาง (เลเวลถัดไป)² แล้วเพิ่มค่าใดก็ได้ 1 (สูงสุด 8)','ของที่ถือ: มือซ้าย/ขวา + เป้ (จำนวน = STR÷2) · เกราะนับจากของทุกชิ้น (สูงสุด 8)','🎁 ส่งของ: ที่การ์ดตัวละคร เลือก "ส่งให้…" ข้างไอเทม'];
function wireGuide(){const b=document.getElementById('gbtn'),o=document.getElementById('guide');if(!b||!o)return;
  b.onclick=()=>{if(!S)return;o.innerHTML=`<div class="gbox"><div class="row"><h2 style="margin:0">❓ ${esc(STEPNAME[S.step]||'')}</h2><button class="bt sm" id="gx" style="margin-left:auto">ปิด</button></div>
    <ul>${(GUIDE[S.step]||[]).map(x=>`<li>${x}</li>`).join('')}</ul>${ROLE==='player'?'<p class="dim">ปุ่มบนมือถือจะส่งคำสั่งไปที่เครื่อง GM ผลลัพธ์ขึ้นทุกจอพร้อมกัน</p>':''}<h3>ทั่วไป</h3><ul>${GEN.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
    o.style.display='flex';$('#gx').onclick=()=>o.style.display='none';o.onclick=e=>{if(e.target===o)o.style.display='none'}}}

// ---------- pixel-art sky ----------
const SHIP_PX=['....XX..........','....XWX.........','E..XXWWXX.......','EEXXXXXXXXXXX...','CEXXXXXXXXXXXXXX','EEXXXXXXXXXXX...','E..XXWWXX.......','....XWX.........','....XX..........'];
const FOE_PX=['..YXX..','.XXXXX.','XXYXYXX','XXXXXXX','.X.X.X.','X.....X'];
let skyT=0,stars=null,shots=[];
function sprite(x,rows,cx,cy,p,pal){const W=rows[0].length*p,H=rows.length*p;rows.forEach((r,j)=>[...r].forEach((ch,i)=>{if(pal[ch]){x.fillStyle=pal[ch];x.fillRect(Math.round(cx-W/2+i*p),Math.round(cy-H/2+j*p),Math.ceil(p),Math.ceil(p))}}))}
function skyLoop(){(window.requestAnimationFrame||(f=>setTimeout(f,60)))(skyLoop);const cv=document.getElementById('sky');if(!cv)return;const x=cv.getContext&&cv.getContext('2d');if(!x)return;
  const w=cv.clientWidth||600,h=cv.clientHeight||260;if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;stars=null}skyT++;
  if(!stars)stars=Array.from({length:110},()=>({x:Math.random()*w,y:Math.random()*h,s:Math.random()<.15?2:1,v:.4+Math.random()*2.4}));
  const fight=S&&S.step==='space'&&S.sp;x.fillStyle='#05040c';x.fillRect(0,0,w,h);
  stars.forEach(s=>{s.x-=s.v*(fight?1.3:3.2);if(s.x<0){s.x=w;s.y=Math.random()*h}x.fillStyle='rgba(255,255,255,'+(.35+s.v/4)+')';x.fillRect(s.x|0,s.y|0,s.s*(fight?1:4),s.s)});
  const P=Math.max(3,Math.round(h/34)),sx=w*(fight?.22:.42),sy=h/2+Math.sin(skyT/30)*h*.05;
  x.fillStyle='rgba(70,229,196,'+(.25+.2*Math.sin(skyT/5))+')';x.fillRect(Math.round(sx-9*P),Math.round(sy-P),Math.round(P*(2+Math.random()*3)),P*2);
  sprite(x,SHIP_PX,sx,sy,P,{X:'#b8c9ea',W:'#6f86c0',E:skyT%6<3?'#46e5c4':'#2b8f7d',C:'#e8fff9'});
  if(fight){S.sp.en.forEach((e,i)=>{if(e.hp<=0)return;const ex=w*(.7+.12*(i%2)),ey=h*(.2+.3*(i%3))+Math.sin((skyT+i*40)/25)*h*.05;
      sprite(x,FOE_PX,ex,ey,P*.9,{X:'#e84f5a',Y:skyT%20<10?'#ffd0d0':'#ff9a9a'});if((skyT+i*37)%70===0)shots.push({x:ex-12,y:ey,v:-7,c:'#ff6b6b'})});
    if(skyT%40===0)shots.push({x:sx+8*P,y:sy,v:10,c:'#fff27a'})}
  shots=shots.filter(s=>(s.x+=s.v)>0&&s.x<w);shots.forEach(s=>{x.fillStyle=s.c;x.fillRect(s.x|0,s.y|0,14,3)})}

// ---------- test hooks ----------
window.__cmd=m=>handleCmd(m);window.__role=r=>{ROLE=r;render()};window.__me=()=>myId;
window.__fsok=()=>{const plain=JSON.parse(JSON.stringify(S));const t=toFS(plain);const nested=o=>Array.isArray(o)?o.some(v=>Array.isArray(v)||nested(v)):(o&&typeof o==='object'?Object.values(o).some(nested):false);return !nested(t)&&JSON.stringify(fromFS(t))===JSON.stringify(plain)};

boot();
})();
