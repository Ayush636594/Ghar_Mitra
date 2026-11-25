/* GharMitra add-on: naukri · version 1.0 */
/* ==================== NAUKRI MITRA (salaried employees) ==================== */
const NDEF=()=>({sal:{basic:30000,da:0,hra:12000,special:10000,other:0,pfCap:false,pt:200,rent:10000,metro:false,join:2018},
 ded:{c80:0,d80:0,home:0,nps:0},pf:{bal:200000,age:32,retire:60,rate:8.25,hike:6},regime:'auto',
 leave:{types:[{id:'cl',name:'Casual leave (CL)',year:12,open:0,lapse:true,max:0},{id:'el',name:'Earned leave (EL)',year:15,open:20,lapse:false,max:300},{id:'sl',name:'Sick / medical leave',year:10,open:5,lapse:false,max:60}],log:[]}});
// Income-tax slabs FY 2026-27 (unchanged from FY 2025-26 in Budget 2026)
const NEW_SLABS=[[400000,0],[800000,.05],[1200000,.10],[1600000,.15],[2000000,.20],[2400000,.25],[Infinity,.30]];
const OLD_SLABS=[[250000,0],[500000,.05],[1000000,.20],[Infinity,.30]];
function slabTax(inc,sl){let tax=0,prev=0;for(const[up,r]of sl){if(inc>prev)tax+=(Math.min(inc,up)-prev)*r;prev=up;if(inc<=up)break}return tax}
function nSalary(){const s=S.naukri.sal;const bd=(+s.basic||0)+(+s.da||0);const gross=bd+(+s.hra||0)+(+s.special||0)+(+s.other||0);
 const pfWage=s.pfCap?Math.min(bd,15000):bd;const empPF=0.12*pfWage;const eps=Math.min(0.0833*Math.min(bd,15000),1250);const erPF=Math.max(0,0.12*pfWage-eps);
 return{bd,gross,pfWage,empPF,eps,erPF,pt:+s.pt||0}}
function nTax(){const N=S.naukri,s=N.sal,d=N.ded,sl=nSalary();const G=sl.gross*12;
 const tn=Math.max(0,G-75000);const slabN=slabTax(tn,NEW_SLABS);let taxN=tn<=1200000?0:Math.min(slabN,tn-1200000);const rebN=slabN-taxN;const totN=taxN*1.04;
 const hraEx=Math.max(0,Math.min((+s.hra||0)*12,Math.max(0,(+s.rent||0)*12-0.1*sl.bd*12),(s.metro?0.5:0.4)*sl.bd*12));
 const pfYear=sl.empPF*12;const c80t=Math.min(150000,pfYear+(+d.c80||0));const d80=Math.min(+d.d80||0,100000);const home=Math.min(+d.home||0,200000);const nps=Math.min(+d.nps||0,50000);
 const ptY=sl.pt*12;const to=Math.max(0,G-50000-ptY-hraEx-c80t-d80-home-nps);const slabO=slabTax(to,OLD_SLABS);const taxO=to<=500000?0:slabO;const totO=taxO*1.04;
 const best=totN<=totO?'new':'old';const chosen=N.regime==='auto'?best:N.regime;const tax=chosen==='new'?totN:totO;
 const c80room=Math.max(0,150000-c80t);const oldRate=to>1000000?0.30:to>500000?0.20:to>250000?0.05:0;
 return{G,tn,slabN,rebN,taxN,totN,hraEx,c80t,pfYear,d80,home,nps,ptY,to,slabO,taxO,totO,best,chosen,tax,save:Math.abs(totN-totO),c80room,oldRate}}
