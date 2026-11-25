/* GharMitra add-on: kaarigar · version 1.0 */
/* ==================== KAARIGAR MITRA (tailors, artisans, self-help groups) ==================== */
const RDEF=()=>({prof:{name:'',craft:'Tailoring',hours:6,days:6,rate:80,overhead:10,margin:25},members:[],orders:[],products:[],materials:[],purchases:[],work:[]});
function rCap(){const R=S.kaarigar;return (+R.prof.hours||0)*Math.max(1,R.members.length)}
function rIsWork(d){const n=+S.kaarigar.prof.days||6,w=wdOf(d);return n>=7?true:n===6?w!==0:(w!==0&&w!==6)}
function rSchedule(){const R=S.kaarigar,t=dnum(today()),cap=rCap();
 const pend=R.orders.filter(o=>o.status==='pending').map(o=>({o,rem:Math.max(0,(+o.hours||0)*(1-(+o.prog||0)/100))})).sort((a,b)=>a.o.due<b.o.due?-1:a.o.due>b.o.due?1:0);
 let d=t,left=cap;const out=[];
 for(const p of pend){let need=p.rem;if(cap<=0){out.push({...p,fin:null,late:true,lateBy:0});continue}
  let guard=0;while(need>1e-9&&guard++<2000){if(!rIsWork(d)){d++;left=cap;continue}const use=Math.min(need,left);need-=use;left-=use;if(need>1e-9){d++;left=cap}}
  const due=dnum(p.o.due);out.push({...p,fin:d,late:d>due,lateBy:d-due,start:null})}
 const totalH=pend.reduce((a,p)=>a+p.rem,0);let capH=0;
 if(pend.length){const last=Math.max(...pend.map(p=>dnum(p.o.due)));for(let x=t;x<=last;x++)if(rIsWork(x))capH+=cap}
 return{out,totalH,capH,util:capH?totalH/capH*100:0,cap,free:Math.max(0,capH-totalH)}}
function rPrice(mat,hours){const P=S.kaarigar.prof;const lab=hours*(+P.rate||0);const base=mat+lab;const oh=base*(+P.overhead||0)/100;const cost=base+oh;const price=cost*(1+(+P.margin||0)/100);return{lab,oh,cost,price,profit:price-cost}}
function rEarn(){const R=S.kaarigar,t=today(),ms=monthStart(t);
 const del=R.orders.filter(o=>o.status==='delivered'&&o.done&&o.done>=ms&&o.done<=t);const income=del.reduce((a,o)=>a+ +o.price,0);
 const mat=R.purchases.filter(p=>p.date>=ms&&p.date<=t).reduce((a,p)=>a+ +p.amt,0);const net=income-mat;
 const wk=R.work.filter(w=>w.date>=ms&&w.date<=t);const hours=wk.reduce((a,w)=>a+ +w.hours,0);
 const byM={};for(const w of wk)byM[w.member]=(byM[w.member]||0)+ +w.hours;
 const shares=Object.entries(byM).map(([m,h])=>({m,h,share:hours?net*h/hours:0}));
 const due=R.orders.filter(o=>o.status!=='pending'||+o.advance>0).reduce((a,o)=>a+Math.max(0,(o.status==='delivered'?+o.price:0)-(+o.advance||0)-(+o.paid||0)),0);
 const hist=[];const now=new Date();for(let k=5;k>=0;k--){const d=new Date(now.getFullYear(),now.getMonth()-k,1);const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const inc=R.orders.filter(o=>o.status==='delivered'&&o.done&&o.done.startsWith(key)).reduce((a,o)=>a+ +o.price,0);const m2=R.purchases.filter(p=>p.date.startsWith(key)).reduce((a,p)=>a+ +p.amt,0);hist.push({k:5-k,m:MON[d.getMonth()],net:inc-m2})}
 return{del,income,mat,net,hours,perHour:hours?net/hours:null,shares,due,hist}}
