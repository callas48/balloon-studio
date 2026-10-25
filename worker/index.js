const appHTML=null;
const dayOf=(ms=Date.now())=>new Date(ms+9*3600000).toISOString().slice(0,10);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const robot=/bot\b|crawler|spider|headless|preview|facebookexternalhit|slurp/i;
// Server admin writes remain disabled until a trusted authentication adapter is configured.
const isAssetOwner=()=>false;
const assetKey=id=>`shared-assets/${id}`;
const assetId=/^shared-[a-f0-9-]{36}$/;
async function sharedAssets(request,env,path){
 if(!env.DB||!env.BUCKET)return json({error:'공용 에셋 보관함을 준비 중입니다.'},503);
 const owner=isAssetOwner(request),origin=new URL(request.url).origin;
 if(path==='/api/shared-assets/session')return request.method==='GET'?json({owner}):json({error:'GET만 가능합니다.'},405);
 if(path==='/api/shared-assets'&&request.method==='GET'){
  const rows=await env.DB.prepare('SELECT id,name,width,height,created_at FROM shared_assets ORDER BY created_at DESC LIMIT 200').all();
  return json({assets:rows.results.map(a=>({...a,url:`/api/shared-assets/${a.id}/image`}))});
 }
 const match=path.match(/^\/api\/shared-assets\/(shared-[a-f0-9-]{36})(?:\/(image))?$/);
 if(match?.[2]&&request.method==='GET'){
  const object=await env.BUCKET.get(assetKey(match[1]));
  if(!object)return json({error:'에셋을 찾지 못했어.'},404);
  return new Response(object.body,{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
 }
 if(request.method!=='POST'&&request.method!=='DELETE')return json({error:'지원하지 않는 요청입니다.'},405);
 if(!owner)return json({error:'운영자 계정으로 로그인해야 합니다.'},403);
 if(request.headers.get('Origin')!==origin)return json({error:'사이트 안에서만 변경할 수 있습니다.'},403);
 if(request.method==='DELETE'&&match&&!match[2]){
  await env.DB.prepare('DELETE FROM shared_assets WHERE id=?').bind(match[1]).run();
  await env.BUCKET.delete(assetKey(match[1]));
  return json({deleted:true});
 }
 if(path!=='/api/shared-assets'||request.method!=='POST')return json({error:'없는 경로입니다.'},404);
 if(Number(request.headers.get('content-length')||0)>12000000)return json({error:'이미지는 8MB 이하로 등록해줘.'},413);
 const data=await request.arrayBuffer();if(data.byteLength<24||data.byteLength>8*1024*1024||request.headers.get('content-type')!=='image/png')return json({error:'8MB 이하의 PNG 이미지로 등록해줘.'},400);
 const bytes=new Uint8Array(data),signature=[137,80,78,71,13,10,26,10];
 if(!signature.every((v,i)=>bytes[i]===v)||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')return json({error:'PNG 이미지가 올바르지 않아.'},400);
 const view=new DataView(data),width=view.getUint32(16),height=view.getUint32(20);
 if(!width||!height||width>2048||height>2048)return json({error:'이미지는 최대 2048 × 2048px로 등록해줘.'},400);
 const name=(new URL(request.url).searchParams.get('name')||'').trim().slice(0,100);
 if(!name)return json({error:'이름을 입력해줘.'},400);
 const id='shared-'+crypto.randomUUID(),createdAt=Date.now();
 await env.BUCKET.put(assetKey(id),data,{httpMetadata:{contentType:'image/png'}});
 try{await env.DB.prepare('INSERT INTO shared_assets(id,name,width,height,created_at) VALUES(?,?,?,?,?)').bind(id,name,width,height,createdAt).run()}
 catch(e){await env.BUCKET.delete(assetKey(id));throw e}
 return json({asset:{id,name,width,height,created_at:createdAt,url:`/api/shared-assets/${id}/image`}},201);
}
export async function collect(request,db,now=Date.now()){
 const origin=request.headers.get('Origin');if(origin!==new URL(request.url).origin)return json({error:'허용되지 않은 요청입니다.'},403);
 if(robot.test(request.headers.get('user-agent')||''))return new Response(null,{status:204});
 if(Number(request.headers.get('content-length')||0)>512)return json({error:'요청이 너무 큽니다.'},413);
 const cookie=request.headers.get('cookie')||'',match=cookie.match(/(?:^|;\s*)bs_visitor=([a-f0-9-]{36})(?:;|$)/),visitor=match?.[1]||crypto.randomUUID(),day=dayOf(now);
 // Count the same browser once per Korean calendar day. Reloads within 15 seconds are one view.
 await db.batch([
  db.prepare('INSERT INTO analytics_days(day, views) VALUES (?, 0) ON CONFLICT(day) DO NOTHING').bind(day),
  db.prepare('UPDATE analytics_days SET views=views+1 WHERE day=? AND NOT EXISTS (SELECT 1 FROM analytics_visits WHERE day=? AND visitor=? AND last_seen>?)').bind(day,day,visitor,now-15000),
  db.prepare('INSERT INTO analytics_visits(day, visitor, last_seen) VALUES (?, ?, ?) ON CONFLICT(day,visitor) DO UPDATE SET last_seen=excluded.last_seen').bind(day,visitor,now)
 ]);
 const response=new Response(null,{status:204,headers:{'Cache-Control':'no-store'}});
 if(!match)response.headers.set('Set-Cookie',`bs_visitor=${visitor}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
 return response;
}
export async function statistics(db,now=Date.now()){
 const today=dayOf(now),start=dayOf(now-29*86400000);
 const results=await db.batch([
  db.prepare('SELECT d.day,d.views,(SELECT COUNT(*) FROM analytics_visits v WHERE v.day=d.day) AS visitors FROM analytics_days d WHERE d.day>=? AND d.day<=? ORDER BY d.day DESC').bind(start,today),
  db.prepare('SELECT MIN(day) AS since,COALESCE(SUM(views),0) AS views FROM analytics_days'),
  db.prepare('SELECT COUNT(*) AS visitors FROM analytics_visits')
 ]);
 const found=new Map(results[0].results.map(r=>[r.day,r])),days=Array.from({length:30},(_,i)=>{const day=dayOf(now-i*86400000);return found.get(day)||{day,visitors:0,views:0}});
 return{today,timezone:'Asia/Seoul',since:results[1].results[0].since,totals:{views:results[1].results[0].views,visitorDays:results[2].results[0].visitors},days};
}
export default {async fetch(request,env){const path=new URL(request.url).pathname;
 try{
  if(path==='/api/shared-assets'||path.startsWith('/api/shared-assets/'))return await sharedAssets(request,env,path);
  if(path==='/api/analytics/visit'){if(request.method!=='POST')return json({error:'POST만 가능합니다.'},405);if(!env.DB)return json({error:'방문 집계가 준비되지 않았습니다.'},503);return await collect(request,env.DB)}
  if(path==='/api/analytics/stats'){if(request.method!=='GET')return json({error:'GET만 가능합니다.'},405);if(!env.DB)return json({error:'통계를 불러올 수 없습니다.'},503);return json(await statistics(env.DB))}
  if(path==='/api/analytics'||path.startsWith('/api/analytics/'))return json({error:'없는 경로입니다.'},404);
  if(env.ASSETS)return env.ASSETS.fetch(request);
  if(path==='/'||path==='/index.html')return new Response(appHTML,{headers:{'Content-Type':'text/html; charset=utf-8'}});
  return new Response('Not found',{status:404});
 }catch(e){console.error('Analytics request failed',e.message);return json({error:'통계를 잠시 불러올 수 없습니다. 다시 시도해주세요.'},503)}
}};