function nPF(){const N=S.naukri,p=N.pf,s=N.sal,sl=nSalary();const age=+p.age||30,years=Math.max(0,(+p.retire||60)-age);const i=(+p.rate||0)/1200,h=(+p.hike||0)/100;
 let bal=+p.bal||0;const pts=[[age,bal]];let bd=sl.bd;
 for(let y=1;y<=years;y++){const wage=s.pfCap?Math.min(bd,15000):bd;const eps=Math.min(0.0833*Math.min(bd,15000),1250);const m=0.12*wage+Math.max(0,0.12*wage-eps);
  for(let k=0;k<12;k++)bal=bal*(1+i)+m;pts.push([age+y,bal]);bd*=1+h}
 const lastBd=sl.bd*(1+h)**Math.max(0,years-1);const service=Math.max(0,new Date().getFullYear()-(+s.join||new Date().getFullYear()))+years;
 const gratRaw=service>=5?15/26*lastBd*service:0;const grat=Math.min(gratRaw,2000000);const sal5=sl.gross*(1+h)**5,sal10=sl.gross*(1+h)**10;
 return{years,pts,corpus:bal,lastBd,service,grat,gratRaw,sal5,sal10,monthly:sl.empPF+sl.erPF}}
function nLeave(){const L=S.naukri.leave,t=today(),y=t.slice(0,4),mo=Number(t.slice(5,7));const sl=nSalary();
 return L.types.map(ty=>{const used=L.log.filter(x=>x.type===ty.id&&x.date.startsWith(y)).reduce((a,x)=>a+ +x.days,0);
  const acc=ty.lapse?+ty.year:(+ty.year)*mo/12;const bal=(+ty.open||0)+acc-used;const yearEnd=(+ty.open||0)+(+ty.year)-used;
  const lapse=ty.lapse?Math.max(0,yearEnd):(+ty.max?Math.max(0,yearEnd-(+ty.max)):0);
  const daysLeftInYear=Math.round((Date.parse(y+'-12-31')-Date.parse(t))/864e5);
  return{...ty,used,acc,bal,yearEnd,lapse,daysLeftInYear,encash:ty.id==='el'?Math.max(0,bal)*sl.bd/26:0}})}
function nAlerts(){const out=[],sl=nSalary(),tx=nTax(),N=S.naukri;const th=sl.gross-sl.empPF-sl.pt-tx.tax/12;
 out.push(['good','💵',`Take-home about <b>${inr(th)}</b> a month (gross ${inr(sl.gross)} − PF ${inr(sl.empPF)} − tax ${inr(tx.tax/12)} − professional tax ${inr(sl.pt)}).`]);
 if(tx.save>500)out.push([N.regime!=='auto'&&N.regime!==tx.best?'warn':'info','🧾',`The <b>${tx.best} regime</b> saves you ${inr(tx.save)} a year (new: ${inr(tx.totN)}, old: ${inr(tx.totO)}).${N.regime!=='auto'&&N.regime!==tx.best?' You have chosen the other one.':''}`]);
 if(tx.best==='old'&&tx.c80room>0&&tx.oldRate>0)out.push(['info','💡',`You can invest ${inr(tx.c80room)} more under 80C (PPF, ELSS, LIC). In the old regime that saves up to ${inr(tx.c80room*tx.oldRate*1.04)} tax.`]);
 for(const l of nLeave())if(l.lapse>0&&l.daysLeftInYear<120)out.push(['warn','🗓️',`${l.lapse} day(s) of ${l.name} will lapse on 31 Dec if not used. Plan them now.`]);
 const p=nPF();out.push(['info','🏦',`PF at retirement (age ${N.pf.retire}): about <b>${inr(p.corpus)}</b>${p.grat?`, plus gratuity about ${inr(p.grat)}`:''}.`]);
 return out}

