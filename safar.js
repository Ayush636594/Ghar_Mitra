/* GharMitra add-on: safar · version 1.0 */
/* ==================== SAFAR MITRA (vehicle owners & drivers) ==================== */
const TDEF=()=>({veh:[],sel:null,fuel:[],trips:[],exp:[]});
const TEXP=['Service / repair','Tyres','Insurance','Parking / toll','Washing','Fine','Other'];
function tVeh(){const L=S.safar.veh;if(!L.length)return null;return L.find(v=>v.id===S.safar.sel)||L[0]}
function tModel(v){const t=dnum(today()),T=S.safar;const F=T.fuel.filter(f=>f.vid===v.id).sort((a,b)=>+a.odo-+b.odo);
 const mil=[];let km=0,lit=0;for(let i=1;i<F.length;i++){const d=F[i].odo-F[i-1].odo;if(d>0&&F[i].litres>0){mil.push({date:F[i].date,kmpl:d/F[i].litres});km+=d;lit+= +F[i].litres}}
 const avgK=lit?km/lit:null;const lastK=mil.length?mil[mil.length-1].kmpl:null;const drop=avgK&&lastK&&mil.length>=3?(avgK-lastK)/avgK*100:0;
 const price=F.length?+F[F.length-1].price:0;const cpk=avgK&&price?price/avgK:null;
 const odoPts=F.map(f=>[dnum(f.date),+f.odo]);if(v.odoDate)odoPts.push([dnum(v.odoDate),+v.odo]);odoPts.sort((a,b)=>a[0]-b[0]);
 const rec=odoPts.filter(p=>p[0]>t-90);const reg=rec.length>=2&&rec[rec.length-1][0]>rec[0][0]?linreg(rec):null;const kmDay=reg?Math.max(0,reg.b):0;
 const odoNow=Math.max(+v.odo||0,...F.map(f=>+f.odo),0);const since=odoNow-(+v.lastService||0);const left=(+v.serviceEvery||0)-since;const svcDay=kmDay>0?t+Math.ceil(left/kmDay):null;
 const docs=[['Insurance',v.ins],['PUC certificate',v.puc],['Driving licence',v.dl],['Permit / fitness',v.permit]].filter(d=>d[1]).map(([n,d])=>({n,d,days:dnum(d)-t}));
 const ms=monthStart(today());const fuelM=F.filter(f=>f.date>=ms).reduce((a,f)=>a+f.litres*f.price,0);const expM=T.exp.filter(e=>e.vid===v.id&&e.date>=ms).reduce((a,e)=>a+ +e.amt,0);
 const tm=T.trips.filter(x=>x.vid===v.id&&x.date>=ms);const earnM=tm.reduce((a,x)=>a+ +x.earn,0),kmM=tm.reduce((a,x)=>a+ +x.km,0);const daysW=new Set(tm.map(x=>x.date)).size;
 const emi=+v.emi||0;const netM=earnM-fuelM-expM-emi;const perKm=kmM?earnM/kmM:null;const runKm=(cpk||0)+(kmM?expM/kmM:0);
 const beKm=perKm&&perKm>runKm?emi/(perKm-runKm):null;const kmMonth=kmDay*30;const tco=kmMonth?((cpk||0)*kmMonth+emi+(+v.yearly||0)/12)/kmMonth:null;
 const emiDay=+v.emiDay||0;const dd=Number(today().slice(8));const emiIn=emiDay?(emiDay>=dd?emiDay-dd:daysInMonth(today())-dd+emiDay):null;
 return{F,mil,avgK,lastK,drop,price,cpk,kmDay,odoNow,since,left,svcDay,docs,fuelM,expM,earnM,kmM,daysW,netM,perKm,runKm,beKm,tco,emi,emiIn,t,kmMonth}}
