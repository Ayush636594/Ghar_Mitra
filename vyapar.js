/* GharMitra add-on: vyapar · version 1.0 */
/* ==================== VYAPAR MITRA (shop / small business) ==================== */
const VDEF=()=>({shop:{name:'',type:'Kirana / general store',margin:18,fixed:15000,gst:0},sales:[],items:[],cust:[],exp:[]});
const VEXP=['Rent','Salary / helper','Electricity','Transport','Packaging','Repairs','Other'];
function vDaily(){const m={};for(const s of S.vyapar.sales)m[s.date]=(m[s.date]||0)+ +s.amt;return m}
function vSalesModel(){
 const m=vDaily(),t=dnum(today());const days=Object.keys(m).map(dnum).filter(d=>d<=t&&d>t-56).sort((a,b)=>a-b);
 if(days.length<3)return null;
 const pts=days.map(d=>[d,m[dstr(d)]]);const last7=pts.filter(p=>p[0]>t-7);
 const ma7=last7.length?last7.reduce((a,p)=>a+p[1],0)/last7.length:0;
 const avg=pts.reduce((a,p)=>a+p[1],0)/pts.length;
 const reg=linreg(pts.filter(p=>p[0]>t-28));
 const wsum=[0,0,0,0,0,0,0],wc=[0,0,0,0,0,0,0];for(const[d,v]of pts){const w=wdOf(d);wsum[w]+=v;wc[w]++}
 const idx=wsum.map((s,i)=>wc[i]&&avg?s/wc[i]/avg:1);
 const base=d=>reg?Math.max(0,reg.a+reg.b*d):avg;const f=d=>base(d)*idx[wdOf(d)];
 const fc=[];for(let d=t+1;d<=t+7;d++)fc.push([d,f(d)]);
 const ms=dnum(monthStart(today())),me=ms+daysInMonth(today())-1;
 let month=0;for(let d=ms;d<=t;d++)month+=m[dstr(d)]||0;let rest=0;for(let d=t+1;d<=me;d++)rest+=f(d);
 const lms=dnum(monthStart(dstr(ms-1)));let last=0;for(let d=lms;d<ms;d++)last+=m[dstr(d)]||0;
 const open=idx.map((v,i)=>wc[i]?v:null);const best=open.indexOf(Math.max(...open.filter(v=>v!=null)));const worst=open.indexOf(Math.min(...open.filter(v=>v!=null)));
 return{pts,ma7,avg,reg,idx,wc,fc,month,proj:month+rest,last,trendM:reg?reg.b*30:0,best,worst,t,next7:fc.reduce((a,p)=>a+p[1],0)}}
function vItem(it){const t=dnum(today());const mv=it.moves||[];const sold=mv.filter(x=>x.q<0&&dnum(x.date)>t-14);
 const first=mv.length?Math.min(...mv.map(x=>dnum(x.date))):t;const span=Math.max(1,Math.min(14,t-first+1));
 const rate=sold.reduce((a,x)=>a-x.q,0)/span;const qty=+it.qty||0;
 const days=rate>0?qty/rate:Infinity;const safety=rate*(+it.safety||0);const rop=rate*(+it.lead||0)+safety;
 const D=rate*365,Ho=(+it.cost||0)*(+it.hold||20)/100;const eoq=D>0&&Ho>0?Math.sqrt(2*D*(+it.orderCost||0)/Ho):0;
 const margin=it.price>0?(it.price-it.cost)/it.price*100:0;
 return{rate,days,rop,safety,eoq,reorder:rate>0&&qty<=rop,out:qty<=0,margin,value:qty*(+it.cost||0),orderDay:rate>0?t+Math.max(0,Math.floor((qty-rop)/rate)):null}}
function vCust(c){const E=[...c.entries].sort((a,b)=>a.date<b.date?-1:1);let bal=0,since=null;
 for(const e of E){const was=bal;bal+= +e.amt;if(was<=0&&bal>0)since=e.date;if(bal<=0)since=null}
 const lp=[...E].reverse().find(e=>+e.amt<0);const age=since?dnum(today())-dnum(since):0;
 return{bal,since,age,lastPay:lp?lp.date:null,lost:bal>0?bal*0.12*age/365:0}}
