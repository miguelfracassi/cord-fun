/* Cliente Supabase mínimo, servido pelo próprio site (sem CDN). Expõe window.supabase.createClient */
(function(){
window.supabase={createClient:function(url,key){
 const K='cord-auth',L=[];
 const hd=t=>({apikey:key,'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})});
 const rd=()=>{try{return JSON.parse(localStorage.getItem(K))}catch(e){return null}};
 const save=s=>{try{s?localStorage.setItem(K,JSON.stringify(s)):localStorage.removeItem(K)}catch(e){}L.forEach(f=>f(s?'SIGNED_IN':'SIGNED_OUT',s))};
 const norm=j=>({access_token:j.access_token,refresh_token:j.refresh_token,user:j.user,expires_at:Math.floor(Date.now()/1000)+(j.expires_in||3600)});
 const msg=(j,r)=>(j&&(j.msg||j.error_description||j.message||j.error))||('Erro '+r.status);
 const call=async(path,body,tok,method)=>{try{const r=await fetch(url+path,{method:method||'POST',headers:hd(tok),body:body?JSON.stringify(body):undefined});const j=await r.json().catch(()=>({}));return r.ok?{data:j,error:null}:{data:null,error:{message:msg(j,r)}}}catch(e){return{data:null,error:{message:'Sem conexão com a internet ou com o Supabase.'}}}};
 /* links de confirmação / recuperação chegam com o token no #hash */
 const init=(async()=>{try{const h=new URLSearchParams(location.hash.slice(1)),t=h.get('access_token');
  if(t){const r=await fetch(url+'/auth/v1/user',{headers:hd(t)});if(r.ok){save({access_token:t,refresh_token:h.get('refresh_token'),user:await r.json(),expires_at:Math.floor(Date.now()/1000)+(+h.get('expires_in')||3600)});history.replaceState(null,'',location.pathname+location.search)}}}catch(e){}})();
 async function session(){await init;let s=rd();if(!s)return null;
  if(s.expires_at-60<Date.now()/1000){const r=await call('/auth/v1/token?grant_type=refresh_token',{refresh_token:s.refresh_token});if(r.error||!r.data.access_token){save(null);return null}s=norm(r.data);try{localStorage.setItem(K,JSON.stringify(s))}catch(e){}}return s}
 const auth={
  getSession:async()=>({data:{session:await session()}}),
  onAuthStateChange:f=>{L.push(f);return{data:{subscription:{unsubscribe(){}}}}},
  signInWithPassword:async o=>{const r=await call('/auth/v1/token?grant_type=password',{email:o.email,password:o.password});if(r.error)return r;const s=norm(r.data);save(s);return{data:{session:s,user:s.user},error:null}},
  signUp:async o=>{const op=o.options||{},q=op.emailRedirectTo?'?redirect_to='+encodeURIComponent(op.emailRedirectTo):'';
   const r=await call('/auth/v1/signup'+q,{email:o.email,password:o.password,data:op.data||{}});if(r.error)return r;
   if(r.data.access_token){const s=norm(r.data);save(s);return{data:{session:s,user:s.user},error:null}}return{data:{session:null,user:r.data.user||r.data},error:null}},
  resetPasswordForEmail:(email,o)=>call('/auth/v1/recover'+(o&&o.redirectTo?'?redirect_to='+encodeURIComponent(o.redirectTo):''),{email}),
  updateUser:async p=>{const s=await session();if(!s)return{data:null,error:{message:'Faça login novamente.'}};const r=await call('/auth/v1/user',p,s.access_token,'PUT');
   if(!r.error){try{localStorage.setItem(K,JSON.stringify({...s,user:r.data}))}catch(e){}}return r},
  signOut:async()=>{const s=rd();if(s)call('/auth/v1/logout',null,s.access_token);save(null);return{error:null}}
 };
 const from=t=>{const q={sel:'*',f:[],ord:null,one:false};
  const b={select:c=>{q.sel=c||'*';return b},order:(c,o)=>{q.ord=c+'.'+(o&&o.ascending===false?'desc':'asc');return b},eq:(c,v)=>{q.f.push(c+'=eq.'+encodeURIComponent(v));return b},maybeSingle:()=>{q.one=true;return b},then:(a,c)=>run().then(a,c)};
  async function run(){try{const s=await session();
   const r=await fetch(url+'/rest/v1/'+t+'?select='+encodeURIComponent(q.sel)+q.f.map(x=>'&'+x).join('')+(q.ord?'&order='+q.ord:'')+(q.one?'&limit=1':''),{headers:hd(s&&s.access_token)});
   const j=await r.json().catch(()=>null);if(!r.ok)return{data:null,error:{message:(j&&j.message)||('Erro '+r.status)}};return{data:q.one?(j[0]||null):j,error:null}}catch(e){return{data:null,error:{message:'Sem conexão com o Supabase.'}}}}
  return b};
 const rpc=async(fn,args)=>{const s=await session();return call('/rest/v1/rpc/'+fn,args||{},s&&s.access_token)};
 return{auth,from,rpc};
}};
})();
