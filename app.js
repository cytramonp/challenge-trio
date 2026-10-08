import {requestProgress} from './progress-client.js';
import {createLocalState} from './local-state.js';
const people=[{id:'sergey',name:'Сергей',goal:'Снижение веса',start:90,target:80,unit:'кг',step:.1,min:40,max:200,color:'#c94437'},{id:'anton',name:'Антон',goal:'Подтягивания',start:8,target:20,unit:'раз',step:1,min:0,max:100,color:'#1671bb'},{id:'diman',name:'Диман',goal:'Жим лёжа',start:85,target:100,unit:'кг',step:2.5,min:0,max:300,color:'#a16b06'}];
const START='2026-10-06',END='2026-12-06';
const $=s=>document.querySelector(s),fmt=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n),dateLabel=d=>new Date(d+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'short',timeZone:'America/Los_Angeles'}),today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`},pct=(p,v)=>Math.max(0,Math.min(100,(v-p.start)/(p.target-p.start)*100));
let storage;try{storage=localStorage}catch{}
const local=createLocalState(storage),cached=local.cache();
let history=cached?.history||cached?.entries||[];
let entries=cached?.entries||[],selected='sergey',filter='sergey',editing=null,loaded=Boolean(cached?.complete),saving=false,loading=false,revision=0;
const current=p=>entries.filter(e=>e.person===p.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3500)}
function render(){
 const now=today(),days=Math.max(0,Math.ceil((Date.parse(END)-Date.parse(now))/86400000));
 $('#phase').textContent=now<START?'Старт 6 октября':now>END?'Челлендж завершён':'День '+(Math.floor((Date.parse(now)-Date.parse(START))/86400000)+1)+' из 62';
 $('#lanes').innerHTML=people.map(p=>{const progress=Math.round(pct(p,current(p)?.value??p.start));return `<div class="lane" style="--color:${p.color};--progress:${progress}%"><span class="lane-label"><i class="avatar ${p.id}" aria-hidden="true"></i>${p.name}</span><div class="lane-track"><div class="lane-fill"></div><i class="runner"></i></div><span class="lane-percent">${loaded||current(p)?progress+'%':'—'}</span></div>`}).join('');
 $('#tabs').innerHTML=people.map(p=>`<button class="${selected===p.id?'active':''}" data-tab="${p.id}" aria-pressed="${selected===p.id}">${p.name}</button>`).join('');
 $('#athletes').innerHTML=people.map(p=>{const e=current(p),v=e?.value??p.start,progress=Math.round(pct(p,v)),remaining=Math.abs(p.target-v);return `<article class="athlete mine ${selected===p.id?'active':''}" style="--color:${p.color};--progress:${progress}%"><div class="portrait ${p.id}"><img class="portrait-photo" src="./${p.id}-photo.png" alt="${p.name} на фоне ${p.id==='anton'?'турников':p.id==='diman'?'жимовой скамьи':'спортзала'}" width="1536" height="1024"><div class="portrait-name"><h3>${p.name}</h3><p>${p.goal}</p></div></div><div class="card-details"><div class="metric"><strong>${loaded||e?fmt(v):'—'}</strong><span>${p.unit}</span><span class="target">цель <b>${p.target}</b></span></div><div class="progress-bar" role="progressbar" aria-label="Прогресс ${p.name}" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><i></i></div><div class="progress-meta"><span>Старт ${p.start} ${p.unit}</span><b>${loaded||e?progress+'% пути':'Нет данных'}</b></div><p class="card-message">${!loaded&&!e?'Результаты ещё не загружены. Это не сброс прогресса.':progress===100?'Цель достигнута. Вот это движение!':e?`До цели ${fmt(remaining)} ${p.unit}. Последний замер: ${dateLabel(e.date)}`:'Всё начинается с первой отметки.<br>Твой следующий шаг уже считается.'}</p><button class="card-button" data-edit="${p.id}">+ Записать результат</button></div></article>`}).join('');
 $('#filters').innerHTML=people.map(p=>`<button data-filter="${p.id}" class="${filter===p.id?'active':''}" aria-pressed="${filter===p.id}">${p.name}</button>`).join('');
 renderCalendar();renderChart();renderHistory();renderPending();
}
function renderCalendar(){
 const p=people.find(p=>p.id===filter);$('#calendar').innerHTML='<div class="months">'+[9,10,11].map(month=>{let cells='';const first=new Date(Date.UTC(2026,month,1)),count=new Date(Date.UTC(2026,month+1,0)).getUTCDate(),offset=(first.getUTCDay()+6)%7;for(let i=0;i<offset;i++)cells+='<span></span>';for(let d=1;d<=count;d++){const date=`2026-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,e=entries.find(e=>e.person===filter&&e.date===date),inRange=date>=START&&date<=END,progress=e?pct(p,e.value):0,bg=e?`color-mix(in srgb, ${p.color} ${Math.round(22+progress*.78)}%, #f4f6f8)`:'',color=e&&progress>50?'white':'';cells+=inRange?`<button class="day ${date===today()?'today':''} ${date>today()?'future':''}" data-day="${date}" style="background:${bg};color:${color}" aria-label="${dateLabel(date)}: ${e?fmt(e.value)+' '+p.unit:'нет записи'}">${d}</button>`:`<span class="day blank"></span>`}return `<div class="month"><span class="month-title">${['Октябрь','Ноябрь','Декабрь'][month-9]}</span><div class="weekdays">${['пн','вт','ср','чт','пт','сб','вс'].map(d=>`<span>${d}</span>`).join('')}</div><div class="days">${cells}</div></div>`}).join('')+'</div>';
 const swatches=$('.legend').querySelectorAll('i');swatches.forEach((el,i)=>el.style.background=`color-mix(in srgb, ${p.color} ${i?i*24:10}%, #f4f6f8)`);
}
function renderHistory(){const sorted=[...history].sort((a,b)=>b.date.localeCompare(a.date)||b.at-a.at);$('#history').innerHTML=sorted.length?sorted.map(e=>{const p=people.find(p=>p.id===e.person);return `<button class="history-row" data-edit="${e.person}" data-date="${e.date}" style="--color:${p.color}"><i class="history-dot"></i><b>${p.name}</b><span class="history-body"><strong>${fmt(e.value)} ${p.unit}</strong>${e.comment?`<span class="comment">${escape(e.comment)}</span>`:''}</span><time>${dateLabel(e.date)}</time><span class="edit-hint">Изменить</span></button>`}).join(''):`<p class="empty">${loaded?'Пока нет записей.':'История не загружена. Проверьте связь и нажмите «Обновить».'}</p>`}
function renderChart(){
 const svg=$('#progress-chart');if(!svg)return;const dates=[START,END,...entries.map(e=>e.date)].sort(),chartStart=dates[0],chartEnd=dates.at(-1);const W=960,H=270,left=44,right=930,top=20,bottom=222,x=d=>left+(Date.parse(d)-Date.parse(chartStart))/(Date.parse(chartEnd)-Date.parse(chartStart))*(right-left),y=v=>bottom-v/100*(bottom-top);
 let content=[0,25,50,75,100].map(v=>`<line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}" stroke="#e5ebef" stroke-dasharray="${v===100?'5 5':'0'}"./><text x="32" y="${y(v)+4}" text-anchor="end" fill="#73828c" font-size="11">${v}%</text>`).join('');
 Array.from({length:5},(_,i)=>new Date(Date.parse(chartStart)+(Date.parse(chartEnd)-Date.parse(chartStart))*i/4).toISOString().slice(0,10)).forEach(d=>content+=`<text x="${x(d)}" y="250" text-anchor="${d===chartStart?'start':d===chartEnd?'end':'middle'}" fill="#73828c" font-size="11">${dateLabel(d)}</text>`);
 for(const p of people){let data=entries.filter(e=>e.person===p.id).sort((a,b)=>a.date.localeCompare(b.date));if(!data.some(e=>e.date===START))data=[{date:START,value:p.start,baseline:true},...data];data.sort((a,b)=>a.date.localeCompare(b.date));let points=data.map(e=>`${x(e.date)},${y(pct(p,e.value))}`).join(' ');content+=`<polyline class="chart-line" fill="none" stroke="${p.color}" stroke-width="2.5" stroke-linejoin="round" points="${points}"./>`;for(const e of data)content+=`<circle tabindex="0" data-chart-person="${p.id}" data-chart-date="${e.date}" cx="${x(e.date)}" cy="${y(pct(p,e.value))}" r="${e.baseline?3:5}" fill="${p.color}" stroke="white" stroke-width="2"><title>${p.name}: ${dateLabel(e.date)} · ${fmt(e.value)} ${p.unit} · ${Math.round(pct(p,e.value))}%${e.comment?' · '+escape(e.comment):''}</title></circle>`}
 svg.innerHTML=loaded||entries.length?content:'';$('#chart-empty').hidden=entries.length>0;$('#chart-empty').textContent=loaded?'Пока нет отметок.':'График появится после загрузки результатов.';
}
async function load(silent=false){
 if(saving||loading)return;
 loading=true;const started=revision;
 try{const data=await requestProgress();if(started!==revision||saving)return;entries=data.entries;history=data.history||data.entries;loaded=true;local.remember({entries,history,complete:loaded});render();$('#sync').textContent='Синхронизировано';$('#sync').style.color='';}
 catch(e){if(started!==revision||saving)return;$('#sync').textContent=loaded?'Показана сохранённая копия · нет связи':'История недоступна · можно внести результат';$('#sync').style.color='#b54735';if(!silent)toast(e.message)}
 finally{loading=false}
}
function openEntry(id,date){editing=people.find(p=>p.id===id);const p=editing,d=date||today(),entry=local.queue().find(e=>e.person===id&&e.date===d)||entries.find(e=>e.person===id&&e.date===d);$('#entry-title').textContent=p.name+' · результат';$('#entry-goal').textContent=p.goal+': '+p.start+' → '+p.target+' '+p.unit;$('#entry-date').value=d;$('#entry-value').min=p.min;$('#entry-value').max=p.max;$('#entry-value').step=p.id==='anton'?1:.1;$('#entry-value').value=entry?.value??(loaded?(current(p)?.value??p.start):'');$('#entry-unit').textContent='('+p.unit+')';$('#entry-comment').value=entry?.comment||'';$('#form-error').textContent=!loaded?'История пока недоступна. Введите результат; запись за выбранную дату заменит предыдущую.':'';$('#save').disabled=false;$('#entry-dialog').showModal()}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.tab){selected=b.dataset.tab;render()}if(b.dataset.filter){filter=b.dataset.filter;render();$('#day-detail').textContent='Нажми на день, чтобы увидеть результат.'}if(b.dataset.edit)openEntry(b.dataset.edit,b.dataset.date);if(b.dataset.day){const p=people.find(p=>p.id===filter),entry=entries.find(e=>e.person===filter&&e.date===b.dataset.day);$('.day.selected')?.classList.remove('selected');b.classList.add('selected');$('#day-detail').textContent=`${p.name}, ${dateLabel(b.dataset.day)}: ${entry?fmt(entry.value)+' '+p.unit+' · '+Math.round(pct(p,entry.value))+'% пути'+(entry.comment?' · '+entry.comment:''):'нет записи'}`;openEntry(filter,b.dataset.day)}});
$('#close-dialog').onclick=()=>{if(!saving)$('#entry-dialog').close()};$('#entry-dialog').addEventListener('cancel',e=>{if(saving)e.preventDefault()});$('#entry-dialog').addEventListener('click',e=>{if(e.target===$('#entry-dialog')&&!saving){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
for(const [id,sign]of [['minus',-1],['plus',1]])$('#'+id).onclick=()=>{const p=editing,v=Number($('#entry-value').value);$('#entry-value').value=Math.min(p.max,Math.max(p.min,Math.round((v+sign*p.step)*10)/10))};
$('#entry-date').onchange=()=>{const e=local.queue().find(e=>e.person===editing.id&&e.date===$('#entry-date').value)||entries.find(e=>e.person===editing.id&&e.date===$('#entry-date').value);if(e){$('#entry-value').value=e.value;$('#entry-comment').value=e.comment||''}else $('#entry-comment').value=''};
function renderPending(){
 $('#pending').innerHTML=local.queue().map(e=>`<p class="help">⏳ ${people.find(p=>p.id===e.person).name}, ${dateLabel(e.date)}: ${fmt(e.value)} — ожидает отправки с этого устройства. <button class="quiet" data-edit="${e.person}" data-date="${e.date}">Открыть</button></p>`).join('');
}
function acceptEntry(entry){
 const previous=entries.find(e=>e.person===entry.person&&e.date===entry.date);
 if(!previous||previous.at<=entry.at){entries=entries.filter(e=>e.person!==entry.person||e.date!==entry.date);entries.push(entry)}
 if(!history.some(e=>e.at===entry.at&&e.person===entry.person&&e.date===entry.date))history.push(entry);
 local.remove(entry.requestId);local.remember({entries,history,complete:loaded});render();
}
async function sendPending(){
 if(saving||!local.queue().length)return;
 saving=true;revision++;
 try{for(const payload of [...local.queue()]){const data=await requestProgress({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});acceptEntry(data.entry)}$('#sync').textContent='Все записи отправлены';}
 catch{$('#sync').textContent='Есть записи, ожидающие отправки';}
 finally{saving=false;renderPending()}
}
$('#entry-form').onsubmit=async event=>{
 event.preventDefault();if(saving)return;saving=true;revision++;$('#save').disabled=true;$('#save').textContent='Сохраняем…';$('#form-error').textContent='';
 const queued=local.enqueue({person:editing.id,date:$('#entry-date').value,value:Number($('#entry-value').value),comment:$('#entry-comment').value});renderPending();
 try{const data=await requestProgress({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(queued.entry)});acceptEntry({...data.entry,requestId:queued.entry.requestId});selected=queued.entry.person;filter=selected;render();$('#entry-dialog').close();$('#sync').textContent='Результат сохранён на сервере';$('#sync').style.color='';toast('Сохранено. Результат доступен всем участникам.');}
 catch(e){if(e.validation){local.remove(queued.entry.requestId);renderPending();$('#form-error').textContent=e.message}else{$('#form-error').textContent=queued.durable?'Сервер не подтвердил сохранение. Запись сохранена на этом устройстве и будет отправлена при восстановлении связи. Пока другие участники её не видят.':'Нет связи и браузер не разрешает сохранить черновик. Не закрывайте форму, повторите отправку.';$('#sync').textContent='Ожидает отправки'}}
 finally{saving=false;$('#save').disabled=false;$('#save').textContent='Сохранить результат';if(!$('#entry-dialog').open)load(true)}
};
async function sync(){await sendPending();await load(true)}
$('#refresh').onclick=()=>sync();
window.addEventListener('online',()=>sync());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
setInterval(()=>{if(!document.hidden)sync()},30000);
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

render();if(cached)$('#sync').textContent='Сохранённая копия · обновляем…';sync();

// Finish at the end of December 6 in the challenge's Los Angeles timezone.
const finishAt=Date.parse('2026-12-07T00:00:00-08:00');
function updateCountdown(){
 const remaining=Math.max(0,Math.floor((finishAt-Date.now())/1000));
 const values=[Math.floor(remaining/86400),Math.floor(remaining/3600)%24,Math.floor(remaining/60)%60,remaining%60];
 document.querySelectorAll('#finish-clock b').forEach((el,i)=>el.textContent=String(values[i]).padStart(2,'0'));
 if(!remaining)document.querySelector('#finish-clock').setAttribute('aria-label','Челлендж завершён');
}
updateCountdown();setInterval(updateCountdown,1000);
