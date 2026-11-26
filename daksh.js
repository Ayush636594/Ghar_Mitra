ADDON_REG.daksh={def:()=>({size:4,snap:[]}),
demo(f){const D=S.daksh;if(D.snap.length&&!f)return;D.size=4;D.snap=[{m:'2026-09',s:64},{m:'2026-10',s:71}]},
sum(){const k=dkM();return{income:0,line:k?'Score '+k.tot+'/100':'Add data',alerts:k&&k.tot<50?[['warn','⭐','Home efficiency score is '+k.tot+'. Weakest area: '+k.worst.n]]:[]}}};
function dkM(){const n=Math.max(1,S.daksh.size),e=elecModel(),l=lpgModel(),B=budgetModel(),c=[],sc=(v,g,b)=>Math.round(Math.max(0,Math.min(100,100*(b-v)/(b-g))));
 if(e)c.push({n:'Electricity',s:sc(e.rate/n,1.5,3),v:f2(e.rate/n)+' units/person/day',tip:'Run fans and lights only where needed and switch off standby devices.'});
 if(l&&l.rate)c.push({n:'Cooking gas',s:sc(l.rate/n,.1,.25),v:f2(l.rate/n)+' kg/person/day',tip:'Use pressure cookers, cover pans and soak pulses.'});
 c.push({n:'Water',s:sc(S.water.use/n,135,250),v:Math.round(S.water.use/n)+' L/person/day',tip:'Fix leaks and use a bucket instead of a running tap or shower.'});
 if(B.inc>0&&B.tot>0){const r=(B.inc-B.proj)/B.inc;c.push({n:'Savings',s:Math.round(Math.max(0,Math.min(100,r/.2*100))),v:Math.round(r*100)+'% of income saved',tip:'Move 20% of income into savings at the start of the month.'})}
 const tot=Math.round(c.reduce((a,x)=>a+x.s,0)/c.length);return{c,tot,worst:c.slice().sort((a,b)=>a.s-b.s)[0]}}
V.d_home=()=>{const D=S.daksh,k=dkM(),g=k.tot>=80?'Excellent':k.tot>=60?'Good':k.tot>=40?'Fair':'Needs work',hs=[...D.snap].sort((a,b)=>a.m<b.m?-1:1),badge=hs.length>=3&&hs.slice(-3).every(x=>x.s>=70);
return `<div class="card"><h2>⭐ Home efficiency score</h2><label>People living in the home</label><input type="number" value="${D.size}" onchange="S.daksh.size=+this.value||1;save();render()">
<div class="big">${k.tot}/100</div><p class="muted" style="text-align:center">${g}${badge?' · 🏅 Efficient Home badge':''}</p>
${k.c.map(x=>`<div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:14px"><b>${x.n}</b><span>${x.v} · ${x.s}</span></div><div style="background:#e2e8f0;border-radius:6px;height:10px"><div style="width:${x.s}%;height:10px;border-radius:6px;background:${x.s>=70?'#16a34a':x.s>=40?'#f59e0b':'#dc2626'}"></div></div></div>`).join('')}
<div class="alert info">💡 Weakest area: <b>${k.worst.n}</b>. ${k.worst.tip}</div>
<div class="btns"><button onclick="dkSave()">Save this month's score</button></div></div>
${hs.length?`<div class="card"><h2>Your history</h2>${hs.map(x=>`<div class="muted">${x.m}: <b>${x.s}</b>/100</div>`).join('')}<p class="muted">Score 70+ for 3 months in a row to earn the badge.</p></div>`:''}`};
function dkSave(){const k=dkM(),m=today().slice(0,7),D=S.daksh;D.snap=D.snap.filter(x=>x.m!==m);D.snap.push({m,s:k.tot});save();render();toast('Score saved')}