function tAlerts(){const out=[];for(const v of S.safar.veh){const m=tModel(v),nm=`<b>${esc(v.name)}</b>`;
 for(const d of m.docs){if(d.days<0)out.push(['bad','📄',`${nm}: ${d.n} expired on ${pretty(d.d)}. Renew before driving (fines and no insurance cover).`]);else if(d.days<=30)out.push(['warn','📄',`${nm}: ${d.n} expires in ${d.days} days (${pretty(d.d)}).`])}
 if(+v.serviceEvery){if(m.left<=0)out.push(['bad','🔧',`${nm}: service overdue by ${Math.round(-m.left)} km.`]);else if(m.left<=300||(m.svcDay!=null&&m.svcDay-m.t<=7))out.push(['warn','🔧',`${nm}: service due in ${Math.round(m.left)} km${m.svcDay!=null?` (around ${prettyN(m.svcDay)})`:''}.`])}
 if(m.drop>=10)out.push(['warn','⛽',`${nm}: mileage dropped to ${f1(m.lastK)} km/L from an average of ${f1(m.avgK)} (${Math.round(m.drop)}% lower). Check tyre pressure, air filter and driving style.`]);
 if(m.emiIn!=null&&m.emiIn<=3&&m.emi)out.push(['warn','🏦',`${nm}: EMI of ${inr(m.emi)} due in ${m.emiIn} day(s).`]);
 if(v.commercial&&m.earnM)out.push([m.netM>=0?'good':'bad','🚕',`${nm}: this month earned ${inr(m.earnM)}, net after fuel, costs and EMI <b>${inr(m.netM)}</b> (${m.daysW} working days).`])}
 if(!S.safar.veh.length)out.push(['info','🛵','Add your vehicle to start.']);return out}

V.t_home=()=>{const L=S.safar.veh,v=tVeh(),m=v?tModel(v):null;
 return `<div class="card"><h2>${H('My vehicles','मेरे वाहन')}</h2>${L.map(x=>`<button class="tile" style="${v&&x.id===v.id?'border-color:var(--acc);background:var(--accbg)':''}" onclick="S.safar.sel='${x.id}';save();render()"><span class="i">${{Bike:'🛵',Car:'🚗',Auto:'🛺',Taxi:'🚕',Truck:'🚚'}[x.type]||'🚗'}</span><span style="flex:1">${esc(x.name)}<small>${x.type}${x.commercial?' · commercial':''} · ${Math.round(tModel(x).odoNow).toLocaleString('en-IN')} km</small></span></button>`).join('')}
 <div class="row" style="margin-top:6px"><div><input id="vn" placeholder="Vehicle name / number"></div><div style="flex:0 0 100px"><select id="vt">${['Bike','Car','Auto','Taxi','Truck'].map(x=>`<option>${x}</option>`).join('')}</select></div><div style="flex:0 0 auto"><button onclick="tAddVeh()">Add</button></div></div></div>
 ${m?`<div class="card"><h2>${esc(v.name)}</h2><div class="stats">
 <div class="stat"><div class="k">⛽ Mileage</div><div class="v">${m.avgK?f1(m.avgK):'—'} <span class="u">km/L</span></div><div class="u">${m.lastK?'last fill '+f1(m.lastK):''}</div></div>
 <div class="stat"><div class="k">💸 Fuel cost per km</div><div class="v">${m.cpk?'₹'+f2(m.cpk):'—'}</div><div class="u">${m.tco?'all-in ₹'+f2(m.tco)+'/km':''}</div></div>
 <div class="stat"><div class="k">🔧 Next service</div><div class="v">${+v.serviceEvery?Math.round(m.left)+' <span class="u">km</span>':'—'}</div><div class="u">${m.svcDay!=null?'≈ '+prettyN(m.svcDay):''}</div></div>
 <div class="stat"><div class="k">🛣️ Running</div><div class="v">${f1(m.kmDay)} <span class="u">km/day</span></div><div class="u">fuel this month ${inr(m.fuelM)}</div></div></div></div>`:''}
 <div class="card"><h2>${H('Alerts and advice','सलाह')}</h2>${tAlerts().map(([c,i,t])=>`<div class="alert ${c}">${i} ${t}</div>`).join('')}</div>`};