function rAlerts(){const out=[],R=S.kaarigar,sc=rSchedule(),t=dnum(today());
 for(const x of sc.out){if(x.late)out.push(['bad','⏰',`<b>${esc(x.o.cust)} – ${esc(x.o.item)}</b> will be ready ${x.fin!=null?prettyN(x.fin):'—'}, <b>${x.lateBy} day(s) after</b> the promised ${pretty(x.o.due)}. Add ${f1(x.lateBy*sc.cap)} extra hours, get help, or inform the customer.`]);
  else if(dnum(x.o.due)-t<=2)out.push(['warn','📦',`<b>${esc(x.o.cust)} – ${esc(x.o.item)}</b> is due ${pretty(x.o.due)}. Expected ready ${prettyN(x.fin)}.`])}
 for(const m of R.materials)if(+m.qty<=+m.min)out.push(['warn','🧶',`Low material: <b>${esc(m.name)}</b> (${f1(m.qty)} ${esc(m.unit)} left, minimum ${m.min}).`]);
 if(sc.out.length){if(sc.util>100)out.push(['bad','📋',`Work in hand needs ${f1(sc.totalH)} h but only ${f1(sc.capH)} h are available before the last due date (${Math.round(sc.util)}% load). Do not take new orders with early dates.`]);
  else out.push(['info','📋',`Workload ${Math.round(sc.util)}% of capacity. Free time before the last due date: about <b>${f1(sc.free)} hours</b>, so you can take more orders.`])}
 const e=rEarn();if(e.due>0)out.push(['info','💰',`To collect from customers: <b>${inr(e.due)}</b>.`]);
 if(e.perHour!=null)out.push([e.perHour<(+R.prof.rate||0)?'warn':'good','⏱️',`This month you earned ${inr(e.perHour)} per hour of work (your target labour rate: ${inr(R.prof.rate)}).`]);
 if(!R.orders.length)out.push(['info','🧵','Add your first order in the Orders tab.']);
 return out}

V.r_home=()=>{const R=S.kaarigar,sc=rSchedule(),e=rEarn();
 return `<div class="card"><h2>${R.prof.name?esc(R.prof.name):'My work'} <span class="hi">· ${esc(R.prof.craft)}</span></h2>
 <div class="stats"><div class="stat"><div class="k">📋 Orders in hand</div><div class="v">${sc.out.length}</div><div class="u">${f1(sc.totalH)} hours of work</div></div>
 <div class="stat"><div class="k">⏰ Late orders</div><div class="v" style="color:${sc.out.some(x=>x.late)?'var(--bad)':'var(--good)'}">${sc.out.filter(x=>x.late).length}</div></div>
 <div class="stat"><div class="k">💰 Earned this month</div><div class="v">${inr(e.net)}</div><div class="u">after materials</div></div>
 <div class="stat"><div class="k">📈 Workload</div><div class="v">${Math.round(sc.util)}<span class="u">%</span></div><div class="bar"><div style="width:${Math.min(100,sc.util)}%;background:${sc.util>100?'var(--bad)':'var(--acc2)'}"></div></div></div></div></div>
 <div class="card"><h2>${H('Alerts and advice','सलाह')}</h2>${rAlerts().map(([k,i,t])=>`<div class="alert ${k}">${i} ${t}</div>`).join('')}</div>
 <div class="card"><h2>Work settings</h2><div class="row"><div><label>Name / group name</label><input value="${esc(R.prof.name)}" onchange="S.kaarigar.prof.name=this.value;save()"></div><div><label>Craft</label><input value="${esc(R.prof.craft)}" onchange="S.kaarigar.prof.craft=this.value;save()"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Work hours per day (each person)</label><input type="number" value="${R.prof.hours}" onchange="S.kaarigar.prof.hours=+this.value;save();render()"></div><div><label>Working days a week</label><select onchange="S.kaarigar.prof.days=+this.value;save();render()">${[5,6,7].map(n=>`<option ${+R.prof.days===n?'selected':''}>${n}</option>`).join('')}</select></div></div>
 <h3>Members (self-help group / helpers)</h3>${R.members.length?R.members.map(m=>`<span class="pill" style="margin:2px">${esc(m.name)} <a style="cursor:pointer;color:var(--bad)" onclick="S.kaarigar.members=S.kaarigar.members.filter(x=>x.id!=='${m.id}');save();render()">✕</a></span>`).join(''):'<p class="muted">Only you. Add members if others work with you; capacity = hours × members.</p>'}
 <div class="row" style="margin-top:8px"><div><input id="mn" placeholder="Member name"></div><div style="flex:0 0 auto"><button class="small" onclick="rAddMember()">Add</button></div></div></div>`};
function rAddMember(){const n=$('#mn').value.trim();if(!n)return;S.kaarigar.members.push({id:uid(),name:n});save();render()}

