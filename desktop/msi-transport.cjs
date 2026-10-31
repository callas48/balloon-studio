'use strict';
const {EventEmitter}=require('node:events');
function rejectedRequest(){const request=new EventEmitter();request.end=()=>queueMicrotask(()=>request.emit('error',Error('다른 출처의 MSI 다운로드는 허용하지 않습니다.')));request.setTimeout=()=>{};request.abort=request.destroy=()=>{};return request;}
// Prevent an ignored Range header or a redirect from turning a differential request into a full download.
function guardExecutor(executor,base){
 const create=executor.createRequest.bind(executor);
 executor.createRequest=(options,callback)=>{
  let url;try{url=new URL(options.path||'/',options.protocol+'//'+(options.hostname||options.host)+(options.port?':'+options.port:''));}catch{return rejectedRequest();}
  if(url.origin!==base.origin)return rejectedRequest();
  const range=options.headers?.range||options.headers?.Range,expected=range&&/^bytes=(\d+)-(\d+)$/.exec(range);
  let request;
  const fail=response=>{request.emit('error',Error('서버의 MSI 범위 응답이 올바르지 않습니다.'));response.destroy?.();request.abort?.();request.destroy?.();};
  request=create(options,response=>{
   const header=name=>{const value=response.headers[name];return Array.isArray(value)?value[0]:value;};
   const returned=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(header('content-range')||'');
   const count=expected?Number(expected[2])-Number(expected[1])+1:executor.expectedInstallerSize;
   if(expected&&(response.statusCode!==206||!returned||returned[1]!==expected[1]||returned[2]!==expected[2]||Number(returned[3])!==executor.expectedInstallerSize)){fail(response);return;}
   if(Number(header('content-length'))>count){fail(response);return;}
   let received=0;response.on('data',chunk=>{received+=chunk.length;if(received>count)fail(response);});callback(response);
  });
  const follow=request.followRedirect?.bind(request);let redirect;
  request.on('redirect',(status,method,url)=>{redirect=url;});
  if(follow)request.followRedirect=()=>{if(!redirect||new URL(redirect).origin!==base.origin){request.emit('error',Error('MSI 다운로드 리디렉션이 허용되지 않습니다.'));request.abort?.();return;}follow();};
  return request;
 };
 return executor;
}
module.exports={guardExecutor};