V.n_home=()=>{const sl=nSalary(),tx=nTax(),p=nPF();const th=sl.gross-sl.empPF-sl.pt-tx.tax/12;const el=nLeave().find(l=>l.id==='el');
 return `<div class="card"><h2>${H('My job','मेरी नौकरी')}</h2><div class="stats">
 <div class="stat"><div class="k">💵 Take-home / month</div><div class="v">${inr(th)}</div><div class="u">gross ${inr(sl.gross)}</div></div>
 <div class="stat"><div class="k">🧾 Income tax / year</div><div class="v">${inr(tx.tax)}</div><div class="u">${tx.chosen} regime${S.naukri.regime==='auto'?' (best)':''}</div></div>
 <div class="stat"><div class="k">🏦 PF at retirement</div><div class="v">${inr(p.corpus)}</div><div class="u">in ${p.years} years</div></div>
 <div class="stat"><div class="k">🗓️ Earned leave</div><div class="v">${el?f1(el.bal):'—'} <span class="u">days</span></div><div class="u">${el?'worth '+inr(el.encash):''}</div></div></div></div>
 <div class="card"><h2>${H('Alerts and advice','सलाह')}</h2>${nAlerts().map(([k,i,t])=>`<div class="alert ${k}">${i} ${t}</div>`).join('')}</div>`};

const nIn=(path,label,val,extra='')=>`<div><label>${label}</label><input type="number" value="${val}" onchange="nSet('${path}',this.value)" ${extra}></div>`;
function nSet(path,v){const[a,b]=path.split('.');S.naukri[a][b]=+v||0;save();render()}
V.n_salary=()=>{const s=S.naukri.sal,sl=nSalary(),tx=nTax(),p=nPF();const th=sl.gross-sl.empPF-sl.pt-tx.tax/12;
 return `<div class="card"><h2>${H('Monthly salary','मासिक वेतन')}</h2>
 <div class="row">${nIn('sal.basic','Basic pay (₹)',s.basic)}${nIn('sal.da','DA (₹)',s.da)}</div>
 <div class="row" style="margin-top:8px">${nIn('sal.hra','HRA (₹)',s.hra)}${nIn('sal.special','Special allowance (₹)',s.special)}${nIn('sal.other','Other allowances (₹)',s.other)}</div>
 <div class="row" style="margin-top:8px">${nIn('sal.pt','Professional tax / month (₹)',s.pt)}${nIn('sal.join','Joining year',s.join)}</div>
 <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:500;color:var(--ink)"><input type="checkbox" ${s.pfCap?'checked':''} onchange="S.naukri.sal.pfCap=this.checked;save();render()" style="width:18px;height:18px;flex:0 0 18px;padding:0"> PF only on ₹15,000 (wage ceiling), not on full basic + DA</label></div>
 <div class="card"><h2>${H('Payslip','वेतन पर्ची')}</h2><table>
 <tr><td>Basic + DA</td><td class="r">${inr(sl.bd)}</td></tr><tr><td>HRA</td><td class="r">${inr(+s.hra||0)}</td></tr><tr><td>Special + other</td><td class="r">${inr((+s.special||0)+(+s.other||0))}</td></tr>
 <tr><th>Gross salary</th><th class="r">${inr(sl.gross)}</th></tr>
 <tr><td>Employee PF (12% of ${inr(sl.pfWage)})</td><td class="r">−${inr(sl.empPF)}</td></tr><tr><td>Professional tax</td><td class="r">−${inr(sl.pt)}</td></tr><tr><td>Income tax (TDS, ${tx.chosen} regime ÷ 12)</td><td class="r">−${inr(tx.tax/12)}</td></tr>
 <tr><th>Take-home</th><th class="r" style="color:var(--good);font-size:17px">${inr(th)}</th></tr></table>
 <p class="muted">Employer also puts ${inr(sl.erPF)} into your EPF and ${inr(sl.eps)} into pension (EPS) each month. Your PF account gets ${inr(sl.empPF+sl.erPF)} a month.</p>
 <canvas id="nsch"></canvas></div>
 <div class="card"><h2>${H('Salary growth','वेतन वृद्धि')}</h2><div class="row">${nIn('pf.hike','Expected yearly hike %',S.naukri.pf.hike,'step="0.5"')}</div>
 <div class="stats" style="margin-top:10px"><div class="stat"><div class="k">Gross in 5 years</div><div class="v">${inr(p.sal5)}</div></div><div class="stat"><div class="k">Gross in 10 years</div><div class="v">${inr(p.sal10)}</div></div></div>
 <div class="eq">Salary after n years = S × (1 + h)ⁿ</div><p class="muted">Compare with inflation (about 5–6% a year): a hike below inflation means your real salary falls.</p></div>`};
