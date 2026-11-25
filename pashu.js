/* GharMitra add-on: pashu · version 1.0 */
/* ==================== PASHU MITRA (dairy & poultry) ==================== */
const PDEF=()=>({animals:[],milkPrice:45,poultry:{birds:0,eggs:[],eggPrice:6,feedKg:0,feedPrice:30},exp:[]});
const GEST={Cow:283,Buffalo:310,Goat:150};
const VACC=[['FMD (foot-and-mouth)',182],['HS (galghotu)',365],['BQ (black quarter)',365],['Deworming',90]];
const PEXP=['Cattle feed','Green / dry fodder','Vet & medicine','Poultry feed','Labour','Other'];
function pAnimal(a){const t=dnum(today());const pts=(a.milk||[]).filter(x=>dnum(x.date)>t-60).map(x=>[dnum(x.date),+x.l]).sort((x,y)=>x[0]-y[0]);
 const av=(f)=>{const s=pts.filter(f);return s.length?s.reduce((q,p)=>q+p[1],0)/s.length:0};
 const avg7=av(p=>p[0]>t-7),avgPrev=av(p=>p[0]<=t-7&&p[0]>t-21);const drop=avgPrev&&avg7?(avgPrev-avg7)/avgPrev*100:0;
 const r30=pts.filter(p=>p[0]>t-30);const reg=r30.length>=5?linreg(r30):null;const dim=a.calved?t-dnum(a.calved):null;
 const g=GEST[a.type]||283;const calving=a.ai&&a.pregnant?dnum(a.ai)+g:null;const dryOff=calving?calving-60:null;
 let heat=null;if(a.heat&&!a.pregnant){heat=dnum(a.heat);while(heat<t)heat+=21}
 const vac=VACC.map(([n,iv])=>{const l=(a.vacc||{})[n];return{n,iv,last:l||null,due:l?dnum(l)+iv:null}});
 return{pts,avg7,avgPrev,drop,reg,dim,calving,dryOff,heat,vac,g,t}}
function pFarm(){const P=S.pashu,t=dnum(today());const an=P.animals.map(a=>({a,r:pAnimal(a)}));
 const milkDay=an.reduce((s,x)=>s+x.r.avg7,0);let milk30=0;for(const a of P.animals)for(const x of a.milk||[])if(dnum(x.date)>t-30)milk30+= +x.l;
 const milkInc=milk30*(+P.milkPrice||0);const po=P.poultry;const e7=po.eggs.filter(x=>dnum(x.date)>t-7);const eggsDay=e7.length?e7.reduce((s,x)=>s+ +x.n,0)/e7.length:0;
 const ePrev=po.eggs.filter(x=>dnum(x.date)<=t-7&&dnum(x.date)>t-21);const eggsPrev=ePrev.length?ePrev.reduce((s,x)=>s+ +x.n,0)/ePrev.length:0;
 const hd=po.birds?eggsDay/po.birds*100:null,hdPrev=po.birds&&eggsPrev?eggsPrev/po.birds*100:null;let eggs30=0;for(const x of po.eggs)if(dnum(x.date)>t-30)eggs30+= +x.n;
 const eggInc=eggs30*(+po.eggPrice||0);const pfDay=(+po.feedKg||0)*(+po.feedPrice||0);const costEgg=eggsDay?pfDay/eggsDay:null;
 const ex=P.exp.filter(e=>dnum(e.date)>t-30);const exp30=ex.reduce((s,e)=>s+ +e.amt,0);const by={};for(const e of ex)by[e.cat]=(by[e.cat]||0)+ +e.amt;
 const cattleFeed=(by['Cattle feed']||0)+(by['Green / dry fodder']||0);const costL=milk30?cattleFeed/milk30:null;const profit=milkInc+eggInc-exp30;
 const hist=[];for(let k=29;k>=0;k--){const d=t-k;let s=0;for(const a of P.animals)for(const x of a.milk||[])if(x.date===dstr(d))s+= +x.l;hist.push([d,s])}
 return{an,milkDay,milk30,milkInc,eggsDay,hd,hdPrev,eggs30,eggInc,pfDay,costEgg,exp30,by,costL,profit,hist,t}}
