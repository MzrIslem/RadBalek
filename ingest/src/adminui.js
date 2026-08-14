// Private mission-control dashboard served at GET /admin.
// Four tabs: 🏠 Système (pipeline/source/push health + force refresh),
// 📋 Signalements (report moderation), 💬 Avis (app feedback),
// 🚀 Version (publish the in-app update banner + GitHub download counts).
// The page is public but inert without the ADMIN_KEY, which the curator
// enters once (kept in localStorage, sent only to this same origin).
// NOTE: this file is a JS template literal — no backticks or ${ } inside.
export const ADMIN_HTML = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#006A60">
<title>Rad Balek — Contrôle</title>
<style>
:root{--p:#006A60;--bg:#F5FAF8;--s1:#EFF5F2;--s2:#E2E9E6;--tx:#171D1B;--mut:#5c6663;
--red:#BA1A1A;--redc:#FFDAD6;--org:#964900;--orgc:#FFDCC2;--grn:#1D6E37;--grnc:#C9EFCF;--yel:#6D5E00;--yelc:#F0E395}
@media(prefers-color-scheme:dark){:root{--bg:#0E1513;--s1:#161D1B;--s2:#232A28;--tx:#DDE4E1;--mut:#93a09c;
--red:#FFB4AB;--redc:#7B1712;--org:#FFB77C;--orgc:#6B3200;--grn:#8FD69B;--grnc:#1D5430;--yel:#DCC94B;--yelc:#524800}}
*{box-sizing:border-box;margin:0}body{font-family:"Segoe UI",Roboto,"Noto Naskh Arabic",sans-serif;background:var(--bg);color:var(--tx);padding:14px;max-width:760px;margin:0 auto}
h1{font-size:18px;display:flex;align-items:center;gap:8px;margin-bottom:4px}
.sub{font-size:12px;color:var(--mut);margin-bottom:14px}
.bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.pill{background:var(--s1);border-radius:99px;padding:6px 12px;font-size:12px;font-weight:600}
.pill b{font-size:13px}
.card{background:var(--s1);border-radius:16px;padding:13px;margin-bottom:10px}
.row{display:flex;gap:10px;align-items:flex-start}
.tx{flex:1;min-width:0}
.t1{font-size:14px;font-weight:700}
.t2{font-size:12.5px;color:var(--mut);margin-top:2px;word-break:break-word}
.err{color:var(--red);font-weight:600}
.st{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:99px;display:inline-block;margin-top:6px}
.s-new{background:var(--yelc);color:var(--yel)}.s-auto-ok{background:var(--s2);color:var(--mut)}
.s-flagged{background:var(--redc);color:var(--red)}.s-community-confirmed{background:var(--orgc);color:var(--org)}
.s-verified{background:var(--grnc);color:var(--grn)}.s-rejected{background:var(--s2);color:var(--mut);text-decoration:line-through}
.acts{display:flex;gap:8px;margin-top:9px;flex-wrap:wrap}
button{font:inherit;font-weight:700;font-size:12.5px;border:0;border-radius:99px;padding:8px 16px;cursor:pointer}
button:disabled{opacity:.6;cursor:wait}
.ok{background:var(--grnc);color:var(--grn)}.no{background:var(--redc);color:var(--red)}
.ghost{background:var(--s2);color:var(--tx)}
input{font:inherit;width:100%;padding:10px 14px;border-radius:12px;border:1px solid var(--s2);background:var(--bg);color:var(--tx)}
label{font-size:11px;font-weight:600;color:var(--mut);display:block;margin:9px 0 3px}
canvas{width:100%;height:90px;display:block;margin-top:8px}
#login{margin:40px auto;max-width:340px;text-align:center}
.hide{display:none}
</style></head><body>
<div id="login">
  <h1 style="justify-content:center">🛡️ Rad Balek — Contrôle</h1>
  <p class="sub">Clé administrateur</p>
  <input id="key" type="password" placeholder="ADMIN_KEY">
  <button class="ghost" style="margin-top:10px;width:100%" onclick="saveKey()">Entrer</button>
</div>
<div id="app" class="hide">
  <h1>🛡️ Contrôle <span style="font-size:11px;color:var(--mut);font-weight:400" id="upd"></span></h1>
  <p class="sub" id="subline"></p>
  <div class="bar">
    <button class="ghost" id="tabO" onclick="setTab('overview')">🏠 Système</button>
    <button class="ghost" id="tabR" onclick="setTab('reports')">📋 Signalements</button>
    <button class="ghost" id="tabF" onclick="setTab('feedback')">💬 Avis</button>
    <button class="ghost" id="tabV" onclick="setTab('version')">🚀 Version</button>
  </div>
  <div class="bar" id="stats"></div>
  <div id="list"></div>
</div>
<script>
const CATS={fire:"🔥 Feu",smoke:"💨 Fumée",road:"🚗 Route",flood:"🌊 Oued/Crue",animal:"🐾 Animal",heat:"🌡️ Chaleur",other:"ℹ️ Autre"};
const FBT={bug:"🐞 Problème",idea:"💡 Idée",comment:"💬 Avis"};
const HAZ={heat:"🌡️",fire:"🔥",flood:"🌊",storm:"⛈️",wind:"💨",quake:"🌍",road:"🚗",rain:"🌧️",other:"⚠️"};
const NAMES={};
let KEY=localStorage.getItem("rb_admin_key")||"";
let TAB=localStorage.getItem("rb_admin_tab")||"overview";
let GH={at:0,data:null};
function setTab(t){TAB=t;localStorage.setItem("rb_admin_tab",t);boot()}
// Key travels in the Authorization header only — never in the URL.
const auth=()=>({headers:{authorization:"Bearer "+KEY}});
// Everything below builds HTML with innerHTML, so every interpolated value
// must be fully escaped: replacing only "<" (or only the quote, for
// attributes) still lets a stored value close an attribute or inject an
// onerror= handler. Reports/feedback text is attacker-supplied, and the
// dashboard runs with the ADMIN_KEY in localStorage — one injected script here
// hands over moderation.
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const attr=esc;
function ago(iso){if(!iso)return"—";const m=Math.round((Date.now()-Date.parse(iso))/60000);
  if(m<1)return"à l’instant";if(m<60)return"il y a "+m+" min";if(m<48*60)return"il y a "+Math.round(m/60)+" h";return"il y a "+Math.round(m/1440)+" j"}
function saveKey(){KEY=document.getElementById("key").value.trim();localStorage.setItem("rb_admin_key",KEY);boot()}
function reveal(){document.getElementById("login").classList.add("hide");document.getElementById("app").classList.remove("hide")}
async function aget(p){const r=await fetch(p,auth());
  if(r.status===403){localStorage.removeItem("rb_admin_key");KEY="";alert("Clé invalide");return null}
  reveal();return r.json()}
async function boot(){
  if(!KEY)return;
  [["tabO","overview"],["tabR","reports"],["tabF","feedback"],["tabV","version"]].forEach(x=>{
    document.getElementById(x[0]).style.background=TAB===x[1]?"var(--grnc)":"var(--s2)"});
  document.getElementById("upd").textContent="· "+new Date().toLocaleTimeString("fr",{hour:"2-digit",minute:"2-digit"});
  if(TAB==="overview"){const o=await aget("/v1/admin/overview");if(!o)return;
    let h=[];try{h=await(await fetch("/v1/history.json")).json()}catch(e){}
    paintOverview(o,h);return}
  if(TAB==="version"){const o=await aget("/v1/admin/overview");if(!o)return;
    const rel=await ghReleases();paintVersion(o,rel);return}
  const r=await fetch("/v1/admin/reports"+(TAB==="feedback"?"?kind=feedback":""),auth());
  if(r.status===403){localStorage.removeItem("rb_admin_key");KEY="";alert("Clé invalide");return}
  reveal();
  if(!Object.keys(NAMES).length){
    try{(await (await fetch("/v1/wilayas.json")).json()).forEach(w=>NAMES[w.code]=w.fr)}catch(e){}
  }
  const data=await r.json();
  if(TAB==="feedback"){paintFb(data.reports||[]);return}
  let snap=null,push=null;
  try{snap=await (await fetch("/v1/alerts.json?lite=1")).json()}catch(e){}
  try{push=await (await fetch("/v1/push-status.json")).json()}catch(e){}
  paint(data.reports||[],snap,push);
}
// ---- 🏠 Système ----
function paintOverview(o,hist){
  document.getElementById("subline").textContent="État du pipeline, des sources et des notifications — rafraîchi chaque minute.";
  const st=o.stats||{},bc=st.byColor||{},p=o.push||{},cfg=o.config||{},src=o.sources||{};
  const age=o.generatedAt?Math.round((Date.now()-Date.parse(o.generatedAt))/60000):null;
  // Cron runs every 10 min: >15 = late (orange), >30 = stalled (red).
  const ageS=age==null||age>30?' style="background:var(--redc);color:var(--red)"':(age>15?' style="background:var(--orgc);color:var(--org)"':"");
  const ck=b=>b?"✓":'<span class="err">✗</span>';
  document.getElementById("stats").innerHTML=
    '<span class="pill"'+ageS+'>⏱ données: <b>'+(age==null?"—":age+" min")+'</b></span>'+
    '<span class="pill">🔴 <b>'+(bc.red||0)+'</b> · 🟠 <b>'+(bc.orange||0)+'</b> · 🟡 <b>'+(bc.yellow||0)+'</b></span>'+
    '<span class="pill">🧯 incidents: <b>'+(st.incidents||0)+'</b></span>'+
    '<span class="pill">📨 push: <b>'+(p.sent==null?"–":p.sent)+'</b> · '+(p.at?ago(p.at):"jamais")+(p.fatal?' · <span class="err">panne</span>':"")+'</span>'+
    '<span class="pill">🤖 IA '+ck(cfg.gemini)+' · 📨 FCM '+ck(cfg.push)+' · 🛰️ FIRMS '+ck(cfg.firms)+'</span>';
  const errFor=n=>{const e=(o.errors||[]).find(x=>x.source===n);return e?e.error:null};
  const KNOWN=["onm","firms","dgpc-telegram","dgpc-web","usgs","craag","press"];
  const rows=[
    ["onm","🌡️ Météo Algérie (ONM)",(st.onmEntries||0)+" entrées · "+(st.activeAlerts||0)+" vigilances actives"],
    ["firms","🛰️ NASA FIRMS",st.firmsSkipped?"clé absente":((st.fireClusters||0)+" foyers détectés")],
    ["dgpc-telegram","🚒 Protection Civile (Telegram)",(st.dgpcPosts||0)+" posts"+(st.dgpcSitrep?" · sitrep "+ago(st.dgpcSitrep.postedAt):"")],
    ["dgpc-web","🏛️ Protection Civile (dgpc.dz)",(st.dgpcWebPosts||0)+" articles"],
    ["usgs","🌍 Séismes (EMSC/USGS)",((src.usgs&&src.usgs.count)||0)+" séismes"+(src.usgs&&src.usgs.newest?" · dernier "+ago(src.usgs.newest):"")],
    ["craag","🇩🇿 CRAAG",(st.craagRows||0)+" lignes"],
    ["press","📰 Presse algérienne",(st.pressItems||0)+" articles"]
  ].map(r=>{const e=errFor(r[0]);
    return '<div style="margin-top:8px"><div class="t1" style="font-size:13px">'+(e?"🔴 ":"🟢 ")+r[1]+
      '</div><div class="t2">'+(e?'<span class="err">'+esc(e).slice(0,220)+"</span>":r[2])+"</div></div>"}).join("");
  const extraErr=(o.errors||[]).filter(x=>!KNOWN.includes(x.source));
  const CH={red:["var(--redc)","var(--red)"],orange:["var(--orgc)","var(--org)"],yellow:["var(--yelc)","var(--yel)"],green:["var(--grnc)","var(--grn)"]};
  const alerts=(o.alerts||[]).slice(0,10).map(a=>{const c=CH[a.color]||["var(--s2)","var(--mut)"];
    return '<div class="t2" style="margin-top:6px">'+(HAZ[a.hazard]||"⚠️")+" "+esc(a.event||a.hazard)+" — "+a.wilayas+
      ' wilaya(s) <span class="st" style="margin:0;background:'+c[0]+";color:"+c[1]+'">'+a.color+"</span></div>"}).join("")
    ||'<div class="t2" style="margin-top:6px">Aucune vigilance active.</div>';
  const pline=p.at?("Dernier cycle "+ago(p.at)+" · envoyés <b>"+(p.sent==null?"–":p.sent)+"</b> · dédupliqués <b>"+(p.deduped==null?"–":p.deduped)+"</b>"+
      (p.heartbeats?" · heartbeats "+p.heartbeats:"")+
      ((p.errors&&p.errors.length)?' · <span class="err">'+p.errors.length+" erreurs</span>":"")+
      (p.fatal?'<br><span class="err">FATAL: '+esc(p.fatal)+"</span>":"")):"Jamais exécuté.";
  document.getElementById("list").innerHTML=
    '<div class="card"><div class="row"><div class="tx"><div class="t1">⚙️ Actions</div>'+
    '<div class="t2">Le cron collecte toutes les 10 min — ce bouton force une collecte immédiate (sans push).</div>'+
    '<div class="acts"><button class="ok" id="btnRefresh" onclick="refreshPipeline()">🔄 Rafraîchir le pipeline</button></div>'+
    "</div></div></div>"+
    '<div class="card"><div class="t1">📡 Sources</div>'+rows+
    (extraErr.length?'<div class="t2" style="margin-top:8px"><span class="err">'+extraErr.map(x=>esc(x.source+": "+x.error).slice(0,220)).join("<br>")+"</span></div>":"")+"</div>"+
    '<div class="card"><div class="t1">🚨 Vigilances actives</div>'+alerts+"</div>"+
    '<div class="card"><div class="t1">📈 Historique (🔴 rouge / 🟠 orange)</div><canvas id="cv"></canvas><div class="t2" id="cvhint"></div></div>'+
    '<div class="card"><div class="t1">📨 Notifications</div><div class="t2" style="margin-top:6px">'+pline+"</div></div>";
  requestAnimationFrame(function(){drawChart(hist)});
}
function drawChart(hist){
  const cv=document.getElementById("cv");if(!cv)return;
  const hint=document.getElementById("cvhint");
  if(!hist||!hist.length){if(hint)hint.textContent="Pas encore d’historique.";return}
  const pts=hist.slice(0,168).reverse();
  const reds=pts.map(x=>((x.stats||{}).byColor||{}).red||0);
  const orgs=pts.map(x=>((x.stats||{}).byColor||{}).orange||0);
  const dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
  cv.width=W*dpr;cv.height=H*dpr;
  const ctx=cv.getContext("2d");ctx.scale(dpr,dpr);
  const mx=Math.max(1,Math.max.apply(null,reds),Math.max.apply(null,orgs));
  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const line=(arr,col)=>{ctx.beginPath();
    arr.forEach((v,i)=>{const x=arr.length>1?i/(arr.length-1)*W:0,y=H-4-(v/mx)*(H-10);
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)});
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke()};
  line(orgs,css("--org"));line(reds,css("--red"));
  if(hint)hint.textContent=pts.length+" relevés horaires · pic: "+mx+" · maintenant: "+reds[reds.length-1]+" rouge / "+orgs[orgs.length-1]+" orange";
}
async function refreshPipeline(){
  const b=document.getElementById("btnRefresh");b.disabled=true;b.textContent="⏳ Collecte en cours…";
  try{
    const r=await fetch("/v1/admin/refresh",{method:"POST",headers:{authorization:"Bearer "+KEY}});
    const j=await r.json().catch(()=>({}));
    b.textContent=r.ok?"✓ Collecté ("+((j.byColor&&j.byColor.red)||0)+" rouge, "+(j.errors||0)+" erreurs)":"Échec "+r.status;
  }catch(e){b.textContent="Échec réseau"}
  setTimeout(function(){b.disabled=false;boot()},1400);
}
// ---- 🚀 Version ----
async function ghReleases(){
  // Fetched browser-side (the Worker cannot reach GitHub) and cached 10 min
  // so the 60s auto-refresh never trips the unauthenticated API rate limit.
  if(GH.data&&Date.now()-GH.at<600000)return GH.data;
  try{const r=await fetch("https://api.github.com/repos/MzrIslem/RadBalek/releases?per_page=10");
    if(!r.ok)throw 0;GH={at:Date.now(),data:await r.json()};return GH.data}catch(e){return GH.data}
}
function paintVersion(o,rels){
  document.getElementById("subline").textContent="Publier ici met à jour la bannière de mise à jour dans l’app (délai ~15 min, cache edge).";
  const al=o.appLatest||{};
  const sum=r=>(r.assets||[]).reduce(function(x,a){return x+(a.download_count||0)},0);
  const dl=(rels||[]).reduce(function(s,r){return s+sum(r)},0);
  document.getElementById("stats").innerHTML=
    '<span class="pill">📱 bannière: <b>'+esc(al.version||"—")+"</b></span>"+
    '<span class="pill">⬇️ téléchargements GitHub: <b>'+(rels?dl:"–")+"</b></span>";
  const rows=(rels||[]).map(function(r){
    return '<div style="margin-top:8px"><div class="t1" style="font-size:13px">'+esc(r.tag_name)+
      (r.prerelease?' <span class="st s-auto-ok" style="margin:0">pre</span>':"")+
      '</div><div class="t2">'+new Date(r.published_at).toLocaleDateString("fr")+" · ⬇️ "+sum(r)+
      ((r.assets||[]).length?" — "+(r.assets||[]).map(function(a){return esc(a.name)+" ("+(a.download_count||0)+")"}).join(", "):"")+
      "</div></div>"}).join("")
    ||'<div class="t2" style="margin-top:6px">GitHub indisponible (limite API ?) — réessayez dans quelques minutes.</div>';
  document.getElementById("list").innerHTML=
    '<div class="card"><div class="t1">🚀 Publier une version (bannière in-app)</div>'+
    '<label>Version (x.y.z)</label><input id="v_version" value="'+attr(al.version||"")+'" placeholder="0.9.8">'+
    '<label>Tag GitHub</label><input id="v_tag" value="'+attr(al.tag||"")+'" placeholder="v0.9.8-beta">'+
    '<label>Lien APK (https)</label><input id="v_apk" value="'+attr(al.apk||"")+'">'+
    '<label>Page de la release (https)</label><input id="v_url" value="'+attr(al.url||"")+'">'+
    '<label>Notes (optionnel)</label><input id="v_notes" value="'+attr(al.notes||"")+'">'+
    '<div class="acts"><button class="ok" onclick="publishVersion()">📤 Publier</button></div>'+
    '<div class="t2" id="vmsg" style="margin-top:7px">'+(al.at?"Dernière publication: "+ago(al.at):"")+"</div></div>"+
    '<div class="card"><div class="t1">📦 Releases GitHub (MzrIslem/RadBalek)</div>'+rows+"</div>";
}
async function publishVersion(){
  const v=function(id){return document.getElementById(id).value.trim()};
  const body={version:v("v_version"),tag:v("v_tag"),apk:v("v_apk"),url:v("v_url"),notes:v("v_notes")};
  const m=document.getElementById("vmsg");m.textContent="⏳ Publication…";
  try{
    const r=await fetch("/v1/admin/app-latest",{method:"POST",
      headers:{"content-type":"application/json",authorization:"Bearer "+KEY},
      body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    m.textContent=r.ok?"✓ Publié — les apps verront la mise à jour sous ~15 min.":"Échec: "+(j.error||r.status);
  }catch(e){m.textContent="Échec réseau"}
}
// ---- 💬 Avis ----
function paintFb(items){
  document.getElementById("subline").textContent="Avis, bugs et idées envoyés depuis l’app.";
  const stars=n=>n?("★".repeat(n)+"☆".repeat(5-n)):"";
  const avg=items.filter(f=>f.rating).reduce((s,f,_,a)=>s+f.rating/a.length,0);
  document.getElementById("stats").innerHTML=
    '<span class="pill">💬 <b>'+items.length+'</b> avis</span>'+
    (avg?'<span class="pill">⭐ moyenne <b>'+avg.toFixed(1)+'</b>/5</span>':"")+
    '<span class="pill">🐞 <b>'+items.filter(f=>f.type==="bug").length+'</b> · 💡 <b>'+items.filter(f=>f.type==="idea").length+'</b></span>';
  document.getElementById("list").innerHTML=items.map(f=>
    '<div class="card"><div class="row"><div class="tx">'+
    '<div class="t1">'+(FBT[f.type]||f.type)+(f.rating?' — <span style="color:#e2a500">'+stars(f.rating)+'</span>':"")+'</div>'+
    '<div class="t2">'+new Date(f.at).toLocaleString("fr")+(f.version?' · v'+f.version:"")+(f.lang?' · '+f.lang:"")+
    (f.text?'<br>« '+esc(f.text)+' »':"")+'</div>'+
    '</div></div></div>').join("")||'<p class="sub">Aucun avis pour le moment.</p>';
}
// ---- 📋 Signalements ----
function paint(reports,snap,push){
  document.getElementById("subline").textContent="Vérifier = badge « vérifié » public · Rejeter = masqué. Gemini pré-trie (auto-ok / flagged) quand la clé est configurée.";
  const by={};reports.forEach(r=>by[r.status]=(by[r.status]||0)+1);
  const bc=snap&&snap.stats?snap.stats.byColor:{};
  document.getElementById("stats").innerHTML=
    '<span class="pill">🔴 <b>'+(bc.red||0)+'</b></span><span class="pill">🟠 <b>'+(bc.orange||0)+'</b></span>'+
    '<span class="pill">📨 push: <b>'+(push?(push.sent??"–"):"–")+'</b> env · <b>'+(push?(push.deduped??"–"):"–")+'</b> dédup</span>'+
    '<span class="pill">📋 <b>'+reports.length+'</b> signalements · à traiter: <b>'+((by["new"]||0)+(by["flagged"]||0)+(by["auto-ok"]||0)+(by["community-confirmed"]||0))+'</b></span>';
  const order={"flagged":0,"new":1,"community-confirmed":2,"auto-ok":3,"verified":4,"rejected":5};
  reports.sort((a,b)=>(order[a.status]??9)-(order[b.status]??9)||(a.at<b.at?1:-1));
  document.getElementById("list").innerHTML=reports.map(r=>
    '<div class="card"><div class="row"><div class="tx">'+
    '<div class="t1">'+(CATS[r.category]||r.category)+' — '+(NAMES[r.wilaya]||("W"+(r.wilaya||"?")))+'</div>'+
    '<div class="t2">'+new Date(r.at).toLocaleString("fr")+(r.lat?' · '+r.lat.toFixed(3)+","+r.lon.toFixed(3):"")+
    (r.description?'<br>« '+esc(r.description)+' »':"")+
    ' · 👍 '+(r.confirms||0)+'</div>'+
    '<span class="st s-'+r.status+'">'+r.status+'</span>'+
    ((r.status!=="verified"&&r.status!=="rejected")?
      '<div class="acts"><button class="ok" onclick="mod(\\''+r.id+'\\',\\'verified\\')">✓ Vérifier</button>'+
      '<button class="no" onclick="mod(\\''+r.id+'\\',\\'rejected\\')">✕ Rejeter</button></div>':"")+
    '</div></div></div>').join("")||'<p class="sub">Aucun signalement.</p>';
}
async function mod(id,status){
  const r=await fetch("/v1/admin/moderate",{method:"POST",
    headers:{"content-type":"application/json",authorization:"Bearer "+KEY},
    body:JSON.stringify({id:id,status:status})});
  if(r.ok)boot();else alert("Échec: "+r.status);
}
boot();
setInterval(boot,60000);
</script></body></html>`;