V.r_orders=()=>{const R=S.kaarigar,sc=rSchedule();const fin={};for(const x of sc.out)fin[x.o.id]=x;
 const done=R.orders.filter(o=>o.status!=='pending').sort((a,b)=>(b.done||'')<(a.done||'')?-1:1);
 return `<div class="card"><h2>${H('New order','नया ऑर्डर')}</h2>
 <div class="row"><div><label>Customer</label><input id="oc"></div><div><label>Item</label><input id="oi" list="prodlist" placeholder="e.g. Blouse stitching"><datalist id="prodlist">${R.products.map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist></div></div>
 <div class="row" style="margin-top:8px"><div><label>Quantity</label><input type="number" id="oq" value="1"></div><div><label>Total price (₹)</label><input type="number" id="op"></div><div><label>Advance (₹)</label><input type="number" id="oa" value="0"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Delivery date</label><input type="date" id="od"></div><div><label>Work hours (total)</label><input type="number" step="0.5" id="oh"></div></div>
 <div class="btns"><button onclick="rAddOrder()">Add order</button><button class="ghost" onclick="rFillFromProduct()">Fill from saved product</button></div>
 <p class="muted">Before promising a date, check the schedule below: if the new order shows "late", give a later date.</p></div>
 <div class="card"><h2>${H('Work schedule','कार्य योजना')}</h2>${sc.out.length?`<p class="muted">Earliest-due-date first · capacity ${f1(sc.cap)} h per working day</p>
 <table><tr><th>Order</th><th class="r">Hours left</th><th>Due</th><th>Ready by</th><th></th></tr>${sc.out.map(x=>`<tr style="${x.late?'background:var(--badbg)':''}"><td><b>${esc(x.o.cust)}</b><br><small>${esc(x.o.item)} × ${x.o.qty}</small></td><td class="r">${f1(x.rem)}</td><td>${pretty(x.o.due)}</td><td>${x.fin!=null?prettyN(x.fin):'—'}${x.late?' ⚠️':' ✅'}</td>
 <td class="r"><select style="padding:4px;font-size:12px;width:auto" onchange="rProg('${x.o.id}',this.value)">${[0,25,50,75].map(p=>`<option value="${p}" ${+x.o.prog===p?'selected':''}>${p}%</option>`).join('')}<option value="done">Done ✔</option></select></td></tr>`).join('')}</table>
 <canvas id="rsch"></canvas><p class="muted">Bars: days between "ready by" and the promised date (above zero = spare days, below zero = late).</p>`:'<p class="muted">No pending orders.</p>'}</div>
 ${done.length?`<div class="card"><h2>Completed / delivered</h2><table>${done.slice(0,30).map(o=>{const bal=+o.price-(+o.advance||0)-(+o.paid||0);return `<tr><td><b>${esc(o.cust)}</b><br><small>${esc(o.item)} · ${o.status==='delivered'?'delivered '+pretty(o.done):'ready, not delivered'}</small></td><td class="r">${inr(o.price)}${bal>0?`<br><small style="color:var(--bad)">due ${inr(bal)}</small>`:''}</td>
 <td class="r">${o.status==='done'?`<button class="small" onclick="rDeliver('${o.id}')">Deliver</button>`:bal>0?`<button class="small ghost" onclick="rPaid('${o.id}')">Paid</button>`:'✅'}</td></tr>`}).join('')}</table></div>`:''}`};
A.r_orders=()=>{const sc=rSchedule();if(!sc.out.length)return;chart('rsch',[{pts:sc.out.map((x,i)=>[i,x.fin!=null?dnum(x.o.due)-x.fin:0]),color:'#8b5cf6',bar:1}],{ymin:Math.min(0,...sc.out.map(x=>x.fin!=null?dnum(x.o.due)-x.fin:0)),hline:0,xlab:i=>sc.out[Math.round(i)]?sc.out[Math.round(i)].o.cust.slice(0,10):''})};
function rAddOrder(){const c=$('#oc').value.trim(),it=$('#oi').value.trim(),p=parseFloat($('#op').value),h=parseFloat($('#oh').value),d=$('#od').value;
 if(!c||!it||isNaN(p)||isNaN(h)||!d)return toast('Fill customer, item, price, hours and date');
 S.kaarigar.orders.push({id:uid(),cust:c,item:it,qty:+$('#oq').value||1,price:p,advance:+$('#oa').value||0,paid:0,due:d,hours:h,prog:0,status:'pending',added:today()});save();render();
 const x=rSchedule().out.find(y=>y.o.cust===c&&y.o.item===it&&y.o.due===d);toast(x&&x.late?`⚠️ This order will be ${x.lateBy} day(s) late`:'Order added',x&&x.late?5000:2200)}
