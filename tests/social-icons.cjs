const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,Path2D,GlobalFonts}=require('@napi-rs/canvas');
for(const [style,file]of [['outlined','MaterialIconsOutlined-Regular.otf'],['regular','MaterialIcons-Regular.ttf']]){
 assert(GlobalFonts.registerFromPath('public/fonts/material-icons/'+file,'Studio Material '+style));
}
let renders=0;
class FontFace{constructor(name,url){this.family=name;this.url=url;this.status='unloaded'}async load(){this.status='loaded';return this}}
const sb=vm.createContext({FontFace,Path2D,console,document:{fonts:{add(){}},createElement:()=>createCanvas(1,1)},render(){renders++}});
vm.runInContext(fs.readFileSync('public/social-icons.js','utf8'),sb);
vm.runInContext(fs.readFileSync('public/image-layers.js','utf8'),sb);
(async()=>{
 const c=createCanvas(280,80),g=c.getContext('2d');
 assert.equal(sb.drawMaterialIcon(g,'comment',0,0,24,'#123456'),false);
 const layer={id:'qa',kind:'post',w:430,h:850,body:'',appLayout:true,displayName:'공방',handle:'studio',replyCount:'3',repostCount:'4',likeCount:'5',bookmarkCount:'6',viewCount:'100',timeLabel:'12:00',compactCounts:true,visible:true};
 const before=sb.postCardBitmap(layer).toBuffer('image/png');const instagram={...layer,id:'ig',kind:'instagram'};const oldInstagram=sb.instagramCardBitmap(instagram).toBuffer('image/png');
 assert(await sb.ensureSocialIconFonts());assert.equal(renders,1);assert.equal(sb.socialIconRevision(),1);
 const names=['comment','send','share','upload','heart','bookmark'];
 names.forEach((name,i)=>assert(sb.drawMaterialIcon(g,name,12+i*43,18,32,'#123456',name==='share'?'regular':'outlined')));
 const pixels=g.getImageData(0,0,280,80).data;let ink=0;
 for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]===255){assert.equal(pixels[i],18);assert.equal(pixels[i+1],52);assert.equal(pixels[i+2],86);ink++}
 assert(ink>500);assert.notDeepEqual(sb.postCardBitmap(layer).toBuffer('image/png'),before,'Font loading invalidates the old vector bitmap');
 assert.notDeepEqual(sb.instagramCardBitmap(instagram).toBuffer('image/png'),oldInstagram);
 assert.deepEqual(sb.postCardBitmap(layer).toBuffer('image/png'),sb.postCardBitmap(JSON.parse(JSON.stringify(layer))).toBuffer('image/png'),'Reload/export uses the same font pixels');
 assert(fs.readFileSync('public/export.js','utf8').includes('await ensureSocialIconFonts();'));
 fs.writeFileSync('/workspace/scratch/04f5ef9299e7/material-icons-qa.png',c.toBuffer('image/png'));
 console.log('PASS: real embedded font glyphs, loading fallback, color, bitmap invalidation and reload/export parity');
})().catch(e=>{console.error(e);process.exitCode=1});