function vAcc(){const Vy=S.vyapar,sm=vSalesModel(),t=today(),ms=monthStart(t);
 const exp=Vy.exp.filter(e=>e.date>=ms&&e.date<=t).reduce((a,e)=>a+ +e.amt,0);const fixed=+Vy.shop.fixed||0;const g=(+Vy.shop.margin||0)/100;
 const salesM=sm?sm.month:0,salesP=sm?sm.proj:0;const expP=Math.max(exp,fixed);
 const gross=salesM*g,grossP=salesP*g,net=gross-exp,netP=grossP-expP;
 const be=g>0?expP/g:null;const beDay=be!=null?be/daysInMonth(t):null;const safety=be&&salesP?(salesP-be)/salesP*100:null;
 const gst=+Vy.shop.gst||0;const gstIn=salesM*gst/(100+gst);
 const hist=[];const now=new Date();for(let k=5;k>=0;k--){const d=new Date(now.getFullYear(),now.getMonth()-k,1);const key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const sl=Vy.sales.filter(s=>s.date.startsWith(key)).reduce((a,s)=>a+ +s.amt,0);const ex=Vy.exp.filter(e=>e.date.startsWith(key)).reduce((a,e)=>a+ +e.amt,0);hist.push({k:5-k,m:MON[d.getMonth()],sales:sl,net:sl*g-ex})}
 const byCat={};for(const e of Vy.exp.filter(e=>e.date>=ms&&e.date<=t))byCat[e.cat]=(byCat[e.cat]||0)+ +e.amt;
 return{exp,fixed,expP,g,salesM,salesP,gross,grossP,net,netP,be,beDay,safety,gst,gstIn,hist,byCat}}
function vAlerts(){const out=[],Vy=S.vyapar;
 for(const it of Vy.items){const r=vItem(it);if(r.out)out.push(['bad','📦',`<b>${esc(it.name)}</b> is out of stock. Order about ${Math.max(1,Math.round(r.eoq||r.rate*7))} ${esc(it.unit)} now.`]);
  else if(r.reorder)out.push(['warn','📦',`Reorder <b>${esc(it.name)}</b>: ${f1(r.days)} days of stock left (supplier takes ${it.lead} days). Best order size ≈ ${Math.round(r.eoq)} ${esc(it.unit)}.`])}
 const od=Vy.cust.map(c=>({c,r:vCust(c)})).filter(x=>x.r.bal>0&&x.r.age>30);
 if(od.length)out.push(['warn','📒',`${od.length} udhaar account(s) pending over 30 days: ${inr(od.reduce((a,x)=>a+x.r.bal,0))}. Oldest: ${esc(od.sort((a,b)=>b.r.age-a.r.age)[0].c.name)} (${od[0].r.age} days).`]);
 const sm=vSalesModel(),a=vAcc();
 if(sm){out.push([a.netP>=0?'good':'bad','📊',`Sales this month ${inr(a.salesM)}; projected month-end <b>${inr(a.salesP)}</b>${sm.last?` (last month ${inr(sm.last)})`:''}. Projected profit <b>${inr(a.netP)}</b>.`]);
  if(a.be&&a.salesP<a.be)out.push(['bad','⚠️',`Projected sales are below break-even (${inr(a.be)}). Need about ${inr(a.beDay)} sales a day.`]);
  out.push(['info','📅',`Busiest day: <b>${WD[sm.best]}</b> (${Math.round(sm.idx[sm.best]*100)}% of average). Stock up before it. Quietest: ${WD[sm.worst]}.`])}
 else out.push(['info','📊','Add daily sales for at least 3 days to start forecasting.']);
 return out}

