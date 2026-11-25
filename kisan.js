/* GharMitra add-on: kisan · version 1.0 */
/* ================= CROP DATA (typical values – edit to local advice) =================
 len: stage lengths in days [initial, development, mid-season, late]
 kc: crop coefficient [initial, mid, end]; root: root depth (m); p: allowed depletion fraction
 npk: recommended kg/ha; split: true = nitrogen in 3 doses; base: base temperature °C for GDD
 yld: typical yield quintal/acre; pests: [from day, to day, what to check] */
const CROPS={
 paddy:{n:'Paddy (Rice) · धान',len:[30,30,40,20],kc:[1.05,1.2,0.9],root:0.3,p:0.5,npk:[80,40,40],split:true,base:10,yld:20,
  pests:[[20,60,'Stem borer and leaf folder: look for dead central shoots and folded, scraped leaves.'],[50,100,'Brown planthopper: check the base of plants for insects; hopper burn appears in circles.'],[60,95,'Blast: spindle-shaped leaf spots; neck blast at flowering.']]},
 wheat:{n:'Wheat · गेहूँ',len:[20,30,45,25],kc:[0.4,1.15,0.4],root:1.0,p:0.55,npk:[120,60,40],split:true,base:5,yld:16,
  pests:[[30,75,'Aphids on leaves and ears.'],[40,95,'Rust: yellow or brown powdery stripes/spots on leaves.']]},
 maize:{n:'Maize · मक्का',len:[20,35,35,20],kc:[0.3,1.2,0.6],root:1.0,p:0.55,npk:[120,60,40],split:true,base:10,yld:20,
  pests:[[10,50,'Fall armyworm: check the whorl for ragged holes and sawdust-like frass.'],[25,60,'Stem borer: dead hearts and shot holes in leaves.']]},
 groundnut:{n:'Groundnut · मूँगफली',len:[25,35,30,20],kc:[0.4,1.15,0.6],root:0.5,p:0.5,npk:[20,40,40],split:false,base:10,yld:8,
  pests:[[20,60,'Leaf miner and thrips: mines and silvering on leaves.'],[40,95,'Tikka leaf spot: dark round spots on leaves.']]},
 mustard:{n:'Mustard · सरसों',len:[20,30,40,20],kc:[0.35,1.1,0.35],root:0.9,p:0.6,npk:[80,40,40],split:true,base:5,yld:6,
  pests:[[30,85,'Aphids: most damaging at flowering; check the tips of shoots.']]},
 tomato:{n:'Tomato · टमाटर',len:[30,40,30,20],kc:[0.6,1.15,0.8],root:0.7,p:0.4,npk:[100,60,60],split:true,base:10,yld:100,
  pests:[[15,60,'Whitefly and leaf curl virus: curled, yellow leaves.'],[50,115,'Fruit borer: holes in fruits during flowering and fruiting.']]},
 potato:{n:'Potato · आलू',len:[25,30,30,15],kc:[0.5,1.15,0.75],root:0.4,p:0.35,npk:[150,80,100],split:true,base:7,yld:80,
  pests:[[30,95,'Late blight: dark water-soaked patches in cool, cloudy, humid weather.']]},
 moong:{n:'Green gram (Moong) · मूँग',len:[15,20,25,10],kc:[0.4,1.05,0.6],root:0.6,p:0.45,npk:[20,40,20],split:false,base:10,yld:4,
  pests:[[15,45,'Whitefly and yellow mosaic virus: yellow patches on leaves.'],[35,65,'Pod borer: holes in pods.']]}
};
const SOILS={sandy:['Sandy · बलुई',70],loam:['Loam · दोमट',150],clay:['Clay · चिकनी',200]};
const METHODS={flood:['Flood / furrow',0.6],sprinkler:['Sprinkler',0.75],drip:['Drip',0.9]};
// approximate monthly normals (eastern India) used when a day has no logged value
const ET0N=[3,4,5,6.5,7,5.5,4,4,4,4,3.5,3];
const TMAXN=[28,31,35,38,39,35,32,32,32,32,30,28],TMINN=[14,17,21,24,26,26,25,25,25,22,17,13];
const ACRE_M2=4046.86,AC_PER_HA=2.471;

const KDEF=()=>({
 farm:{name:'',village:'',crop:'paddy',area:1,sow:'',soil:'loam',method:'flood',flow:250,hp:1,npk:null},
 log:[],            // {date, rain, irr (mm), tmax, tmin, et0}
 fert:{prices:{urea:266.5,dap:1350,mop:1700},done:[]},
 pest:{gddTh:'',gddName:''},
 yld:{recs:[],xvar:'rain',xnow:''},
 market:{prices:[],qty:20,store:10,loss:1,msp:''},
 money:{costs:[],price:'',loan:{p:50000,m:12,kcc:7,ml:24}}
});
/* ================= Chart ================= */
function kchart(id,series,opt={}){
 const c=document.getElementById(id);if(!c)return;
 const dpr=window.devicePixelRatio||1,W=c.clientWidth,H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;
 const g=c.getContext('2d');g.scale(dpr,dpr);g.font='11px system-ui';
 const all=series.flatMap(s=>s.pts);if(!all.length){g.fillStyle='#9ca3af';g.fillText('Add data to see the graph',10,H/2);return}
 let x0=Math.min(...all.map(p=>p[0])),x1=Math.max(...all.map(p=>p[0]));if(opt.xmax!=null)x1=Math.max(x1,opt.xmax);if(x0===x1)x1=x0+1;
 let y0=opt.ymin!=null?opt.ymin:Math.min(...all.map(p=>p[1])),y1=Math.max(...all.map(p=>p[1]));if(opt.ymax!=null)y1=Math.max(y1,opt.ymax);if(opt.hline!=null){y1=Math.max(y1,opt.hline);y0=Math.min(y0,opt.hline)}if(y0===y1)y1=y0+1;
 const pad={l:42,r:10,t:16,b:22},X=x=>pad.l+(x-x0)/(x1-x0)*(W-pad.l-pad.r),Y=y=>H-pad.b-(y-y0)/(y1-y0)*(H-pad.t-pad.b);
 g.strokeStyle='#e5e7eb';g.fillStyle='#6b7280';
 for(let i=0;i<=4;i++){const v=y0+(y1-y0)*i/4,y=Y(v);g.beginPath();g.moveTo(pad.l,y);g.lineTo(W-pad.r,y);g.stroke();g.fillText(Math.abs(v)>=1000?(Math.round(v/100)/10)+'k':Math.round(v*10)/10,2,y+4)}
 if(opt.xlab){g.fillText(opt.xlab(x0),pad.l,H-6);const t=opt.xlab(x1);g.fillText(t,W-pad.r-g.measureText(t).width,H-6)}
 if(opt.hline!=null){g.strokeStyle='#dc2626';g.setLineDash([4,4]);g.beginPath();g.moveTo(pad.l,Y(opt.hline));g.lineTo(W-pad.r,Y(opt.hline));g.stroke();g.setLineDash([])}
 if(opt.vline!=null){g.strokeStyle='#9ca3af';g.setLineDash([2,3]);g.beginPath();g.moveTo(X(opt.vline),pad.t);g.lineTo(X(opt.vline),H-pad.b);g.stroke();g.setLineDash([]);g.fillStyle='#6b7280';g.fillText('today',X(opt.vline)+3,pad.t+20)}
 for(const s of series){g.strokeStyle=s.color;g.fillStyle=s.color;g.lineWidth=2;
  if(s.bar){const bw=Math.max(3,(W-pad.l-pad.r)/((x1-x0+1)*1.4));for(const[x,y]of s.pts)if(y>0)g.fillRect(X(x)-bw/2,Y(y),bw,Y(y0)-Y(y));continue}
  if(!s.noline){if(s.dash)g.setLineDash([5,4]);g.beginPath();s.pts.forEach(([x,y],i)=>i?g.lineTo(X(x),Y(y)):g.moveTo(X(x),Y(y)));g.stroke();g.setLineDash([])}
  if(s.dots)for(const[x,y]of s.pts){g.beginPath();g.arc(X(x),Y(y),s.noline?4.5:3,0,7);g.fill()}}
 if(series.some(s=>s.name)){let lx=pad.l+4;for(const s of series){if(!s.name)continue;g.fillStyle=s.color;g.fillRect(lx,3,10,4);g.fillStyle='#374151';g.fillText(s.name,lx+14,9);lx+=g.measureText(s.name).width+28}}
}

