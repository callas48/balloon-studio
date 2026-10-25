const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/lettering.js','utf8');const glyphs=[];
const sb=vm.createContext({emotionKinds:[],family:()=> 'sans-serif',artOf:()=>({}),paintGlyph:(c,b,ch)=>glyphs.push({ch,x:c.x,y:c.y})});
vm.runInContext(source.slice(source.indexOf('function verticalTextLayout')),sb);
const c={save(){},restore(){},translate(x,y){this.x=x;this.y=y},rotate(){}};
for(const mode of ['vertical','vertical-left']){
 const b={kind:'text',text:'가나다라\n마바\n사',x:10,y:20,w:200,h:300,padding:10,fontSize:20,lineHeight:1.4,weight:400,align:'center',writingMode:mode};glyphs.length=0;sb.drawVerticalText(c,b);
 const first=['가','마','사'].map(ch=>glyphs.find(g=>g.ch===ch));assert.ok(first.every(g=>g.y===first[0].y));assert.equal(first[0].y,140);assert.equal(glyphs.find(g=>g.ch==='라').y-first[0].y,60);assert.ok(mode==='vertical'?first[0].x<first[1].x:first[0].x>first[1].x);
 b.text='가나다라마바';b.h=100;glyphs.length=0;sb.drawVerticalText(c,b);assert.equal(glyphs.find(g=>g.ch==='가').y,glyphs.find(g=>g.ch==='마').y);
 b.text='';assert.doesNotThrow(()=>sb.drawVerticalText(c,b));
}
console.log('Vertical alignment: shared start, glyph spacing, both column directions, automatic wraps and empty text passed.');
