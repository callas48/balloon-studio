'use strict';
const feed=require('./desktop/update-feed.json');
module.exports={
 appId:'kr.balloonstudio.desktop',productName:'말풍선 공방',artifactName:'Balloon-Studio-Setup-${version}-${arch}.${ext}',
 directories:{output:'release'},files:['desktop/**','package.json'],
 extraResources:[{from:'dist/client',to:'editor'}],
 asar:true,compression:'normal',
 win:{target:[{target:'nsis',arch:['x64']}],icon:'public/icons/studio-512.png'},
 nsis:{oneClick:false,perMachine:false,allowToChangeInstallationDirectory:true,createDesktopShortcut:true,createStartMenuShortcut:true,deleteAppDataOnUninstall:false,differentialPackage:true},
 publish:feed.url?[{provider:'generic',url:feed.url}]:null
};
