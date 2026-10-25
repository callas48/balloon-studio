'use strict';
const {GenericProvider}=require('electron-updater/out/providers/GenericProvider');
const {parseUpdateInfo}=require('electron-updater/out/providers/Provider');
const {getChannelFilename,newUrlFromBase}=require('electron-updater/out/util');
const {CancellationToken}=require('builder-util-runtime');
// GenericProvider 6.8.11 retries ECONNREFUSED internally. This provider deliberately does not.
class OnceProvider extends GenericProvider {
 constructor(options,updater,runtime){super(options,updater,{...runtime,isUseMultipleRangeRequest:false});this.timeoutMs=options.timeoutMs||10000}
 async getLatestVersion(){
  const name=getChannelFilename(this.channel),url=newUrlFromBase(name,this.baseUrl,this.updater.isAddNoCacheQuery),token=new CancellationToken();
  const timer=setTimeout(()=>token.cancel(),this.timeoutMs);
  try{return parseUpdateInfo(await this.httpRequest(url,undefined,token),name,url)}finally{clearTimeout(timer)}
 }
}
module.exports={OnceProvider};
