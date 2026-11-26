ADDON_REG.salah={def:()=>({}),demo(){},
sum(){const a=slAdv();return{income:0,line:a.length?a.length+' tips this month':'Add expenses',alerts:a.filter(x=>x[0]==='bad'||x[0]==='warn').slice(0,1)}}};
function slAdv(){const B=budgetModel(),t=today(),pd=new Date();pd.setDate(0);const pm=pd.getFullYear()+'-'+String(pd.getMonth()+1).padStart(2,'0'),prev={},a=[];
 for(const x of S.budget.exp)if(x.date.slice(0,7)===pm)prev[x.cat]=(prev[x.cat]||0)+x.amt;
 if(!(B.inc>0)||!B.tot)return a;const day=Number(t.slice(8)),dim=daysInMonth(t),sv=B.inc-B.proj,rate=sv/B.inc;
 if(rate<0)a.push(['bad','🚨','At this pace you will overspend your income by '+inr(-sv)+' this month. Cut non-essentials now.']);
 else if(rate<.2)a.push(['warn','💡','You are on track to save '+Math.round(rate*100)+'% of income. Saving 20% needs about '+inr(B.inc*.2-sv)+' less spending this month.']);
 else a.push(['good','✅','Great: you are on track to save '+Math.round(rate*100)+'% of income ('+inr(sv)+').']);
 let top=null;for(const c in B.by){const p=prev[c]||0,pr=B.by[c]/day*dim;if(p>300&&pr>p*1.15&&(!top||pr-p>top.d))top={c,d:pr-p,p:Math.round((pr/p-1)*100)}}
 if(top)a.push(['warn','📈',top.c+' is heading '+inr(top.d)+' ('+top.p+'%) higher than last month.']);
 const big=Object.entries(B.by).sort((x,y)=>y[1]-x[1])[0];if(big&&big[1]/B.tot>.4)a.push(['info','🔎',big[0]+' is '+Math.round(big[1]/B.tot*100)+'% of your spending. A 10% cut here saves about '+inr(big[1]/day*dim*.1)+' a month.']);
 if(sv>0)a.push(['info','🛟','Moving '+inr(sv)+' a month into your emergency fund builds 6 months of expenses in about '+Math.ceil(6*B.proj/sv)+' months.']);
 return a}
V.c_home=()=>{const a=slAdv();return `<div class="card"><h2>💡 Your money coach <span class="pill">${MON[new Date().getMonth()]}</span></h2>${a.length?a.map(x=>`<div class="alert ${x[0]}">${x[1]} ${x[2]}</div>`).join(''):'<div class="alert info">Add your income and expenses in GharMitra → Money. The coach reads them and gives advice in plain language.</div>'}<p class="muted">Advice updates as you log expenses. It compares this month's pace with your income and with last month.</p></div>`};
