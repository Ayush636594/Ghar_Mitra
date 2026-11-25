/* GharMitra add-on: vidya · version 1.0 */
/* ==================== VIDYA MITRA (students & parents) ==================== */
const SDEF=()=>({kids:[],sel:null,hours:2});
const SUBJ=['Maths','Science','English','Hindi','Social Science','Odia','Sanskrit','Computer'];
function sKid(){const K=S.vidya.kids;if(!K.length)return null;return K.find(k=>k.id===S.vidya.sel)||K[0]}
function sModel(k){const t=dnum(today());const tests=[...k.tests].sort((a,b)=>a.date<b.date?-1:1);const subs={};
 for(const x of tests){const p=+x.max?x.marks/x.max*100:0;(subs[x.subject]=subs[x.subject]||[]).push([dnum(x.date),p])}
 const exam=k.exam?dnum(k.exam):null;const tgt=+k.target||90;
 const rows=Object.entries(subs).map(([s,pts])=>{const avg=pts.reduce((a,p)=>a+p[1],0)/pts.length;const last=pts[pts.length-1][1];const reg=pts.length>=3&&pts[pts.length-1][0]>pts[0][0]?linreg(pts):null;
  const perM=reg?reg.b*30:0;const pred=reg&&exam?Math.max(0,Math.min(100,reg.a+reg.b*exam)):null;return{s,pts,avg,last,reg,perM,pred}}).sort((a,b)=>a.avg-b.avg);
 const overall=rows.length?rows.reduce((a,r)=>a+r.avg,0)/rows.length:null;const w=(+k.finalW||50)/100;const need=overall!=null&&w>0?(tgt-(1-w)*overall)/w:null;
 const hrs=+S.vidya.hours||2;const days=exam&&exam>=t?exam-t:null;const total=days!=null?days*hrs:hrs*7;
 const wts=rows.map(r=>Math.max(0,tgt-r.avg)+10);const ws=wts.reduce((a,b)=>a+b,0);const plan=rows.map((r,i)=>({s:r.s,h:ws?total*wts[i]/ws:0,wk:ws?hrs*7*wts[i]/ws:0}));
 const st={};for(const x of k.study.filter(x=>dnum(x.date)>t-7))st[x.subject]=(st[x.subject]||0)+ +x.mins/60;const stTot=Object.values(st).reduce((a,b)=>a+b,0);
 const P=+k.att.p||0,T=+k.att.t||0;const pct=T?P/T*100:null;const canMiss=T?Math.max(0,Math.floor(P/0.75-T)):0;const needAtt=T&&pct<75?Math.ceil((0.75*T-P)/0.25):0;
 const fees=[...k.fees].sort((a,b)=>a.due<b.due?-1:1);const unpaid=fees.filter(f=>!f.paid);const nextFee=unpaid[0]||null;const yearFees=fees.reduce((a,f)=>a+ +f.amt,0);
 const c=k.college||{};const cy=Math.max(0,+c.years||0),cr=(+c.ret||8)/100,ci=cr/12,cn=cy*12;const cFut=(+c.cost||0)*(1+(+c.infl||10)/100)**cy;const cSaved=(+c.saved||0)*(1+cr)**cy;const cGap=Math.max(0,cFut-cSaved);const cSip=cn?(ci?cGap*ci/((1+ci)**cn-1):cGap/cn):cGap;
 return{rows,overall,tgt,w,need,days,total,plan,st,stTot,hrs,pct,canMiss,needAtt,P,T,fees,unpaid,nextFee,yearFees,exam,cFut,cSaved,cGap,cSip,t}}