/* ================= MODELS ================= */
function kCrop(){return CROPS[S.kisan.farm.crop]||CROPS.paddy}
function kNpk(){return S.kisan.farm.npk||kCrop().npk}
function kCropState(){
 const F=S.kisan.farm,C=kCrop();if(!F.sow)return null;
 const sow=dnum(F.sow),t=dnum(today()),das=t-sow,dur=C.len.reduce((a,b)=>a+b,0);
 let acc=0,stage=0;for(let i=0;i<4;i++){if(das>=acc+C.len[i])stage=i+1;acc+=C.len[i]}stage=Math.min(stage,3);
 const ends=[];acc=0;for(const l of C.len){acc+=l;ends.push(sow+acc)}
 return{sow,t,das,dur,stage,ends,harvest:sow+dur,notSown:das<0,done:das>dur};
}
function kKcAt(das){const C=kCrop(),[l1,l2,l3,l4]=C.len,[ki,km,ke]=C.kc;
 if(das<l1)return ki;if(das<l1+l2)return ki+(km-ki)*(das-l1)/l2;if(das<l1+l2+l3)return km;if(das<l1+l2+l3+l4)return km+(ke-km)*(das-l1-l2-l3)/l4;return ke}
function kLogMap(){const m={};for(const e of S.kisan.log)m[e.date]=e;return m}
function kEt0Of(d,m){const e=m[dstr(d)];return e&&num(e.et0)?+e.et0:ET0N[monthOf(d)]}
function kEffRain(r){return r>5?0.8*r:0}
function kWater(){
 const cs=kCropState();if(!cs||cs.notSown)return null;
 const F=S.kisan.farm,C=kCrop();const TAW=SOILS[F.soil][1]*C.root,RAW=C.p*TAW;const m=kLogMap();
 let Dr=0;const hist=[];const end=Math.min(cs.t,cs.harvest);
 for(let d=cs.sow;d<=end;d++){const e=m[dstr(d)]||{};const etc=kKcAt(d-cs.sow)*kEt0Of(d,m);
  Dr=Math.min(TAW,Math.max(0,Dr+etc-kEffRain(+e.rain||0)-(+e.irr||0)*METHODS[F.method][1]));hist.push([d,(TAW-Dr)/TAW*100])}
 // forecast with no rain
 let Df=Dr,dueDay=null,need=null;const fc=[[end,(TAW-Dr)/TAW*100]];
 if(Dr>=RAW){dueDay=end;need=Dr}
 for(let d=end+1;d<=Math.min(end+21,cs.harvest);d++){Df=Math.min(TAW,Df+kKcAt(d-cs.sow)*kEt0Of(d,m));fc.push([d,(TAW-Df)/TAW*100]);if(dueDay==null&&Df>=RAW){dueDay=d;need=Df}}
 const eff=METHODS[F.method][1];const net=need||RAW;const gross=net/eff;const area=F.area*ACRE_M2;
 const litres=gross*area;const mins=F.flow>0?litres/F.flow:null;const kwh=mins!=null?F.hp*0.746*mins/60:null;
 const etcToday=kKcAt(Math.min(cs.das,cs.dur))*kEt0Of(cs.t,m);
 return{TAW,RAW,Dr,pct:(TAW-Dr)/TAW*100,rawPct:(1-C.p)*100,hist,fc,dueDay,net,gross,litres,mins,kwh,etcToday,kc:kKcAt(Math.min(cs.das,cs.dur)),cs};
}
function kFert(){
 const F=S.kisan.farm,C=kCrop(),[N,P,K]=kNpk(),ha=F.area/AC_PER_HA;
 const Nt=N*ha,Pt=P*ha,Kt=K*ha;
 const dap=Pt/0.46,mop=Kt/0.60,nFromDap=0.18*dap,urea=Math.max(0,(Nt-nFromDap)/0.46);
 const bags={urea:Math.ceil(urea/45),dap:Math.ceil(dap/50),mop:Math.ceil(mop/50)};
 const pr=S.kisan.fert.prices;const cost=bags.urea*pr.urea+bags.dap*pr.dap+bags.mop*pr.mop;
 const cs=kCropState();let sched=[];
 if(C.split){sched=[{key:'basal',das:0,what:`All DAP (${f1(dap)} kg) + all MOP (${f1(mop)} kg) + Urea ${f1(urea/3)} kg`,stage:'At sowing / transplanting'},
   {key:'top1',das:C.len[0],what:`Urea ${f1(urea/3)} kg (1st top dressing)`,stage:'Start of vegetative growth'},
   {key:'top2',das:C.len[0]+C.len[1],what:`Urea ${f1(urea/3)} kg (2nd top dressing)`,stage:'Before flowering / panicle stage'}]}
 else sched=[{key:'basal',das:0,what:`All DAP (${f1(dap)} kg) + MOP (${f1(mop)} kg)${urea>0.5?' + Urea '+f1(urea)+' kg':''} at sowing (legume: no top dressing)`,stage:'At sowing'}];
 let next=null;if(cs&&!cs.notSown){for(const s of sched){s.day=cs.sow+s.das;s.done=S.kisan.fert.done.includes(s.key+'@'+S.kisan.farm.sow)}next=sched.find(s=>!s.done)||null}
 return{N,P,K,ha,Nt,Pt,Kt,dap,mop,urea,nFromDap,bags,cost,sched,next};
}
function kGdd(){const cs=kCropState();if(!cs||cs.notSown)return null;const C=kCrop(),m=kLogMap();let g=0;const pts=[];
 for(let d=cs.sow;d<=Math.min(cs.t,cs.harvest);d++){const e=m[dstr(d)]||{};const mo=monthOf(d);const tx=num(e.tmax)?+e.tmax:TMAXN[mo],tn=num(e.tmin)?+e.tmin:TMINN[mo];g+=Math.max(0,(tx+tn)/2-C.base);pts.push([d,g])}
 let crossDay=null;const th=+S.kisan.pest.gddTh;if(th>0&&g<th&&pts.length>=7){const rate=(g-pts[Math.max(0,pts.length-8)][1])/Math.min(7,pts.length-1);if(rate>0)crossDay=cs.t+Math.ceil((th-g)/rate)}
 return{g,pts,th,crossDay};}