function pAlerts(){const out=[],f=pFarm(),t=f.t;
 for(const{a,r}of f.an){const nm=`<b>${esc(a.name)}</b>`;
  for(const v of r.vac){if(v.due!=null&&v.due<t)out.push(['bad','💉',`${nm}: ${v.n} overdue since ${prettyN(v.due)}.`]);else if(v.due!=null&&v.due-t<=14)out.push(['warn','💉',`${nm}: ${v.n} due ${prettyN(v.due)}.`]);else if(!v.last&&v.n!=='Deworming')out.push(['info','💉',`${nm}: no ${v.n} record. Ask your vet.`])}
  if(r.drop>=15&&r.avg7>0)out.push(['bad','🥛',`${nm} milk fell ${Math.round(r.drop)}% this week (${f1(r.avgPrev)} → ${f1(r.avg7)} L/day). Check for fever, mastitis or feed change; call the vet if it continues.`]);
  if(r.heat!=null&&r.heat-t<=2)out.push(['info','🐄',`${nm} may come into heat around ${prettyN(r.heat)} (21-day cycle). Watch for signs; AI is best 12–18 hours after heat starts.`]);
  if(r.calving!=null){if(r.calving-t<=15&&r.calving>=t)out.push(['warn','🍼',`${nm} expected to calve around <b>${prettyN(r.calving)}</b>. Keep a clean, dry calving place ready.`]);
   if(r.dryOff>=t-7&&r.dryOff-t<=7&&r.avg7>0)out.push(['warn','🐄',`${nm}: dry off around ${prettyN(r.dryOff)} (60 days before calving) so she rests and the next lactation is better.`])}
  if(r.dim!=null&&r.dim>305&&r.avg7>0&&!a.pregnant)out.push(['info','🐄',`${nm} is ${r.dim} days in milk and not pregnant. Discuss breeding with the vet.`])}
 if(f.hd!=null&&f.hdPrev!=null&&f.hdPrev-f.hd>=10)out.push(['warn','🥚',`Egg production fell from ${Math.round(f.hdPrev)}% to ${Math.round(f.hd)}% of birds. Check feed, water, light and disease.`]);
 if(f.an.length||f.hd!=null)out.push([f.profit>=0?'good':'bad','💰',`Last 30 days: milk ${inr(f.milkInc)} + eggs ${inr(f.eggInc)} − costs ${inr(f.exp30)} = <b>${inr(f.profit)}</b>.${f.costL!=null?` Feed cost ${inr(f.costL)} per litre.`:''}`]);
 else out.push(['info','🐄','Add your animals in the Animals tab to start.']);return out}

V.p_home=()=>{const f=pFarm(),P=S.pashu;
 return `<div class="card"><h2>${H('My dairy and poultry','मेरा पशुधन')}</h2><div class="stats">
 <div class="stat"><div class="k">🥛 Milk per day</div><div class="v">${f1(f.milkDay)} <span class="u">L</span></div><div class="u">${f.an.length} animals</div></div>
 <div class="stat"><div class="k">🥚 Eggs per day</div><div class="v">${Math.round(f.eggsDay)}</div><div class="u">${f.hd!=null?Math.round(f.hd)+'% of '+P.poultry.birds+' birds':''}</div></div>
 <div class="stat"><div class="k">💰 Profit (30 days)</div><div class="v" style="color:${f.profit<0?'var(--bad)':'var(--good)'}">${inr(f.profit)}</div></div>
 <div class="stat"><div class="k">🌾 Feed cost per litre</div><div class="v">${f.costL!=null?inr(f.costL):'—'}</div><div class="u">milk price ${inr(P.milkPrice)}/L</div></div></div></div>
 <div class="card"><h2>${H('Alerts and advice','सलाह')}</h2>${pAlerts().map(([c,i,t])=>`<div class="alert ${c}">${i} ${t}</div>`).join('')}</div>
 <div class="card"><div class="row"><div><label>Milk price (₹/litre) at dairy/society</label><input type="number" value="${P.milkPrice}" onchange="S.pashu.milkPrice=+this.value;save();render()"></div></div><p class="muted">Vaccination intervals are a general schedule. Follow your veterinarian or government veterinary hospital.</p></div>`};