function sAlerts(){const out=[];for(const k of S.vidya.kids){const m=sModel(k),nm=`<b>${esc(k.name)}:</b>`;
 if(m.pct!=null){if(m.pct<75)out.push(['bad','🏫',`${nm} attendance ${f1(m.pct)}% is below 75%. Attend the next <b>${m.needAtt} classes</b> without a break to reach 75%.`]);else if(m.canMiss<=3)out.push(['warn','🏫',`${nm} attendance ${f1(m.pct)}%. Can miss only ${m.canMiss} more class(es) and stay above 75%.`])}
 for(const f of m.unpaid){const d=dnum(f.due)-m.t;if(d<0)out.push(['bad','💳',`${nm} ${esc(f.name)} fee ${inr(f.amt)} was due ${pretty(f.due)} (overdue).`]);else if(d<=10)out.push(['warn','💳',`${nm} ${esc(f.name)} fee ${inr(f.amt)} due in ${d} days (${pretty(f.due)}).`])}
 const down=m.rows.filter(r=>r.reg&&r.perM<-2);for(const r of down)out.push(['warn','📉',`${nm} ${r.s} marks falling about ${f1(-r.perM)}% a month (last ${Math.round(r.last)}%). Give it extra time.`]);
 if(m.rows.length&&m.rows[0].avg<m.tgt-10)out.push(['info','📚',`${nm} weakest subject: <b>${m.rows[0].s}</b> (${Math.round(m.rows[0].avg)}%). The study plan gives it the most time.`]);
 if(m.need!=null&&m.exam&&m.days!=null){out.push([m.need>100?'warn':'info','🎯',`${nm} needs <b>${Math.min(100,Math.round(m.need))}%</b> in the final exam to reach ${m.tgt}% overall${m.need>100?' (not possible: aim for '+Math.floor((1-m.w)*m.overall+m.w*100)+'% instead)':''}. Exam in ${m.days} days.`])}}
 if(!S.vidya.kids.length)out.push(['info','🎒','Add a child to start (Study tab).']);return out}

V.s_home=()=>{const K=S.vidya.kids,k=sKid();const m=k?sModel(k):null;
 return `<div class="card"><h2>${H('Children','बच्चे')} (${K.length}/4)</h2>
 ${K.map(x=>{const mm=sModel(x);return `<button class="tile" style="${k&&x.id===k.id?'border-color:var(--acc);background:var(--accbg)':''}" onclick="S.vidya.sel='${x.id}';save();render()"><span class="i">🎒</span><span style="flex:1">${esc(x.name)} · Class ${esc(x.cls)}<small>Average ${mm.overall!=null?Math.round(mm.overall)+'%':'—'} · attendance ${mm.pct!=null?f1(mm.pct)+'%':'—'}</small></span></button>`}).join('')}
 ${K.length<4?`<div class="row" style="margin-top:6px"><div><input id="kn" placeholder="Child's name"></div><div style="flex:0 0 90px"><input id="kc" placeholder="Class"></div><div style="flex:0 0 auto"><button onclick="sAddKid()">Add</button></div></div>`:''}</div>
 ${m?`<div class="card"><h2>${esc(k.name)} <span class="hi">· Class ${esc(k.cls)}</span></h2><div class="stats">
 <div class="stat"><div class="k">📝 Average marks</div><div class="v">${m.overall!=null?Math.round(m.overall)+'<span class="u">%</span>':'—'}</div><div class="u">target ${m.tgt}%</div></div>
 <div class="stat"><div class="k">🏫 Attendance</div><div class="v" style="color:${m.pct!=null&&m.pct<75?'var(--bad)':'inherit'}">${m.pct!=null?f1(m.pct)+'<span class="u">%</span>':'—'}</div></div>
 <div class="stat"><div class="k">📅 Exam in</div><div class="v">${m.days!=null?m.days+' <span class="u">days</span>':'—'}</div></div>
 <div class="stat"><div class="k">⏱️ Studied (7 days)</div><div class="v">${f1(m.stTot)} <span class="u">h</span></div><div class="u">plan ${f1(m.hrs*7)} h</div></div></div></div>`:''}
 <div class="card"><h2>${H('Alerts and advice','सलाह')}</h2>${sAlerts().map(([c,i,t])=>`<div class="alert ${c}">${i} ${t}</div>`).join('')}</div>`};
function sAddKid(){const n=$('#kn').value.trim();if(!n)return toast('Enter a name');const k={id:uid(),name:n,cls:$('#kc').value||'',target:90,finalW:50,exam:'',tests:[],study:[],att:{p:0,t:0},fees:[],college:{cost:500000,years:6,saved:0,ret:8,infl:10}};S.vidya.kids.push(k);S.vidya.sel=k.id;save();render()}
function sK(path,v){const k=sKid();const[a,b]=path.split('.');if(b)k[a][b]=v;else k[a]=v;save();render()}

