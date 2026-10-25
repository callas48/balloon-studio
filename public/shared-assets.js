'use strict';
let sharedAssets=[],sharedAssetOwner=false,sharedAssetBusy=false;
function sharedAssetMessage(message){$('sharedAssetMessage').textContent=message}
async function sharedAssetRequest(url,options){const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});const data=await response.json();if(!response.ok)throw Error(data.error||'공용 에셋을 불러오지 못했어.');return data}
function refreshSharedAssets(){
 const host=$('sharedAssetList');host.replaceChildren();
 for(const asset of sharedAssets){
  const row=document.createElement('div');row.className='custom-asset-card';
  const use=document.createElement('button');use.type='button';use.className='custom-asset-use';use.disabled=sharedAssetBusy;
  const img=document.createElement('img');img.src=asset.url;img.alt='';img.loading='lazy';
  const label=document.createElement('span');label.textContent=asset.name;use.append(img,label);
  use.onclick=async()=>{if(sharedAssetBusy)return;sharedAssetBusy=true;refreshSharedAssets();try{
   const response=await fetch(asset.url,{credentials:'same-origin'});if(!response.ok)throw Error('에셋 그림을 불러오지 못했어.');
   const src=await read(await response.blob()),a={id:asset.id.replace(/^shared-/,'custom-'),name:asset.name,width:asset.width,height:asset.height,src};
   await decodeCustomAsset(a);await addCustomAsset(a);
  }catch(e){sharedAssetMessage(e.message||'에셋을 넣지 못했어.')}finally{sharedAssetBusy=false;refreshSharedAssets()}};
  row.append(use);
  if(sharedAssetOwner){const remove=document.createElement('button');remove.type='button';remove.textContent='공용에서 삭제';remove.disabled=sharedAssetBusy;remove.onclick=async()=>{
   if(!confirm(`「${asset.name}」을 공용 목록에서 삭제할까? 이미 작업에 넣은 에셋은 남아.`))return;
   sharedAssetBusy=true;refreshSharedAssets();try{await sharedAssetRequest(`/api/shared-assets/${asset.id}`,{method:'DELETE'});sharedAssets=sharedAssets.filter(x=>x.id!==asset.id);sharedAssetMessage('공용 목록에서 삭제했어.')}catch(e){sharedAssetMessage(e.message)}finally{sharedAssetBusy=false;refreshSharedAssets()}
  };row.append(remove)}host.append(row);
 }
 if(!sharedAssets.length&&!sharedAssetBusy&&$('sharedAssetSection').hidden===false)sharedAssetMessage('아직 등록된 공용 에셋이 없어.');
}
async function loadSharedAssets(){try{const data=await sharedAssetRequest('/api/shared-assets');sharedAssets=data.assets;refreshSharedAssets()}catch(e){sharedAssetMessage(e.message)}}
async function initSharedAssets(){
 $('sharedAssetUpload').onclick=()=>$('sharedAssetFile').click();
 $('sharedAssetFile').onchange=async e=>{const files=[...e.target.files];e.target.value='';if(!sharedAssetOwner||!files.length)return;sharedAssetBusy=true;refreshSharedAssets();let count=0;const errors=[];
  for(const file of files)try{
   const processed=await customAssetFromFile(file),blob=await (await fetch(processed.src)).blob();
   await sharedAssetRequest(`/api/shared-assets?name=${encodeURIComponent(processed.name)}`,{method:'POST',headers:{'Content-Type':'image/png'},body:blob});count++;
  }catch(err){errors.push(`${file.name}: ${err.message}`)}
  sharedAssetBusy=false;await loadSharedAssets();sharedAssetMessage(`${count}개를 공용 에셋에 등록했어.${errors.length?' '+errors.join(' / '):''}`);
 };
 try{const session=await sharedAssetRequest('/api/shared-assets/session');sharedAssetOwner=!!session.owner;$('sharedAssetAdmin').hidden=!sharedAssetOwner;$('sharedAssetSignIn').hidden=sharedAssetOwner;await loadSharedAssets()}catch(e){sharedAssetMessage(e.message)}
}