V.v_home=()=>{const Vy=S.vyapar,sm=vSalesModel(),a=vAcc();const stockVal=Vy.items.reduce((s,i)=>s+vItem(i).value,0);const rec=Vy.cust.reduce((s,c)=>s+Math.max(0,vCust(c).bal),0);
 return `<div class="card"><h2>${Vy.shop.name?esc(Vy.shop.name):'My shop'} <span class="hi">· ${esc(Vy.shop.type)}</span></h2>
 <div class="stats"><div class="stat"><div class="k">📊 Sales this month</div><div class="v">${inr(a.salesM)}</div><div class="u">projected ${inr(a.salesP)}</div></div>
 <div class="stat"><div class="k">💰 Projected profit</div><div class="v" style="color:${a.netP<0?'var(--bad)':'var(--good)'}">${sm?inr(a.netP):'—'}</div></div>
 <div class="stat"><div class="k">📦 Stock value</div><div class="v">${inr(stockVal)}</div><div class="u">${Vy.items.filter(i=>vItem(i).reorder||vItem(i).out).length} items to reorder</div></div>
 <div class="stat"><div class="k">📒 Udhaar to collect</div><div class="v">${inr(rec)}</div></div></div></div>
 <div class="card"><h2>${H('Alerts and advice','सलाह')}</h2>${vAlerts().map(([k,i,t])=>`<div class="alert ${k}">${i} ${t}</div>`).join('')}</div>
 <div class="card"><h2>Quick sale entry</h2><div class="row"><div><label>Today's total sales (₹)</label><input type="number" id="qs"></div><div style="flex:0 0 auto;align-self:flex-end"><button onclick="vQuickSale()">Save</button></div></div></div>
 <div class="card"><h2>Shop settings</h2><div class="row"><div><label>Shop name</label><input value="${esc(Vy.shop.name)}" onchange="S.vyapar.shop.name=this.value;save()"></div><div><label>Type of business</label><input value="${esc(Vy.shop.type)}" onchange="S.vyapar.shop.type=this.value;save()"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Average profit margin %</label><input type="number" value="${Vy.shop.margin}" onchange="S.vyapar.shop.margin=+this.value;save();render()"></div><div><label>Fixed monthly expenses (₹)</label><input type="number" value="${Vy.shop.fixed}" onchange="S.vyapar.shop.fixed=+this.value;save();render()"></div><div><label>GST % in prices</label><input type="number" value="${Vy.shop.gst}" onchange="S.vyapar.shop.gst=+this.value;save();render()"></div></div>
 <p class="muted">Margin % = (selling price − cost price) ÷ selling price × 100, averaged over what you sell. Fixed expenses: rent, helper's salary, electricity.</p></div>`};
function vQuickSale(){const a=parseFloat($('#qs').value);if(isNaN(a))return toast('Enter the amount');const d=today();S.vyapar.sales=S.vyapar.sales.filter(s=>s.date!==d);S.vyapar.sales.push({id:uid(),date:d,amt:a});save();render();toast('Today\'s sales saved')}

