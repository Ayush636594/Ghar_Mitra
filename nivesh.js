/* GharMitra add-on: nivesh · version 1.0 */
/* ==================== NIVESH MITRA (savings, investments & loans) ==================== */
const IDEF=()=>({goals:[],inv:[],loans:[],infl:6});
const ITYPES=['SIP / mutual fund','Fixed deposit (FD)','Recurring deposit (RD)','PPF','Sukanya Samriddhi','Gold','Post office scheme','Other'];
function iGoal(g){const now=new Date().getFullYear();const n=Math.max(0,(+g.year||now)-now);const r=(+g.ret||0)/100,i=r/12,N=n*12,inf=(+S.nivesh.infl||0)/100;
 const fut=(+g.cost||0)*(1+inf)**n;const fvSaved=(+g.saved||0)*(1+r)**n;const fvSip=i?(+g.monthly||0)*((1+i)**N-1)/i:(+g.monthly||0)*N;
 const gap=Math.max(0,fut-fvSaved);const need=N?(i?gap*i/((1+i)**N-1):gap/N):gap;const pct=fut?(fvSaved+fvSip)/fut*100:0;
 return{n,fut,fvSaved,fvSip,need,pct,extra:Math.max(0,need-(+g.monthly||0))}}
function iInv(x){const t=dnum(today());const yrs=Math.max(0,(t-dnum(x.start||today()))/365);const r=(+x.rate||0)/100,i=r/12;const months=Math.floor(yrs*12);
 const val=(+x.amount||0)*(1+r)**yrs+(i?(+x.monthly||0)*((1+i)**months-1)/i:(+x.monthly||0)*months);const invested=(+x.amount||0)+(+x.monthly||0)*months;
 const mat=x.maturity?dnum(x.maturity)-t:null;return{yrs,val,invested,gain:val-invested,mat,double:r?72/(r*100):null}}
function iLoan(L){const P=+L.principal||0,r=(+L.rate||0)/1200,n=+L.months||1;const emi=r?P*r*(1+r)**n/((1+r)**n-1):P/n;
 const now=new Date(),st=new Date((L.start||today())+'T00:00:00');const paidM=Math.max(0,Math.min(n,(now.getFullYear()-st.getFullYear())*12+now.getMonth()-st.getMonth()));
 let bal=P,intPaid=0;for(let k=0;k<paidM;k++){const it=bal*r;intPaid+=it;bal=bal+it-emi}bal=Math.max(0,bal);
 const sim=x=>{let b=bal,m=0,int=0;const pts=[[0,b]];while(b>0.5&&m<1200){const it=b*r;int+=it;b=Math.max(0,b+it-emi-x);m++;pts.push([m,b])}return{m,int,pts}};
 const base=sim(0),pre=sim(+L.extra||0);return{emi,paidM,bal,intPaid,left:base.m,intLeft:base.int,preM:pre.m,preInt:pre.int,saveM:base.m-pre.m,saveInt:base.int-pre.int,totalInt:emi*n-P,basePts:base.pts,prePts:pre.pts}}
function iSum(){const N=S.nivesh;const inv=N.inv.map(x=>({x,r:iInv(x)}));const loans=N.loans.map(L=>({L,r:iLoan(L)}));
 const assets=inv.reduce((a,v)=>a+v.r.val,0);const debt=loans.reduce((a,v)=>a+v.r.bal,0);const emi=loans.reduce((a,v)=>a+v.r.emi,0);const inc=+S.budget.income||0;
 const dti=inc?emi/inc*100:null;const by={};for(const v of inv)by[v.x.type]=(by[v.x.type]||0)+v.r.val;const wr=assets?inv.reduce((a,v)=>a+v.r.val*(+v.x.rate||0),0)/assets:0;
 const sip=N.inv.reduce((a,x)=>a+(+x.monthly||0),0);return{inv,loans,assets,debt,net:assets-debt,emi,inc,dti,by,wr,sip}}
