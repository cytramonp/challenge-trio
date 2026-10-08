const endpoints=['https://challenge-trio-api.netlify.app/api/progress','https://challenge-trio.vercel.app/api/progress'];

export async function requestProgress(options={}, {urls=endpoints,fetcher=fetch,timeout=12000}={}) {
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
   if(!response.ok|| (options.method==='POST'?!data.entry:!Array.isArray(data.entries)))throw new Error('Invalid response');
   return data;
  }catch(error){if(error.validation)throw error}
  finally{clearTimeout(timer)}
 }
 throw new Error(options.method==='POST'
  ?'Сервер не подтвердил сохранение. Введённые данные остались в форме. Проверьте связь и повторите сохранение.'
  :'Не удалось загрузить историю. Можно открыть форму и попробовать записать результат.');
}