A.n_salary=()=>{const sl=nSalary(),tx=nTax(),s=S.naukri.sal;const parts=[['Take-home',sl.gross-sl.empPF-sl.pt-tx.tax/12],['PF',sl.empPF],['Tax',tx.tax/12],['Prof. tax',sl.pt]];
 chart('nsch',[{pts:parts.map((p,i)=>[i,p[1]]),color:'#3b82f6',bar:1}],{ymin:0,xlab:i=>parts[Math.round(i)]?parts[Math.round(i)][0]:''})};

V.n_tax=()=>{const N=S.naukri,d=N.ded,s=N.sal,tx=nTax();const row=(l,a,b)=>`<tr><td>${l}</td><td class="r">${a}</td><td class="r">${b}</td></tr>`;
 return `<div class="card"><h2>${H('Income tax: new vs old regime','आयकर')}</h2><p class="muted">FY 2026-27 slabs (same as FY 2025-26). Salary income only.</p>
 <table><tr><th></th><th class="r">New regime</th><th class="r">Old regime</th></tr>
 ${row('Gross salary (year)',inr(tx.G),inr(tx.G))}
 ${row('Standard deduction','−'+inr(75000),'−'+inr(50000))}
 ${row('HRA exemption','—','−'+inr(tx.hraEx))}
 ${row('Professional tax','—','−'+inr(tx.ptY))}
 ${row('80C (PF + investments)','—','−'+inr(tx.c80t))}
 ${row('80D, home loan interest, NPS','—','−'+inr(tx.d80+tx.home+tx.nps))}
 <tr><th>Taxable income</th><th class="r">${inr(tx.tn)}</th><th class="r">${inr(tx.to)}</th></tr>
 ${row('Tax on slabs',inr(tx.slabN),inr(tx.slabO))}
 ${row('Rebate u/s 87A',tx.rebN?'−'+inr(tx.rebN):'—',tx.taxO===0&&tx.slabO?'−'+inr(tx.slabO):'—')}
 ${row('Health & education cess 4%',inr(tx.taxN*0.04),inr(tx.taxO*0.04))}
 <tr><th>Total tax</th><th class="r" style="${tx.best==='new'?'color:var(--good)':''}">${inr(tx.totN)}</th><th class="r" style="${tx.best==='old'?'color:var(--good)':''}">${inr(tx.totO)}</th></tr></table>
 <div class="alert good">✅ <b>${tx.best==='new'?'New':'Old'} regime</b> is better for you by <b>${inr(tx.save)}</b> a year.</div>
 <label>Regime used for monthly TDS</label><select onchange="S.naukri.regime=this.value;save();render()"><option value="auto" ${N.regime==='auto'?'selected':''}>Automatic (lower tax)</option><option value="new" ${N.regime==='new'?'selected':''}>New regime</option><option value="old" ${N.regime==='old'?'selected':''}>Old regime</option></select>
 <canvas id="ntch"></canvas><p class="muted">Tax at different yearly salaries (new vs old with your current deductions). The new regime is flat at zero up to ₹12.75 lakh salary.</p></div>
 <div class="card"><h2>${H('Deductions (old regime)','कटौती')}</h2>
 <div class="row">${nIn('sal.rent','Rent paid / month (₹)',s.rent)}<div><label>City</label><select onchange="S.naukri.sal.metro=this.value==='1';save();render()"><option value="0" ${!s.metro?'selected':''}>Non-metro (40%)</option><option value="1" ${s.metro?'selected':''}>Metro (50%)</option></select></div></div>
 <div class="row" style="margin-top:8px">${nIn('ded.c80','80C investments besides PF (₹/yr)',d.c80)}${nIn('ded.d80','80D health insurance (₹/yr)',d.d80)}</div>
 <div class="row" style="margin-top:8px">${nIn('ded.home','Home loan interest (₹/yr)',d.home)}${nIn('ded.nps','NPS 80CCD(1B) (₹/yr)',d.nps)}</div>
 <p class="muted">Limits used: 80C ₹1.5 lakh (your PF ${inr(tx.pfYear)} counts), 80D up to ₹1 lakh, home loan interest ₹2 lakh, NPS ₹50,000. HRA exemption = least of HRA received, rent − 10% of basic+DA, and 40/50% of basic+DA.</p></div>
 <div class="card"><h2>Slab rates FY 2026-27</h2><table><tr><th>New regime</th><th class="r">Rate</th></tr>${[['0–4 lakh','0%'],['4–8 lakh','5%'],['8–12 lakh','10%'],['12–16 lakh','15%'],['16–20 lakh','20%'],['20–24 lakh','25%'],['Above 24 lakh','30%']].map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td></tr>`).join('')}</table>
 <table style="margin-top:8px"><tr><th>Old regime (below 60 years)</th><th class="r">Rate</th></tr>${[['0–2.5 lakh','0%'],['2.5–5 lakh','5%'],['5–10 lakh','20%'],['Above 10 lakh','30%']].map(r=>`<tr><td>${r[0]}</td><td class="r">${r[1]}</td></tr>`).join('')}</table>
 <p class="muted">Rebate u/s 87A: no tax up to ₹12 lakh taxable (new) or ₹5 lakh (old), with marginal relief just above ₹12 lakh. Surcharge above ₹50 lakh is not included. For filing, confirm with the Income Tax Department's calculator or a tax adviser.</p></div>`};
