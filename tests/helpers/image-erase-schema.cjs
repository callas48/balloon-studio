// Use the real current erase-mask schema without installing unrelated selection UI.
const fs=require('node:fs'),vm=require('node:vm');
module.exports=sb=>{const s=fs.readFileSync('public/image-selection.js','utf8');vm.runInContext(s.slice(0,s.indexOf('function applyImageEraseStrokes(')),sb)};
