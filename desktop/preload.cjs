'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('balloonDesktop',Object.freeze({
 getUpdateState:()=>ipcRenderer.invoke('studio:update-state'),
 checkUpdates:()=>ipcRenderer.invoke('studio:update-check'),
 downloadUpdate:full=>ipcRenderer.invoke('studio:update-download',full===true),
 installUpdate:token=>ipcRenderer.invoke('studio:update-install',token),
 saveProject:(text,name,saveAs,documentId)=>ipcRenderer.invoke('studio:save-project',{text,name,saveAs:saveAs===true,documentId}),
 openProject:()=>ipcRenderer.invoke('studio:open-project'),
 claimProject:(token,documentId)=>ipcRenderer.invoke('studio:claim-project',{token,documentId}),
 backupBeforeUpdate:text=>ipcRenderer.invoke('studio:update-backup',text),
 onUpdate:callback=>{const listener=(_,state)=>callback(state);ipcRenderer.on('studio:update-state',listener);return()=>ipcRenderer.removeListener('studio:update-state',listener)},
 onCommand:callback=>{const listener=(_,command)=>callback(command);ipcRenderer.on('studio:command',listener);return()=>ipcRenderer.removeListener('studio:command',listener)}
}));
