'use strict';
/* ── TimeCard v9 ── single file, no external deps ── */
const DB='tc9';
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYSL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const H12=['1','2','3','4','5','6','7','8','9','10','11','12'];
const MINS=Array.from({length:60},(_,i)=>String(i).padStart(2,'0'));
const TABS={calculator:'Calculator',history:'History',calendar:'Calendar',settings:'Settings'};

let S={
  user:null,users:{},tab:'calculator',
  shifts:[mkSh()],cfg:{rate:'',otW:40},
  ci:null,cit:null,
  calY:new Date().getFullYear(),calM:new Date().getMonth()+1,calSel:null,
  hf:'all',rf:'',rt:'',lm:'login',le:'',
};

function mkSh(){return{id:uid(),date:td(),iH:'9',iM:'00',iP:'AM',oH:'5',oM:'00',oP:'PM'};}
function uid(){return Date.now()+'-'+(Math.random()*99999|0);}
function td(){return new Date().toISOString().split('T')[0];}
function isoD(d){return d.toISOString().split('T')[0];}
function hp(p){let h=0;for(let i=0;i<p.length;i++){h=((h<<5)-h)+p.charCodeAt(i);h|=0;}return h.toString(36);}
function $(i){return document.getElementById(i);}
function $$(s,c){return[...(c||document).querySelectorAll(s)];}
function dv(c,h){const d=document.createElement('div');if(c)d.className=c;if(h!=null)d.innerHTML=h;return d;}
function mk(t,c,h){const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;}