V.p_milk=()=>{const f=pFarm(),P=S.pashu;const milking=P.animals.filter(a=>a.type!=='Goat'||true);
 return `<div class="card"><h2>${H('Today\'s milk','आज का दूध')}</h2>${milking.length?`<div class="row"><div><label>Date</label><input type="date" id="md" value="${today()}"></div></div>
 ${milking.map(a=>`<div class="row" style="margin-top:8px;align-items:center"><div style="flex:1 1 60%"><b>${esc(a.name)}</b> <small class="muted">${a.type}</small></div><div style="flex:1 1 30%"><input type="number" step="0.1" id="ml_${a.id}" placeholder="litres"></div></div>`).join('')}
 <div class="btns"><button onclick="pSaveMilk()">Save milk</button></div><p class="muted">Enter morning + evening total for each animal.</p>`:'<p class="muted">Add animals first (Animals tab).</p>'}</div>
 ${f.an.length?`<div class="card"><h2>${H('Milk analysis','दूध विश्लेषण')}</h2><table><tr><th>Animal</th><th class="r">Last 7 days</th><th class="r">Change</th><th class="r">Days in milk</th></tr>
 ${f.an.map(({a,r})=>`<tr style="${r.drop>=15?'background:var(--badbg)':''}"><td>${esc(a.name)}</td><td class="r"><b>${f1(r.avg7)}</b> L/day</td><td class="r" style="color:${r.drop>=15?'var(--bad)':r.drop<0?'var(--good)':'inherit'}">${r.avgPrev?(r.drop>0?'−':'+')+Math.abs(Math.round(r.drop))+'%':'—'}</td><td class="r">${r.dim!=null?r.dim:'—'}</td></tr>`).join('')}</table>
 <canvas id="pmch"></canvas><p class="muted">Total herd milk per day, last 30 days. Yield normally peaks 6–8 weeks after calving and then falls slowly; a sudden drop is a warning sign.</p>
 <div class="eq">Weekly change % = (previous 2-week average − last 7-day average) ÷ previous average × 100</div></div>`:''}`};
A.p_milk=()=>{const f=pFarm();if(!f.an.length)return;chart('pmch',[{pts:f.hist,color:'#65a30d',name:'Litres/day'}],{ymin:0,xlab:prettyN})};
function pSaveMilk(){const d=$('#md').value||today();let n=0;for(const a of S.pashu.animals){const v=parseFloat(($('#ml_'+a.id)||{}).value);if(!isNaN(v)){a.milk=(a.milk||[]).filter(x=>x.date!==d);a.milk.push({date:d,l:v});n++}}if(!n)return toast('Enter litres');save();render();toast('Milk saved for '+n+' animal(s)')}