function iAlerts(){const out=[],s=iSum();
 for(const g of S.nivesh.goals){const r=iGoal(g);if(r.pct<90)out.push(['warn','🎯',`Goal <b>${esc(g.name)}</b> is ${Math.round(r.pct)}% on track. Raise the monthly saving by <b>${inr(r.extra)}</b> (to ${inr(r.need)}) to reach ${inr(r.fut)} by ${g.year}.`]);else out.push(['good','🎯',`Goal <b>${esc(g.name)}</b> is on track (${Math.round(r.pct)}%).`])}
 for(const{x,r}of s.inv)if(r.mat!=null&&r.mat>=0&&r.mat<=30)out.push(['info','🏦',`${esc(x.name)} matures in ${r.mat} days (${pretty(x.maturity)}), value about ${inr(r.val)}. Plan where to reinvest it.`]);
 if(s.dti!=null&&s.emi){out.push([s.dti>40?'bad':s.dti>30?'warn':'good','📊',`EMIs take <b>${Math.round(s.dti)}%</b> of monthly income (${inr(s.emi)} of ${inr(s.inc)}).${s.dti>40?' Above 40% is risky; avoid new loans.':''}`])}
 for(const{L,r}of s.loans)if(+L.rate>s.wr+1&&r.bal>0)out.push(['info','💡',`${esc(L.name)} costs ${L.rate}% but your investments earn about ${f1(s.wr)}%. Prepaying ${inr(+L.extra||2000)} a month would save ${inr(+L.extra?r.saveInt:iLoan({...L,extra:2000}).saveInt)} interest.`]);
 try{const ef=efundModel();if(ef.pct<50&&s.sip>0)out.push(['warn','🛟',`Emergency fund is only ${Math.round(ef.pct)}% of target. Build it before adding risky investments.`])}catch(e){}
 if(!S.nivesh.goals.length&&!S.nivesh.inv.length&&!S.nivesh.loans.length)out.push(['info','📈','Add a goal, an investment or a loan to start.']);return out}

V.i_home=()=>{const s=iSum();
 return `<div class="card"><h2>${H('My money','मेरी पूँजी')}</h2><div class="stats">
 <div class="stat"><div class="k">📈 Investments</div><div class="v">${inr(s.assets)}</div><div class="u">avg return ${f1(s.wr)}%</div></div>
 <div class="stat"><div class="k">🏦 Loans left</div><div class="v">${inr(s.debt)}</div><div class="u">EMI ${inr(s.emi)}/month</div></div>
 <div class="stat"><div class="k">💎 Net worth</div><div class="v" style="color:${s.net<0?'var(--bad)':'var(--good)'}">${inr(s.net)}</div><div class="u">investments − loans (house/land not counted)</div></div>
 <div class="stat"><div class="k">📊 EMI ÷ income</div><div class="v">${s.dti!=null?Math.round(s.dti)+'<span class="u">%</span>':'—'}</div><div class="u">income from GharMitra budget</div></div></div></div>
 <div class="card"><h2>${H('Alerts and advice','सलाह')}</h2>${iAlerts().map(([c,i,t])=>`<div class="alert ${c}">${i} ${t}</div>`).join('')}</div>
 <div class="card"><div class="row"><div><label>Expected inflation % a year</label><input type="number" step="0.5" value="${S.nivesh.infl}" onchange="S.nivesh.infl=+this.value;save();render()"></div></div><p class="muted">Returns are assumptions for planning; market-linked investments can go up or down. This is not financial advice.</p></div>`};

