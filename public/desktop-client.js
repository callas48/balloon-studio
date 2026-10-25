'use strict';
(()=>{
 const api=window.balloonDesktop;if(!api)return;
 function init(){
  const style=document.createElement('style');style.textContent='.desktop-update-notice{position:fixed;right:20px;bottom:24px;z-index:2500;background:#182a25;color:#fff;border:1px solid #45695d;border-radius:12px;padding:12px;box-shadow:0 6px 24px #0005;display:flex;align-items:center;gap:12px}.desktop-update-dialog{width:min(480px,90vw);border-radius:16px;padding:24px}.desktop-update-dialog::backdrop{background:#0007}.desktop-update-dialog pre{white-space:pre-wrap;max-height:220px;overflow:auto;font:inherit}.desktop-update-dialog progress{width:100%}.desktop-update-dialog .desktop-update-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}';document.head.append(style);
  const notice=document.createElement('aside');notice.className='desktop-update-notice';notice.hidden=true;notice.style.display='none';const noticeText=document.createElement('span'),noticeButton=document.createElement('button');noticeButton.textContent='업데이트';notice.append(noticeText,noticeButton);document.body.append(notice);
  const panel=document.createElement('dialog');panel.className='desktop-update-dialog';panel.setAttribute('aria-label','프로그램 업데이트');
  const title=document.createElement('h2');title.textContent='말풍선 공방 업데이트';
  const version=document.createElement('p'),message=document.createElement('p'),notes=document.createElement('pre'),progress=document.createElement('progress');progress.max=100;
  const actions=document.createElement('div');actions.className='desktop-update-actions';
  const check=document.createElement('button');check.textContent='업데이트 확인';
  const download=document.createElement('button'),install=document.createElement('button'),close=document.createElement('button');install.textContent='저장 후 설치';close.textContent='나중에';actions.append(check,download,install,close);panel.append(title,version,message,notes,progress,actions);document.body.append(panel);
  let updateState={phase:'idle'},saving=false;
  function hideNotice(){notice.hidden=true;notice.style.display='none'}
  function showState(value){
   if(!value||!value.phase)return;updateState=value;version.textContent='현재 버전 '+value.version+(value.nextVersion?' → '+value.nextVersion:'');
   message.textContent=value.message||'업데이트는 프로그램을 시작할 때 한 번 확인합니다.';notes.textContent=value.notes||'';
   check.disabled=['checking','downloading'].includes(value.phase)||saving;
   download.hidden=!['available','full-required'].includes(value.phase);download.textContent=value.phase==='full-required'?'전체 파일 다운로드'+(value.size?' ('+(value.size/1048576).toFixed(1)+' MB)':''):'업데이트 다운로드';
   install.hidden=value.phase!=='downloaded';install.disabled=saving;
   progress.hidden=value.phase!=='downloading';progress.value=value.percent||0;
   if(value.phase==='downloading')message.textContent+=' '+Math.round(value.percent||0)+'%';
   if(['available','downloaded'].includes(value.phase)&&navigator.onLine!==false){noticeText.textContent=value.phase==='downloaded'?'업데이트 다운로드 완료':'새 버전 '+value.nextVersion+'이 있습니다.';noticeButton.textContent=value.phase==='downloaded'?'설치 준비':'업데이트';notice.hidden=false;notice.style.display='flex'}else hideNotice();
  }
  function openPanel(){if(!panel.open)panel.showModal();showState(updateState)}
  close.onclick=()=>panel.close();check.onclick=async()=>showState(await api.checkUpdates());
  download.onclick=async()=>showState(await api.downloadUpdate(updateState.phase==='full-required'));
  noticeButton.onclick=()=>{openPanel();if(updateState.phase==='available')void api.downloadUpdate(false).then(showState)};
  window.addEventListener('offline',hideNotice); // No online/focus/resume update checks.
  api.onUpdate(showState);void api.getUpdateState().then(showState);
  async function saveNative(saveAs=false){
   if(projectBusy||localSaveInteractionActive())return false;
   const revision=localChanges,id=localProjectId;
   const result=await api.saveProject(JSON.stringify(serializableBook()),$('title').value,saveAs,id);
   if(!result.ok){if(!result.canceled)status(result.message||'프로젝트를 저장하지 못했습니다.');return false}
   if(id!==localProjectId||revision!==localChanges){status('파일은 저장됐지만 이후 수정 사항이 있습니다. 다시 저장해주세요.');return false}
   projectDirty=false;status(result.name+' 저장 완료');return true;
  }
  async function openNative(){
   if(projectBusy)return;const result=await api.openProject();if(!result.ok){if(!result.canceled)status(result.message||'파일을 열지 못했습니다.');return}
   if(await openBookFile(new File([result.text],result.name,{type:'application/json'})))await api.claimProject(result.token,localProjectId);
  }
  install.onclick=async()=>{
   if(saving||projectBusy||localSaveInteractionActive()){message.textContent='현재 편집 동작을 마친 뒤 설치해주세요.';return}
   saving=true;showState(updateState);
   try{
    if(!await saveNative(false))throw Error('현재 작업을 저장한 뒤 설치해주세요.');
    setProjectBusy(true);
    const recovery=await api.backupBeforeUpdate(JSON.stringify(serializableBook()));if(!recovery.ok)throw Error(recovery.message||'복구 저장본을 만들지 못했습니다.');
    if(!await saveLocalProject(true)||localChanges!==localSaved)throw Error('자동저장을 완료하지 못했습니다. 현재 작업은 유지됩니다.');
    const result=await api.installUpdate(recovery.token);if(!result.ok)throw Error(result.message||'설치를 시작하지 못했습니다.');
   }catch(error){message.textContent=error.message}finally{setProjectBusy(false);saving=false;install.disabled=false}
  };
  const menu=document.querySelector('#projectMore .project-menu');
  if(menu){for(const [label,action]of [['파일로 저장',()=>saveNative(false)],['다른 이름으로 저장',()=>saveNative(true)],['프로그램 정보 / 업데이트',openPanel]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=()=>{$('projectMore').open=false;void action()};menu.append(button)}}
  if($('saveProject'))$('saveProject').onclick=()=>void saveNative(false);
  if($('openProject'))$('openProject').onclick=()=>void openNative();
  if($('installStudio')){$('installStudio').textContent='Windows 앱으로 실행 중';$('installStudio').disabled=true}
  if($('visitorStats'))$('visitorStats').hidden=true;
  api.onCommand(command=>{if(command==='open')void openNative();else if(command==='save')void saveNative(false);else if(command==='save-as')void saveNative(true);else if(command==='updates'){openPanel();void api.checkUpdates().then(showState)}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
