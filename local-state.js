export function createLocalState(storage) {
 const read=(key,fallback)=>{try{return JSON.parse(storage.getItem(key))??fallback}catch{return fallback}};
 let cache=read('trio-cache-v1',null),queue=read('trio-queue-v1',[]);
 if(!Array.isArray(queue))queue=[];
 const write=(key,value)=>{try{storage.setItem(key,JSON.stringify(value));return true}catch{return false}};
 return {
  cache:()=>cache,
  queue:()=>queue,
  remember(data){cache=data;write('trio-cache-v1',data)},
  enqueue(payload){
   const old=queue.find(e=>e.person===payload.person&&e.date===payload.date);
   if(old&&old.value===payload.value&&old.comment===payload.comment)return {entry:old,durable:write('trio-queue-v1',queue)};
   const entry={...payload,requestId:crypto.randomUUID()};
   queue=queue.filter(e=>e.person!==payload.person||e.date!==payload.date);queue.push(entry);
   return {entry,durable:write('trio-queue-v1',queue)};
  },
  remove(id){queue=queue.filter(e=>e.requestId!==id);write('trio-queue-v1',queue)}
 };
}