V.i_goals=()=>{const G=S.nivesh.goals;
 return `<div class="card"><h2>${H('New goal','लक्ष्य')}</h2><div class="row"><div><label>Goal</label><input id="gn" placeholder="e.g. Daughter's college, house"></div><div><label>Cost today (₹)</label><input type="number" id="gc"></div><div><label>Year needed</label><input type="number" id="gy" value="${new Date().getFullYear()+8}"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Already saved (₹)</label><input type="number" id="gs" value="0"></div><div><label>Saving per month (₹)</label><input type="number" id="gm" value="0"></div><div><label>Expected return %/yr</label><input type="number" id="gr" value="10"></div></div><div class="btns"><button onclick="iAddGoal()">Add goal</button></div></div>
 ${G.map(g=>{const r=iGoal(g);return `<div class="card"><h2>🎯 ${esc(g.name)} <span class="hi">· ${g.year}</span></h2><div class="bar" style="height:14px"><div style="width:${Math.min(100,r.pct)}%;background:${r.pct>=90?'var(--good)':'#f59e0b'}"></div></div>
 <p class="muted">${Math.round(r.pct)}% on track</p><table><tr><td>Cost today</td><td class="r">${inr(g.cost)}</td></tr><tr><td>Cost in ${g.year} (inflation ${S.nivesh.infl}%)</td><td class="r"><b>${inr(r.fut)}</b></td></tr><tr><td>Savings will grow to</td><td class="r">${inr(r.fvSaved)}</td></tr><tr><td>Monthly ${inr(g.monthly)} will grow to</td><td class="r">${inr(r.fvSip)}</td></tr><tr><th>Monthly saving needed</th><th class="r">${inr(r.need)}</th></tr></table>
 <div class="btns"><button class="small ghost" onclick="iGoalSet('${g.id}',${Math.round(r.need)})">Set saving to ${inr(r.need)}</button><button class="small danger" onclick="S.nivesh.goals=S.nivesh.goals.filter(x=>x.id!=='${g.id}');save();render()">Remove</button></div></div>`}).join('')}
 ${G.length?`<div class="card"><div class="eq">Future cost = C(1 + f)ⁿ &nbsp;·&nbsp; Monthly saving = [future cost − S(1 + r)ⁿ] × i ÷ [(1 + i)ᴺ − 1]</div></div>`:''}`};
function iAddGoal(){const n=$('#gn').value.trim(),c=parseFloat($('#gc').value);if(!n||isNaN(c))return toast('Enter goal and cost');S.nivesh.goals.push({id:uid(),name:n,cost:c,year:+$('#gy').value,saved:+$('#gs').value||0,monthly:+$('#gm').value||0,ret:+$('#gr').value||0});save();render()}
function iGoalSet(id,m){const g=S.nivesh.goals.find(x=>x.id===id);g.monthly=m;save();render();toast('Monthly saving updated')}