V.s_marks=()=>{const k=sKid();if(!k)return '<div class="alert info">Add a child first (Study tab).</div>';const m=sModel(k);
 return `<div class="card"><h2>${H('Add test marks','अंक')} · ${esc(k.name)}</h2>
 <div class="row"><div><label>Subject</label><select id="ts">${SUBJ.map(s=>`<option>${s}</option>`).join('')}</select></div><div><label>Test / exam</label><input id="tn" placeholder="e.g. Unit test 2"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Marks got</label><input type="number" id="tm" step="0.5"></div><div><label>Out of</label><input type="number" id="tx" value="25"></div><div><label>Date</label><input type="date" id="td" value="${today()}"></div></div>
 <div class="btns"><button onclick="sAddTest()">Save</button></div></div>
 ${m.rows.length?`<div class="card"><h2>${H('Subject analysis','विषय विश्लेषण')}</h2><table><tr><th>Subject</th><th class="r">Average</th><th class="r">Last</th><th class="r">Trend/month</th><th class="r">At exam</th></tr>
 ${m.rows.map(r=>`<tr><td>${r.s}</td><td class="r"><b>${Math.round(r.avg)}%</b></td><td class="r">${Math.round(r.last)}%</td><td class="r" style="color:${r.perM<-1?'var(--bad)':r.perM>1?'var(--good)':'inherit'}">${r.reg?(r.perM>=0?'+':'')+f1(r.perM)+'%':'—'}</td><td class="r">${r.pred!=null?Math.round(r.pred)+'%':'—'}</td></tr>`).join('')}</table>
 <canvas id="smch"></canvas><p class="muted">Each line is one subject's test percentage over time. "At exam" extends the trend line to the exam date (needs 3+ tests).</p></div>`:''}
 <div class="card"><h2>${H('Target calculator','लक्ष्य')}</h2><div class="row"><div><label>Target overall %</label><input type="number" value="${k.target}" onchange="sK('target',+this.value)"></div><div><label>Final exam weight %</label><input type="number" value="${k.finalW}" onchange="sK('finalW',+this.value)"></div><div><label>Final exam date</label><input type="date" value="${k.exam||''}" onchange="sK('exam',this.value)"></div></div>
 ${m.need!=null?`<div class="alert ${m.need>100?'warn':'good'}">With ${Math.round(m.overall)}% so far, ${esc(k.name)} needs <b>${Math.min(100,Math.round(m.need))}%</b> in the final exam to reach ${m.tgt}%.${m.need>100?' This is above 100%, so the best possible is '+Math.floor((1-m.w)*m.overall+m.w*100)+'%.':''}</div>`:''}
 <div class="eq">Needed in final = (target − (1 − w) × current average) ÷ w</div></div>
 ${k.tests.length?`<div class="card"><h2>All tests</h2><table>${[...k.tests].sort((a,b)=>a.date<b.date?1:-1).slice(0,30).map(x=>`<tr><td>${pretty(x.date)}</td><td>${x.subject}<br><small class="muted">${esc(x.name||'')}</small></td><td class="r">${x.marks}/${x.max}</td><td class="r"><button class="x" onclick="sKid().tests=sKid().tests.filter(y=>y.id!=='${x.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
A.s_marks=()=>{const k=sKid();if(!k)return;const m=sModel(k);const cols=['#dc2626','#2563eb','#16a34a','#f59e0b','#7c3aed','#0891b2','#db2777','#65a30d'];chart('smch',m.rows.map((r,i)=>({pts:r.pts,color:cols[i%8],name:r.s.slice(0,8)})),{ymin:0,ymax:100,xlab:prettyN})};
function sAddTest(){const k=sKid();const mk=parseFloat($('#tm').value),mx=parseFloat($('#tx').value);if(isNaN(mk)||isNaN(mx)||mx<=0||mk>mx)return toast('Check marks and out-of');k.tests.push({id:uid(),date:$('#td').value||today(),subject:$('#ts').value,name:$('#tn').value.trim(),marks:mk,max:mx});save();render();toast('Saved')}

V.s_study=()=>{const k=sKid();if(!k)return V.s_home();const m=sModel(k);
 return `<div class="card"><h2>${H('Study planner','पढ़ाई योजना')} · ${esc(k.name)}</h2>
 <div class="row"><div><label>Study hours available per day</label><input type="number" step="0.5" value="${S.vidya.hours}" onchange="S.vidya.hours=+this.value;save();render()"></div></div>
 ${m.plan.length?`<p class="muted">${m.days!=null?`${m.days} days to the exam × ${m.hrs} h = <b>${f1(m.total)} hours</b> in all.`:'Weekly plan (set the exam date in Marks for a full countdown plan).'} Weaker subjects get more time.</p>
 <table><tr><th>Subject</th><th class="r">${m.days!=null?'Hours till exam':'Hours/week'}</th><th class="r">Per week</th><th class="r">Done (7 days)</th></tr>${m.plan.sort((a,b)=>b.h-a.h).map(p=>`<tr><td>${p.s}</td><td class="r"><b>${f1(m.days!=null?p.h:p.wk)}</b></td><td class="r">${f1(p.wk)}</td><td class="r" style="color:${(m.st[p.s]||0)<p.wk*0.7?'var(--bad)':'var(--good)'}">${f1(m.st[p.s]||0)}</td></tr>`).join('')}</table>
 <canvas id="ssch"></canvas><p class="muted">Light bars: planned hours this week. Dark bars: hours actually studied in the last 7 days.</p>
 <div class="eq">Hours for a subject = total hours × weight ÷ sum of weights, &nbsp; weight = (target − average) + 10</div>`:'<p class="muted">Add some test marks first; the plan is based on them.</p>'}</div>
 <div class="card"><h2>${H('Log study time','पढ़ाई का समय')}</h2><div class="row"><div><label>Subject</label><select id="ys">${SUBJ.map(s=>`<option>${s}</option>`).join('')}</select></div><div><label>Minutes</label><input type="number" id="ym" value="45"></div><div><label>Date</label><input type="date" id="yd" value="${today()}"></div></div>
 <div class="btns"><button onclick="sAddStudy()">Save</button></div></div>`};
A.s_study=()=>{const k=sKid();if(!k)return;const m=sModel(k);if(!m.plan.length)return;const P=[...m.plan].sort((a,b)=>b.h-a.h);
 chart('ssch',[{pts:P.map((p,i)=>[i-0.18,p.wk]),color:'#c4b5fd',bar:1,name:'Planned'},{pts:P.map((p,i)=>[i+0.18,m.st[p.s]||0]),color:'#6d28d9',bar:1,name:'Done'}],{ymin:0,xlab:i=>P[Math.round(i)]?P[Math.round(i)].s.slice(0,8):''})};
function sAddStudy(){const k=sKid();const mi=parseFloat($('#ym').value);if(isNaN(mi)||mi<=0)return toast('Enter minutes');k.study.push({id:uid(),date:$('#yd').value||today(),subject:$('#ys').value,mins:mi});save();render();toast('Study time saved')}

V.s_att=()=>{const k=sKid();if(!k)return V.s_home();const m=sModel(k);
 return `<div class="card"><h2>${H('Attendance','उपस्थिति')} · ${esc(k.name)}</h2><div class="big" style="color:${m.pct!=null&&m.pct<75?'var(--bad)':'var(--good)'}">${m.pct!=null?f1(m.pct)+'%':'—'}</div>
 <p class="muted" style="text-align:center">${m.P} present out of ${m.T} school days</p>
 <div class="btns" style="justify-content:center"><button onclick="sAtt(1)">+ Present today</button><button class="ghost" onclick="sAtt(0)">+ Absent today</button></div>
 ${m.T?(m.pct>=75?`<div class="alert ${m.canMiss<=3?'warn':'good'}">Can miss <b>${m.canMiss}</b> more day(s) and still stay at or above 75%.</div>`:`<div class="alert bad">Must attend the next <b>${m.needAtt}</b> days in a row to get back to 75%.</div>`):''}
 <div class="eq">Can miss k days while P ÷ (T + k) ≥ 0.75 &nbsp;→&nbsp; k = ⌊P ÷ 0.75 − T⌋</div><div class="eq">Days needed n: (P + n) ÷ (T + n) ≥ 0.75 &nbsp;→&nbsp; n = ⌈(0.75T − P) ÷ 0.25⌉</div>
 <h3>Correct the totals</h3><div class="row"><div><label>Days present</label><input type="number" value="${m.P}" onchange="sK('att.p',+this.value)"></div><div><label>Total school days</label><input type="number" value="${m.T}" onchange="sK('att.t',+this.value)"></div></div></div>`};
function sAtt(p){const k=sKid();k.att.t=(+k.att.t||0)+1;if(p)k.att.p=(+k.att.p||0)+1;save();render();toast(p?'Marked present':'Marked absent')}

V.s_fees=()=>{const k=sKid();if(!k)return V.s_home();const m=sModel(k),c=k.college||{};
 return `<div class="card"><h2>${H('Fees','फ़ीस')} · ${esc(k.name)}</h2>${m.fees.length?`<table>${m.fees.map(f=>{const d=dnum(f.due)-m.t;return `<tr style="${!f.paid&&d<0?'background:var(--badbg)':!f.paid&&d<=10?'background:var(--warnbg)':''}"><td>${esc(f.name)}<br><small class="muted">due ${pretty(f.due)}</small></td><td class="r">${inr(f.amt)}</td><td class="r">${f.paid?'✅ Paid':`<button class="small" onclick="sPay('${f.id}')">Mark paid</button>`}</td></tr>`}).join('')}<tr><th>Total this year</th><th class="r">${inr(m.yearFees)}</th><th></th></tr></table>`:'<p class="muted">No fees added.</p>'}
 <h3>Add fee</h3><div class="row"><div><label>What</label><input id="fn" placeholder="e.g. Tuition Q3, bus, exam"></div><div><label>Amount (₹)</label><input type="number" id="fa"></div><div><label>Due date</label><input type="date" id="fd"></div></div><div class="btns"><button onclick="sAddFee()">Add</button></div></div>
 <div class="card"><h2>${H('Higher-education fund','उच्च शिक्षा कोष')}</h2>
 <div class="row"><div><label>Cost today (₹)</label><input type="number" value="${c.cost||0}" onchange="sK('college.cost',+this.value)"></div><div><label>Years until needed</label><input type="number" value="${c.years||0}" onchange="sK('college.years',+this.value)"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Already saved (₹)</label><input type="number" value="${c.saved||0}" onchange="sK('college.saved',+this.value)"></div><div><label>Education inflation %/yr</label><input type="number" value="${c.infl||10}" onchange="sK('college.infl',+this.value)"></div><div><label>Return on savings %/yr</label><input type="number" value="${c.ret||8}" onchange="sK('college.ret',+this.value)"></div></div>
 <div class="stats" style="margin-top:10px"><div class="stat"><div class="k">Cost when needed</div><div class="v">${inr(m.cFut)}</div></div><div class="stat"><div class="k">Save each month</div><div class="v">${inr(m.cSip)}</div><div class="u">for ${c.years||0} years</div></div></div>
 <div class="eq">Future cost = cost × (1 + inflation)ⁿ &nbsp;·&nbsp; Monthly saving = gap × i ÷ [(1 + i)ᴺ − 1]</div></div>`};
function sAddFee(){const k=sKid();const a=parseFloat($('#fa').value),d=$('#fd').value;if(isNaN(a)||!d)return toast('Enter amount and due date');k.fees.push({id:uid(),name:$('#fn').value.trim()||'Fee',amt:a,due:d,paid:false});save();render()}
function sPay(id){const f=sKid().fees.find(x=>x.id===id);f.paid=true;f.paidOn=today();save();render();toast('Marked paid')}

V.s_more=()=>`<div class="card"><h2>More · और</h2>
 <button class="tile" onclick="go('s_maths')"><span class="i">📐</span><span>How it works (the maths)<small>Trends, target, 75% rule, study weights</small></span></button>
 <button class="tile" onclick="addonDemo('vidya')"><span class="i">🧪</span><span>Load VidyaMitra demo<small>Two children with tests, attendance and fees</small></span></button>
 <button class="tile" onclick="go('home')"><span class="i">🏠</span><span>Back to GharMitra</span></button></div>`;
V.s_maths=()=>`<div class="card"><h2>📐 VidyaMitra models</h2><p class="muted">Marks and attendance → Models → Predictions → Alerts → Student acts → New marks.</p></div>
<div class="card"><h2>📝 Marks</h2><div class="eq">Percentage = marks ÷ maximum × 100</div><div class="eq">Trend: p(t) = a + b·t (least squares); change per month = 30b</div><div class="eq">Needed in final = (target − (1 − w) × average) ÷ w</div></div>
<div class="card"><h2>⏱️ Study plan: proportional allocation</h2><div class="eq">weight = (target − subject average) + 10</div><div class="eq">Hours for subject = total hours × weight ÷ Σ weights</div></div>
<div class="card"><h2>🏫 Attendance (75% rule): inequalities</h2><div class="eq">P ÷ (T + k) ≥ 0.75 → k ≤ P ÷ 0.75 − T</div><div class="eq">(P + n) ÷ (T + n) ≥ 0.75 → n ≥ (0.75T − P) ÷ 0.25</div></div>
<div class="card"><h2>🎓 Education fund: compound growth</h2><div class="eq">Future cost = C(1 + f)ⁿ</div><div class="eq">Monthly saving M = gap × i ÷ [(1 + i)ᴺ − 1]</div></div>`;

function sDemo(quiet){const t=dnum(today());S.vidya=SDEF();S.vidya.hours=2.5;
 const mk=(name,cls,tgt)=>({id:uid(),name,cls,target:tgt,finalW:50,exam:dstr(t+95),tests:[],study:[],att:{p:0,t:0},fees:[],college:{cost:800000,years:6,saved:60000,ret:8,infl:10}});
 const a=mk('Rahul','10',90),b=mk('Riya','7',85);b.college={cost:600000,years:9,saved:20000,ret:8,infl:10};
 const T=(k,days,subj,m,x,n)=>k.tests.push({id:uid(),date:dstr(t-days),subject:subj,marks:m,max:x,name:n});
 [[150,'Unit test 1'],[100,'Unit test 2'],[60,'Half-yearly'],[20,'Unit test 3']].forEach(([d,n],j)=>{
  T(a,d,'Maths',[18,17,62,15.5][j],[25,25,80,25][j],n);T(a,d,'Science',[20,21,66,21.5][j],[25,25,80,25][j],n);T(a,d,'English',[21,22,70,22][j],[25,25,80,25][j],n);T(a,d,'Social Science',[19,19,63,20][j],[25,25,80,25][j],n);T(a,d,'Hindi',[22,21,68,22][j],[25,25,80,25][j],n);
  T(b,d,'Maths',[20,21,68,22][j],[25,25,80,25][j],n);T(b,d,'Science',[17,16,54,15][j],[25,25,80,25][j],n);T(b,d,'English',[22,23,72,23][j],[25,25,80,25][j],n);T(b,d,'Odia',[21,20,70,21][j],[25,25,80,25][j],n)});
 a.att={p:93,t:122};b.att={p:112,t:122};
 for(let d=t-6;d<=t;d++){a.study.push({id:uid(),date:dstr(d),subject:['Maths','Science','English','Maths','Social Science','Science','Maths'][t-d],mins:[60,45,30,60,40,45,50][t-d]})}
 a.fees=[{id:uid(),name:'Tuition – Q2',amt:9000,due:dstr(t-80),paid:true},{id:uid(),name:'Tuition – Q3',amt:9000,due:dstr(t+6),paid:false},{id:uid(),name:'Board exam fee',amt:1800,due:dstr(t+20),paid:false}];
 b.fees=[{id:uid(),name:'Tuition – Q3',amt:7500,due:dstr(t-3),paid:false},{id:uid(),name:'School bus (Dec)',amt:1200,due:dstr(t+12),paid:false}];
 S.vidya.kids=[a,b];S.vidya.sel=a.id;if(!quiet){S.addons.on.vidya=true;save();toast('VidyaMitra demo loaded');go('s_home')}}
ADDON_REG.vidya={def:SDEF,demo:sDemo,sum(){const K=S.vidya.kids;return{income:0,line:K.length?K.map(x=>{const m=sModel(x);return esc(x.name)+' '+(m.overall!=null?Math.round(m.overall)+'%':'—')}).join(' · ')+' average marks':'Add a child to start',alerts:sAlerts()}}};