// math
function to24(h,m,ap){let hh=parseInt(h)||0,mm=parseInt(m)||0;if(ap==='AM'){if(hh===12)hh=0;}else{if(hh!==12)hh+=12;}return hh*60+mm;}
function shMins(s){let a=to24(s.iH,s.iM,s.iP),b=to24(s.oH,s.oM,s.oP);if(b<=a)b+=1440;return Math.max(0,b-a);}
function f12(t){let h=Math.floor(t/60)%24,m=t%60,ap=h<12?'AM':'PM';if(h===0)h=12;else if(h>12)h-=12;return h+':'+(String(m).padStart(2,'0'))+' '+ap;}
function fd(m){if(!m||m<=0)return'—';const h=Math.floor(m/60),mn=Math.round(m%60);if(h===0)return mn+'m';if(mn===0)return h+'h';return h+'h '+mn+'m';}
function fp(m){if(!m||m<=0)return'no time';const h=Math.floor(m/60),mn=Math.round(m%60);if(h===0)return mn+' min';if(mn===0)return h+' hr'+(h!==1?'s':'');return h+' hr'+(h!==1?'s':'')+' '+mn+' min';}
function fm(n){return'$'+parseFloat(n).toFixed(2);}
function p2(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
function elp(ms){const s=Math.floor(ms/1000),h=Math.floor(s/3600),min=Math.floor((s%3600)/60),sec=s%60;return(h?h+':':'')+(String(min).padStart(h?2:1,'0'))+':'+(String(sec).padStart(2,'0'));}

// DB
function ldb(){try{const d=JSON.parse(localStorage.getItem(DB)||'{}');if(d.users)S.users=d.users;}catch(e){}}
function sdb(){try{localStorage.setItem(DB,JSON.stringify({users:S.users}));}catch(e){}}
function ents(){return S.users[S.user]?.entries||[];}
function ups(e){if(!S.users[S.user])S.users[S.user]={entries:[]};const a=S.users[S.user].entries,i=a.findIndex(x=>x.id===e.id);if(i>=0)a[i]=e;else a.push(e);sdb();}
function del(id){const u=S.users[S.user];if(u)u.entries=u.entries.filter(e=>e.id!==id);sdb();}
function gcfg(){return S.users[S.user]?.settings||{rate:'',otW:40};}
function scfg(s){if(!S.users[S.user])S.users[S.user]={entries:[]};S.users[S.user].settings=s;sdb();}

// Time select builder
function tsel(opts,val,cls,dat){
  const s=document.createElement('select');if(cls)s.className=cls;
  if(dat)Object.entries(dat).forEach(([k,v])=>s.dataset[k]=v);
  opts.forEach(o=>{const op=document.createElement('option');op.value=o;op.textContent=o;if(String(o)===String(val))op.selected=true;s.appendChild(op);});
  return s;
}
function tpick(iH,iM,iP,dat){
  const w=dv('tp');
  w.append(
    tsel(H12,iH,'ts th',{...dat,f:dat.px+'H'}),
    mk('span','tsep',':'),
    tsel(MINS,iM,'ts tm',{...dat,f:dat.px+'M'}),
    tsel(['AM','PM'],iP,'ts tap',{...dat,f:dat.px+'P'})
  );
  return w;
}

// Clock-in
function stCI(){if(S.cit)clearInterval(S.cit);S.cit=setInterval(tkCI,1000);tkCI();}
function spCI(){if(S.cit){clearInterval(S.cit);S.cit=null;}}
function tkCI(){
  const dot=$('dot'),lbl=$('cilbl'),tmr=$('ctmr'),btn=$('btn-ci');
  if(S.ci){
    if(dot)dot.className='dot on';
    if(lbl)lbl.textContent='Clocked in';
    if(tmr)tmr.textContent=elp(Date.now()-S.ci);
    if(btn){btn.textContent='Clock Out';btn.className='cibtn out';}
  }else{
    if(dot)dot.className='dot';
    if(lbl)lbl.textContent='Not clocked in';
    if(tmr)tmr.textContent='';
    if(btn){btn.textContent='Clock In';btn.className='cibtn';}
  }
}
function togCI(){
  if(!S.ci){S.ci=Date.now();stCI();}
  else{
    const out=Date.now(),mins=Math.round((out-S.ci)/60000);
    ups({id:uid(),clockIn:new Date(S.ci).toISOString(),clockOut:new Date(out).toISOString(),durationMins:mins,note:'',source:'clockin'});
    S.ci=null;spCI();tkCI();
    toast('Saved — '+fp(mins));
    if(S.tab==='history'||S.tab==='calendar')rend();
  }
}

// Live clock
function liveClock(){
  function t(){const c=$('hclock');if(!c)return;const n=new Date();let h=n.getHours(),m=n.getMinutes(),s=n.getSeconds(),ap=h<12?'AM':'PM';if(h===0)h=12;else if(h>12)h-=12;c.textContent=h+':'+(String(m).padStart(2,'0'))+':'+(String(s).padStart(2,'0'))+' '+ap;}
  t();setInterval(t,1000);
}

// Toast
let _tt=null;
function toast(msg){
  const t=$('toast');t.textContent=msg;t.style.opacity='1';t.style.transform='translateX(-50%) translateY(0)';
  if(_tt)clearTimeout(_tt);
  _tt=setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(-50%) translateY(10px)';},2600);
}

// Export CSV
function expCSV(){
  const ee=ents();if(!ee.length){toast('No entries to export');return;}
  const r=parseFloat(gcfg().rate)||0;
  const rows=[['Date','Day','Clock In','Clock Out','Hours','Note',r?'Pay':''].filter(Boolean)];
  [...ee].sort((a,b)=>new Date(a.clockIn)-new Date(b.clockIn)).forEach(e=>{
    const ci=new Date(e.clockIn),co=new Date(e.clockOut);
    const row=[ci.toLocaleDateString(),DAYSL[ci.getDay()],f12(ci.getHours()*60+ci.getMinutes()),f12(co.getHours()*60+co.getMinutes()),(e.durationMins/60).toFixed(2),e.note||''];
    if(r)row.push((e.durationMins/60*r).toFixed(2));
    rows.push(row);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='timecard.csv';a.click();
  toast('Exported!');
}

// Auth
function showL(){
  $('login').classList.remove('hide');$('app').classList.add('hide');
  const isL=S.lm==='login';
  $('lt').textContent=isL?'Welcome back':'Create account';
  $('ls').textContent=isL?'Track your hours. Know your pay.':'Free — data stays on your device.';
  $('lbtn').textContent=isL?'Sign in':'Create account';
  const err=$('lerr');err.classList.toggle('hide',!S.le);err.textContent=S.le||'';
  $('lf').innerHTML=`
    ${!isL?`<div class="lfg"><label>Your name</label><input id="ln" type="text" placeholder="Full name" autocomplete="name"></div>`:''}
    <div class="lfg"><label>Email</label><input id="le" type="email" placeholder="you@email.com" autocomplete="email"></div>
    <div class="lfg"><label>Password</label><input id="lp" type="password" placeholder="••••••••"></div>`;
  $('ltog').innerHTML=isL?`No account? <button id="ltb">Register free</button>`:`Have an account? <button id="ltb">Sign in</button>`;
  $('lbtn').onclick=doL;
  $('lp').onkeydown=e=>{if(e.key==='Enter')doL();};
  $('ltb').onclick=()=>{S.lm=isL?'register':'login';S.le='';showL();};
}

function doL(){
  const email=$('le').value.trim().toLowerCase(),pass=$('lp').value;
  if(S.lm==='register'){
    const name=$('ln').value.trim();
    if(!name||!email||!pass){S.le='All fields required.';showL();return;}
    if(S.users[email]){S.le='Email already registered.';showL();return;}
    S.users[email]={name,passHash:hp(pass),entries:[]};sdb();
    S.user=email;S.le='';launch();
  }else{
    if(!email||!pass){S.le='Enter email and password.';showL();return;}
    const u=S.users[email];
    if(!u||u.passHash!==hp(pass)){S.le='Invalid email or password.';showL();return;}
    S.user=email;S.le='';launch();
  }
}

function launch(){
  $('login').classList.add('hide');$('app').classList.remove('hide');
  S.cfg={...gcfg()};liveClock();if(S.ci)stCI();rend();
}

// Navigation
function setTab(t){
  S.tab=t;
  $$('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));
  $('htitle').textContent=TABS[t]||t;
  rend();
}

function rend(){
  const pg=$('pg');pg.innerHTML='';
  ({calculator:calcPg,history:histPg,calendar:calPg,settings:settPg})[S.tab]?.();
}

/* ════ CALCULATOR ════════════════════════════════════ */
function calcPg(){
  const pg=$('pg');
  const c=S.cfg,rate=parseFloat(c.rate)||0,otW=parseFloat(c.otW)||40;

  // Rate bar
  const rb=dv('card');
  rb.innerHTML=`<div class="g2">
    <div><label class="lbl">Hourly Rate ($)</label>
      <input class="inp" id="cr" type="number" value="${c.rate||''}" placeholder="0.00" inputmode="decimal">
    </div>
    <div><label class="lbl">OT after (h/wk)</label>
      <input class="inp" id="cot" type="number" value="${c.otW||40}" inputmode="numeric">
    </div>
  </div>`;
  rb.querySelector('#cr').addEventListener('input',e=>{S.cfg.rate=e.target.value;scfg(S.cfg);reC();});
  rb.querySelector('#cot').addEventListener('input',e=>{S.cfg.otW=parseFloat(e.target.value)||40;scfg(S.cfg);reC();});
  pg.appendChild(rb);

  // Shift cards
  S.shifts.forEach(s=>pg.appendChild(buildSC(s,rate,otW)));

  // Add shift btn
  const ab=mk('button','addbtn');
  ab.innerHTML=`<svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg> Add another shift`;
  ab.addEventListener('click',()=>{S.shifts.push(mkSh());reC();});
  pg.appendChild(ab);

  // Summary
  const totM=S.shifts.reduce((s,r)=>s+shMins(r),0);
  if(totM>0){
    const tH=totM/60,regH=Math.min(tH,otW),otH=Math.max(0,tH-otW),pay=regH*rate+otH*rate*1.5;
    const sc=dv('sumcard');
    sc.innerHTML=`
      <div class="sumn">${fd(totM)}</div>
      <div class="sump">${fp(totM)}</div>
      <div class="sumgrid">
        <div class="si"><div class="sil">Regular</div><div class="siv">${fd(regH*60)}</div><div class="sis">${rate>0?fm(regH*rate):''}</div></div>
        <div class="si ot"><div class="sil">Overtime</div><div class="siv">${otH>0?fd(otH*60):'None'}</div><div class="sis">${rate>0&&otH>0?fm(otH*rate*1.5)+' (1.5×)':''}</div></div>
        ${rate>0?`<div class="si py"><div class="sil">Est. Pay</div><div class="siv">${fm(pay)}</div><div class="sis">@ ${fm(rate)}/hr</div></div>`:''}
      </div>
      <div class="sumtxt">You worked <strong>${fp(totM)}</strong>${otH>0?`, including <strong>${fp(otH*60)} overtime</strong>`:''}${rate>0?`. Estimated pay: <strong>${fm(pay)}</strong>`:''}.
      </div>
      <div class="sumacts">
        <button class="btn bp sumsave" id="dosave">Save to history</button>
        <button class="btn bg sumclr" id="doclr">Clear all</button>
      </div>`;
    pg.appendChild(sc);
    sc.querySelector('#dosave').addEventListener('click',()=>{
      let n=0;
      S.shifts.forEach(r=>{
        const m=shMins(r);if(!m||!r.date)return;
        const a=to24(r.iH,r.iM,r.iP),b=to24(r.oH,r.oM,r.oP);
        ups({id:uid(),clockIn:new Date(r.date+'T'+p2(a)).toISOString(),clockOut:new Date(r.date+'T'+p2(b)).toISOString(),durationMins:m,note:'',source:'manual'});n++;
      });
      toast(n?n+' shift'+(n!==1?'s':'')+' saved!':'Nothing to save');
    });
    sc.querySelector('#doclr').addEventListener('click',()=>{S.shifts=[mkSh()];reC();});
  }
}

function buildSC(s,rate,otW){
  const mins=shMins(s);
  const card=dv('scard'+(mins>0?' has':''));

  // Date + delete
  const dr=dv('sdrow');
  const dw=dv('sdwrap');
  const dl=mk('label','lbl','Date');
  const di=mk('input','inp');di.type='date';di.value=s.date||'';di.dataset.id=s.id;
  const dy=dv('sday');
  if(s.date){const d=new Date(s.date+'T12:00:00');dy.textContent=DAYSL[d.getDay()];}
  di.addEventListener('change',e=>{const r=S.shifts.find(x=>x.id===e.target.dataset.id);if(r){r.date=e.target.value;reC();}});
  dw.append(dl,di,dy);
  const db=mk('button','sdel','×');
  db.addEventListener('click',()=>{S.shifts=S.shifts.length===1?[mkSh()]:S.shifts.filter(r=>r.id!==s.id);reC();});
  dr.append(dw,db);card.appendChild(dr);

  // In / Out
  const tr=dv('strow');
  const ic=dv('');ic.innerHTML='<span class="stlbl">Clock In</span>';
  ic.appendChild(tpick(s.iH,s.iM,s.iP,{id:s.id,px:'i'}));
  const oc=dv('');oc.innerHTML='<span class="stlbl">Clock Out</span>';
  oc.appendChild(tpick(s.oH,s.oM,s.oP,{id:s.id,px:'o'}));
  tr.append(ic,oc);card.appendChild(tr);

  // Bind time selects
  $$('.ts',card).forEach(sel=>sel.addEventListener('change',e=>{
    const r=S.shifts.find(x=>x.id===e.target.dataset.id);
    if(r){r[e.target.dataset.f]=e.target.value;reC();}
  }));

  // Result
  const res=dv('sres');
  if(mins>0){
    res.innerHTML=`<span class="srn${mins/60>otW?' ot':''}">${fd(mins)}</span><span class="srp">${fp(mins)}</span>${rate>0?`<span class="srpay">${fm(mins/60*rate)}</span>`:''}`;
  }else{
    res.innerHTML=`<span class="srmt">Set times to calculate</span>`;
  }
  card.appendChild(res);
  return card;
}

function reC(){const pg=$('pg'),y=pg.scrollTop;pg.innerHTML='';calcPg();pg.scrollTop=y;}

/* ════ HISTORY ═══════════════════════════════════════ */
function histPg(){
  const pg=$('pg');
  const sets=gcfg(),rate=parseFloat(sets.rate)||0,otW=sets.otW||40;

  // Pay period calc
  const rc=dv('card');
  rc.innerHTML=`<div class="ctit">Pay Period Calculator</div>
    <div class="g2" style="margin-bottom:14px">
      <div><label class="lbl">From</label><input class="inp" type="date" id="hrf" value="${S.rf||''}"></div>
      <div><label class="lbl">To</label><input class="inp" type="date" id="hrt" value="${S.rt||''}"></div>
    </div>`;
  if(S.rf&&S.rt){
    const from=new Date(S.rf+'T00:00:00'),to=new Date(S.rt+'T23:59:59');
    let rM=0;const ds=new Set();
    ents().filter(e=>{const d=new Date(e.clockIn);return d>=from&&d<=to;}).forEach(e=>{rM+=e.durationMins||0;ds.add(isoD(new Date(e.clockIn)));});
    const rH=rM/60,rReg=Math.min(rH,otW),rOT=Math.max(0,rH-otW),rPay=rReg*rate+rOT*rate*1.5;
    if(rM>0){
      const sg=dv('srow');
      sg.innerHTML=`
        <div class="sbox ca"><div class="sbl">Total</div><div class="sbv">${fd(rM)}</div><div class="sbs">${fp(rM)}</div></div>
        <div class="sbox"><div class="sbl">Days</div><div class="sbv">${ds.size}</div><div class="sbs">worked</div></div>
        <div class="sbox${rOT>0?' co':''}"><div class="sbl">OT</div><div class="sbv">${rOT>0?fd(rOT*60):'None'}</div></div>
        ${rate>0?`<div class="sbox cg"><div class="sbl">Pay</div><div class="sbv">${fm(rPay)}</div></div>`:''}`;
      rc.appendChild(sg);
      const co=dv('callout');
      co.innerHTML=`<strong>${new Date(S.rf+'T12:00:00').toLocaleDateString([],{month:'short',day:'numeric'})}</strong> – <strong>${new Date(S.rt+'T12:00:00').toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'})}</strong>: <strong>${fp(rM)}</strong> over <strong>${ds.size} day${ds.size!==1?'s':''}</strong>${rOT>0?`, incl. <strong>${fp(rOT*60)} OT</strong>`:''}${rate>0?`. Pay: <strong>${fm(rPay)}</strong>`:''}.`;
      rc.appendChild(co);
    }else{
      rc.innerHTML+=`<div class="callout" style="border-left-color:var(--amb)">No hours found in this range.</div>`;
    }
  }
  rc.querySelector('#hrf').addEventListener('change',e=>{S.rf=e.target.value;rend();});
  rc.querySelector('#hrt').addEventListener('change',e=>{S.rt=e.target.value;rend();});
  pg.appendChild(rc);

  // Entries list
  const lc=dv('card');
  const now=new Date();
  const ftw=dv('ftabs');
  ['all','today','week','month'].forEach(f=>{
    const b=mk('button','ftab'+(S.hf===f?' on':''),f.charAt(0).toUpperCase()+f.slice(1));
    b.addEventListener('click',()=>{S.hf=f;rend();});ftw.appendChild(b);
  });
  lc.appendChild(ftw);

  const raw=ents().filter(e=>{
    const d=new Date(e.clockIn);
    if(S.hf==='today')return d.toDateString()===now.toDateString();
    if(S.hf==='week')return(now-d)<7*86400000;
    if(S.hf==='month')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    return true;
  }).sort((a,b)=>new Date(b.clockIn)-new Date(a.clockIn));

  const tot=raw.reduce((s,e)=>s+(e.durationMins||0),0);
  if(tot>0){
    const inf=dv('');
    inf.innerHTML=`<span style="font-size:15px;color:var(--txt2)">${raw.length} record${raw.length!==1?'s':''} · <strong style="color:var(--acc)">${fd(tot)}</strong> — ${fp(tot)}${rate>0?` · <span style="color:var(--grn)">${fm(tot/60*rate)}</span>`:''}</span>`;
    inf.style.marginBottom='14px';lc.appendChild(inf);
  }

  if(!raw.length){lc.innerHTML+=`<div class="empty">No records for this period.</div>`;}
  else raw.forEach(e=>{
    const ci=new Date(e.clockIn),co=new Date(e.clockOut);
    const he=dv('he');
    he.innerHTML=`
      <div class="hedate">${ci.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric',year:'numeric'})}</div>
      <div class="hetime">${f12(ci.getHours()*60+ci.getMinutes())} → ${f12(co.getHours()*60+co.getMinutes())}</div>
      <div class="hedur">${fd(e.durationMins)} <span>${fp(e.durationMins)}</span>${rate>0?` <span class="hepay">${fm(e.durationMins/60*rate)}</span>`:''}</div>
      ${e.note?`<div class="henote">${e.note}</div>`:''}
      <div class="heacts">
        <button class="btn bsm bg hed" data-id="${e.id}">Edit</button>
        <button class="btn bsm bd hdl" data-id="${e.id}">Delete</button>
      </div>
      <div class="heef" id="ef-${e.id}"></div>`;
    lc.appendChild(he);
  });
  pg.appendChild(lc);

  $$('.hdl',pg).forEach(b=>b.addEventListener('click',e=>{
    if(confirm('Delete this entry?')){del(e.currentTarget.dataset.id);rend();toast('Deleted');}
  }));
  $$('.hed',pg).forEach(b=>b.addEventListener('click',e=>{
    const id=e.currentTarget.dataset.id,ef=$('ef-'+id);if(!ef)return;
    if(ef.classList.contains('open')){ef.classList.remove('open');ef.innerHTML='';return;}
    const entry=ents().find(x=>x.id===id);if(!entry)return;
    ef.classList.add('open');ef.appendChild(buildEF(entry,false,()=>rend()));
  }));
}

/* ════ CALENDAR ══════════════════════════════════════ */
function calPg(){
  const pg=$('pg');
  const {calY:y,calM:m,calSel:sel_}=S;
  const byDay={};
  ents().forEach(e=>{
    const d=new Date(e.clockIn);
    if(d.getFullYear()===y&&d.getMonth()+1===m){const day=d.getDate();byDay[day]=(byDay[day]||0)+(e.durationMins||0);}
  });
  const tot=Object.values(byDay).reduce((a,b)=>a+b,0);
  const first=new Date(y,m-1,1).getDay(),days=new Date(y,m,0).getDate(),now=new Date();

  const cc=dv('card');
  const top=dv('caltop');
  const pv=mk('button','btn bg bsm','‹');
  pv.addEventListener('click',()=>{if(S.calM===1){S.calM=12;S.calY--;}else S.calM--;S.calSel=null;rend();});
  const nx=mk('button','btn bg bsm','›');
  nx.addEventListener('click',()=>{if(S.calM===12){S.calM=1;S.calY++;}else S.calM++;S.calSel=null;rend();});
  const mid=dv('');
  mid.innerHTML=`<div class="calm">${MON[m-1]} ${y}</div>${tot>0?`<div class="calsub">${fp(tot)} logged</div>`:''}`;
  top.append(pv,mid,nx);cc.appendChild(top);

  const cg=dv('calg');
  DAYS.forEach(d=>cg.appendChild(dv('calnh',d)));
  for(let i=0;i<first;i++)cg.appendChild(dv('cald emp'));
  for(let d=1;d<=days;d++){
    const isT=y===now.getFullYear()&&m===now.getMonth()+1&&d===now.getDate();
    const mins=byDay[d]||0;
    const ds=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const cell=dv('cald '+(mins>0?'wk':'nw')+(isT?' td':'')+(sel_===ds?' sl':''));
    cell.innerHTML=`<span class="cdn">${d}</span>${mins>0?`<span class="cdh">${fd(mins)}</span>`:''}`;
    cell.addEventListener('click',()=>{S.calSel=S.calSel===ds?null:ds;rend();});
    cg.appendChild(cell);
  }
  cc.appendChild(cg);
  pg.appendChild(cc);

  if(sel_){
    const panel=dv('dpanel');
    const dee=ents().filter(e=>isoD(new Date(e.clockIn))===sel_);
    const dm=dee.reduce((s,e)=>s+(e.durationMins||0),0);
    const r=parseFloat(gcfg().rate)||0;

    const ph=dv('dphdr');
    ph.innerHTML=`<span class="dpdate">${new Date(sel_+'T12:00:00').toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'})}</span>`;
    const ab=mk('button','btn bp bsm','+ Add');
    ab.addEventListener('click',()=>{
      const af=$('dpaf');if(!af)return;
      if(af.classList.contains('open')){af.classList.remove('open');af.innerHTML='';return;}
      af.classList.add('open');
      af.appendChild(buildEF({id:'_new',clockIn:new Date(sel_+'T09:00').toISOString(),clockOut:new Date(sel_+'T17:00').toISOString(),durationMins:480,note:''},true,()=>rend()));
    });
    ph.appendChild(ab);panel.appendChild(ph);

    const tb=dv('dtot');
    tb.innerHTML=`<span class="dtotn">${dm>0?fd(dm):'No hours'}</span><span class="dtotp">${fp(dm)}</span>${r>0&&dm>0?`<span class="dtotpay">${fm(dm/60*r)}</span>`:''}`;
    panel.appendChild(tb);

    if(!dee.length)panel.innerHTML+=`<div class="empty" style="padding:1rem">No entries yet. Tap "+ Add".</div>`;
    dee.forEach(e=>{
      const ci=new Date(e.clockIn),co=new Date(e.clockOut);
      const de=dv('dpe');
      de.innerHTML=`
        <div class="dpet">${f12(ci.getHours()*60+ci.getMinutes())} → ${f12(co.getHours()*60+co.getMinutes())}</div>
        <div class="dped">${fd(e.durationMins)} <span>${fp(e.durationMins)}</span></div>
        ${e.note?`<div class="henote">${e.note}</div>`:''}
        <div class="dpeacts">
          <button class="btn bg bsm dped2" data-id="${e.id}">Edit</button>
          <button class="btn bd bsm dpdl" data-id="${e.id}">Delete</button>
        </div>
        <div class="heef" id="dpef-${e.id}"></div>`;
      panel.appendChild(de);
    });
    const af=dv('heef');af.id='dpaf';panel.appendChild(af);

    $$('.dpdl',panel).forEach(b=>b.addEventListener('click',e=>{
      if(confirm('Delete?')){del(e.currentTarget.dataset.id);rend();toast('Deleted');}
    }));
    $$('.dped2',panel).forEach(b=>b.addEventListener('click',e=>{
      const id=e.currentTarget.dataset.id,ef=$('dpef-'+id);if(!ef)return;
      if(ef.classList.contains('open')){ef.classList.remove('open');ef.innerHTML='';return;}
      const entry=ents().find(x=>x.id===id);if(!entry)return;
      ef.classList.add('open');ef.appendChild(buildEF(entry,false,()=>rend()));
    }));
    pg.appendChild(panel);
  }
}

/* ════ EDIT FORM ════════════════════════════════════ */
function buildEF(entry,isNew,onDone){
  const ci=new Date(entry.clockIn),co=new Date(entry.clockOut);
  const ds=isoD(ci);
  let ih=ci.getHours(),im=ci.getMinutes(),ip=ih<12?'AM':'PM';if(ih===0)ih=12;else if(ih>12)ih-=12;
  let oh=co.getHours(),om=co.getMinutes(),op=oh<12?'AM':'PM';if(oh===0)oh=12;else if(oh>12)oh-=12;
  const eid='e'+uid();

  const form=dv('ef');
  form.innerHTML=`
    <div class="eft">${isNew?'Add Entry':'Edit Entry'}</div>
    <div class="g2" style="margin-bottom:12px">
      <div><label class="lbl">Date</label><input class="inp efdt" type="date" value="${ds}"></div>
      <div><label class="lbl">Note</label><input class="inp efnt" type="text" value="${entry.note||''}" placeholder="Optional"></div>
    </div>
    <div class="g2" style="margin-bottom:12px">
      <div><label class="lbl">Clock In</label><div id="${eid}i" class="tp"></div></div>
      <div><label class="lbl">Clock Out</label><div id="${eid}o" class="tp"></div></div>
    </div>
    <div class="efprev" id="${eid}p"></div>
    <div class="efacts">
      <button class="btn bp bsm efsv">${isNew?'Add':'Update'}</button>
      <button class="btn bg bsm efcx">Cancel</button>
    </div>`;

  const inD=form.querySelector('#'+eid+'i'),outD=form.querySelector('#'+eid+'o');
  const eih=tsel(H12,String(ih),'ts th',{}),eim=tsel(MINS,String(im).padStart(2,'0'),'ts tm',{}),eip=tsel(['AM','PM'],ip,'ts tap',{});
  inD.append(eih,mk('span','tsep',':'),eim,eip);
  const eoh=tsel(H12,String(oh),'ts th',{}),eom=tsel(MINS,String(om).padStart(2,'0'),'ts tm',{}),eop=tsel(['AM','PM'],op,'ts tap',{});
  outD.append(eoh,mk('span','tsep',':'),eom,eop);

  function prev(){
    const a=to24(eih.value,eim.value,eip.value),b=to24(eoh.value,eom.value,eop.value);
    let d=b-a;if(d<=0)d+=1440;
    const pv=form.querySelector('#'+eid+'p');
    if(pv)pv.innerHTML=d>0?`<strong>${fd(d)}</strong> <span style="color:var(--txt2)">— ${fp(d)}</span>`:`<span style="color:var(--red)">End must be after start</span>`;
  }
  [eih,eim,eip,eoh,eom,eop].forEach(s=>s.addEventListener('change',prev));prev();

  form.querySelector('.efcx').addEventListener('click',()=>{
    const p=form.closest('.heef');if(p){p.classList.remove('open');p.innerHTML='';}
  });
  form.querySelector('.efsv').addEventListener('click',()=>{
    const dv2=form.querySelector('.efdt').value||ds;
    const a=to24(eih.value,eim.value,eip.value),b=to24(eoh.value,eom.value,eop.value);
    let d=b-a;if(d<=0)d+=1440;if(d<=0){toast('Invalid times');return;}
    ups({...(isNew?{id:uid()}:entry),clockIn:new Date(dv2+'T'+p2(a)).toISOString(),clockOut:new Date(dv2+'T'+p2(b)).toISOString(),durationMins:d,note:form.querySelector('.efnt').value.trim(),source:'manual'});
    toast(isNew?'Entry added':'Updated');onDone();
  });
  return form;
}

/* ════ SETTINGS ══════════════════════════════════════ */
function settPg(){
  const pg=$('pg');
  const s=gcfg();

  const c1=dv('card');
  c1.innerHTML=`<div class="ctit">Pay Settings</div>
    <div class="g2" style="margin-bottom:16px">
      <div><label class="lbl">Hourly Rate ($)</label>
        <input class="inp" type="number" id="sr" value="${s.rate||''}" placeholder="15.00" min="0" step="0.01" inputmode="decimal">
      </div>
      <div><label class="lbl">OT after (h/wk)</label>
        <input class="inp" type="number" id="sot" value="${s.otW||40}" min="1" inputmode="numeric">
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:14px">
      <button class="btn bp" id="svs">Save settings</button>
      <span id="svok" style="display:none;font-size:16px;color:var(--grn);font-weight:700">Saved ✓</span>
    </div>`;
  c1.querySelector('#svs').addEventListener('click',()=>{
    const ns={rate:c1.querySelector('#sr').value,otW:parseFloat(c1.querySelector('#sot').value)||40};
    scfg(ns);S.cfg={...ns};
    const ok=c1.querySelector('#svok');ok.style.display='inline';setTimeout(()=>ok.style.display='none',2000);
    toast('Settings saved');
  });
  pg.appendChild(c1);

  const c2=dv('card');
  const u=S.users[S.user];
  c2.innerHTML=`<div class="ctit">Account</div>
    <div style="margin-bottom:14px">
      <div style="font-size:18px;font-weight:600">${u?.name||''}</div>
      <div style="font-size:15px;color:var(--txt3)">${S.user}</div>
    </div>
    <div style="font-size:15px;color:var(--txt2);margin-bottom:16px;line-height:1.6">
      All data is stored locally in your browser. Use the export button in the header to download your records as CSV.
    </div>
    <button class="btn bd" id="clrd">Clear all my data</button>`;
  c2.querySelector('#clrd').addEventListener('click',()=>{
    if(confirm('Delete ALL your data? This cannot be undone.')){
      const u=S.users[S.user];if(u){u.entries=[];sdb();toast('Cleared');rend();}
    }
  });
  pg.appendChild(c2);
}

/* ════ BOOT ═════════════════════════════════════════ */
ldb();showL();

$('btn-out').addEventListener('click',()=>{
  S.user=null;S.ci=null;spCI();
  $('app').classList.add('hide');showL();
  S.lm='login';S.le='';showL();
});
$('btn-exp').addEventListener('click',expCSV);
$('btn-ci').addEventListener('click',togCI);
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));

// PWA
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
}