V.i_invest=()=>{const s=iSum();
 return `<div class="card"><h2>${H('Add investment','निवेश')}</h2><div class="row"><div><label>Type</label><select id="it">${ITYPES.map(x=>`<option>${x}</option>`).join('')}</select></div><div><label>Name</label><input id="inm" placeholder="e.g. SBI FD, PPF account"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Lump sum (₹)</label><input type="number" id="ia" value="0"></div><div><label>Monthly (₹)</label><input type="number" id="imo" value="0"></div><div><label>Return %/yr</label><input type="number" step="0.1" id="ir"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Started on</label><input type="date" id="is2" value="${today()}"></div><div><label>Matures on (optional)</label><input type="date" id="im"></div></div><div class="btns"><button onclick="iAddInv()">Add</button></div></div>
 ${s.inv.length?`<div class="card"><h2>${H('Portfolio','पोर्टफोलियो')}</h2><table><tr><th>Investment</th><th class="r">Invested</th><th class="r">Value now</th><th class="r">Doubles in</th></tr>
 ${s.inv.map(({x,r})=>`<tr><td><b>${esc(x.name)}</b><br><small class="muted">${x.type} · ${x.rate}%${x.maturity?' · matures '+pretty(x.maturity):''}</small></td><td class="r">${inr(r.invested)}</td><td class="r"><b>${inr(r.val)}</b><br><small style="color:var(--good)">+${inr(r.gain)}</small></td><td class="r">${r.double?f1(r.double)+' yr':'—'}</td><td class="r"><button class="x" onclick="S.nivesh.inv=S.nivesh.inv.filter(y=>y.id!=='${x.id}');save();render()">✕</button></td></tr>`).join('')}</table>
 <h3>Where your money is</h3>${Object.entries(s.by).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${k}</span><span>${inr(v)} · ${Math.round(v/s.assets*100)}%</span></div><div class="bar"><div style="width:${v/s.assets*100}%"></div></div></div>`).join('')}
 <div class="eq">Lump sum: A = P(1 + r)ᵗ &nbsp;·&nbsp; Monthly: FV = M[(1 + i)ⁿ − 1] ÷ i &nbsp;·&nbsp; Rule of 72: years to double ≈ 72 ÷ rate</div></div>`:''}`};
function iAddInv(){const nm=$('#inm').value.trim(),r=parseFloat($('#ir').value);if(!nm||isNaN(r))return toast('Enter name and return %');S.nivesh.inv.push({id:uid(),type:$('#it').value,name:nm,amount:+$('#ia').value||0,monthly:+$('#imo').value||0,rate:r,start:$('#is2').value||today(),maturity:$('#im').value||''});save();render();toast('Investment added')}

V.i_loans=()=>{const s=iSum();
 return `<div class="card"><h2>${H('Add loan','कर्ज़')}</h2><div class="row"><div><label>Loan</label><input id="ln" placeholder="e.g. Home loan, bike loan"></div><div><label>Amount taken (₹)</label><input type="number" id="lp"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Interest %/yr</label><input type="number" step="0.05" id="lr2"></div><div><label>Months</label><input type="number" id="lm2"></div><div><label>Started on</label><input type="date" id="ls" value="${today()}"></div></div><div class="btns"><button onclick="iAddLoan()">Add</button></div></div>
 ${s.loans.map(({L,r},idx)=>`<div class="card"><h2>🏦 ${esc(L.name)} <span class="hi">· ${L.rate}% · ${L.months} months</span></h2>
 <div class="stats"><div class="stat"><div class="k">EMI</div><div class="v">${inr(r.emi)}</div></div><div class="stat"><div class="k">Balance left</div><div class="v">${inr(r.bal)}</div><div class="u">${r.left} EMIs to go</div></div>
 <div class="stat"><div class="k">Interest paid so far</div><div class="v">${inr(r.intPaid)}</div></div><div class="stat"><div class="k">Interest still to pay</div><div class="v">${inr(r.intLeft)}</div></div></div>
 <h3>Prepayment calculator</h3><div class="row"><div><label>Extra payment per month (₹)</label><input type="number" value="${L.extra||0}" onchange="S.nivesh.loans[${idx}].extra=+this.value;save();render()"></div></div>
 ${+L.extra?`<div class="alert good">Paying ${inr(L.extra)} extra every month closes the loan <b>${r.saveM} months earlier</b> and saves <b>${inr(r.saveInt)}</b> in interest.</div>`:''}
 <canvas id="lch_${idx}"></canvas><p class="muted">Loan balance month by month (dashed = with extra payment).</p>
 <div class="btns"><button class="small danger" onclick="S.nivesh.loans=S.nivesh.loans.filter(x=>x.id!=='${L.id}');save();render()">Remove</button></div></div>`).join('')}
 ${s.loans.length?`<div class="card"><div class="eq">EMI = P·r(1 + r)ⁿ ÷ [(1 + r)ⁿ − 1] &nbsp;·&nbsp; Bₖ₊₁ = Bₖ(1 + r) − EMI − extra</div><p class="muted">Each month interest is charged on the balance; the rest of the EMI reduces the balance. Early EMIs are mostly interest.</p></div>`:''}`};
A.i_loans=()=>{const thin=P=>{const st=Math.max(1,Math.round(P.length/30));return P.filter((p,i)=>i%st===0||i===P.length-1)};iSum().loans.forEach(({r},idx)=>chart('lch_'+idx,[{pts:thin(r.basePts),color:'#0e7490',name:'Normal'},...(r.saveM>0?[{pts:thin(r.prePts),color:'#16a34a',dash:1,name:'With extra'}]:[])],{ymin:0,xlab:m=>'Month '+Math.round(m)}))};
function iAddLoan(){const n=$('#ln').value.trim(),p=parseFloat($('#lp').value),r=parseFloat($('#lr2').value),m=parseFloat($('#lm2').value);if(!n||isNaN(p)||isNaN(r)||isNaN(m))return toast('Fill all loan details');S.nivesh.loans.push({id:uid(),name:n,principal:p,rate:r,months:m,start:$('#ls').value||today(),extra:0});save();render();toast('Loan added')}

V.i_more=()=>`<div class="card"><h2>More · और</h2>
 <button class="tile" onclick="go('i_maths')"><span class="i">📐</span><span>How it works (the maths)<small>Compound interest, SIP, EMI, amortisation</small></span></button>
 <button class="tile" onclick="addonDemo('nivesh')"><span class="i">🧪</span><span>Load NiveshMitra demo<small>Two goals, five investments, two loans</small></span></button>
 <button class="tile" onclick="go('home')"><span class="i">🏠</span><span>Back to GharMitra</span></button></div>`;
V.i_maths=()=>`<div class="card"><h2>📐 NiveshMitra models</h2><p class="muted">Goals and accounts → Compound-interest models → On-track check → Alerts → Family acts.</p></div>
<div class="card"><h2>📈 Growth</h2><div class="eq">Compound interest A = P(1 + r)ᵗ</div><div class="eq">Monthly saving (SIP/RD) FV = M[(1 + i)ⁿ − 1] ÷ i</div><div class="eq">Rule of 72: doubling time ≈ 72 ÷ r%</div><div class="eq">Inflation: future cost = C(1 + f)ⁿ</div></div>
<div class="card"><h2>🏦 Loans: amortisation</h2><div class="eq">EMI = P·r(1 + r)ⁿ ÷ [(1 + r)ⁿ − 1]</div><div class="eq">Bₖ₊₁ = Bₖ(1 + r) − EMI − extra</div><div class="eq">EMI-to-income % = total EMI ÷ monthly income × 100</div></div>`;

function iDemo(quiet){const t=dnum(today()),y=new Date().getFullYear();S.nivesh=IDEF();const N=S.nivesh;N.infl=6;
 N.goals=[{id:uid(),name:"Rahul's engineering",cost:800000,year:y+2,saved:250000,monthly:12000,ret:7.5},{id:uid(),name:"Riya's marriage",cost:1000000,year:y+13,saved:100000,monthly:4000,ret:11}];
 N.inv=[{id:uid(),type:'Fixed deposit (FD)',name:'SBI FD',amount:200000,monthly:0,rate:6.8,start:dstr(t-345),maturity:dstr(t+20)},{id:uid(),type:'PPF',name:'PPF account',amount:180000,monthly:5000,rate:7.1,start:dstr(t-1100),maturity:''},
  {id:uid(),type:'SIP / mutual fund',name:'Index fund SIP',amount:0,monthly:3000,rate:11,start:dstr(t-900),maturity:''},{id:uid(),type:'Sukanya Samriddhi',name:"Riya's SSY",amount:50000,monthly:1500,rate:8.2,start:dstr(t-700),maturity:''},{id:uid(),type:'Gold',name:'Gold coins',amount:90000,monthly:0,rate:8,start:dstr(t-800),maturity:''}];
 N.loans=[{id:uid(),name:'Home loan',principal:2500000,rate:8.6,months:240,start:dstr(t-1480),extra:3000},{id:uid(),name:'Bike loan',principal:90000,rate:11.5,months:36,start:dstr(t-400),extra:0}];
 if(!quiet){S.addons.on.nivesh=true;save();toast('NiveshMitra demo loaded');go('i_home')}}
ADDON_REG.nivesh={def:IDEF,demo:iDemo,sum(){const x=iSum();return{income:0,line:x.assets||x.debt?`Net worth ${inr(x.net)} · EMI ${inr(x.emi)}/month`:'Add goals, investments or loans',alerts:iAlerts()}}};