function rFillFromProduct(){const n=$('#oi').value.trim();const p=S.kaarigar.products.find(x=>x.name===n)||S.kaarigar.products[0];if(!p)return toast('Save a product in the Pricing tab first');const q=+$('#oq').value||1;
 $('#oi').value=p.name;$('#op').value=Math.round(p.price*q);$('#oh').value=+(p.hours*q).toFixed(1);toast('Filled price and hours for '+q+' × '+p.name)}
function rProg(id,v){const o=S.kaarigar.orders.find(x=>x.id===id);if(v==='done'){o.status='done';o.prog=100;o.done=today()}else o.prog=+v;save();render()}
function rDeliver(id){const o=S.kaarigar.orders.find(x=>x.id===id);o.status='delivered';o.done=today();save();render();toast('Delivered')}
function rPaid(id){const o=S.kaarigar.orders.find(x=>x.id===id);o.paid=+o.price-(+o.advance||0);save();render();toast('Payment received')}

V.r_price=()=>{const R=S.kaarigar,P=R.prof;
 return `<div class="card"><h2>${H('Fair price calculator','सही दाम')}</h2>
 <div class="row"><div><label>Product</label><input id="pn" placeholder="e.g. Kurti stitching"></div><div><label>Material cost per piece (₹)</label><input type="number" id="pm" oninput="rCalc()"></div><div><label>Hours per piece</label><input type="number" step="0.25" id="ph" oninput="rCalc()"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Your labour rate ₹/hour</label><input type="number" value="${P.rate}" onchange="S.kaarigar.prof.rate=+this.value;save();rCalc()"></div><div><label>Overheads % (electricity, thread, machine)</label><input type="number" value="${P.overhead}" onchange="S.kaarigar.prof.overhead=+this.value;save();rCalc()"></div><div><label>Profit margin %</label><input type="number" value="${P.margin}" onchange="S.kaarigar.prof.margin=+this.value;save();rCalc()"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Market price for same item (optional)</label><input type="number" id="pmk" oninput="rCalc()"></div></div>
 <div id="pout"></div><div class="btns"><button onclick="rSaveProd()">Save product</button></div>
 <div class="eq">Price = (material + hours × rate) × (1 + overhead %) × (1 + margin %)</div></div>
 ${R.products.length?`<div class="card"><h2>Saved products</h2><table><tr><th>Product</th><th class="r">Material</th><th class="r">Hours</th><th class="r">Fair price</th><th></th></tr>${R.products.map(p=>`<tr><td>${esc(p.name)}</td><td class="r">${inr(p.mat)}</td><td class="r">${p.hours}</td><td class="r"><b>${inr(rPrice(+p.mat,+p.hours).price)}</b></td><td class="r"><button class="x" onclick="S.kaarigar.products=S.kaarigar.products.filter(x=>x.id!=='${p.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}
 <div class="card"><h2>${H('Break-even for a new machine or tool','मशीन कब वसूल')}</h2><div class="row"><div><label>Machine cost (₹)</label><input type="number" id="bm" oninput="rBE()"></div><div><label>Profit per piece (₹)</label><input type="number" id="bp" oninput="rBE()"></div><div><label>Pieces per month</label><input type="number" id="bq" oninput="rBE()"></div></div><div id="bout"></div></div>`};
A.r_price=()=>rCalc();
function rCalc(){const o=$('#pout');if(!o)return;const m=parseFloat($('#pm').value),h=parseFloat($('#ph').value);if(isNaN(m)||isNaN(h)){o.innerHTML='<p class="muted">Enter material cost and hours to see the fair price.</p>';return}
 const r=rPrice(m,h),mk=parseFloat($('#pmk').value);const P=S.kaarigar.prof;
 let cmp='';if(!isNaN(mk)){const earn=(mk/(1+P.overhead/100)-m)/h;cmp=`<div class="alert ${mk>=r.price?'good':mk>=r.cost?'warn':'bad'}">At the market price ${inr(mk)} you earn about <b>${inr(earn)} per hour</b> (target ${inr(P.rate)}). ${mk<r.cost?'This price does not cover your costs.':mk<r.price?'This covers costs but gives less profit than your target.':'Good: market price is above your fair price.'}</div>`}
 o.innerHTML=`<table style="margin-top:10px"><tr><td>Material</td><td class="r">${inr(m)}</td></tr><tr><td>Labour (${h} h × ${inr(P.rate)})</td><td class="r">${inr(r.lab)}</td></tr><tr><td>Overheads (${P.overhead}%)</td><td class="r">${inr(r.oh)}</td></tr><tr><th>Total cost</th><th class="r">${inr(r.cost)}</th></tr><tr><td>Profit (${P.margin}%)</td><td class="r">${inr(r.profit)}</td></tr><tr><th>Fair selling price</th><th class="r" style="font-size:18px;color:var(--acc)">${inr(r.price)}</th></tr></table>${cmp}`}
function rSaveProd(){const n=$('#pn').value.trim(),m=parseFloat($('#pm').value),h=parseFloat($('#ph').value);if(!n||isNaN(m)||isNaN(h))return toast('Enter product, material and hours');S.kaarigar.products.push({id:uid(),name:n,mat:m,hours:h,price:Math.round(rPrice(m,h).price)});save();render();toast('Product saved')}
function rBE(){const c=parseFloat($('#bm').value),p=parseFloat($('#bp').value),q=parseFloat($('#bq').value);const o=$('#bout');if(isNaN(c)||isNaN(p)||p<=0){o.innerHTML='';return}
 const n=Math.ceil(c/p);o.innerHTML=`<div class="alert info">Break-even after <b>${n} pieces</b>${!isNaN(q)&&q>0?` ≈ <b>${f1(n/q)} months</b>`:''}. After that, the machine's profit is all yours.</div><div class="eq">Break-even pieces = machine cost ÷ profit per piece</div>`}

V.r_material=()=>{const R=S.kaarigar;const val=R.materials.reduce((a,m)=>a+(+m.qty||0)*(+m.cost||0),0);
 return `<div class="card"><h2>${H('Materials','सामान')}</h2>${R.materials.length?`<p class="muted">Stock value: <b>${inr(val)}</b></p><table><tr><th>Material</th><th class="r">Stock</th><th class="r">Min</th><th class="r">Use / add</th></tr>${R.materials.map(m=>`<tr style="${+m.qty<=+m.min?'background:var(--warnbg)':''}"><td>${esc(m.name)}<br><small class="muted">₹${m.cost}/${esc(m.unit)}</small></td><td class="r">${f1(m.qty)} ${esc(m.unit)}</td><td class="r">${m.min}</td>
 <td class="r" style="white-space:nowrap"><input type="number" id="mq_${m.id}" style="width:60px;padding:5px" placeholder="qty"> <button class="small" onclick="rMat('${m.id}',-1)">−</button> <button class="small ghost" onclick="rMat('${m.id}',1)">+</button></td></tr>`).join('')}</table>
 <p class="muted">"+" (bought) also records the purchase cost in Earnings.</p>`:'<p class="muted">No materials yet.</p>'}</div>
 <div class="card"><h2>Add material</h2><div class="row"><div><label>Name</label><input id="an" placeholder="e.g. Cotton cloth"></div><div><label>Unit</label><input id="au" value="m"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Quantity now</label><input type="number" id="aq"></div><div><label>Cost per unit (₹)</label><input type="number" id="ac"></div><div><label>Minimum to keep</label><input type="number" id="am"></div></div>
 <div class="btns"><button onclick="rAddMat()">Add</button></div></div>`};
function rAddMat(){const n=$('#an').value.trim();if(!n)return toast('Enter a name');S.kaarigar.materials.push({id:uid(),name:n,unit:$('#au').value||'pcs',qty:+$('#aq').value||0,cost:+$('#ac').value||0,min:+$('#am').value||0});save();render()}
function rMat(id,sign){const m=S.kaarigar.materials.find(x=>x.id===id);const q=parseFloat($('#mq_'+id).value);if(isNaN(q)||q<=0)return toast('Enter quantity');m.qty=Math.max(0,(+m.qty||0)+sign*q);
 if(sign>0)S.kaarigar.purchases.push({id:uid(),date:today(),amt:q*(+m.cost||0),note:m.name});save();render();toast(sign>0?'Purchase recorded':'Material used')}

V.r_earn=()=>{const R=S.kaarigar,e=rEarn();const who=R.members.length?R.members.map(m=>m.name):[R.prof.name||'Me'];
 return `<div class="card"><h2>${H('This month','इस महीने')}</h2>
 <table><tr><td>Income from delivered orders (${e.del.length})</td><td class="r">${inr(e.income)}</td></tr><tr><td>Material bought</td><td class="r">−${inr(e.mat)}</td></tr><tr><th>Net earnings</th><th class="r" style="color:${e.net<0?'var(--bad)':'var(--good)'}">${inr(e.net)}</th></tr>
 <tr><td>Hours worked</td><td class="r">${f1(e.hours)} h</td></tr><tr><td>Earning per hour</td><td class="r">${e.perHour!=null?inr(e.perHour):'—'}</td></tr><tr><td>Still to collect</td><td class="r">${inr(e.due)}</td></tr></table>
 <canvas id="rech"></canvas><p class="muted">Net earnings of the last 6 months.</p></div>
 ${e.shares.length?`<div class="card"><h2>${H('Fair share for each member','हिस्सा')}</h2><table><tr><th>Member</th><th class="r">Hours</th><th class="r">Share</th></tr>${e.shares.map(s=>`<tr><td>${esc(s.m)}</td><td class="r">${f1(s.h)}</td><td class="r"><b>${inr(s.share)}</b></td></tr>`).join('')}</table><div class="eq">Share = net earnings × member's hours ÷ total hours</div></div>`:''}
 <div class="card"><h2>${H('Log work hours','काम के घंटे')}</h2><div class="row"><div><label>Who</label><select id="ww">${who.map(n=>`<option>${esc(n)}</option>`).join('')}</select></div><div><label>Hours</label><input type="number" step="0.5" id="wh"></div><div><label>Date</label><input type="date" id="wd" value="${today()}"></div></div>
 <div class="btns"><button onclick="rLogWork()">Save</button></div></div>`};
A.r_earn=()=>{const e=rEarn();chart('rech',[{pts:e.hist.map(h=>[h.k,h.net]),color:'#8b5cf6',bar:1}],{ymin:Math.min(0,...e.hist.map(h=>h.net)),xlab:k=>e.hist[Math.round(k)]?e.hist[Math.round(k)].m:''})};
function rLogWork(){const h=parseFloat($('#wh').value);if(isNaN(h)||h<=0)return toast('Enter hours');S.kaarigar.work.push({id:uid(),date:$('#wd').value||today(),member:$('#ww').value,hours:h});save();render();toast('Hours saved')}

V.r_more=()=>`<div class="card"><h2>More · और</h2>
 <button class="tile" onclick="go('r_maths')"><span class="i">📐</span><span>How it works (the maths)<small>Scheduling, pricing, break-even, sharing</small></span></button>
 <button class="tile" onclick="addonDemo('kaarigar')"><span class="i">🧪</span><span>Load KaarigarMitra demo<small>A tailoring self-help group with 3 members</small></span></button>
 <button class="tile" onclick="go('home')"><span class="i">🏠</span><span>Back to GharMitra</span></button></div>`;
V.r_maths=()=>`<div class="card"><h2>📐 KaarigarMitra models</h2><p class="muted">Orders → Schedule → Ready-by dates → Alerts → Artisan acts → Updated progress.</p></div>
<div class="card"><h2>📋 Scheduling: earliest due date first</h2><div class="eq">Capacity per day = hours per person × number of members</div><div class="eq">Hours left = estimated hours × (1 − progress %)</div><p class="muted">Orders are sorted by delivery date and filled into working days one after another. An order is late if its ready-by day is after its due date.</p><div class="eq">Workload % = hours needed ÷ hours available before the last due date × 100</div></div>
<div class="card"><h2>🏷️ Fair pricing</h2><div class="eq">Cost = (material + hours × labour rate) × (1 + overhead %)</div><div class="eq">Price = cost × (1 + margin %)</div><div class="eq">Earning per hour at market price = (market price ÷ (1 + overhead %) − material) ÷ hours</div></div>
<div class="card"><h2>⚖️ Break-even and sharing</h2><div class="eq">Break-even pieces = fixed cost ÷ profit per piece</div><div class="eq">Member share = net earnings × (member hours ÷ total hours)</div><p class="muted">Sharing by hours is direct proportion: twice the hours gives twice the share.</p></div>`;

function rDemo(quiet){const t=dnum(today());S.kaarigar=RDEF();const R=S.kaarigar;R.prof={name:'Maa Mangala SHG',craft:'Tailoring & embroidery',hours:4,days:6,rate:70,overhead:10,margin:25};
 R.members=[{id:uid(),name:'Sunita'},{id:uid(),name:'Laxmi'},{id:uid(),name:'Pinky'}];
 R.products=[{id:uid(),name:'Blouse stitching',mat:60,hours:2,price:0},{id:uid(),name:'Kurti stitching',mat:90,hours:2.5,price:0},{id:uid(),name:'School uniform set',mat:220,hours:3,price:0},{id:uid(),name:'Embroidered saree border',mat:150,hours:6,price:0}];
 R.products.forEach(p=>p.price=Math.round(rPrice(p.mat,p.hours).price));
 const o=(cust,item,qty,price,adv,dueIn,hours,prog)=>({id:uid(),cust,item,qty,price,advance:adv,paid:0,due:dstr(t+dueIn),hours,prog,status:'pending',added:dstr(t-3)});
 R.orders=[o('St. Xavier School','School uniform set',20,8400,3000,6,60,25),o('Rekha Mohanty','Embroidered saree border',2,1100,500,3,12,50),o('Anita','Blouse stitching',4,1000,0,2,8,0),o('Puja Boutique','Kurti stitching',15,4200,1500,7,37.5,0),o('Kavita','Blouse stitching',2,500,200,12,4,0)];
 const ms=dnum(monthStart(today()));const dd=(k)=>dstr(Math.min(t,ms+k));
 R.orders.push({id:uid(),cust:'Sharma family',item:'Kurti stitching',qty:6,price:1680,advance:500,paid:1180,due:dd(4),hours:15,prog:100,status:'delivered',done:dd(4)},
  {id:uid(),cust:'Govt. school (Dera)',item:'School uniform set',qty:12,price:5040,advance:2000,paid:0,due:dd(10),hours:36,prog:100,status:'delivered',done:dd(10)},
  {id:uid(),cust:'Rina',item:'Blouse stitching',qty:3,price:750,advance:0,paid:750,due:dd(7),hours:6,prog:100,status:'delivered',done:dd(7)},
  {id:uid(),cust:'Das family (wedding)',item:'Embroidered saree border',qty:5,price:6000,advance:3000,paid:3000,due:dd(14),hours:30,prog:100,status:'delivered',done:dd(14)},
  {id:uid(),cust:'Govt. school (Dera)',item:'School uniform set',qty:10,price:4200,advance:4200,paid:0,due:dd(18),hours:30,prog:100,status:'delivered',done:dd(18)});
 const plm=dnum(monthStart(dstr(ms-1)));R.orders.push({id:uid(),cust:'Wedding order',item:'Embroidered saree border',qty:6,price:3300,advance:3300,paid:0,due:dstr(plm+20),hours:36,prog:100,status:'delivered',done:dstr(plm+20)});
 R.materials=[{id:uid(),name:'Cotton cloth',unit:'m',qty:38,cost:85,min:30},{id:uid(),name:'Thread spools',unit:'pcs',qty:14,cost:25,min:20},{id:uid(),name:'Buttons (pack)',unit:'pcs',qty:30,cost:15,min:10},{id:uid(),name:'Embroidery zari',unit:'roll',qty:2,cost:180,min:3}];
 R.purchases=[{id:uid(),date:dd(2),amt:2550,note:'Cotton cloth'},{id:uid(),date:dd(9),amt:600,note:'Thread & buttons'},{id:uid(),date:dstr(plm+5),amt:1100,note:'Zari'}];
 for(let d=ms;d<=t;d+=2)if(rIsWork(d))R.members.forEach((m,i)=>R.work.push({id:uid(),date:dstr(d),member:m.name,hours:[4,4,3.5][i]}));
 if(!quiet){S.addons.on.kaarigar=true;save();toast('KaarigarMitra demo loaded');go('r_home')}}
ADDON_REG.kaarigar={def:RDEF,demo:rDemo,sum(){const e=rEarn();return{income:e.net,line:`${S.kaarigar.orders.filter(o=>o.status==='pending').length} orders in hand · earned ${inr(e.net)} this month`,alerts:rAlerts()}}};
