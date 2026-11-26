ADDON_REG.yaad={def:()=>({items:[]}),
demo(f){const Y=S.yaad;if(Y.items.length&&!f)return;const t=dnum(today());Y.items=[{id:'y1',t:'Pay electricity bill',every:30,next:t+3},{id:'y2',t:'Medicine refill',every:30,next:t+9},{id:'y3',t:'Insurance premium',every:365,next:t+60}]},
sum(){const l=yaList().filter(x=>x.d<=2);return{income:0,line:l.length?l.length+' due soon':'Nothing due',alerts:l.slice(0,3).map(x=>[x.d<0?'bad':'warn','⏰',esc(x.t)+(x.d<0?' (overdue)':x.d==0?' today':' in '+x.d+' days')])}}};
function yaList(){const now=dnum(today()),o=[],r=[...S.elec.readings].sort((a,b)=>a.date<b.date?-1:1),last=r[r.length-1];
 if(!last||now-dnum(last.date)>=3)o.push({k:'meter',t:'Take the electricity meter reading',d:last?dnum(last.date)+3-now:0,auto:1});
 const l=lpgModel();if(l&&l.emptyDay)o.push({k:'gas',t:'Book a gas cylinder (about '+f1(l.daysLeft)+' days left)',d:l.emptyDay-3-now,auto:1});
 ((S.guests&&S.guests.v)||[]).filter(x=>x.act==null&&dnum(x.start)>=now).forEach(x=>o.push({k:'g'+x.id,t:'Guests arriving: '+(x.name||'visit'),d:dnum(x.start)-now,auto:1}));
 S.yaad.items.forEach(x=>o.push({t:x.t,d:x.next-now,id:x.id}));return o.sort((a,b)=>a.d-b.d)}
V.y_home=()=>{const l=yaList(),P=[['Pay electricity bill',30],['Medicine refill',30],['Insurance premium',365],['Water tank cleaning',90]];
return `<div class="card"><h2>⏰ Smart reminders</h2>${yaN()}${l.map(x=>`<div class="alert ${x.d<0?'bad':x.d<=3?'warn':'info'}"><b>${esc(x.t)}</b><br><span class="muted">${x.d<0?'Overdue by '+(-x.d)+' days':x.d==0?'Due today':'Due in '+x.d+' days'}${x.auto?' · automatic':''}</span>${x.id?`<div class="btns"><button class="small" onclick="yaDone('${x.id}')">Done</button><button class="small ghost" onclick="yaDel('${x.id}')">Delete</button></div>`:''}</div>`).join('')||'<div class="alert good">✅ Nothing due.</div>'}
<p class="muted">Reminders also appear on the Home screen. Meter, gas and guest reminders are created automatically.</p></div>
<div class="card"><h2>Add a reminder</h2><div class="btns">${P.map(p=>`<button class="small ghost" onclick="yaAdd('${p[0]}',${p[1]},7)">+ ${p[0]}</button>`).join('')}</div>
<label>Custom reminder</label><input id="yt" placeholder="e.g. School fees"><div class="row"><div><label>First due</label><input type="date" id="yd" value="${dstr(dnum(today())+7)}"></div><div><label>Repeat every (days, 0 = once)</label><input type="number" id="ye" value="30"></div></div><div class="btns"><button onclick="yaCustom()">Save reminder</button></div></div>`};
function yaAdd(t,e,d){S.yaad.items.push({id:uid(),t,every:e,next:dnum(today())+d});save();render();yaSync()}
function yaCustom(){const t=$('#yt').value.trim();if(!t)return toast('Enter a reminder');S.yaad.items.push({id:uid(),t,every:+$('#ye').value||0,next:dnum($('#yd').value)});save();render();yaSync()}
function yaDone(id){const x=S.yaad.items.find(a=>a.id===id);if(!x)return;if(x.every>0){x.next+=x.every;if(x.next<=dnum(today()))x.next=dnum(today())+x.every}else S.yaad.items=S.yaad.items.filter(a=>a.id!==id);save();render();yaSync()}
function yaDel(id){S.yaad.items=S.yaad.items.filter(y=>y.id!==id);save();render();yaSync()}
function yaN(){const N=window.GMNotify;return N?(N.hasPermission()?'<div class="alert good">🔔 Phone notifications are on: 6 pm the day before and 9 am on the due day.</div>':'<div class="alert warn">🔔 Phone notifications are off.<div class="btns"><button class="small" onclick="GMNotify.requestPermission();setTimeout(()=>{yaSync();render()},4000)">Enable notifications</button></div></div>'):'<div class="alert info">🔔 Phone notifications need the updated GharMitra app. Until then, reminders show inside the app.</div>'}
function yaSync(){const N=window.GMNotify;if(!N)return;try{(N.cancelPrefix?N.cancelPrefix('ya_'):N.cancelAll());const now=dnum(today()),at=(n,h)=>new Date(dstr(n)+'T'+h+':00:00').getTime();
 for(const x of yaList()){const k=x.k||x.id,due=now+x.d,t='⏰ '+x.t.replace(/\n/g,' ');if(x.d>=0)N.schedule('ya_'+k+'_d',t,'Due today',at(due,'09'));if(x.d>=1)N.schedule('ya_'+k+'_e',t,'Due tomorrow',at(due-1,'18'))}}catch(e){}}
setTimeout(yaSync,2000);