A.n_tax=()=>{const N=S.naukri;const tx=nTax();const oldDed=50000+tx.ptY+tx.hraEx+tx.c80t+tx.d80+tx.home+tx.nps;const ptsN=[],ptsO=[];
 for(let g=300000;g<=3000000;g+=100000){const tn=Math.max(0,g-75000);let a=tn<=1200000?0:Math.min(slabTax(tn,NEW_SLABS),tn-1200000);ptsN.push([g/100000,a*1.04]);const to=Math.max(0,g-oldDed);ptsO.push([g/100000,(to<=500000?0:slabTax(to,OLD_SLABS))*1.04])}
 chart('ntch',[{pts:ptsN,color:'#1d4ed8',name:'New'},{pts:ptsO,color:'#f59e0b',name:'Old'},{pts:[[tx.G/100000,tx.tax]],color:'#dc2626',name:'You'}],{ymin:0,xlab:v=>'₹'+Math.round(v)+' L'})};

V.n_pf=()=>{const p=S.naukri.pf,r=nPF(),sl=nSalary();
 return `<div class="card"><h2>${H('PF and retirement','भविष्य निधि')}</h2>
 <div class="row">${nIn('pf.bal','PF balance today (₹)',p.bal)}${nIn('pf.age','Your age',p.age)}${nIn('pf.retire','Retirement age',p.retire)}</div>
 <div class="row" style="margin-top:8px">${nIn('pf.rate','EPF interest % a year',p.rate,'step="0.05"')}${nIn('pf.hike','Yearly salary hike %',p.hike,'step="0.5"')}</div>
 <div class="stats" style="margin-top:10px"><div class="stat"><div class="k">PF at retirement</div><div class="v">${inr(r.corpus)}</div><div class="u">after ${r.years} years</div></div>
 <div class="stat"><div class="k">Going in now</div><div class="v">${inr(r.monthly)}<span class="u">/month</span></div></div>
 <div class="stat"><div class="k">Gratuity at retirement</div><div class="v">${r.grat?inr(r.grat):'—'}</div><div class="u">${r.service} years of service${r.gratRaw>r.grat?' · capped at ₹20 lakh':''}</div></div>
 <div class="stat"><div class="k">Last basic + DA</div><div class="v">${inr(r.lastBd)}</div></div></div>
 <canvas id="npch"></canvas><p class="muted">PF balance by age, with monthly contributions growing with salary.</p>
 <div class="eq">B(m+1) = B(m) × (1 + i) + C, &nbsp; i = rate ÷ 12</div><div class="eq">Gratuity = 15 ÷ 26 × last (basic + DA) × years of service</div>
 <p class="muted">EPF interest is set every year (8.25% for 2024-25); the projection assumes it stays the same. Gratuity needs at least 5 years of service; under the Payment of Gratuity Act the maximum is ₹20 lakh (check your employer's rules).</p></div>`};