function kPestNow(){const cs=kCropState();if(!cs||cs.notSown||cs.done)return[];return kCrop().pests.filter(([a,b])=>cs.das>=a&&cs.das<=b)}
function kYield(){const Y=S.kisan.yld,xv=Y.xvar;const pts=Y.recs.filter(r=>num(r[xv])&&num(r.y)).map(r=>[+r[xv],+r.y]);const reg=pts.length>=3?linreg(pts):null;
 const pred=reg&&num(Y.xnow)?reg.a+reg.b*(+Y.xnow):null;return{pts,reg,pred,xv}}
function kExpYield(){const y=kYield();return y.pred!=null&&y.pred>0?{v:y.pred,src:'yield predictor'}:{v:kCrop().yld,src:'typical yield for '+kCrop().n.split(' ·')[0]}}
function kMarket(){const M=S.kisan.market;const p=[...M.prices].sort((a,b)=>a.date<b.date?-1:1);if(!p.length)return null;
 const cur=+p[p.length-1].price;const last=p.slice(-4);const ma=last.reduce((a,x)=>a+ +x.price,0)/last.length;
 const lastDay=dnum(p[p.length-1].date);const rec=p.filter(x=>dnum(x.date)>=lastDay-60);const reg=rec.length>=3?linreg(rec.map(x=>[dnum(x.date),+x.price])):null;
 const slopeM=reg?reg.b*30:0;const q=+M.qty||0,st=+M.store||0,loss=(+M.loss||0)/100;
 const opts=[];for(let mo=0;mo<=4;mo++){const price=Math.max(0,cur+slopeM*mo);const qq=q*(1-loss*mo);const rev=price*qq-st*q*mo;opts.push({mo,price,qq,rev})}
 const best=opts.reduce((a,b)=>b.rev>a.rev?b:a,opts[0]);const gain=best.rev-opts[0].rev;
 return{p,cur,ma,reg,slopeM,opts,best,gain,lastDay}}
function kMoney(){const F=S.kisan.farm,M=S.kisan.money;const tot=M.costs.reduce((a,c)=>a+ +c.amt,0);const by={};for(const c of M.costs)by[c.cat]=(by[c.cat]||0)+ +c.amt;
 const fm=kFert();const mk=kMarket();const price=num(M.price)?+M.price:(mk?mk.cur:null);const ey=kExpYield();const prod=ey.v*F.area;
 const rev=price!=null?prod*price:null;const profit=rev!=null?rev-tot:null;
 const beY=price?tot/price/F.area:null;const beP=prod?tot/prod:null;
 const L=M.loan;const emi=(P,r,n)=>{const i=r/1200;return i?P*i*(1+i)**n/((1+i)**n-1):P/n};
 const e1=emi(+L.p,+L.kcc,+L.m),e2=emi(+L.p,+L.ml,+L.m);
 return{tot,by,perAcre:tot/(F.area||1),price,ey,prod,rev,profit,beY,beP,e1,e2,i1:e1*L.m-L.p,i2:e2*L.m-L.p,fertCost:fm.cost}}

/* ================= ALERTS ================= */
function kAlerts(){const out=[];const cs=kCropState();
 if(!cs){out.push(['info','🌱','Set up your farm first: crop, area and sowing date (Farm tab).']);return out}
 if(cs.notSown){out.push(['info','🌱',`Sowing planned on <b>${pretty(S.kisan.farm.sow)}</b> (${-cs.das} days away).`]);return out}
 if(cs.done){out.push(['good','🌾',`Crop has completed its ${cs.dur}-day season. Harvest now if not already done.`])}
 else{const w=kWater();if(w){if(w.dueDay!=null&&w.dueDay<=cs.t)out.push(['bad','💧',`<b>Irrigate today.</b> Soil water is down to ${Math.round(w.pct)}%. Apply about ${f1(w.gross)} mm: ${Math.round(w.litres/1000).toLocaleString('en-IN')} thousand litres, pump ${Math.round(w.mins)} min.`]);
   else if(w.dueDay!=null)out.push([w.dueDay-cs.t<=2?'warn':'good','💧',`Next irrigation in <b>${w.dueDay-cs.t} days</b> (${prettyN(w.dueDay)}) if it does not rain. Soil water now ${Math.round(w.pct)}%.`]);
   else out.push(['good','💧',`Soil water is fine (${Math.round(w.pct)}%). No irrigation needed in the next 3 weeks unless very hot.`])}
  const fm=kFert();if(fm.next){const dd=fm.next.day-cs.t;out.push([dd<=0?'warn':'info','🧪',dd<=0?`<b>Fertiliser due now:</b> ${fm.next.what}.`:`Next fertiliser in ${dd} days (${prettyN(fm.next.day)}): ${fm.next.what}.`])}
  for(const[a,b,t]of kPestNow())out.push(['warn','🐛',`Pest watch (day ${cs.das}): ${t}`]);
  const g=kGdd();if(g&&g.th>0){if(g.g>=g.th)out.push(['warn','🌡️',`Heat units ${Math.round(g.g)} GDD have crossed your ${S.kisan.pest.gddName||'pest'} threshold (${g.th}). Inspect the field.`]);else if(g.crossDay)out.push(['info','🌡️',`${S.kisan.pest.gddName||'Pest'} threshold (${g.th} GDD) expected around ${prettyN(g.crossDay)}.`])}
  out.push(['info','🌾',`Day ${cs.das} of ${cs.dur}: ${['Initial','Vegetative','Flowering / grain filling','Maturity'][cs.stage]} stage. Expected harvest <b>${prettyN(cs.harvest)}</b>.`])}
 const mk=kMarket();if(mk&&mk.reg){out.push([mk.best.mo>0?'info':'good','📈',mk.best.mo>0?`Prices rising ${inr(mk.slopeM)}/q per month. Holding ${mk.best.mo} month(s) may earn about <b>${inr(mk.gain)}</b> more after storage cost and loss.`:`Selling now looks best: price trend does not cover storage cost and loss.`])}
 const mm=kMoney();if(mm.profit!=null&&mm.tot>0)out.push([mm.profit>=0?'good':'bad','💰',`Expected profit <b>${inr(mm.profit)}</b> (cost ${inr(mm.tot)}, income ${inr(mm.rev)}). Break-even yield: ${f1(mm.beY)} q/acre.`]);
 return out}

/* ================= VIEWS ================= */

V.k_home=()=>{const cs=kCropState(),w=kWater(),fm=kFert(),mm=kMoney(),C=kCrop();
 return `<div class="card"><h2>${S.kisan.farm.name?esc(S.kisan.farm.name)+' · ':''}${C.n}</h2>
 <p class="muted" style="margin-top:-6px">${f2(S.kisan.farm.area)} acre${S.kisan.farm.village?' · '+esc(S.kisan.farm.village):''}${S.kisan.farm.sow?' · sown '+pretty(S.kisan.farm.sow):''}</p>
 ${cs&&!cs.notSown?`<div class="stages">${['Initial','Vegetative','Flowering','Maturity'].map((n,i)=>`<div class="${cs.done||i<cs.stage?'done':i===cs.stage?'on':''}">${n}</div>`).join('')}</div><div class="bar"><div style="width:${Math.min(100,cs.das/cs.dur*100)}%"></div></div><p class="muted">Day ${Math.min(cs.das,cs.dur)} of ${cs.dur} · harvest ${prettyN(cs.harvest)}</p>`:''}
 <div class="stats">
  <div class="stat"><div class="k">💧 Soil water</div><div class="v">${w?Math.round(w.pct)+'<span class="u">%</span>':'—'}</div></div>
  <div class="stat"><div class="k">💧 Next irrigation</div><div class="v">${w?(w.dueDay==null?'Not soon':w.dueDay<=cs.t?'Today':(w.dueDay-cs.t)+' <span class="u">days</span>'):'—'}</div></div>
  <div class="stat"><div class="k">🧪 Fertiliser cost</div><div class="v">${inr(fm.cost)}</div></div>
  <div class="stat"><div class="k">💰 Expected profit</div><div class="v" style="color:${mm.profit!=null&&mm.profit<0?'var(--bad)':'inherit'}">${mm.profit!=null&&mm.tot?inr(mm.profit):'—'}</div></div></div></div>
 <div class="card"><h2>${H('Alerts and advice','सलाह')}</h2>${kAlerts().map(([k,i,t])=>`<div class="alert ${k}">${i} ${t}</div>`).join('')}</div>
 <div class="card"><h2>How KisanMitra works</h2><p class="muted">Field data → Mathematical model → Prediction → Alert → Farmer acts → New data. Every reading you add makes the next prediction better.</p>
 <div class="btns"><button class="ghost small" onclick="go('k_maths')">See the maths</button><button class="ghost small" onclick="kDemo()">Load demo data</button></div></div>`};