function tAddVeh(){const n=$('#vn').value.trim();if(!n)return toast('Enter a name');const ty=$('#vt').value;const v={id:uid(),name:n,type:ty,commercial:['Auto','Taxi','Truck'].includes(ty),odo:0,odoDate:today(),serviceEvery:ty==='Bike'?3000:ty==='Auto'?5000:10000,lastService:0,emi:0,emiDay:0,yearly:0};S.safar.veh.push(v);S.safar.sel=v.id;save();render();toast('Vehicle added. Fill odometer and dates in Service.')}
function tV(k,v){const x=tVeh();x[k]=v;save();render()}

V.t_fuel=()=>{const v=tVeh();if(!v)return V.t_home();const m=tModel(v);
 return `<div class="card"><h2>${H('Fuel fill','ईंधन')} · ${esc(v.name)}</h2><div class="row"><div><label>Odometer (km)</label><input type="number" id="fo" placeholder="${Math.round(m.odoNow)}"></div><div><label>Litres filled</label><input type="number" step="0.01" id="fl"></div><div><label>Price ₹/L</label><input type="number" step="0.01" id="fp" value="${m.price||''}"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Date</label><input type="date" id="fd2" value="${today()}"></div></div><div class="btns"><button onclick="tAddFuel()">Save</button></div>
 <p class="muted">Fill the tank full every time and note the odometer: mileage = km since last fill ÷ litres filled now.</p></div>
 ${m.mil.length?`<div class="card"><h2>${H('Mileage','माइलेज')}</h2><div class="stats"><div class="stat"><div class="k">Average</div><div class="v">${f1(m.avgK)} <span class="u">km/L</span></div></div><div class="stat"><div class="k">Fuel cost per km</div><div class="v">₹${f2(m.cpk||0)}</div></div></div>
 <canvas id="tfch"></canvas><p class="muted">Mileage of each fill (dashed red = your average). A steady fall means the vehicle needs attention.</p>
 <div class="eq">Mileage = (odometerₙ − odometerₙ₋₁) ÷ litresₙ &nbsp;·&nbsp; Average = total km ÷ total litres</div></div>`:''}
 ${m.F.length?`<div class="card"><h2>Fill history</h2><table>${[...m.F].reverse().slice(0,25).map(f=>`<tr><td>${pretty(f.date)}</td><td class="r">${(+f.odo).toLocaleString('en-IN')} km</td><td class="r">${f.litres} L</td><td class="r">${inr(f.litres*f.price)}</td><td class="r"><button class="x" onclick="S.safar.fuel=S.safar.fuel.filter(x=>x.id!=='${f.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
A.t_fuel=()=>{const v=tVeh();if(!v)return;const m=tModel(v);if(!m.mil.length)return;chart('tfch',[{pts:m.mil.map(x=>[dnum(x.date),x.kmpl]),color:'#0e7490',name:'km/L'}],{hline:m.avgK,xlab:prettyN})};
function tAddFuel(){const v=tVeh();const o=parseFloat($('#fo').value),l=parseFloat($('#fl').value),p=parseFloat($('#fp').value);if(isNaN(o)||isNaN(l)||isNaN(p))return toast('Enter odometer, litres and price');S.safar.fuel.push({id:uid(),vid:v.id,date:$('#fd2').value||today(),odo:o,litres:l,price:p});if(o>(+v.odo||0)){v.odo=o;v.odoDate=$('#fd2').value||today()}save();render();toast('Fuel saved')}

V.t_service=()=>{const v=tVeh();if(!v)return V.t_home();const m=tModel(v);const E=S.safar.exp.filter(e=>e.vid===v.id).sort((a,b)=>a.date<b.date?1:-1);
 return `<div class="card"><h2>${H('Service','सर्विस')} · ${esc(v.name)}</h2>
 <div class="row"><div><label>Odometer now (km)</label><input type="number" value="${Math.round(m.odoNow)}" onchange="tV('odo',+this.value);tV('odoDate',today())"></div><div><label>Service every (km)</label><input type="number" value="${v.serviceEvery}" onchange="tV('serviceEvery',+this.value)"></div><div><label>Last service at (km)</label><input type="number" value="${v.lastService}" onchange="tV('lastService',+this.value)"></div></div>
 ${+v.serviceEvery?`<div class="bar" style="height:14px;margin-top:10px"><div style="width:${Math.min(100,Math.max(0,m.since/v.serviceEvery*100))}%;background:${m.left<=300?'var(--bad)':'var(--acc2)'}"></div></div><p class="muted">${Math.round(m.since)} km since last service · ${Math.round(m.left)} km left${m.svcDay!=null?` · at ${f1(m.kmDay)} km/day, due around <b>${prettyN(m.svcDay)}</b>`:''}</p>`:''}
 <div class="btns"><button class="small" onclick="tV('lastService',${Math.round(m.odoNow)})">Serviced today</button></div>
 <div class="eq">Service date = today + (km left ÷ km per day) &nbsp;·&nbsp; km per day from the odometer trend line</div></div>
 <div class="card"><h2>${H('Documents','कागज़ात')}</h2><div class="row"><div><label>Insurance valid till</label><input type="date" value="${v.ins||''}" onchange="tV('ins',this.value)"></div><div><label>PUC valid till</label><input type="date" value="${v.puc||''}" onchange="tV('puc',this.value)"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Driving licence valid till</label><input type="date" value="${v.dl||''}" onchange="tV('dl',this.value)"></div><div><label>Permit / fitness (commercial)</label><input type="date" value="${v.permit||''}" onchange="tV('permit',this.value)"></div></div>
 ${m.docs.length?`<table style="margin-top:8px">${m.docs.map(d=>`<tr style="${d.days<0?'background:var(--badbg)':d.days<=30?'background:var(--warnbg)':''}"><td>${d.n}</td><td>${pretty(d.d)}</td><td class="r">${d.days<0?'expired':d.days+' days left'}</td></tr>`).join('')}</table>`:''}</div>
 <div class="card"><h2>${H('Loan and yearly costs','EMI')}</h2><div class="row"><div><label>EMI (₹/month)</label><input type="number" value="${v.emi||0}" onchange="tV('emi',+this.value)"></div><div><label>EMI date (day of month)</label><input type="number" value="${v.emiDay||''}" onchange="tV('emiDay',+this.value)"></div><div><label>Insurance + tax per year (₹)</label><input type="number" value="${v.yearly||0}" onchange="tV('yearly',+this.value)"></div></div>
 <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:500;color:var(--ink)"><input type="checkbox" ${v.commercial?'checked':''} onchange="tV('commercial',this.checked)" style="width:18px;height:18px;flex:0 0 18px;padding:0"> Commercial vehicle (I earn from trips)</label>
 ${m.tco?`<p class="muted">All-in cost per km (fuel + EMI + insurance) ≈ <b>₹${f2(m.tco)}</b>.</p>`:''}</div>
 <div class="card"><h2>Add expense</h2><div class="row"><div><label>Amount (₹)</label><input type="number" id="xa2"></div><div><label>Type</label><select id="xc2">${TEXP.map(c=>`<option>${c}</option>`).join('')}</select></div></div><div class="btns"><button onclick="tAddExp()">Add</button></div>
 ${E.length?`<table style="margin-top:8px">${E.slice(0,20).map(e=>`<tr><td>${pretty(e.date)}</td><td>${e.cat}</td><td class="r">${inr(e.amt)}</td><td class="r"><button class="x" onclick="S.safar.exp=S.safar.exp.filter(x=>x.id!=='${e.id}');save();render()">✕</button></td></tr>`).join('')}</table>`:''}</div>`};
function tAddExp(){const v=tVeh();const a=parseFloat($('#xa2').value);if(isNaN(a)||a<=0)return toast('Enter amount');S.safar.exp.push({id:uid(),vid:v.id,date:today(),cat:$('#xc2').value,amt:a});save();render()}

V.t_earn=()=>{const v=tVeh();if(!v)return V.t_home();const m=tModel(v);const T=S.safar.trips.filter(x=>x.vid===v.id).sort((a,b)=>a.date<b.date?1:-1);
 if(!v.commercial)return `<div class="card"><h2>${H('Earnings','कमाई')}</h2><p class="muted">This is a personal vehicle. Turn on "Commercial vehicle" in the Service tab to track trips and earnings (auto, taxi, truck).</p></div>`;
 return `<div class="card"><h2>${H('Day\'s earnings','दिन की कमाई')} · ${esc(v.name)}</h2><div class="row"><div><label>Date</label><input type="date" id="rd2" value="${today()}"></div><div><label>Km driven</label><input type="number" id="rk"></div><div><label>Earnings (₹)</label><input type="number" id="re2"></div></div>
 <div class="btns"><button onclick="tAddTrip()">Save</button></div></div>
 <div class="card"><h2>This month</h2><table><tr><td>Earnings (${m.daysW} days, ${Math.round(m.kmM)} km)</td><td class="r">${inr(m.earnM)}</td></tr><tr><td>Fuel</td><td class="r">−${inr(m.fuelM)}</td></tr><tr><td>Other costs</td><td class="r">−${inr(m.expM)}</td></tr><tr><td>EMI</td><td class="r">−${inr(m.emi)}</td></tr>
 <tr><th>Net income</th><th class="r" style="color:${m.netM<0?'var(--bad)':'var(--good)'}">${inr(m.netM)}</th></tr></table>
 <div class="stats" style="margin-top:10px"><div class="stat"><div class="k">Earning per km</div><div class="v">${m.perKm?'₹'+f2(m.perKm):'—'}</div></div><div class="stat"><div class="k">Running cost per km</div><div class="v">₹${f2(m.runKm)}</div></div>
 <div class="stat"><div class="k">Km to cover EMI</div><div class="v">${m.beKm!=null?Math.round(m.beKm):'—'} <span class="u">km/month</span></div></div><div class="stat"><div class="k">Per working day</div><div class="v">${m.daysW?inr(m.netM/m.daysW):'—'}</div></div></div>
 <canvas id="tech"></canvas><div class="eq">Net = earnings − fuel − costs − EMI &nbsp;·&nbsp; Break-even km = EMI ÷ (earning per km − cost per km)</div></div>
 ${T.length?`<div class="card"><h2>Days</h2><table>${T.slice(0,30).map(x=>`<tr><td>${pretty(x.date)}</td><td class="r">${x.km} km</td><td class="r">${inr(x.earn)}</td><td class="r"><button class="x" onclick="S.safar.trips=S.safar.trips.filter(y=>y.id!=='${x.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
A.t_earn=()=>{const v=tVeh();if(!v||!v.commercial)return;const t=dnum(today());const P=S.safar.trips.filter(x=>x.vid===v.id&&dnum(x.date)>t-30).map(x=>[dnum(x.date),+x.earn]);chart('tech',[{pts:P,color:'#0e7490',bar:1,name:'Daily earnings'}],{ymin:0,xlab:prettyN})};
function tAddTrip(){const v=tVeh();const k=parseFloat($('#rk').value),e=parseFloat($('#re2').value);if(isNaN(k)||isNaN(e))return toast('Enter km and earnings');S.safar.trips.push({id:uid(),vid:v.id,date:$('#rd2').value||today(),km:k,earn:e});save();render();toast('Saved')}

V.t_more=()=>`<div class="card"><h2>More · और</h2>
 <button class="tile" onclick="go('t_maths')"><span class="i">📐</span><span>How it works (the maths)<small>Mileage, cost per km, service prediction, break-even</small></span></button>
 <button class="tile" onclick="addonDemo('safar')"><span class="i">🧪</span><span>Load SafarMitra demo<small>A family motorcycle and an auto-rickshaw</small></span></button>
 <button class="tile" onclick="go('home')"><span class="i">🏠</span><span>Back to GharMitra</span></button></div>`;
V.t_maths=()=>`<div class="card"><h2>📐 SafarMitra models</h2><p class="muted">Fuel fills and odometer → Mileage and trends → Alerts → Driver acts → New readings.</p></div>
<div class="card"><h2>⛽ Mileage and cost</h2><div class="eq">Mileage = distance ÷ fuel used</div><div class="eq">Fuel cost per km = price per litre ÷ mileage</div><div class="eq">All-in cost per km = (fuel + EMI + insurance ÷ 12) ÷ km per month</div></div>
<div class="card"><h2>🔧 Service prediction: linear model</h2><div class="eq">Odometer x(t) = a + b·t (b = km per day)</div><div class="eq">Service date = today + (service interval − km since service) ÷ b</div></div>
<div class="card"><h2>🚕 Earnings and break-even</h2><div class="eq">Net = earnings − fuel − other costs − EMI</div><div class="eq">Break-even km = EMI ÷ (earning per km − running cost per km)</div></div>`;

function tDemo(quiet){const t=dnum(today());S.safar=TDEF();const T=S.safar;
 const bike={id:uid(),name:'Family motorcycle',type:'Bike',commercial:false,odo:0,odoDate:dstr(t),serviceEvery:3000,lastService:0,emi:0,emiDay:0,yearly:2200,ins:dstr(t+22),puc:dstr(t+70),dl:dstr(t+900)};
 const auto={id:uid(),name:'OD-19 Auto',type:'Auto',commercial:true,odo:0,odoDate:dstr(t),serviceEvery:5000,lastService:0,emi:4200,emiDay:Number(dstr(t+2).slice(8)),yearly:9000,ins:dstr(t+150),puc:dstr(t-3),dl:dstr(t+400),permit:dstr(t+200)};
 let o=21480;const bm=[40,41,39,40.5,38,37,33.5];T.fuel.push({id:uid(),vid:bike.id,date:dstr(t-84),odo:o,litres:6,price:106.5});
 for(let k=1;k<7;k++){const dist=[0,320,300,330,310,290,300][k];o+=dist;T.fuel.push({id:uid(),vid:bike.id,date:dstr(t-84+k*12),odo:o,litres:+(dist/bm[k]).toFixed(2),price:106.5})}
 bike.odo=o+150;bike.odoDate=dstr(t);bike.lastService=bike.odo-2850;
 let a=58200;T.fuel.push({id:uid(),vid:auto.id,date:dstr(t-55),odo:a,litres:9,price:96});
 for(let k=1;k<12;k++){const dist=230+((k*37)%40);const km=26.5*(1+((k*3)%4-1.5)/40);a+=dist;T.fuel.push({id:uid(),vid:auto.id,date:dstr(t-55+k*5),odo:a,litres:+(dist/km).toFixed(2),price:96})}
 auto.odo=a+60;auto.odoDate=dstr(t);auto.lastService=auto.odo-4100;
 const ms=dnum(monthStart(today()));for(let d=Math.max(ms,t-30);d<=t;d++){if(wdOf(d)===0)continue;const km=85+((d*7)%30);T.trips.push({id:uid(),vid:auto.id,date:dstr(d),km,earn:Math.round(km*13.5+((d*11)%90))})}
 T.exp.push({id:uid(),vid:auto.id,date:dstr(Math.max(ms,t-10)),cat:'Service / repair',amt:1800},{id:uid(),vid:auto.id,date:dstr(Math.max(ms,t-4)),cat:'Parking / toll',amt:300});
 T.veh=[bike,auto];T.sel=bike.id;if(!quiet){S.addons.on.safar=true;save();toast('SafarMitra demo loaded');go('t_home')}}
ADDON_REG.safar={def:TDEF,demo:tDemo,sum(){const V_=S.safar.veh;let inc=0;for(const v of V_)if(v.commercial)inc+=tModel(v).netM;return{income:inc,line:V_.length?V_.map(v=>esc(v.name)).join(', ')+(inc?` · net ${inr(inc)} this month`:''):'Add your vehicle to start',alerts:tAlerts()}}};
