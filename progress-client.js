const endpoints=['https://challenge-trio-api.netlify.app/api/progress','https://challenge-trio.vercel.app/api/progress'];

export async function requestProgress(options={}, {urls=endpoints,fetcher=fetch,timeout=12000}={}) {
 const failures=[];
 if(options.method==='POST')options={...options,headers:{...options.headers,'Content-Type':'text/plain;charset=UTF-8'}};
 for(const url of [...new Set(urls)]) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try {
   const response=await fetcher(url,{...options,cache:'no-store',signal:controller.signal});
   const data=await response.json();
   if(options.method==='POST'&&[400,409,422].includes(response.status)) {
    const error=new Error(data.error||'Проверьте введённые данные.');
    error.validation=true;throw error;
   }
   if(!response.ok|| (options.method==='POST'?!data.entry:!Array.isArray(data.entries)))throw new Error('HTTP '+response.status);
   return data;
  }catch(error){if(error.validation)throw error;const host=url.startsWith('http')?new URL(url).hostname:'основной сервер';failures.push(host+': '+(controller.signal.aborted?'тайм-аут':error.message==='Failed to fetch'?'соединение не установлено':error.message));}
  finally{clearTimeout(timer)}
 }
 const error=new Error(options.method==='POST'
  ?'Сервер не подтвердил сохранение. Введённые данные остались в форме. Проверьте связь и повторите сохранение.'
  :'Не удалось загрузить историю. Можно открыть форму и попробовать записать результат.');
 error.diagnostic='S2 · '+failures.join(' / ');throw error;
}