V.k_farm=()=>{const F=S.kisan.farm,cs=kCropState(),C=kCrop(),g=kGdd();
 return `<div class="card"><h2>${H('My farm','मेरा खेत')}</h2>
 <div class="row"><div><label>Farmer name</label><input value="${esc(F.name)}" onchange="S.kisan.farm.name=this.value;save()"></div><div><label>Village</label><input value="${esc(F.village)}" onchange="S.kisan.farm.village=this.value;save()"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Crop · फसल</label><select onchange="S.kisan.farm.crop=this.value;S.kisan.farm.npk=null;save();render()">${Object.entries(CROPS).map(([k,c])=>`<option value="${k}" ${F.crop===k?'selected':''}>${c.n}</option>`).join('')}</select></div>
 <div><label>Area (acre) · रकबा</label><input type="number" step="0.01" value="${F.area}" onchange="S.kisan.farm.area=+this.value||0;save();render()"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Sowing / transplanting date · बुवाई</label><input type="date" value="${F.sow}" onchange="S.kisan.farm.sow=this.value;save();render()"></div>
 <div><label>Soil type · मिट्टी</label><select onchange="S.kisan.farm.soil=this.value;save();render()">${Object.entries(SOILS).map(([k,s])=>`<option value="${k}" ${F.soil===k?'selected':''}>${s[0]}</option>`).join('')}</select></div></div>
 <div class="row" style="margin-top:8px"><div><label>Irrigation method</label><select onchange="S.kisan.farm.method=this.value;save();render()">${Object.entries(METHODS).map(([k,s])=>`<option value="${k}" ${F.method===k?'selected':''}>${s[0]}</option>`).join('')}</select></div>
 <div><label>Pump flow (litres/min)</label><input type="number" value="${F.flow}" onchange="S.kisan.farm.flow=+this.value;save();render()"></div><div><label>Pump power (HP)</label><input type="number" step="0.5" value="${F.hp}" onchange="S.kisan.farm.hp=+this.value;save();render()"></div></div>
 <p class="muted">Find pump flow: time how many seconds the pump takes to fill a 20-litre bucket; flow = 20 × 60 ÷ seconds.</p></div>
 ${cs&&!cs.notSown?`<div class="card"><h2>${H('Crop calendar','फसल कैलेंडर')}</h2>
 <table><tr><th>Stage</th><th>Days</th><th>Ends on</th></tr>${['Initial','Vegetative (development)','Flowering / grain filling','Maturity'].map((n,i)=>`<tr style="${i===cs.stage&&!cs.done?'background:var(--accbg)':''}"><td>${n}</td><td>${C.len.slice(0,i).reduce((a,b)=>a+b,0)}–${C.len.slice(0,i+1).reduce((a,b)=>a+b,0)}</td><td>${prettyN(cs.ends[i])}</td></tr>`).join('')}</table>
 <p class="muted">Expected harvest: <b>${prettyN(cs.harvest)}</b>. Crop water use factor (Kc) today: ${f2(kKcAt(Math.min(cs.das,cs.dur)))}.</p></div>
 <div class="card"><h2>${H('Pest watch','कीट निगरानी')}</h2>${kPestNow().length?kPestNow().map(([a,b,t])=>`<div class="alert warn">🐛 Days ${a}–${b}: ${t}</div>`).join(''):'<div class="alert good">No major pest window for this crop stage. Keep walking the field weekly.</div>'}
 <h3>All pest windows for ${C.n.split(' ·')[0]}</h3><table>${C.pests.map(([a,b,t])=>`<tr><td>Day ${a}–${b}</td><td>${t}</td></tr>`).join('')}</table><p class="muted">General guidance. Confirm identification and control with your Krishi Vigyan Kendra (KVK) or agriculture officer.</p></div>
 <div class="card"><h2>${H('Heat units (GDD)','ताप इकाई')}</h2><div class="big">${g?Math.round(g.g):0} GDD</div><p class="muted" style="text-align:center">since sowing · base temperature ${C.base} °C</p>
 <canvas id="gch"></canvas>
 <div class="row"><div><label>Pest/stage name</label><input value="${esc(S.kisan.pest.gddName)}" placeholder="e.g. stem borer 2nd generation" onchange="S.kisan.pest.gddName=this.value;save();render()"></div><div><label>Its GDD threshold</label><input type="number" value="${S.kisan.pest.gddTh}" placeholder="from KVK" onchange="S.kisan.pest.gddTh=this.value;save();render()"></div></div>
 ${g&&g.th>0?(g.g>=g.th?`<div class="alert warn">Threshold crossed. Inspect the field now.</div>`:g.crossDay?`<div class="alert info">At the current rate the threshold is reached around <b>${prettyN(g.crossDay)}</b>.</div>`:''):''}
 <p class="muted">Insects and crops develop according to accumulated heat, not calendar days. GDD = Σ[(Tmax + Tmin) ÷ 2 − base]. Uses your logged temperatures, else monthly averages.</p></div>`:'<div class="alert info">Enter the sowing date to see the crop calendar, pest watch and heat units.</div>'}`};
A.k_farm=()=>{const g=kGdd();if(!g)return;const cs=kCropState();kchart('gch',[{pts:g.pts,color:'#ea580c',name:'Cumulative GDD'}],{ymin:0,hline:g.th>0?g.th:null,xlab:prettyN})};

