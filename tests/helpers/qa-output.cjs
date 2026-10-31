'use strict';
const fs=require('node:fs'),path=require('node:path');
module.exports=name=>{const root=path.resolve(process.env.BALLOON_QA_DIR||'work/qa');fs.mkdirSync(root,{recursive:true});return path.join(root,name);};
