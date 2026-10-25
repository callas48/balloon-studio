'use strict';
// Pinned electron-updater 6.8.11 calls this hook BEFORE its full-download fallback.
function consentUpdaterClass(Base){
 return class ConsentUpdater extends Base {
  async differentialDownloadInstaller(...args){
   const needsFull=await super.differentialDownloadInstaller(...args);
   if(needsFull&&!this.fullDownloadAllowed){const error=Error('전체 파일 다운로드를 선택해주세요.');error.code='FULL_DOWNLOAD_REQUIRED';throw error}
   return needsFull;
  }
 };
}
module.exports={consentUpdaterClass};