V.k_water=()=>{const w=kWater(),F=S.kisan.farm,cs=kCropState();const L=[...S.kisan.log].sort((a,b)=>a.date<b.date?1:-1);
 return `<div class="card"><h2>${H('Daily field log','दैनिक रिकॉर्ड')}</h2>
 <div class="row"><div><label>Date</label><input type="date" id="ld" value="${today()}"></div><div><label>Rain (mm) · वर्षा</label><input type="number" id="lr" step="0.1" placeholder="0"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Irrigation: pump minutes</label><input type="number" id="lm" placeholder="0"></div><div><label>or depth (mm)</label><input type="number" id="li" step="0.1"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Max temp °C</label><input type="number" id="ltx"></div><div><label>Min temp °C</label><input type="number" id="ltn"></div></div>
 <div class="btns"><button onclick="kAddLog()">Save</button></div>
 <p class="muted">Rain: use a simple rain gauge (straight-sided jar; mm of water collected). Irrigation minutes are converted to mm: depth = flow × minutes ÷ field area.</p></div>
 ${w?`<div class="card"><h2>${H('Irrigation scheduler','सिंचाई योजना')}</h2>
  <div class="big" style="color:${w.dueDay!=null&&w.dueDay<=cs.t?'var(--bad)':'inherit'}">${w.dueDay==null?'No irrigation needed soon':w.dueDay<=cs.t?'Irrigate today':'Irrigate in '+(w.dueDay-cs.t)+' days'}</div>
  <p class="muted" style="text-align:center">${w.dueDay!=null?prettyN(w.dueDay)+' · if no rain':''}</p>
  <div class="stats"><div class="stat"><div class="k">Soil water left</div><div class="v">${Math.round(w.pct)}<span class="u">%</span></div></div>
  <div class="stat"><div class="k">Crop uses today</div><div class="v">${f1(w.etcToday)} <span class="u">mm/day</span></div></div>
  <div class="stat"><div class="k">Water to apply</div><div class="v">${f1(w.gross)} <span class="u">mm</span></div><div class="u">${Math.round(w.litres).toLocaleString('en-IN')} L</div></div>
  <div class="stat"><div class="k">Pump time</div><div class="v">${w.mins!=null?Math.round(w.mins)+' <span class="u">min</span>':'—'}</div><div class="u">${w.kwh!=null?f1(w.kwh)+' kWh':''}</div></div></div>
  <canvas id="wch"></canvas><p class="muted">Green: soil water in the root zone (100% = field full). Dashed: forecast with no rain. Red line: irrigate below this level (${Math.round(w.rawPct)}%).</p>
  ${F.crop==='paddy'?'<div class="alert info">🌾 Paddy: the model follows Alternate Wetting and Drying (AWD). Irrigate 5 cm when standing water has disappeared and the soil is just moist. Keep standing water during flowering.</div>':''}
  </div>`:'<div class="alert info">Set the crop and sowing date in the Farm tab to start the water model.</div>'}
 <div class="card"><h2>Log history</h2>${L.length?`<table><tr><th>Date</th><th class="r">Rain</th><th class="r">Irrig.</th><th class="r">Temp</th><th></th></tr>${L.slice(0,40).map(e=>`<tr><td>${pretty(e.date)}</td><td class="r">${num(e.rain)?e.rain+' mm':''}</td><td class="r">${num(e.irr)?f1(e.irr)+' mm':''}</td><td class="r">${num(e.tmax)?e.tmax+'/'+(e.tmin??''):''}</td><td class="r"><button class="x" onclick="kDelLog('${e.date}')">✕</button></td></tr>`).join('')}</table>`:'<p class="muted">Nothing logged yet. Days without entries count as no rain and average temperature.</p>'}</div>`};
A.k_water=()=>{const w=kWater();if(!w)return;const L=S.kisan.log.filter(e=>num(e.rain)&&+e.rain>0).map(e=>[dnum(e.date),Math.min(100,+e.rain)]);
 kchart('wch',[{pts:w.hist,color:'#16a34a',name:'Soil water %'},{pts:w.fc,color:'#16a34a',dash:1},{pts:L,color:'#60a5fa',bar:1,name:'Rain mm'}],{ymin:0,ymax:100,hline:w.rawPct,vline:w.cs.t,xlab:prettyN})};
function kAddLog(){const d=$('#ld').value||today();const o={};const r=parseFloat($('#lr').value),mi=parseFloat($('#lm').value),ir=parseFloat($('#li').value),tx=parseFloat($('#ltx').value),tn=parseFloat($('#ltn').value);
 if(!isNaN(r))o.rain=r;if(!isNaN(ir))o.irr=ir;else if(!isNaN(mi)&&S.kisan.farm.area>0)o.irr=+(S.kisan.farm.flow*mi/(S.kisan.farm.area*ACRE_M2)).toFixed(1);if(!isNaN(tx))o.tmax=tx;if(!isNaN(tn))o.tmin=tn;
 if(!Object.keys(o).length)return toast('Enter at least one value');let e=S.kisan.log.find(x=>x.date===d);if(!e){e={date:d};S.kisan.log.push(e)}Object.assign(e,o);save();render();toast(o.irr!=null?`Saved: irrigation ${f1(o.irr)} mm`:'Saved')}
function kDelLog(d){S.kisan.log=S.kisan.log.filter(x=>x.date!==d);save();render()}

V.k_fert=()=>{const fm=kFert(),F=S.kisan.farm,pr=S.kisan.fert.prices,cs=kCropState();
 return `<div class="card"><h2>${H('Fertiliser calculator','खाद गणना')}</h2>
 <p class="muted">${kCrop().n} · ${f2(F.area)} acre (${f2(fm.ha)} ha). Recommended dose (kg per hectare), edit from your Soil Health Card:</p>
 <div class="row"><div><label>N (nitrogen)</label><input type="number" value="${fm.N}" onchange="kSetNPK(0,this.value)"></div><div><label>P₂O₅ (phosphorus)</label><input type="number" value="${fm.P}" onchange="kSetNPK(1,this.value)"></div><div><label>K₂O (potash)</label><input type="number" value="${fm.K}" onchange="kSetNPK(2,this.value)"></div></div>
 <table style="margin-top:10px"><tr><th>Fertiliser</th><th class="r">Needed</th><th class="r">Bags</th><th class="r">Cost</th></tr>
 <tr><td>DAP (18-46-0)</td><td class="r">${f1(fm.dap)} kg</td><td class="r">${fm.bags.dap} × 50 kg</td><td class="r">${inr(fm.bags.dap*pr.dap)}</td></tr>
 <tr><td>MOP (0-0-60)</td><td class="r">${f1(fm.mop)} kg</td><td class="r">${fm.bags.mop} × 50 kg</td><td class="r">${inr(fm.bags.mop*pr.mop)}</td></tr>
 <tr><td>Urea (46-0-0)</td><td class="r">${f1(fm.urea)} kg</td><td class="r">${fm.bags.urea} × 45 kg</td><td class="r">${inr(fm.bags.urea*pr.urea)}</td></tr>
 <tr><th>Total</th><th></th><th></th><th class="r">${inr(fm.cost)}</th></tr></table>
 <div class="eq">DAP = P ÷ 0.46 &nbsp;·&nbsp; MOP = K ÷ 0.60 &nbsp;·&nbsp; Urea = (N − 0.18 × DAP) ÷ 0.46</div>
 <p class="muted">Needed N ${f1(fm.Nt)} kg, P₂O₅ ${f1(fm.Pt)} kg, K₂O ${f1(fm.Kt)} kg for your field. DAP already supplies ${f1(fm.nFromDap)} kg N, so less urea is needed.</p></div>
 <div class="card"><h2>${H('When to apply','कब डालें')}</h2>${cs&&!cs.notSown?`<table>${fm.sched.map(s=>`<tr style="${s===fm.next?'background:var(--warnbg)':''}"><td><b>${prettyN(s.day)}</b><br><small class="muted">day ${s.das} · ${s.stage}</small></td><td>${s.what}</td><td class="r">${s.done?'✅':`<button class="small ghost" onclick="kMarkDose('${s.key}')">Done</button>`}</td></tr>`).join('')}</table>`:'<p class="muted">Enter the sowing date in the Farm tab to get dates.</p>'}
 <p class="muted">Apply urea on moist soil and avoid heavy rain forecasts, so it is not washed away.</p></div>
 <div class="card"><h2>Bag prices (₹)</h2><div class="row"><div><label>Urea 45 kg</label><input type="number" value="${pr.urea}" onchange="S.kisan.fert.prices.urea=+this.value;save();render()"></div><div><label>DAP 50 kg</label><input type="number" value="${pr.dap}" onchange="S.kisan.fert.prices.dap=+this.value;save();render()"></div><div><label>MOP 50 kg</label><input type="number" value="${pr.mop}" onchange="S.kisan.fert.prices.mop=+this.value;save();render()"></div></div><p class="muted">Example prices. Change to your local dealer's rates.</p></div>`};