V.v_sales=()=>{const sm=vSalesModel();const L=[...S.vyapar.sales].sort((a,b)=>a.date<b.date?1:-1);
 return `<div class="card"><h2>${H('Daily sales','बिक्री')}</h2><div class="row"><div><label>Date</label><input type="date" id="sd" value="${today()}"></div><div><label>Total sales (₹)</label><input type="number" id="sa"></div></div>
 <div class="btns"><button onclick="vAddSale()">Save</button></div><p class="muted">One entry per day (a new entry for the same date replaces the old one).</p></div>
 ${sm?`<div class="card"><h2>${H('Forecast','अनुमान')}</h2>
 <div class="stats"><div class="stat"><div class="k">7-day average</div><div class="v">${inr(sm.ma7)}<span class="u">/day</span></div></div>
 <div class="stat"><div class="k">Trend</div><div class="v" style="color:${sm.trendM>=0?'var(--good)':'var(--bad)'}">${sm.trendM>=0?'+':''}${inr(sm.trendM)}<span class="u">/day per month</span></div></div>
 <div class="stat"><div class="k">Next 7 days</div><div class="v">${inr(sm.next7)}</div></div>
 <div class="stat"><div class="k">Month-end projection</div><div class="v">${inr(sm.proj)}</div></div></div>
 <canvas id="vsch"></canvas><p class="muted">Bars: daily sales. Line: 7-day moving average. Dashed: forecast for the next 7 days (trend × weekday pattern).</p>
 <h3>Weekday pattern</h3><table><tr>${WD.map(w=>`<th class="r">${w}</th>`).join('')}</tr><tr>${sm.idx.map((v,i)=>`<td class="r" style="${i===sm.best?'color:var(--good);font-weight:700':i===sm.worst?'color:var(--bad)':''}">${sm.wc[i]?Math.round(v*100)+'%':'—'}</td>`).join('')}</tr></table>
 <p class="muted">100% = an average day. Keep more stock and staff on high days; run offers on low days.</p>
 <h3>Next 7 days</h3><table>${sm.fc.map(([d,v])=>`<tr><td>${WD[wdOf(d)]} ${prettyN(d)}</td><td class="r">${inr(v)}</td></tr>`).join('')}</table></div>`:'<div class="alert info">Add sales for at least 3 days to see the forecast.</div>'}
 <div class="card"><h2>History</h2>${L.length?`<table>${L.slice(0,40).map(s=>`<tr><td>${WD[wdOf(dnum(s.date))]} ${pretty(s.date)}</td><td class="r">${inr(s.amt)}</td><td class="r"><button class="x" onclick="S.vyapar.sales=S.vyapar.sales.filter(x=>x.id!=='${s.id}');save();render()">✕</button></td></tr>`).join('')}</table>`:'<p class="muted">No sales yet.</p>'}</div>`};
A.v_sales=()=>{const sm=vSalesModel();if(!sm)return;const p=sm.pts.filter(x=>x[0]>sm.t-28);const ma=[];for(const[d]of p){const w=p.filter(x=>x[0]>d-7&&x[0]<=d);ma.push([d,w.reduce((a,x)=>a+x[1],0)/w.length])}
 chart('vsch',[{pts:p,color:'#fdba74',bar:1,name:'Daily sales'},{pts:ma,color:'#9a3412',name:'7-day avg'},{pts:[[sm.t,ma.length?ma[ma.length-1][1]:sm.avg],...sm.fc],color:'#2563eb',dash:1,name:'Forecast'}],{ymin:0,xlab:prettyN,xmax:sm.t+7})};
function vAddSale(){const a=parseFloat($('#sa').value),d=$('#sd').value||today();if(isNaN(a))return toast('Enter the amount');S.vyapar.sales=S.vyapar.sales.filter(s=>s.date!==d);S.vyapar.sales.push({id:uid(),date:d,amt:a});save();render();toast('Saved')}

