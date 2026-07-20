// Private curator dashboard served at GET /admin.
// The page is public but inert without the ADMIN_KEY, which the curator
// enters once (kept in localStorage, sent only to this same origin).
export const ADMIN_HTML = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#006A60">
<title>Rad Balek — Curation</title>
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
.st{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:99px;display:inline-block;margin-top:6px}
.s-new{background:var(--yelc);color:var(--yel)}.s-auto-ok{background:var(--s2);color:var(--mut)}
.s-flagged{background:var(--redc);color:var(--red)}.s-community-confirmed{background:var(--orgc);color:var(--org)}
.s-verified{background:var(--grnc);color:var(--grn)}.s-rejected{background:var(--s2);color:var(--mut);text-decoration:line-through}
.acts{display:flex;gap:8px;margin-top:9px}
button{font:inherit;font-weight:700;font-size:12.5px;border:0;border-radius:99px;padding:8px 16px;cursor:pointer}
.ok{background:var(--grnc);color:var(--grn)}.no{background:var(--redc);color:var(--red)}
.ghost{background:var(--s2);color:var(--tx)}
input{font:inherit;width:100%;padding:10px 14px;border-radius:12px;border:1px solid var(--s2);background:var(--s1);color:var(--tx)}
#login{margin:40px auto;max-width:340px;text-align:center}
.hide{display:none}
</style></head><body>
<div id="login">
  <h1 style="justify-content:center">🛡️ Rad Balek — Curation</h1>
  <p class="sub">Clé administrateur</p>
  <input id="key" type="password" placeholder="ADMIN_KEY">
  <button class="ghost" style="margin-top:10px;width:100%" onclick="saveKey()">Entrer</button>
</div>
<div id="app" class="hide">
  <h1>🛡️ Curation <span style="font-size:11px;color:var(--mut);font-weight:400" id="upd"></span></h1>
  <p class="sub">Vérifier = badge « vérifié » public · Rejeter = masqué. Gemini pré-trie (auto-ok / flagged) quand la clé est configurée.</p>
  <div class="bar" id="stats"></div>
  <div id="list"></div>
</div>
<script>
const CATS={fire:"🔥 Feu",smoke:"💨 Fumée",road:"🚗 Route",flood:"🌊 Oued/Crue",animal:"🐾 Animal",heat:"🌡️ Chaleur",other:"ℹ️ Autre"};
const NAMES={};
let KEY=localStorage.getItem("rb_admin_key")||"";
function saveKey(){KEY=document.getElementById("key").value.trim();localStorage.setItem("rb_admin_key",KEY);boot()}
async function boot(){
  if(!KEY)return;
  const r=await fetch("/v1/admin/reports?key="+encodeURIComponent(KEY));
  if(r.status===403){localStorage.removeItem("rb_admin_key");alert("Clé invalide");return}
  document.getElementById("login").classList.add("hide");
  document.getElementById("app").classList.remove("hide");
  if(!Object.keys(NAMES).length){
    try{(await (await fetch("/v1/wilayas.json")).json()).forEach(w=>NAMES[w.code]=w.fr)}catch(e){}
  }
  const data=await r.json();
  let snap=null,push=null;
  try{snap=await (await fetch("/v1/alerts.json?lite=1")).json()}catch(e){}
  try{push=await (await fetch("/v1/push-status.json")).json()}catch(e){}
  paint(data.reports||[],snap,push);
}
function paint(reports,snap,push){
  const by={};reports.forEach(r=>by[r.status]=(by[r.status]||0)+1);
  const bc=snap&&snap.stats?snap.stats.byColor:{};
  document.getElementById("upd").textContent="· "+new Date().toLocaleTimeString("fr",{hour:"2-digit",minute:"2-digit"});
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
    (r.description?'<br>« '+r.description.replace(/</g,"&lt;")+' »':"")+
    ' · 👍 '+(r.confirms||0)+'</div>'+
    '<span class="st s-'+r.status+'">'+r.status+'</span>'+
    ((r.status!=="verified"&&r.status!=="rejected")?
      '<div class="acts"><button class="ok" onclick="mod(\\''+r.id+'\\',\\'verified\\')">✓ Vérifier</button>'+
      '<button class="no" onclick="mod(\\''+r.id+'\\',\\'rejected\\')">✕ Rejeter</button></div>':"")+
    '</div></div></div>').join("")||'<p class="sub">Aucun signalement.</p>';
}
async function mod(id,status){
  const r=await fetch("/v1/admin/moderate",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({key:KEY,id:id,status:status})});
  if(r.ok)boot();else alert("Échec: "+r.status);
}
boot();
setInterval(boot,60000);
</script></body></html>`;