function kSetNPK(i,v){const a=[...kNpk()];a[i]=+v||0;S.kisan.farm.npk=a;save();render()}
function kMarkDose(k){S.kisan.fert.done.push(k+'@'+S.kisan.farm.sow);save();render();toast('Marked as applied')}

V.k_market=()=>{const mk=kMarket(),M=S.kisan.market;const P=[...M.prices].sort((a,b)=>a.date<b.date?1:-1);
 return `<div class="card"><h2>${H('Mandi price log','मंडी भाव')}</h2>
 <div class="row"><div><label>Date</label><input type="date" id="pd" value="${today()}"></div><div><label>Price (₹ per quintal)</label><input type="number" id="pp"></div></div>
 <div class="btns"><button onclick="kAddPrice()">Save price</button></div><p class="muted">Get daily prices from the local mandi, the eNAM portal or the Kisan Suvidha app.</p></div>
 ${mk?`<div class="card"><h2>${H('Best time to sell','कब बेचें')}</h2>
 <div class="stats"><div class="stat"><div class="k">Latest price</div><div class="v">${inr(mk.cur)}<span class="u">/q</span></div></div>
 <div class="stat"><div class="k">Average (last 4)</div><div class="v">${inr(mk.ma)}<span class="u">/q</span></div></div>
 <div class="stat"><div class="k">Trend</div><div class="v" style="color:${mk.slopeM>=0?'var(--good)':'var(--bad)'}">${mk.reg?(mk.slopeM>=0?'+':'')+inr(mk.slopeM):'—'}<span class="u">/q per month</span></div></div>
 <div class="stat"><div class="k">MSP</div><div class="v">${num(M.msp)?inr(+M.msp):'—'}<span class="u">/q</span></div></div></div>
 ${num(M.msp)&&mk.cur<+M.msp?`<div class="alert warn">Market price is below MSP (${inr(+M.msp)}). Check selling at a government procurement centre.</div>`:''}
 <canvas id="mch"></canvas>
 <h3>Sell now or store? (${f1(M.qty)} quintal)</h3>
 <table><tr><th>Sell after</th><th class="r">Price</th><th class="r">Qty left</th><th class="r">Net income</th></tr>${mk.opts.map(o=>`<tr style="${o===mk.best?'background:var(--goodbg);font-weight:700':''}"><td>${o.mo?o.mo+' month'+(o.mo>1?'s':''):'Now'}</td><td class="r">${inr(o.price)}</td><td class="r">${f1(o.qq)} q</td><td class="r">${inr(o.rev)}</td></tr>`).join('')}</table>
 <div class="alert ${mk.best.mo?'info':'good'}">${mk.reg?(mk.best.mo?`Best: <b>store ${mk.best.mo} month(s)</b> and sell. Extra income about ${inr(mk.gain)}.`:'Best: <b>sell now</b>. The price rise does not cover storage and loss.'):'Add at least 3 prices over a few weeks to see the trend.'}</div>
 <p class="muted">Model: price after m months = current + trend × m; income = price × qty × (1 − loss × m) − storage × qty × m. Trends can change suddenly; use this as a guide only.</p></div>`:''}
 <div class="card"><h2>Settings</h2><div class="row"><div><label>Quantity to sell (q)</label><input type="number" value="${M.qty}" onchange="S.kisan.market.qty=+this.value;save();render()"></div><div><label>MSP ₹/q (optional)</label><input type="number" value="${M.msp}" onchange="S.kisan.market.msp=this.value;save();render()"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Storage cost ₹/q/month</label><input type="number" value="${M.store}" onchange="S.kisan.market.store=+this.value;save();render()"></div><div><label>Storage loss %/month</label><input type="number" step="0.1" value="${M.loss}" onchange="S.kisan.market.loss=+this.value;save();render()"></div></div></div>
 ${P.length?`<div class="card"><h2>Price history</h2><table>${P.slice(0,30).map(x=>`<tr><td>${pretty(x.date)}</td><td class="r">${inr(x.price)}</td><td class="r"><button class="x" onclick="S.kisan.market.prices=S.kisan.market.prices.filter(y=>y.id!=='${x.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
A.k_market=()=>{const mk=kMarket();if(!mk)return;const pts=mk.p.map(x=>[dnum(x.date),+x.price]);const ser=[{pts,color:'#3f6212',name:'Price',dots:1}];
 if(mk.reg){const x0=pts[0][0],x1=mk.lastDay+120;ser.push({pts:[[Math.max(x0,mk.lastDay-60),mk.reg.a+mk.reg.b*Math.max(x0,mk.lastDay-60)],[x1,mk.reg.a+mk.reg.b*x1]],color:'#f59e0b',dash:1,name:'Trend'})}
 kchart('mch',ser,{hline:num(S.kisan.market.msp)?+S.kisan.market.msp:null,xlab:prettyN,xmax:mk.reg?mk.lastDay+120:null})};
function kAddPrice(){const p=parseFloat($('#pp').value);if(isNaN(p))return toast('Enter the price');S.kisan.market.prices.push({id:uid(),date:$('#pd').value||today(),price:p});save();render();toast('Price saved')}

const CCATS=['Seed','Fertiliser','Pesticide','Labour','Irrigation / diesel','Machinery / tractor','Land rent','Other'];
V.k_money=()=>{const mm=kMoney(),M=S.kisan.money,L=M.loan;
 return `<div class="card"><h2>${H('Cost and profit','लागत और मुनाफ़ा')}</h2>
 <div class="row"><div><label>Amount (₹)</label><input type="number" id="ca"></div><div><label>Item</label><select id="cc">${CCATS.map(c=>`<option>${c}</option>`).join('')}</select></div></div>
 <div class="btns"><button onclick="kAddCost()">Add cost</button>${mm.fertCost&&!M.costs.some(c=>c.cat==='Fertiliser')?`<button class="ghost" onclick="kAddFertCost()">Add fertiliser estimate ${inr(mm.fertCost)}</button>`:''}</div>
 <div class="stats" style="margin-top:12px"><div class="stat"><div class="k">Total cost</div><div class="v">${inr(mm.tot)}</div><div class="u">${inr(mm.perAcre)} per acre</div></div>
 <div class="stat"><div class="k">Expected production</div><div class="v">${f1(mm.prod)} <span class="u">q</span></div><div class="u">${f1(mm.ey.v)} q/acre (${mm.ey.src})</div></div>
 <div class="stat"><div class="k">Expected income</div><div class="v">${mm.rev!=null?inr(mm.rev):'—'}</div><div class="u">${mm.price?'at '+inr(mm.price)+'/q':'enter a price'}</div></div>
 <div class="stat"><div class="k">Expected profit</div><div class="v" style="color:${mm.profit!=null&&mm.profit<0?'var(--bad)':'var(--good)'}">${mm.profit!=null?inr(mm.profit):'—'}</div></div>
 <div class="stat"><div class="k">Break-even yield</div><div class="v">${mm.beY!=null?f1(mm.beY):'—'} <span class="u">q/acre</span></div></div>
 <div class="stat"><div class="k">Break-even price</div><div class="v">${mm.beP?inr(mm.beP):'—'}<span class="u">/q</span></div></div></div>
 <label style="margin-top:10px">Expected selling price ₹/q (blank = latest mandi price)</label><input type="number" value="${M.price}" onchange="S.kisan.money.price=this.value;save();render()">
 ${Object.keys(mm.by).length?`<h3>Cost breakdown</h3>${Object.entries(mm.by).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div style="margin:6px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${c}</span><span>${inr(v)} · ${Math.round(v/mm.tot*100)}%</span></div><div class="bar"><div style="width:${v/mm.tot*100}%"></div></div></div>`).join('')}`:''}
 <div class="eq">Profit = yield × area × price − cost &nbsp;·&nbsp; Break-even yield = cost ÷ (price × area)</div></div>
 <div class="card"><h2>${H('Loan comparison','कर्ज़ तुलना')}</h2>
 <div class="row"><div><label>Loan amount (₹)</label><input type="number" value="${L.p}" onchange="S.kisan.money.loan.p=+this.value;save();render()"></div><div><label>Months</label><input type="number" value="${L.m}" onchange="S.kisan.money.loan.m=+this.value;save();render()"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Kisan Credit Card rate %/yr</label><input type="number" step="0.1" value="${L.kcc}" onchange="S.kisan.money.loan.kcc=+this.value;save();render()"></div><div><label>Moneylender rate %/yr</label><input type="number" step="0.1" value="${L.ml}" onchange="S.kisan.money.loan.ml=+this.value;save();render()"></div></div>
 <table style="margin-top:10px"><tr><th></th><th class="r">Monthly EMI</th><th class="r">Total interest</th></tr><tr><td>KCC (bank)</td><td class="r">${inr(mm.e1)}</td><td class="r">${inr(mm.i1)}</td></tr><tr><td>Moneylender</td><td class="r">${inr(mm.e2)}</td><td class="r">${inr(mm.i2)}</td></tr></table>
 <div class="alert good">The bank loan saves <b>${inr(mm.i2-mm.i1)}</b> in interest. Check current KCC interest and repayment benefits at your bank.</div>
 <div class="eq">EMI = P·r(1+r)ⁿ ÷ [(1+r)ⁿ − 1], &nbsp; r = yearly rate ÷ 12</div></div>
 ${M.costs.length?`<div class="card"><h2>Cost entries</h2><table>${[...M.costs].reverse().map(c=>`<tr><td>${pretty(c.date)}</td><td>${esc(c.cat)}</td><td class="r">${inr(c.amt)}</td><td class="r"><button class="x" onclick="S.kisan.money.costs=S.kisan.money.costs.filter(x=>x.id!=='${c.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
function kAddCost(){const a=parseFloat($('#ca').value);if(isNaN(a)||a<=0)return toast('Enter an amount');S.kisan.money.costs.push({id:uid(),date:today(),cat:$('#cc').value,amt:a});save();render();toast('Cost added')}
function kAddFertCost(){S.kisan.money.costs.push({id:uid(),date:today(),cat:'Fertiliser',amt:Math.round(kFert().cost)});save();render()}

V.k_yield=()=>{const y=kYield(),Y=S.kisan.yld;const lab={rain:'Season rainfall (mm)',n:'Nitrogen used (kg/acre)'};
 return `<div class="card"><h2>${H('Yield predictor','उपज अनुमान')}</h2>
 <p class="muted">Enter past seasons from your own records, neighbours or the district agriculture office.</p>
 <div class="row"><div><label>Year</label><input type="number" id="yy" placeholder="2023"></div><div><label>Rainfall (mm)</label><input type="number" id="yr"></div></div>
 <div class="row" style="margin-top:8px"><div><label>Nitrogen (kg/acre)</label><input type="number" id="yn"></div><div><label>Yield (q/acre)</label><input type="number" step="0.1" id="yv"></div></div>
 <div class="btns"><button onclick="kAddYld()">Add season</button></div></div>
 <div class="card"><h2>Model</h2><label>Predict yield from</label><select onchange="S.kisan.yld.xvar=this.value;save();render()"><option value="rain" ${Y.xvar==='rain'?'selected':''}>Rainfall</option><option value="n" ${Y.xvar==='n'?'selected':''}>Nitrogen used</option></select>
 ${y.reg?`<div class="eq">Yield = ${f2(y.reg.a)} ${y.reg.b>=0?'+':'−'} ${Math.abs(y.reg.b).toFixed(4)} × ${Y.xvar==='rain'?'rainfall':'N'} &nbsp; (R² = ${f2(y.reg.r2)})</div>
 <label>This season's ${lab[Y.xvar].toLowerCase()}</label><input type="number" value="${Y.xnow}" onchange="S.kisan.yld.xnow=this.value;save();render()">
 ${y.pred!=null?`<div class="alert good">Predicted yield: <b>${f1(y.pred)} q/acre</b> → ${f1(y.pred*S.kisan.farm.area)} q from ${f2(S.kisan.farm.area)} acre.</div>`:''}
 <p class="muted">R² close to 1 means the line fits the past data well. Use only within the range of past values.</p>`:'<p class="muted">Add at least 3 seasons to fit the model.</p>'}
 <canvas id="ych"></canvas></div>
 ${Y.recs.length?`<div class="card"><h2>Past seasons</h2><table><tr><th>Year</th><th class="r">Rain</th><th class="r">N</th><th class="r">Yield</th><th></th></tr>${[...Y.recs].sort((a,b)=>b.year-a.year).map(r=>`<tr><td>${esc(r.year)}</td><td class="r">${r.rain??''}</td><td class="r">${r.n??''}</td><td class="r">${r.y} q</td><td class="r"><button class="x" onclick="S.kisan.yld.recs=S.kisan.yld.recs.filter(x=>x.id!=='${r.id}');save();render()">✕</button></td></tr>`).join('')}</table></div>`:''}`};
A.k_yield=()=>{const y=kYield();if(!y.pts.length)return;const xs=y.pts.map(p=>p[0]);const x0=Math.min(...xs),x1=Math.max(...xs);
 const ser=[{pts:y.pts,color:'#3f6212',dots:1,noline:1,name:'Past seasons'}];
 if(y.reg)ser.push({pts:[[x0,y.reg.a+y.reg.b*x0],[x1,y.reg.a+y.reg.b*x1]],color:'#f59e0b',name:'Fitted line'});
 if(y.pred!=null)ser.push({pts:[[+S.kisan.yld.xnow,y.pred]],color:'#dc2626',dots:1,noline:1,name:'This season'});
 kchart('ych',ser,{xlab:v=>Math.round(v)+(S.kisan.yld.xvar==='rain'?' mm':' kg')})};
function kAddYld(){const y=$('#yy').value,r=parseFloat($('#yr').value),n=parseFloat($('#yn').value),v=parseFloat($('#yv').value);if(isNaN(v))return toast('Enter the yield');const o={id:uid(),year:y||'',y:v};if(!isNaN(r))o.rain=r;if(!isNaN(n))o.n=n;S.kisan.yld.recs.push(o);save();render();toast('Season added')}

V.k_maths=()=>`<div class="card"><h2>📐 The mathematical models</h2><p class="muted">KisanMitra runs a feedback cycle: <b>Field data → Model → Prediction → Alert → Farmer acts → New data</b>.</p></div>
<div class="card"><h2>💧 Irrigation: soil water balance (recurrence relation)</h2>
<div class="eq">Dᵣ(t+1) = min{ TAW, max[ 0, Dᵣ(t) + ETc − Rₑ − I ] }</div>
<div class="eq">ETc = Kc × ET₀ &nbsp;·&nbsp; TAW = soil water capacity × root depth &nbsp;·&nbsp; RAW = p × TAW</div>
<p class="muted">Dᵣ = water used up from the root zone (mm). Irrigate when Dᵣ ≥ RAW. Effective rain Rₑ = 0.8 × rain if rain &gt; 5 mm. Kc rises from the initial to the mid-season value and falls at maturity (linear interpolation).</p>
<div class="eq">Water to apply = Dᵣ ÷ efficiency &nbsp;·&nbsp; Litres = mm × area (m²) &nbsp;·&nbsp; Pump time = litres ÷ flow</div><p class="muted">1 mm of water on 1 m² = 1 litre. 1 acre = 4,047 m².</p></div>
<div class="card"><h2>🧪 Fertiliser: ratio and proportion</h2><div class="eq">Fertiliser (kg) = nutrient needed ÷ nutrient fraction</div><div class="eq">DAP = P ÷ 0.46, MOP = K ÷ 0.60, Urea = (N − 0.18·DAP) ÷ 0.46</div></div>
<div class="card"><h2>🌡️ Heat units (cumulative sum)</h2><div class="eq">GDD = Σ max(0, (Tmax + Tmin) ÷ 2 − T_base)</div><p class="muted">Date to reach a threshold = today + (threshold − GDD) ÷ average daily GDD of the last week.</p></div>
<div class="card"><h2>🌾 Yield: linear regression</h2><div class="eq">ŷ = a + b·x, &nbsp; b = [nΣxy − ΣxΣy] ÷ [nΣx² − (Σx)²]</div><div class="eq">R² = 1 − Σ(y − ŷ)² ÷ Σ(y − ȳ)²</div></div>
<div class="card"><h2>📈 Mandi price: moving average, trend, optimisation</h2><div class="eq">Moving average = (p₁ + p₂ + p₃ + p₄) ÷ 4</div><div class="eq">Income(m) = (p₀ + s·m) × Q(1 − ℓm) − c·Q·m</div><p class="muted">s = price trend per month (regression), ℓ = storage loss per month, c = storage cost. The app picks the month m (0–4) with the highest income.</p></div>
<div class="card"><h2>💰 Profit, break-even and loans</h2><div class="eq">Profit = Y × A × P − C &nbsp;·&nbsp; Break-even yield = C ÷ (P × A)</div><div class="eq">EMI = P·r(1+r)ⁿ ÷ [(1+r)ⁿ − 1]</div></div>
<div class="card"><h2>✔️ Checking the models</h2><div class="eq">Error % = |predicted − actual| ÷ actual × 100</div><p class="muted">Compare predicted irrigation dates with when the field actually looked dry (or soil-moisture sensor readings), predicted yield with the real harvest, and predicted prices with real mandi rates.</p></div>
<div class="card"><p class="muted">Crop factors, nutrient doses and pest windows are typical textbook values for guidance. Always follow your Soil Health Card, the Krishi Vigyan Kendra (KVK) and local agriculture officers.</p></div>`;

/* ================= Demo ================= */
function kDemo(quiet){const t=dnum(today());S.kisan=KDEF();
 S.kisan.farm={name:'Ramesh Pradhan',village:'Dera',crop:'paddy',area:2,sow:dstr(t-52),soil:'loam',method:'flood',flow:500,hp:3,npk:null};
 // weather log + irrigations applied whenever the model said so (farmer following the app)
 const rains={[t-50]:18,[t-44]:32,[t-43]:12,[t-35]:25,[t-27]:40,[t-26]:15,[t-15]:22,[t-6]:8};
 const C=CROPS.paddy,TAW=SOILS.loam[1]*C.root,RAW=C.p*TAW,eff=METHODS.flood[1];let Dr=0;const sow=t-52;
 for(let d=sow;d<=t;d++){const e={date:dstr(d)};if(rains[d])e.rain=rains[d];if((t-d)%2===0){e.tmax=31+((t-d)%5)*0.6;e.tmin=20+((t-d)%3)*0.7}
  const kc=kKcAt(d-sow),et=kc*ET0N[monthOf(d)];Dr=Math.min(TAW,Math.max(0,Dr+et-kEffRain(rains[d]||0)));
  if(Dr>=RAW&&d<t-1){const g=Math.round(Dr/eff);e.irr=g;Dr=Math.max(0,Dr-g*eff)}
  if(Object.keys(e).length>1)S.kisan.log.push(e)}
 S.kisan.fert.done=['basal@'+S.kisan.farm.sow,'top1@'+S.kisan.farm.sow];
 S.kisan.yld.recs=[{id:uid(),year:2019,rain:1180,n:28,y:16.5},{id:uid(),year:2020,rain:1420,n:30,y:19.8},{id:uid(),year:2021,rain:1050,n:30,y:15.2},{id:uid(),year:2022,rain:1510,n:32,y:20.6},{id:uid(),year:2023,rain:1290,n:32,y:18.1},{id:uid(),year:2024,rain:1360,n:33,y:19.0}];S.kisan.yld.xnow=1340;
 const base=2150;for(let k=0;k<10;k++)S.kisan.market.prices.push({id:uid(),date:dstr(t-63+k*7),price:Math.round(base+k*14+((k*37)%25)-12)});
 S.kisan.market.qty=40;S.kisan.market.store=12;S.kisan.market.loss=0.8;
 S.kisan.money.costs=[['Seed',3200],['Land rent',0],['Labour',14000],['Machinery / tractor',6000],['Irrigation / diesel',2500],['Pesticide',1800]].filter(x=>x[1]).map(([c,a],i)=>({id:uid(),date:dstr(t-52+i*6),cat:c,amt:a}));
 S.kisan.money.costs.push({id:uid(),date:dstr(t-52),cat:'Fertiliser',amt:Math.round(kFert().cost)});
 if(!quiet){S.addons.on.kisan=true;save();toast('KisanMitra demo loaded');go('k_home')}}

V.k_more=()=>`<div class="card"><h2>More · और</h2>
 <button class="tile" onclick="go('k_yield')"><span class="i">🌾</span><span>Yield predictor · उपज अनुमान<small>Regression on past seasons</small></span></button>
 <button class="tile" onclick="go('k_maths')"><span class="i">📐</span><span>How it works (the maths)<small>Every model and equation</small></span></button>
 <button class="tile" onclick="addonDemo('kisan')"><span class="i">🧪</span><span>Load KisanMitra demo<small>A 2-acre paddy farm on day 52</small></span></button>
 <button class="tile" onclick="go('home')"><span class="i">🏠</span><span>Back to GharMitra</span></button></div>`;
ADDON_REG.kisan={def:KDEF,demo:kDemo,sum(){const mm=kMoney(),cs=kCropState(),C=kCrop();const months=C.len.reduce((a,b)=>a+b,0)/30;return{income:mm.profit!=null&&mm.tot>0?mm.profit/months:0,line:cs&&!cs.notSown?`${C.n.split(' ·')[0]} · day ${Math.min(cs.das,cs.dur)} of ${cs.dur}${mm.profit!=null&&mm.tot?' · season profit '+inr(mm.profit):''}`:'Set up your farm to start',alerts:kAlerts()}}};