A.n_pf=()=>{const r=nPF();chart('npch',[{pts:r.pts,color:'#1d4ed8',name:'PF balance'}],{ymin:0,xlab:a=>'Age '+Math.round(a)})};

V.n_leave=()=>{const L=nLeave(),N=S.naukri;const log=[...N.leave.log].sort((a,b)=>a.date<b.date?1:-1);
 return `<div class="card"><h2>${H('Leave balance','छुट्टी')} ${today().slice(0,4)}</h2><table><tr><th>Type</th><th class="r">Balance</th><th class="r">Used</th><th class="r">Lapses 31 Dec</th></tr>
 ${L.map(l=>`<tr><td>${esc(l.name)}<br><small class="muted">${l.year}/year${l.lapse?' · lapses':' · max '+l.max}</small></td><td class="r"><b>${f1(l.bal)}</b></td><td class="r">${f1(l.used)}</td><td class="r" style="color:${l.lapse>0?'var(--bad)':'inherit'}">${f1(l.lapse)}</td></tr>`).join('')}</table>
 ${L.filter(l=>l.lapse>0).map(l=>`<div class="alert warn">${f1(l.lapse)} day(s) of ${esc(l.name)} will lapse. ${l.daysLeftInYear} days left in the year.</div>`).join('')}
 ${L.find(l=>l.id==='el')?`<p class="muted">Earned leave encashment value now: <b>${inr(L.find(l=>l.id==='el').encash)}</b> (balance × (basic + DA) ÷ 26).</p>`:''}
 <canvas id="nlch"></canvas></div>
 <div class="card"><h2>Take leave</h2><div class="row"><div><label>Type</label><select id="lt">${N.leave.types.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></div><div><label>Days</label><input type="number" step="0.5" id="ld" value="1"></div><div><label>From date</label><input type="date" id="lf" value="${today()}"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Reason</label><input id="lr" placeholder="optional"></div></div><div class="btns"><button onclick="nAddLeave()">Save</button></div></div>
 <div class="card"><h2>Leave rules</h2><table><tr><th>Type</th><th class="r">Per year</th><th class="r">Opening (1 Jan)</th><th class="r">Max carry</th></tr>${N.leave.types.map((t,i)=>`<tr><td>${esc(t.name)}</td><td class="r"><input type="number" style="width:60px;padding:5px" value="${t.year}" onchange="S.naukri.leave.types[${i}].year=+this.value;save();render()"></td><td class="r"><input type="number" style="width:60px;padding:5px" value="${t.open}" onchange="S.naukri.leave.types[${i}].open=+this.value;save();render()"></td><td class="r">${t.lapse?'lapses':`<input type="number" style="width:60px;padding:5px" value="${t.max}" onchange="S.naukri.leave.types[${i}].max=+this.value;save();render()">`}</td></tr>`).join('')}</table><p class="muted">Use your office's leave rules. Casual leave is credited on 1 January; others build up month by month.</p></div>
 ${log.length?`<div class="card"><h2>Leave taken</h2><table>${log.slice(0,30).map(l=>`<tr><td>${pretty(l.date)}</td><td>${esc((N.leave.types.find(t=>t.id===l.type)||{}).name||l.type)}${l.note?'<br><small class="muted">'+esc(l.note)+'</small>':''}</td><td class="r">${l.days} d</td><td class="r"><button class="x" onclick="S.naukri.leave.log=S.naukri.leave.log.filter(x=>x.id!=='${l.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
A.n_leave=()=>{const L=nLeave();chart('nlch',[{pts:L.map((l,i)=>[i,Math.max(0,l.bal)]),color:'#3b82f6',bar:1}],{ymin:0,xlab:i=>L[Math.round(i)]?L[Math.round(i)].name.split(' (')[0].slice(0,12):''})};
function nAddLeave(){const d=parseFloat($('#ld').value);if(isNaN(d)||d<=0)return toast('Enter days');S.naukri.leave.log.push({id:uid(),date:$('#lf').value||today(),type:$('#lt').value,days:d,note:$('#lr').value.trim()});save();render();toast('Leave saved')}

V.n_more=()=>`<div class="card"><h2>More · और</h2>
 <button class="tile" onclick="go('n_maths')"><span class="i">📐</span><span>How it works (the maths)<small>Tax slabs, HRA, PF compounding, gratuity</small></span></button>
 <button class="tile" onclick="addonDemo('naukri')"><span class="i">🧪</span><span>Load NaukriMitra demo<small>An employee with ₹1.22 lakh monthly gross salary</small></span></button>
 <button class="tile" onclick="go('home')"><span class="i">🏠</span><span>Back to GharMitra</span></button></div>`;
V.n_maths=()=>`<div class="card"><h2>📐 NaukriMitra models</h2><p class="muted">Salary data → Tax and PF models → Best choice → Alerts → Employee acts.</p></div>
<div class="card"><h2>🧾 Income tax: piecewise linear function</h2><div class="eq">Tax(x) = Σ rate_k × (part of x inside slab k)</div><p class="muted">The tax graph is a broken line whose slope rises at each slab: 0, 5, 10, 15, 20, 25, 30% (new) or 0, 5, 20, 30% (old).</p>
<div class="eq">New regime: if x ≤ 12,00,000 then tax = 0; else tax = min(Tax(x), x − 12,00,000)</div><div class="eq">Total tax = tax × 1.04 (4% cess)</div>
<div class="eq">HRA exemption = min(HRA, rent − 10% of basic, 40% or 50% of basic)</div></div>
<div class="card"><h2>🏦 PF: compound growth with growing deposits</h2><div class="eq">B(m+1) = B(m) × (1 + r/12) + C</div><div class="eq">C = 12% of PF wage (employee) + (12% − EPS) (employer)</div><div class="eq">Salary after n years = S × (1 + h)ⁿ</div><div class="eq">Gratuity = 15 ÷ 26 × last (basic + DA) × years</div></div>
<div class="card"><h2>🗓️ Leave: accrual and lapse</h2><div class="eq">Balance = opening + yearly quota × months passed ÷ 12 − used</div><div class="eq">Lapse = max(0, year-end balance − carry-forward limit)</div><div class="eq">Encashment = EL days × (basic + DA) ÷ 26</div></div>`;

function nDemo(quiet){const t=today();S.naukri=NDEF();const N=S.naukri;
 N.sal={basic:70000,da:38000,hra:10800,special:0,other:3200,pfCap:false,pt:200,rent:15000,metro:false,join:2012};
 N.ded={c80:0,d80:25000,home:150000,nps:50000};N.pf={bal:1450000,age:41,retire:60,rate:8.25,hike:5};
 const y=t.slice(0,4);const mm=Number(t.slice(5,7));const L=(m,d,type,days,note)=>{if(m<=mm)N.leave.log.push({id:uid(),date:`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,type,days,note})};
 L(1,15,'cl',1,'Family function');L(3,8,'sl',2,'Fever');L(4,22,'cl',2,'Village visit');L(6,10,'el',5,'Summer trip');L(8,5,'cl',1,'');L(10,20,'cl',2,'Durga Puja');
 if(!quiet){S.addons.on.naukri=true;save();toast('NaukriMitra demo loaded');go('n_home')}}
ADDON_REG.naukri={def:NDEF,demo:nDemo,sum(){const sl=nSalary(),tx=nTax();const th=sl.gross-sl.empPF-sl.pt-tx.tax/12;return{income:th,line:`Take-home ${inr(th)}/month · tax ${inr(tx.tax)}/year (${tx.chosen} regime)`,alerts:nAlerts()}}};