V.p_animals=()=>{const f=pFarm();
 return `<div class="card"><h2>${H('Add animal','पशु जोड़ें')}</h2><div class="row"><div><label>Name / tag no.</label><input id="an2"></div><div><label>Type</label><select id="at">${Object.keys(GEST).map(k=>`<option>${k}</option>`).join('')}</select></div><div><label>Breed</label><input id="ab" placeholder="e.g. Gir, HF cross"></div></div>
 <div class="btns"><button onclick="pAddAnimal()">Add</button></div></div>
 ${f.an.map(({a,r})=>`<div class="card"><h2>${a.type==='Buffalo'?'🐃':a.type==='Goat'?'🐐':'🐄'} ${esc(a.name)} <span class="hi">· ${a.type}${a.breed?', '+esc(a.breed):''}</span></h2>
 <h3>Breeding · प्रजनन</h3><div class="row"><div><label>Last calving</label><input type="date" value="${a.calved||''}" onchange="pSet('${a.id}','calved',this.value)"></div><div><label>Last heat seen</label><input type="date" value="${a.heat||''}" onchange="pSet('${a.id}','heat',this.value)"></div></div>
 <div class="row" style="margin-top:8px"><div><label>AI / service date</label><input type="date" value="${a.ai||''}" onchange="pSet('${a.id}','ai',this.value)"></div><div><label>Pregnant (confirmed)?</label><select onchange="pSet('${a.id}','pregnant',this.value==='1')"><option value="0" ${!a.pregnant?'selected':''}>No / not checked</option><option value="1" ${a.pregnant?'selected':''}>Yes</option></select></div></div>
 <div class="stats" style="margin-top:8px"><div class="stat"><div class="k">Next heat</div><div class="v" style="font-size:16px">${r.heat!=null?prettyN(r.heat):'—'}</div></div><div class="stat"><div class="k">Expected calving</div><div class="v" style="font-size:16px">${r.calving!=null?prettyN(r.calving):'—'}</div><div class="u">${r.calving!=null?'dry off '+prettyN(r.dryOff):''}</div></div></div>
 <h3>Vaccination and deworming · टीका</h3><table>${r.vac.map(v=>`<tr style="${v.due!=null&&v.due<r.t?'background:var(--badbg)':v.due!=null&&v.due-r.t<=14?'background:var(--warnbg)':''}"><td>${v.n}<br><small class="muted">every ${v.iv>=365?'year':v.iv>=180?'6 months':'3 months'}</small></td><td>${v.last?pretty(v.last):'—'}</td><td>${v.due!=null?'next '+prettyN(v.due):''}</td><td class="r"><button class="small ghost" onclick="pVac('${a.id}','${v.n}')">Done today</button></td></tr>`).join('')}</table>
 <div class="btns"><button class="small danger" onclick="S.pashu.animals=S.pashu.animals.filter(x=>x.id!=='${a.id}');save();render()">Remove</button></div></div>`).join('')}
 <div class="card"><div class="eq">Next heat = last heat + 21 days × k &nbsp;·&nbsp; Calving = AI date + gestation (cow 283, buffalo 310, goat 150 days) &nbsp;·&nbsp; Dry-off = calving − 60 days</div></div>`};
function pAddAnimal(){const n=$('#an2').value.trim();if(!n)return toast('Enter a name');S.pashu.animals.push({id:uid(),name:n,type:$('#at').value,breed:$('#ab').value.trim(),milk:[],vacc:{}});save();render()}
function pSet(id,k,v){const a=S.pashu.animals.find(x=>x.id===id);a[k]=v;save();render()}
function pVac(id,n){const a=S.pashu.animals.find(x=>x.id===id);a.vacc=a.vacc||{};a.vacc[n]=today();save();render();toast(n+' recorded')}

V.p_poultry=()=>{const f=pFarm(),po=S.pashu.poultry;const L=[...po.eggs].sort((a,b)=>a.date<b.date?1:-1);
 return `<div class="card"><h2>${H('Poultry','मुर्गी पालन')}</h2><div class="row"><div><label>Laying birds</label><input type="number" value="${po.birds}" onchange="S.pashu.poultry.birds=+this.value;save();render()"></div><div><label>Egg price (₹)</label><input type="number" step="0.25" value="${po.eggPrice}" onchange="S.pashu.poultry.eggPrice=+this.value;save();render()"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Feed per day (kg)</label><input type="number" step="0.5" value="${po.feedKg}" onchange="S.pashu.poultry.feedKg=+this.value;save();render()"></div><div><label>Feed price (₹/kg)</label><input type="number" value="${po.feedPrice}" onchange="S.pashu.poultry.feedPrice=+this.value;save();render()"></div></div>
 <h3>Eggs collected today</h3><div class="row"><div><input type="number" id="en" placeholder="number of eggs"></div><div style="flex:0 0 auto"><button onclick="pEggs()">Save</button></div></div></div>
 ${po.birds?`<div class="card"><div class="stats"><div class="stat"><div class="k">Production (hen-day)</div><div class="v">${f.hd!=null?Math.round(f.hd)+'<span class="u">%</span>':'—'}</div><div class="u">${f.hdPrev!=null?'was '+Math.round(f.hdPrev)+'%':''}</div></div>
 <div class="stat"><div class="k">Feed cost per egg</div><div class="v">${f.costEgg!=null?'₹'+f2(f.costEgg):'—'}</div><div class="u">egg sells at ₹${po.eggPrice}</div></div>
 <div class="stat"><div class="k">Profit per day</div><div class="v">${inr(f.eggsDay*po.eggPrice-f.pfDay)}</div></div><div class="stat"><div class="k">Eggs (30 days)</div><div class="v">${f.eggs30}</div></div></div>
 <canvas id="pech"></canvas><div class="eq">Hen-day % = eggs per day ÷ laying birds × 100 &nbsp;·&nbsp; Feed cost per egg = feed kg × price ÷ eggs</div></div>`:''}`};
