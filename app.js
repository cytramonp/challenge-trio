const people=[{id:'sergey',name:'Сергей',goal:'Снижение веса',start:90,target:80,unit:'кг',step:.1,min:40,max:200,color:'#c94437'},{id:'anton',name:'Антон',goal:'Подтягивания',start:8,target:20,unit:'раз',step:1,min:0,max:100,color:'#1671bb'},{id:'diman',name:'Диман',goal:'Жим лёжа',start:85,target:100,unit:'кг',step:2.5,min:0,max:300,color:'#a16b06'}];
const START='2026-10-06',END='2026-12-06';
const $=s=>document.querySelector(s),fmt=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n),dateLabel=d=>new Date(d+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'short',timeZone:'America/Los_Angeles'}),today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'}),pct=(p,v)=>Math.max(0,Math.min(100,(v-p.start)/(p.target-p.start)*100));
let entries=[],selected='sergey',filter='sergey',editing=null,loaded=false,saving=false;
const current=p=>entries.filter(e=>e.person===p.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3500)}
function render(){
 const now=today(),days=Math.max(0,Math.ceil((Date.parse(END)-Date.parse(now))/86400000));
 $('#phase').textContent=now<START?'Старт 6 октября':now>END?'Челлендж завершён':'День '+(Math.floor((Date.parse(now)-Date.parse(START))/86400000)+1)+' из 62';
 $('#lanes').innerHTML=people.map(p=>{const progress=Math.round(pct(p,current(p)?.value??p.start));return `<div class="lane" style="--color:${p.color};--progress:${progress}%"><span class="lane-label"><i class="avatar ${p.id}" aria-hidden="true"></i>${p.name}</span><div class="lane-track"><div class="lane-fill"></div><i class="runner"></i></div><span class="lane-percent">${progress}%</span></div>`}).join('');
 $('#tabs').innerHTML=people.map(p=>`<button class="${selected===p.id?'active':''}" data-tab="${p.id}" aria-pressed="${selected===p.id}">${p.name}</button>`).join('');
 $('#athletes').innerHTML=people.map(p=>{const e=current(p),v=e?.value??p.start,progress=Math.round(pct(p,v)),remaining=Math.abs(p.target-v);return `<article class="athlete mine ${selected===p.id?'active':''}" style="--color:${p.color};--progress:${progress}%"><div class="portrait ${p.id}"><img class="portrait-photo" src="./${p.id}-photo.png" alt="${p.name} на фоне ${p.id==='anton'?'турников':p.id==='diman'?'жимовой скамьи':'спортзала'}" width="1536" height="1024"><div class="portrait-name"><h3>${p.name}</h3><p>${p.goal}</p></div></div><div class="card-details"><div class="metric"><strong>${fmt(v)}</strong><span>${p.unit}</span><span class="target">цель <b>${p.target}</b></span></div><div class="progress-bar" role="progressbar" aria-label="Прогресс ${p.name}" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><i></i></div><div class="progress-meta"><span>Старт ${p.start} ${p.unit}</span><b>${progress}% пути</b></div><p class="card-message">${progress===100?'Цель достигнута. Вот это движение!':e?`До цели ${fmt(remaining)} ${p.unit}. Последний замер: ${dateLabel(e.date)}`:'Всё начинается с первой отметки.<br>Твой следующий шаг уже считается.'}</p><button class="card-button" data-edit="${p.id}">+ Записать результат</button></div></article>`}).join('');
 $('#filters').innerHTML=people.map(p=>`<button data-filter="${p.id}" class="${filter===p.id?'active':''}" aria-pressed="${filter===p.id}">${p.name}</button>`).join('');
 renderCalendar();renderChart();renderHistory();
}
function renderCalendar(){
 const p=people.find(p=>p.id===filter);$('#calendar').innerHTML='<div class="months">'+[9,10,11].map(month=>{let cells='';const first=new Date(Date.UTC(2026,month,1)),count=new Date(Date.UTC(2026,month+1,0)).getUTCDate(),offset=(first.getUTCDay()+6)%7;for(let i=0;i<offset;i++)cells+='<span></span>';for(let d=1;d<=count;d++){const date=`2026-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,e=entries.find(e=>e.person===filter&&e.date===date),inRange=date>=START&&date<=END,progress=e?pct(p,e.value):0,bg=e?`color-mix(in srgb, ${p.color} ${Math.round(22+progress*.78)}%, #f4f6f8)`:'',color=e&&progress>50?'white':'';cells+=inRange?`<button class="day ${date===today()?'today':''} ${date>today()?'future':''}" data-day="${date}" style="background:${bg};color:${color}" aria-label="${dateLabel(date)}: ${e?fmt(e.value)+' '+p.unit:'нет записи'}">${d}</button>`:`<span class="day blank"></span>`}return `<div class="month"><span class="month-title">${['Октябрь','Ноябрь','Декабрь'][month-9]}</span><div class="weekdays">${['пн','вт','ср','чт','пт','сб','вс'].map(d=>`<span>${d}</span>`).join('')}</div><div class="days">${cells}</div></div>`}).join('')+'</div>';
 const swatches=$('.legend').querySelectorAll('i');swatches.forEach((el,i)=>el.style.background=`color-mix(in srgb, ${p.color} ${i?i*24:10}%, #f4f6f8)`);
}
function renderHistory(){const sorted=[...entries].sort((a,b)=>b.date.localeCompare(a.date)||b.at-a.at);$('#history').innerHTML=sorted.length?sorted.slice(0,30).map(e=>{const p=people.find(p=>p.id===e.person);return `<button class="history-row" data-edit="${e.person}" data-date="${e.date}" style="--color:${p.color}"><i class="history-dot"></i><b>${p.name}</b><span class="history-body"><strong>${fmt(e.value)} ${p.unit}</strong>${e.comment?`<span class="comment">${escape(e.comment)}</span>`:''}</span><time>${dateLabel(e.date)}</time><span class="edit-hint">Изменить</span></button>`}).join(''):'<p class="empty">Здесь появятся ваши замеры и комментарии. Первая запись станет началом истории.</p>'}
function renderChart(){
 const svg=$('#progress-chart');if(!svg)return;const W=960,H=270,left=44,right=930,top=20,bottom=222,x=d=>left+(Date.parse(d)-Date.parse(START))/(Date.parse(END)-Date.parse(START))*(right-left),y=v=>bottom-v/100*(bottom-top);
 let content=[0,25,50,75,100].map(v=>`<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}" stroke="#e5ebef" stroke-dasharray="${v===100?'5 5':'0'}"./><text x="32" y="${y(v)+4}" text-anchor="end" fill="#73828c" font-size="11">${v}%</text>`).join('');
 [START,'2026-10-22','2026-11-06','2026-11-21',END].forEach(d=>content+=`<text x="${x(d)}" y="250" text-anchor="${d===START?'start':d===END?'end':'middle'}" fill="#73828c" font-size="11">${dateLabel(d)}</text>`);
 for(const p of people){let data=entries.filter(e=>e.person===p.id).sort((a,b)=>a.date.localeCompare(b.date));if(!data.some(e=>e.date===START))data=[{date:START,value:p.start,baseline:true},...data];let points=data.map(e=>`${x(e.date)},${y(pct(p,e.value))}`).join(' ');content+=`<polyline class="chart-line" fill="none" stroke="${p.color}" stroke-width="2.5" stroke-linejoin="round" points="${points}"./>`;for(const e of data)content+=`<circle tabindex="0" data-chart-person="${p.id}" data-chart-date="${e.date}" cx="${x(e.date)}" cy="${y(pct(p,e.value))}" r="${e.baseline?3:5}" fill="${p.color}" stroke="white" stroke-width="2"><title>${p.name}: ${dateLabel(e.date)} · ${fmt(e.value)} ${p.unit} · ${Math.round(pct(p,e.value))}%${e.comment?' · '+escape(e.comment):''}</title></circle>`}
 svg.innerHTML=content;$('#chart-empty').hidden=entries.length>0;
}
async function load(silent=false){if(saving)return;try{const r=await fetch('https://challenge-trio-api-production.up.railway.app/api/progress',{cache:'no-store'});if(!r.ok)throw Error();const data=await r.json();entries=data.entries;loaded=true;render();$('#sync').textContent='Синхронизировано';$('#sync').style.color='';}catch{$('#sync').textContent='Нет связи · повторить ниже';$('#sync').style.color='#b54735';if(!silent)toast('Не удалось загрузить результаты. Нажми «Обновить».')}}
function openEntry(id,date){if(!loaded){toast('Сначала дождитесь загрузки результатов.');return}editing=people.find(p=>p.id===id);const p=editing,d=date||[END,today()].sort()[0],entry=entries.find(e=>e.person===id&&e.date===d);$('#entry-title').textContent=p.name+' · результат';$('#entry-goal').textContent=p.goal+': '+p.start+' → '+p.target+' '+p.unit;$('#entry-date').value=d<START?START:d;$('#entry-date').max=today()<END?today():END;$('#entry-value').min=p.min;$('#entry-value').max=p.max;$('#entry-value').step=p.id==='anton'?1:.1;$('#entry-value').value=entry?.value??current(p)?.value??p.start;$('#entry-unit').textContent='('+p.unit+')';$('#entry-comment').value=entry?.comment||'';$('#form-error').textContent=today()<START?'Первая отметка доступна 6 октября, в день старта.':'';$('#save').disabled=today()<START;$('#entry-dialog').showModal()}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.tab){selected=b.dataset.tab;render()}if(b.dataset.filter){filter=b.dataset.filter;render();$('#day-detail').textContent='Нажми на день, чтобы увидеть результат.'}if(b.dataset.edit)openEntry(b.dataset.edit,b.dataset.date);if(b.dataset.day){const p=people.find(p=>p.id===filter),entry=entries.find(e=>e.person===filter&&e.date===b.dataset.day);$('.day.selected')?.classList.remove('selected');b.classList.add('selected');$('#day-detail').textContent=`${p.name}, ${dateLabel(b.dataset.day)}: ${entry?fmt(entry.value)+' '+p.unit+' · '+Math.round(pct(p,entry.value))+'% пути'+(entry.comment?' · '+entry.comment:''):'нет записи'}`;if(b.dataset.day<=today()&&b.dataset.day>=START)openEntry(filter,b.dataset.day)}});
$('#close-dialog').onclick=()=>{if(!saving)$('#entry-dialog').close()};$('#entry-dialog').addEventListener('cancel',e=>{if(saving)e.preventDefault()});$('#entry-dialog').addEventListener('click',e=>{if(e.target===$('#entry-dialog')&&!saving){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
for(const [id,sign]of [['minus',-1],['plus',1]])$('#'+id).onclick=()=>{const p=editing,v=Number($('#entry-value').value);$('#entry-value').value=Math.min(p.max,Math.max(p.min,Math.round((v+sign*p.step)*10)/10))};
$('#entry-date').onchange=()=>{const e=entries.find(e=>e.person===editing.id&&e.date===$('#entry-date').value);if(e){$('#entry-value').value=e.value;$('#entry-comment').value=e.comment||''}else $('#entry-comment').value=''};
$('#entry-form').onsubmit=async event=>{event.preventDefault();if(saving)return;saving=true;$('#save').disabled=true;$('#save').textContent='Сохраняем…';$('#form-error').textContent='';const payload={person:editing.id,date:$('#entry-date').value,value:Number($('#entry-value').value),comment:$('#entry-comment').value};try{const r=await fetch('https://challenge-trio-api-production.up.railway.app/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw Error(data.error||'Не удалось сохранить');entries=entries.filter(e=>e.person!==payload.person||e.date!==payload.date);entries.push(data.entry);selected=payload.person;filter=payload.person;render();$('#entry-dialog').close();toast(pct(editing,payload.value)>=100?'Цель достигнута! Отличная работа.':'Записано. Ещё один шаг вперёд.');}catch(e){$('#form-error').textContent=e.message==='Failed to fetch'?'Нет связи. Результат не сохранён, попробуйте ещё раз.':e.message}finally{saving=false;$('#save').disabled=false;$('#save').textContent='Сохранить результат'}};
$('#refresh').onclick=()=>load();document.addEventListener('visibilitychange',()=>{if(!document.hidden)load(true)});setInterval(()=>{if(!document.hidden&&!$('#entry-dialog').open)load(true)},60000);
const musicAudio=$('#motivation-audio'),musicButton=$('#music');
let musicPending=false;
function syncMusic(){
 const playing=!musicAudio.paused&&!musicAudio.ended;
 musicButton.setAttribute('aria-pressed',String(playing));
 musicButton.classList.toggle('playing',playing);
 $('#music-label').textContent=playing?'Поставить на паузу':'Замотивируй меня';
}
for(const event of ['playing','pause','ended'])musicAudio.addEventListener(event,syncMusic);
musicAudio.addEventListener('error',()=>{syncMusic();toast('Не удалось загрузить музыку. Попробуйте ещё раз.')});
musicButton.onclick=async()=>{
 if(musicPending)return;
 if(!musicAudio.paused){musicAudio.pause();return}
 musicPending=true;musicButton.setAttribute('aria-busy','true');
 try{if(musicAudio.ended)musicAudio.currentTime=0;await musicAudio.play()}
 catch{syncMusic();toast('Не удалось включить музыку. Нажмите ещё раз.')}
 finally{musicPending=false;musicButton.removeAttribute('aria-busy')}
};

render();load();

// Finish at the end of December 6 in the challenge's Los Angeles timezone.
const finishAt=Date.parse('2026-12-07T00:00:00-08:00');
function updateCountdown(){
 const remaining=Math.max(0,Math.floor((finishAt-Date.now())/1000));
 const values=[Math.floor(remaining/86400),Math.floor(remaining/3600)%24,Math.floor(remaining/60)%60,remaining%60];
 document.querySelectorAll('#finish-clock b').forEach((el,i)=>el.textContent=String(values[i]).padStart(2,'0'));
 if(!remaining)document.querySelector('#finish-clock').setAttribute('aria-label','Челлендж завершён');
}
updateCountdown();setInterval(updateCountdown,1000);