V.v_stock=()=>{const Vy=S.vyapar;const rows=Vy.items.map(it=>({it,r:vItem(it)})).sort((a,b)=>(a.r.days)-(b.r.days));
 return `<div class="card"><h2>${H('Stock movement','स्टॉक')}</h2>${Vy.items.length?`<div class="row"><div><label>Item</label><select id="mi">${Vy.items.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join('')}</select></div><div><label>Quantity</label><input type="number" id="mq" step="0.1"></div></div>
 <label style="display:flex;gap:8px;align-items:center;margin-top:8px;font-weight:500;color:var(--ink)"><input type="checkbox" id="madd" checked style="width:18px;height:18px;flex:0 0 18px;padding:0"> Add sold value to today's sales</label>
 <div class="btns"><button onclick="vMove(-1)">− Sold</button><button class="ghost" onclick="vMove(1)">+ Restocked</button></div>`:'<p class="muted">Add your items below first.</p>'}</div>
 ${rows.length?`<div class="card"><h2>${H('Reorder planner','कब मँगाएँ')}</h2><table><tr><th>Item</th><th class="r">In stock</th><th class="r">Sells/day</th><th class="r">Days left</th><th class="r">Order size</th></tr>
 ${rows.map(({it,r})=>`<tr style="${r.out?'background:var(--badbg)':r.reorder?'background:var(--warnbg)':''}"><td><b>${esc(it.name)}</b><br><small class="muted">margin ${f1(r.margin)}% · reorder at ${f1(r.rop)}</small></td><td class="r">${f1(it.qty)} ${esc(it.unit)}</td><td class="r">${f2(r.rate)}</td><td class="r">${r.days===Infinity?'—':f1(r.days)}</td><td class="r">${r.eoq?Math.round(r.eoq):'—'}</td></tr>`).join('')}</table>
 <p class="muted">Reorder point = daily sales × (supplier days + safety days). Order size = economic order quantity √(2DS ÷ H): the size that keeps ordering cost + holding cost lowest.</p>
 <canvas id="vstch"></canvas><p class="muted">Days of stock left per item (red line = 7 days).</p></div>`:''}
 <div class="card"><h2>Add an item</h2><div class="row"><div><label>Item name</label><input id="in"></div><div><label>Unit</label><input id="iu" value="kg"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Quantity now</label><input type="number" id="iq"></div><div><label>Cost price (₹/unit)</label><input type="number" id="ic"></div><div><label>Selling price (₹/unit)</label><input type="number" id="ip"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Supplier takes (days)</label><input type="number" id="il" value="3"></div><div><label>Safety stock (days)</label><input type="number" id="is" value="2"></div><div><label>Cost per order (₹)</label><input type="number" id="io" value="100"></div></div>
 <div class="btns"><button onclick="vAddItem()">Add item</button></div><p class="muted">Cost per order: transport, phone, time for one purchase trip. Holding cost is taken as 20% of item cost per year (money locked, spoilage).</p></div>
 ${Vy.items.length?`<div class="card"><h2>Items</h2><table>${Vy.items.map(it=>`<tr><td>${esc(it.name)}</td><td class="r">₹${it.cost} → ₹${it.price}</td><td class="r"><button class="x" onclick="S.vyapar.items=S.vyapar.items.filter(x=>x.id!=='${it.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
A.v_stock=()=>{const rows=S.vyapar.items.map((it,i)=>[i,Math.min(60,vItem(it).days===Infinity?60:vItem(it).days)]);if(!rows.length)return;chart('vstch',[{pts:rows,color:'#ea580c',bar:1}],{ymin:0,hline:7,xlab:i=>S.vyapar.items[Math.round(i)]?S.vyapar.items[Math.round(i)].name.slice(0,10):''})};
function vAddItem(){const n=$('#in').value.trim();if(!n)return toast('Enter item name');S.vyapar.items.push({id:uid(),name:n,unit:$('#iu').value||'pcs',qty:+$('#iq').value||0,cost:+$('#ic').value||0,price:+$('#ip').value||0,lead:+$('#il').value||0,safety:+$('#is').value||0,orderCost:+$('#io').value||0,hold:20,moves:[]});save();render();toast('Item added')}
function vMove(sign){const it=S.vyapar.items.find(x=>x.id===$('#mi').value);const q=parseFloat($('#mq').value);if(!it||isNaN(q)||q<=0)return toast('Enter quantity');
 it.moves=it.moves||[];it.moves.push({date:today(),q:sign*q});it.qty=Math.max(0,(+it.qty||0)+sign*q);
 if(sign<0&&$('#madd').checked){const d=today();let s=S.vyapar.sales.find(x=>x.date===d);if(!s){s={id:uid(),date:d,amt:0};S.vyapar.sales.push(s)}s.amt=+s.amt+q*it.price}
 save();render();toast(sign<0?`Sold ${q} ${it.unit} ${it.name}`:`Restocked ${q} ${it.unit} ${it.name}`)}

V.v_udhaar=()=>{const Vy=S.vyapar;const rows=Vy.cust.map(c=>({c,r:vCust(c)})).sort((a,b)=>b.r.bal-a.r.bal);const tot=rows.reduce((a,x)=>a+Math.max(0,x.r.bal),0);const lost=rows.reduce((a,x)=>a+x.r.lost,0);
 return `<div class="card"><h2>${H('Udhaar book','उधार खाता')}</h2>
 <div class="stats"><div class="stat"><div class="k">To collect</div><div class="v">${inr(tot)}</div></div><div class="stat"><div class="k">Interest lost (12%/yr)</div><div class="v">${inr(lost)}</div></div></div>
 <h3>New entry</h3><div class="row"><div><label>Customer</label><select id="uc"><option value="">+ New customer</option>${Vy.cust.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div><label>New customer name</label><input id="un" placeholder="if new"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Amount (₹)</label><input type="number" id="ua"></div><div><label>Note</label><input id="ut" placeholder="items / bill no."></div></div>
 <div class="btns"><button onclick="vUdhaar(1)">Gave on credit</button><button class="ghost" onclick="vUdhaar(-1)">Received payment</button></div></div>
 <div class="card"><h2>Customers</h2>${rows.length?rows.map(({c,r})=>`<div class="tile" style="cursor:default;align-items:flex-start"><span class="i">${r.bal<=0?'✅':r.age>30?'🔴':'🟡'}</span><span style="flex:1"><b>${esc(c.name)}</b><small>${r.bal>0?`Pending since ${pretty(r.since)} (${r.age} days)`:'All clear'}${r.lastPay?' · last paid '+pretty(r.lastPay):''}</small>
 ${r.bal>0?`<span class="btns" style="margin-top:6px"><button class="small ghost" onclick="vRemind('${c.id}')">Reminder message</button></span>`:''}</span><b style="color:${r.bal>0?'var(--bad)':'var(--good)'}">${inr(r.bal)}</b></div>`).join(''):'<p class="muted">No customers yet.</p>'}<div id="rem"></div></div>`};
function vUdhaar(sign){const Vy=S.vyapar;let c=Vy.cust.find(x=>x.id===$('#uc').value);const a=parseFloat($('#ua').value);if(isNaN(a)||a<=0)return toast('Enter amount');
 if(!c){const n=$('#un').value.trim();if(!n)return toast('Choose or enter a customer');c={id:uid(),name:n,entries:[]};Vy.cust.push(c)}
 c.entries.push({id:uid(),date:today(),amt:sign*a,note:$('#ut').value.trim()});save();render();toast(sign>0?'Credit recorded':'Payment recorded')}
function vRemind(id){const c=S.vyapar.cust.find(x=>x.id===id),r=vCust(c);const msg=`Namaste ${c.name} ji, ${S.vyapar.shop.name||'our shop'} ka ₹${Math.round(r.bal)} ka udhaar ${pretty(r.since)} se baaki hai. Kripya jaldi bhugtan karein. Dhanyavaad.`;
 $('#rem').innerHTML=`<h3>Message (copy and send on WhatsApp/SMS)</h3><textarea readonly>${esc(msg)}</textarea>`;try{navigator.clipboard.writeText(msg).then(()=>toast('Message copied'),()=>{})}catch(e){}}

V.v_accounts=()=>{const a=vAcc(),Vy=S.vyapar;const L=[...Vy.exp].sort((x,y)=>x.date<y.date?1:-1);
 return `<div class="card"><h2>${H('Profit this month','मुनाफ़ा')}</h2>
 <table><tr><th></th><th class="r">So far</th><th class="r">Month-end (proj.)</th></tr>
 <tr><td>Sales</td><td class="r">${inr(a.salesM)}</td><td class="r">${inr(a.salesP)}</td></tr>
 <tr><td>Gross profit (${f1(a.g*100)}% margin)</td><td class="r">${inr(a.gross)}</td><td class="r">${inr(a.grossP)}</td></tr>
 <tr><td>Expenses</td><td class="r">−${inr(a.exp)}</td><td class="r">−${inr(a.expP)}</td></tr>
 <tr><th>Net profit</th><th class="r" style="color:${a.net<0?'var(--bad)':'var(--good)'}">${inr(a.net)}</th><th class="r" style="color:${a.netP<0?'var(--bad)':'var(--good)'}">${inr(a.netP)}</th></tr></table>
 <div class="stats" style="margin-top:10px"><div class="stat"><div class="k">Break-even sales</div><div class="v">${a.be!=null?inr(a.be):'—'}<span class="u">/month</span></div><div class="u">${a.beDay!=null?inr(a.beDay)+' a day':''}</div></div>
 <div class="stat"><div class="k">Margin of safety</div><div class="v" style="color:${a.safety!=null&&a.safety<0?'var(--bad)':'inherit'}">${a.safety!=null?Math.round(a.safety)+'%':'—'}</div><div class="u">sales above break-even</div></div>
 ${a.gst?`<div class="stat"><div class="k">GST inside sales (${a.gst}%)</div><div class="v">${inr(a.gstIn)}</div><div class="u">= sales × ${a.gst} ÷ ${100+a.gst}</div></div>`:''}</div>
 <canvas id="vach"></canvas><p class="muted">Net profit of the last 6 months (sales × margin − expenses).</p></div>
 <div class="card"><h2>${H('Add expense','खर्च')}</h2><div class="row"><div><label>Amount (₹)</label><input type="number" id="ea"></div><div><label>Type</label><select id="ec">${VEXP.map(c=>`<option>${c}</option>`).join('')}</select></div></div>
 <div class="btns"><button onclick="vAddExp()">Add</button></div>
 ${Object.keys(a.byCat).length?`<h3>This month by type</h3>${Object.entries(a.byCat).sort((x,y)=>y[1]-x[1]).map(([c,v])=>`<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${c}</span><span>${inr(v)}</span></div><div class="bar"><div style="width:${v/a.exp*100}%"></div></div></div>`).join('')}`:''}</div>
 ${L.length?`<div class="card"><h2>Expense history</h2><table>${L.slice(0,30).map(e=>`<tr><td>${pretty(e.date)}</td><td>${esc(e.cat)}</td><td class="r">${inr(e.amt)}</td><td class="r"><button class="x" onclick="S.vyapar.exp=S.vyapar.exp.filter(x=>x.id!=='${e.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
A.v_accounts=()=>{const a=vAcc();chart('vach',[{pts:a.hist.map(h=>[h.k,h.net]),color:'#ea580c',bar:1}],{ymin:Math.min(0,...a.hist.map(h=>h.net)),xlab:k=>a.hist[Math.round(k)]?a.hist[Math.round(k)].m:''})};
function vAddExp(){const a=parseFloat($('#ea').value);if(isNaN(a)||a<=0)return toast('Enter amount');S.vyapar.exp.push({id:uid(),date:today(),cat:$('#ec').value,amt:a});save();render();toast('Expense added')}

V.v_more=()=>`<div class="card"><h2>More · और</h2>
 <button class="tile" onclick="go('v_maths')"><span class="i">📐</span><span>How it works (the maths)<small>Forecasting, reorder point, EOQ, break-even</small></span></button>
 <button class="tile" onclick="addonDemo('vyapar')"><span class="i">🧪</span><span>Load VyaparMitra demo<small>A kirana shop with 8 weeks of sales</small></span></button>
 <button class="tile" onclick="go('home')"><span class="i">🏠</span><span>Back to GharMitra<small>Home, family budget, health</small></span></button></div>`;
V.v_maths=()=>`<div class="card"><h2>📐 VyaparMitra models</h2><p class="muted">Data → Model → Forecast → Alert → Shopkeeper acts → New data.</p></div>
<div class="card"><h2>📊 Sales forecast: moving average + trend + seasonality</h2><div class="eq">MA₇ = (S₁ + S₂ + … + S₇) ÷ 7</div><div class="eq">Trend: S(t) = a + b·t (least squares, last 28 days)</div><div class="eq">Weekday index Iᵥ = average sales on weekday w ÷ overall average</div><div class="eq">Forecast F(t) = (a + b·t) × I₍weekday of t₎</div></div>
<div class="card"><h2>📦 Inventory: reorder point and economic order quantity</h2><div class="eq">Daily demand d = units sold in last 14 days ÷ 14</div><div class="eq">Reorder point = d × (lead time + safety days)</div><div class="eq">EOQ = √(2DS ÷ H)</div><p class="muted">D = yearly demand (d × 365), S = cost of placing one order, H = cost of holding one unit for a year (20% of its cost). EOQ balances ordering too often against keeping too much stock.</p></div>
<div class="card"><h2>📒 Udhaar: running balance and opportunity cost</h2><div class="eq">Balance = Σ credit − Σ payments</div><div class="eq">Interest lost = balance × 12% × days ÷ 365</div></div>
<div class="card"><h2>🧾 Profit, break-even and GST</h2><div class="eq">Gross profit = sales × margin %</div><div class="eq">Net profit = gross profit − expenses</div><div class="eq">Break-even sales = fixed expenses ÷ margin %</div><div class="eq">Margin of safety = (sales − break-even) ÷ sales × 100</div><div class="eq">GST inside a price P at rate r% = P × r ÷ (100 + r)</div><p class="muted">Check GST registration rules and rates for your goods with a tax adviser.</p></div>`;

function vDemo(quiet){const t=dnum(today());S.vyapar=VDEF();const Vy=S.vyapar;Vy.shop={name:'Maa Tarini Kirana Store',type:'Kirana / general store',margin:16,fixed:18000,gst:0};
 const wk=[1.25,0.85,0.9,0.95,1.0,1.1,1.35];// Sun..Sat
 for(let d=t-55;d<=t;d++){const w=wdOf(d);Vy.sales.push({id:uid(),date:dstr(d),amt:Math.round((5200+(d-(t-55))*14)*wk[w]*(1+((d*7)%11-5)/60))})}
 const mkI=(name,unit,qty,cost,price,lead,safety,oc,perDay)=>{const it={id:uid(),name,unit,qty,cost,price,lead,safety,orderCost:oc,hold:20,moves:[]};for(let d=t-13;d<=t;d++)it.moves.push({date:dstr(d),q:-Math.round(perDay*(0.8+((d*3)%5)/10)*10)/10});return it};
 Vy.items=[mkI('Rice (Swarna)','kg',180,38,44,4,2,150,22),mkI('Mustard oil','L',14,165,185,3,2,120,4.5),mkI('Sugar','kg',95,40,46,3,2,100,9),mkI('Atta','kg',60,32,38,3,2,100,8),mkI('Toor dal','kg',9,120,140,4,2,120,3),mkI('Detergent powder','pcs',40,48,60,7,3,150,3),mkI('Biscuits (pack)','pcs',0,9,10,2,1,50,25)];
 Vy.cust=[{id:uid(),name:'Sahu ji',entries:[{id:uid(),date:dstr(t-48),amt:2400},{id:uid(),date:dstr(t-35),amt:1350},{id:uid(),date:dstr(t-20),amt:-1500}]},
  {id:uid(),name:'Meena didi',entries:[{id:uid(),date:dstr(t-12),amt:860}]},{id:uid(),name:'Ravi (driver)',entries:[{id:uid(),date:dstr(t-40),amt:1200},{id:uid(),date:dstr(t-9),amt:-1200}]}];
 const ms=dnum(monthStart(today()));const plm=dnum(monthStart(dstr(ms-1)));
 for(const base of [plm,ms])[['Rent',8000,1],['Salary / helper',7000,2],['Electricity',1400,5],['Transport',900,8],['Packaging',500,12]].forEach(([c,a,dd])=>{if(base+dd-1<=t)Vy.exp.push({id:uid(),date:dstr(base+dd-1),cat:c,amt:a})});
 if(!quiet){S.addons.on.vyapar=true;save();toast('VyaparMitra demo loaded');go('v_home')}}
ADDON_REG.vyapar={def:VDEF,demo:vDemo,sum(){const a=vAcc(),sm=vSalesModel();return{income:sm?a.netP:0,line:sm?`Sales this month ${inr(a.salesM)} · projected profit ${inr(a.netP)}`:'Add daily sales to start',alerts:vAlerts()}}};