A.p_poultry=()=>{const po=S.pashu.poultry;if(!po.birds)return;const t=dnum(today());chart('pech',[{pts:po.eggs.filter(x=>dnum(x.date)>t-30).map(x=>[dnum(x.date),x.n/po.birds*100]).sort((a,b)=>a[0]-b[0]),color:'#f59e0b',name:'Hen-day %'}],{ymin:0,ymax:100,xlab:prettyN})};
function pEggs(){const n=parseFloat($('#en').value);if(isNaN(n))return toast('Enter eggs');const d=today();S.pashu.poultry.eggs=S.pashu.poultry.eggs.filter(x=>x.date!==d);S.pashu.poultry.eggs.push({date:d,n});save();render();toast('Saved')}

V.p_money=()=>{const f=pFarm();const L=[...S.pashu.exp].sort((a,b)=>a.date<b.date?1:-1);
 return `<div class="card"><h2>${H('Income and costs (last 30 days)','आय-व्यय')}</h2><table>
 <tr><td>Milk ${f1(f.milk30)} L × ${inr(S.pashu.milkPrice)}</td><td class="r">${inr(f.milkInc)}</td></tr><tr><td>Eggs ${f.eggs30} × ₹${S.pashu.poultry.eggPrice}</td><td class="r">${inr(f.eggInc)}</td></tr>
 ${Object.entries(f.by).map(([c,v])=>`<tr><td>${c}</td><td class="r">−${inr(v)}</td></tr>`).join('')}<tr><th>Profit</th><th class="r" style="color:${f.profit<0?'var(--bad)':'var(--good)'}">${inr(f.profit)}</th></tr></table>
 ${f.costL!=null?`<div class="alert ${f.costL<S.pashu.milkPrice*0.6?'good':'warn'}">Feed and fodder cost <b>${inr(f.costL)}</b> per litre of milk (${Math.round(f.costL/S.pashu.milkPrice*100)}% of milk price). Green fodder and balanced mineral mixture usually lower this.</div>`:''}
 <div class="eq">Cost per litre = (cattle feed + fodder cost) ÷ litres produced</div></div>
 <div class="card"><h2>Add expense</h2><div class="row"><div><label>Amount (₹)</label><input type="number" id="pa"></div><div><label>Type</label><select id="pc">${PEXP.map(c=>`<option>${c}</option>`).join('')}</select></div></div><div class="btns"><button onclick="pAddExp()">Add</button></div></div>
 ${L.length?`<div class="card"><h2>Expenses</h2><table>${L.slice(0,30).map(e=>`<tr><td>${pretty(e.date)}</td><td>${e.cat}</td><td class="r">${inr(e.amt)}</td><td class="r"><button class="x" onclick="S.pashu.exp=S.pashu.exp.filter(x=>x.id!=='${e.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
function pAddExp(){const a=parseFloat($('#pa').value);if(isNaN(a)||a<=0)return toast('Enter amount');S.pashu.exp.push({id:uid(),date:today(),cat:$('#pc').value,amt:a});save();render()}

V.p_more=()=>`<div class="card"><h2>More · और</h2>
 <button class="tile" onclick="go('p_maths')"><span class="i">📐</span><span>How it works (the maths)<small>Milk trends, breeding dates, egg production</small></span></button>
 <button class="tile" onclick="addonDemo('pashu')"><span class="i">🧪</span><span>Load PashuMitra demo<small>3 cows/buffalo and 120 laying hens</small></span></button>
 <button class="tile" onclick="go('home')"><span class="i">🏠</span><span>Back to GharMitra</span></button></div>`;
V.p_maths=()=>`<div class="card"><h2>📐 PashuMitra models</h2><p class="muted">Daily milk and eggs → Averages and cycles → Alerts → Farmer acts → New records.</p></div>
<div class="card"><h2>🥛 Milk</h2><div class="eq">7-day average = Σ last 7 days ÷ 7</div><div class="eq">Drop % = (earlier average − recent average) ÷ earlier average × 100</div><div class="eq">Days in milk = today − calving date</div></div>
<div class="card"><h2>🐄 Breeding: arithmetic sequences</h2><div class="eq">Heat dates = h₀ + 21k (k = 1, 2, 3 …)</div><div class="eq">Calving = AI date + gestation &nbsp;·&nbsp; Dry-off = calving − 60</div><div class="eq">Next vaccine = last dose + interval</div></div>
<div class="card"><h2>🥚 Poultry and profit</h2><div class="eq">Hen-day % = eggs ÷ birds × 100</div><div class="eq">Cost per egg = feed kg × ₹/kg ÷ eggs</div><div class="eq">Profit = milk income + egg income − costs</div></div>`;

function pDemo(quiet){const t=dnum(today());S.pashu=PDEF();const P=S.pashu;P.milkPrice=42;
 const mk=(name,type,breed,calvedAgo,base,peak,extra)=>{const a={id:uid(),name,type,breed,calved:dstr(t-calvedAgo),milk:[],vacc:{},...extra};
  for(let d=t-40;d<=t;d++){const dim=d-(t-calvedAgo);let y=base*(1+0.35*Math.min(1,dim/50))*Math.exp(-0.0016*Math.max(0,dim-50));if(peak&&d>t-7)y*=peak;a.milk.push({date:dstr(d),l:Math.round((y+((d*7)%5-2)*0.15)*10)/10})}return a};
 P.animals=[mk('Lakshmi','Cow','HF cross',75,10,0,{vacc:{'FMD (foot-and-mouth)':dstr(t-170),'HS (galghotu)':dstr(t-150),'BQ (black quarter)':dstr(t-150),'Deworming':dstr(t-80)},heat:dstr(t-20)}),
  mk('Gauri','Cow','Gir',190,8,0.78,{vacc:{'FMD (foot-and-mouth)':dstr(t-60),'HS (galghotu)':dstr(t-150),'BQ (black quarter)':dstr(t-150),'Deworming':dstr(t-40)},ai:dstr(t-150),pregnant:true}),
  mk('Kali','Buffalo','Murrah',240,9,0,{vacc:{'FMD (foot-and-mouth)':dstr(t-200),'HS (galghotu)':dstr(t-150),'BQ (black quarter)':dstr(t-150),'Deworming':dstr(t-30)},ai:dstr(t-245),pregnant:true})];
 P.poultry={birds:120,eggs:[],eggPrice:6,feedKg:13,feedPrice:32};for(let d=t-29;d<=t;d++)P.poultry.eggs.push({date:dstr(d),n:Math.round(120*(d>t-7?0.74:0.86)+((d*3)%7-3))});
 [[2,'Cattle feed',4200],[5,'Green / dry fodder',2600],[9,'Poultry feed',6200],[12,'Vet & medicine',650],[16,'Cattle feed',4200],[20,'Poultry feed',6200],[22,'Green / dry fodder',2400],[25,'Labour',3000]].forEach(([d,c,a])=>P.exp.push({id:uid(),date:dstr(t-28+d),cat:c,amt:a}));
 if(!quiet){S.addons.on.pashu=true;save();toast('PashuMitra demo loaded');go('p_home')}}
ADDON_REG.pashu={def:PDEF,demo:pDemo,sum(){const f=pFarm();return{income:f.profit,line:f.an.length||f.hd!=null?`Milk ${f1(f.milkDay)} L/day · ${Math.round(f.eggsDay)} eggs/day · 30-day profit ${inr(f.profit)}`:'Add your animals to start',alerts:pAlerts()}}};
