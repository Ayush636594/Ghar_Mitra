ADDON_REG.utsav={def:()=>({ev:[]}),
demo(f){const U=S.utsav;if(U.ev.length&&!f)return;U.ev=[{id:'e1',name:'Diwali family dinner',date:dstr(dnum(today())+21),guests:15,pg:250,fixed:4000,saved:3000,items:[{id:'i1',n:'Sweets',a:1800}]}]},
sum(){const up=utNext();if(!up)return{income:0,line:'No event planned',alerts:[]};const m=utM(up);return{income:0,line:esc(up.name)+' in '+m.days+' days',alerts:m.gap>0&&m.days<=30?[['warn','🎉','Save about '+inr(m.perWeek)+'/week for '+esc(up.name)]]:[]}}};
function utNext(){return S.utsav.ev.filter(e=>dnum(e.date)>=dnum(today())).sort((a,b)=>a.date<b.date?-1:1)[0]}
function utM(e){const G=(S.guests&&S.guests.a)||{eu:1.5,lg:.12,lpg:900},days=Math.max(0,dnum(e.date)-dnum(today())),w=e.guests;
 const extra=w*2*(G.eu*5.7+G.lg*G.lpg/14.2),est=w*e.pg+e.fixed+extra,spent=e.items.reduce((a,x)=>a+x.a,0),gap=Math.max(0,est-e.saved);
 return{days,extra,est,spent,gap,perWeek:gap/Math.max(1,days/7),ratio:S.budget.income?est/S.budget.income:0}}
V.u_home=()=>{const ev=[...S.utsav.ev].sort((a,b)=>a.date<b.date?-1:1);
return `<div class="card"><h2>🎉 Plan an event or festival</h2><label>Event name</label><input id="un" placeholder="e.g. Diwali, wedding, birthday">
<div class="row"><div><label>Date</label><input type="date" id="ud" value="${dstr(dnum(today())+14)}"></div><div><label>Guests</label><input type="number" id="ug" value="10"></div></div>
<div class="row"><div><label>Food/sweets per guest (₹)</label><input type="number" id="up" value="250"></div><div><label>Fixed costs: decor, clothes (₹)</label><input type="number" id="uf" value="3000"></div></div>
<label>Already set aside (₹)</label><input type="number" id="us" value="0"><div class="btns"><button onclick="utAdd()">Plan event</button></div></div>
${ev.map(e=>{const m=utM(e),vd=m.ratio>.5?'bad':m.ratio>.3?'warn':'good';return `<div class="card"><h2>${esc(e.name)} <span class="pill">${m.days} days · ${pretty(e.date)}</span></h2>
<div class="stats"><div class="stat"><div class="k">Estimated cost</div><div class="v">${inr(m.est)}</div></div><div class="stat"><div class="k">Still to arrange</div><div class="v">${inr(m.gap)}</div></div><div class="stat"><div class="k">Save per week</div><div class="v">${inr(m.perWeek)}</div></div><div class="stat"><div class="k">Spent so far</div><div class="v">${inr(m.spent)}</div></div></div>
<div class="alert ${vd}">💰 This event is ${Math.round(m.ratio*100)}% of a month's income. ${vd==='good'?'Comfortable.':vd==='warn'?'Plan it with care.':'Very heavy: reduce guests or cost per guest.'} It includes about ${inr(m.extra)} of extra power and gas.</div>
${e.items.map(x=>`<div class="muted">• ${esc(x.n)}: ${inr(x.a)}</div>`).join('')}
<div class="row"><div><input id="in_${e.id}" placeholder="Item bought"></div><div><input type="number" id="ia_${e.id}" placeholder="₹"></div></div>
<div class="btns"><button class="small" onclick="utItem('${e.id}')">Add expense</button><button class="small ghost" onclick="S.utsav.ev=S.utsav.ev.filter(x=>x.id!=='${e.id}');save();render()">Delete</button></div></div>`}).join('')||'<div class="alert info">No events yet. Plan your first one above.</div>'}`};
function utAdd(){const n=$('#un').value.trim();if(!n){toast('Enter a name');return}S.utsav.ev.push({id:uid(),name:n,date:$('#ud').value,guests:+$('#ug').value||1,pg:+$('#up').value||0,fixed:+$('#uf').value||0,saved:+$('#us').value||0,items:[]});save();render()}
function utItem(id){const e=S.utsav.ev.find(x=>x.id===id),a=+$('#ia_'+id).value,n=$('#in_'+id).value.trim()||'Item';if(e&&a>0){e.items.push({id:uid(),n,a});save();render()}}
