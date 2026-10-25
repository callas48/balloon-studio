"""Precision extraction from the user's original pixels, not an AI-cleaned sheet."""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from scipy.ndimage import gaussian_filter,binary_fill_holes,label,binary_dilation,binary_opening,distance_transform_edt
ROOT=Path(__file__).resolve().parent.parent
source=Image.open(ROOT/'docs/assets/pink-reactions/source-6842.png').convert('RGB')
rgb=np.array(source).astype(float)
# Smooth only background samples; do not blur/rewrite foreground lettering.
bg_samples=(rgb.max(axis=2)<65)&(rgb.min(axis=2)>12)
weights=gaussian_filter(bg_samples.astype(float),40)
bg=np.stack([gaussian_filter(rgb[:,:,i]*bg_samples,40)/np.maximum(weights,.001) for i in range(3)],axis=2)
delta=np.maximum(rgb-bg,0).max(axis=2)
alpha=np.clip((delta-8)/58,0,1)
# Unmix the old dark paper only in the antialiased halo. Opaque original pixels stay exact.
a=np.maximum(alpha,.001)
fg=np.clip((rgb-bg*(1-alpha[:,:,None]))/a[:,:,None],0,255)
rgba=np.dstack([fg,np.round(alpha*255)]).astype('uint8')
regions={
'kkulleong':[(890,510),(953,501),(976,530),(977,578),(1016,592),(1046,640),(1047,693),(998,698),(964,670),(947,629),(899,623),(878,586),(885,552)],
'haljjak':[(757,536),(793,536),(813,575),(836,599),(868,625),(885,667),(878,697),(847,698),(811,661),(775,652),(751,614),(730,588),(734,565),(753,562)],
'eung':[(654,515),(677,508),(704,515),(725,549),(734,601),(729,646),(714,688),(670,692),(648,663),(635,604),(637,557)],
'chu-eup':[(530,507),(586,507),(610,554),(614,572),(645,580),(654,621),(647,688),(566,693),(556,660),(562,619),(537,616),(519,584),(528,559)],
'pang':[(896,390),(996,373),(1024,382),(1027,457),(1046,469),(1048,517),(981,520),(929,507),(907,474),(894,442)],
'umjjil':[(930,239),(985,235),(1005,276),(1040,290),(1047,337),(1043,387),(1008,401),(972,367),(922,352),(919,324),(926,302)],
'hwaaaa':[(1348,18),(1432,12),(1479,96),(1491,190),(1487,282),(1475,330),(1431,329),(1413,291),(1387,246),(1378,177),(1381,124),(1340,110),(1340,89),(1345,58)],
'bureureut-pink':[(1402,294),(1442,292),(1478,329),(1488,393),(1504,513),(1509,555),(1467,572),(1438,552),(1409,495),(1391,397),(1389,333)],
'haang':[(279,148),(310,142),(340,163),(356,210),(356,269),(349,302),(355,318),(337,333),(287,331),(273,315),(257,270),(250,207),(260,170)],
'meoeong':[(1182,36),(1339,34),(1364,78),(1377,127),(1389,145),(1382,161),(1323,167),(1275,148),(1191,127),(1177,92)],
'haa-eung':[(818,370),(848,356),(877,377),(899,401),(899,461),(914,507),(901,539),(881,554),(854,551),(823,531),(803,495),(795,442),(800,407)]
}
paper={'eung','haang','haa-eung'}
out=ROOT/'public/sticker-assets/pink-reactions'
reports=[]
# Bright original stroke components define letter boundaries, not diagonal crop lines.
cores,n=label(rgb.max(axis=2)>205)
_,nearest=distance_transform_edt(cores==0,return_indices=True)
owners=cores[tuple(nearest)]
ids={'umjjil':[105],'chu-eup':[147],'pang':[130,131,140,141],'meoeong':[3,19,36,41]}
# Wide stair-step separations travel through gaps between neighboring words.
regions['kkulleong']=[(879,500),(981,500),(981,574),(1026,574),(1026,626),(1052,626),(1052,700),(991,700),(991,672),(944,672),(944,631),(882,631),(882,549),(894,549),(894,529),(879,529)]
regions['haljjak']=[(762,536),(816,536),(816,588),(878,588),(878,642),(895,642),(895,705),(838,705),(838,679),(789,679),(789,648),(743,648),(743,621),(730,621),(730,545),(762,545)]
# Keep all of first 화; change the left boundary only below the first syllable.
regions['hwaaaa']=[(1330,8),(1450,8),(1501,110),(1501,328),(1420,328),(1410,276),(1380,227),(1378,177),(1384,122),(1330,122)]
regions['bureureut-pink']=[(1385,292),(1516,292),(1516,579),(1385,579)]
for slug in ['kkulleong','haljjak','eung','chu-eup','pang','umjjil','hwaaaa','bureureut-pink','meoeong']:
 points=regions[slug];mask=Image.new('L',source.size);ImageDraw.Draw(mask).polygon(points,fill=255);m=np.array(mask)>0
 if slug in ids:
  support=np.isin(owners,ids[slug]);m=support
  if slug=='meoeong':
   extra=Image.new('L',source.size);ImageDraw.Draw(extra).ellipse((1380,132,1394,148),fill=255);m=m|(np.array(extra)>0)
 if slug=='kkulleong':m=m&(owners==132)
 if slug=='eung':
  roi=np.zeros(source.size[::-1],bool);roi[509:694,636:735]=True
  yy,xx=np.indices(roi.shape);ell=((xx-(684+.13*(yy-600)))/43)**2+((yy-600)/88)**2<=1
  bright=(rgb.max(axis=2)>100)&ell
  filled=binary_fill_holes(bright)
  ll,nn=label(filled);sizes=np.bincount(ll.ravel());sizes[0]=0;body=ll==sizes.argmax()
  body=binary_fill_holes(body);m=binary_dilation(body,iterations=5)&binary_dilation(ell,iterations=3)
  aa=np.maximum(alpha*m,body.astype(float))
 else:aa=alpha*m
 pix=rgba.copy();pix[:,:,3]=np.round(aa*255).astype('uint8')
 if slug in ['kkulleong','haljjak']:
  ink=(rgb[:,:,0]>140)&(rgb[:,:,0]-rgb[:,:,1]>45)&(rgb[:,:,0]-rgb[:,:,2]>30)&m
  yy,xx=np.indices(ink.shape)
  if slug=='kkulleong':ink&=~((xx<895)&(yy>523)&(yy<548))
  if slug=='haljjak':
   ink&=~((yy<540)|((xx<762)&(yy<545)))
  ink_support=distance_transform_edt(~ink)<=7
  pix[:,:,3]*=ink_support
  if slug=='kkulleong':pix[:,:,3][(xx<890)&(yy<542)]=0

 if slug=='eung':
  opaque=body;pix[:,:,:3][opaque]=rgb[opaque].astype('uint8')
  yy,xx=np.indices(body.shape);alien=(rgb[:,:,0]-rgb[:,:,1]>50)&(rgb[:,:,0]-rgb[:,:,2]>25)&(yy<540)&(xx>690);pix[:,:,3][alien]=0
 # Separate the actual red/pink overlap by ink color, not a diagonal clipping line.
 if slug in ['hwaaaa','bureureut-pink']:
  red=(rgb[:,:,0]-rgb[:,:,2]>55)&(rgb[:,:,0]-rgb[:,:,1]>45)&(rgb[:,:,0]>160)
  pink=(rgb[:,:,2]-rgb[:,:,1]>55)&(rgb[:,:,0]-rgb[:,:,2]<55)&(rgb[:,:,0]-rgb[:,:,1]>65)
  near_red=distance_transform_edt(~red);near_pink=distance_transform_edt(~pink)
  yy,xx=np.indices(red.shape)
  if slug=='hwaaaa':
   keep=near_red<=near_pink;pix[:,:,3]*=keep
  else:
   keep=(yy>366)|(near_pink<near_red);pix[:,:,3]*=keep
 # Remove disconnected neighbor flecks while retaining small hearts and ellipsis dots.
 ll,nn=label(aa>.25);sizes=np.bincount(ll.ravel());keep=np.where(sizes>=6)[0];keep=keep[keep!=0]
 support=binary_dilation(np.isin(ll,keep),iterations=4);pix[:,:,3]*=support
 # Only the source's genuinely overlapped portions reuse matching source pixels.
 if slug=='bureureut-pink':
  # Recover the genuinely occluded first 뷰 from the intact 뷰 in 뷰릇, at native scale.
  x0,y0,x1,y1=1240,390,1345,490
  local=rgb[y0:y1,x0:x1];ink=(local[:,:,0]>140)&(local[:,:,2]-local[:,:,1]>45)&(local[:,:,0]-local[:,:,1]>65)
  il,nn=label(ink);_,ip=distance_transform_edt(il==0,return_indices=True);io=il[tuple(ip)]
  ink_sizes=np.bincount(il.ravel());ink_sizes[0]=0;chosen=[int(ink_sizes.argmax()),il[465-y0,1280-x0]]
  chosen=[k for k in chosen if k]
  # Each core component belongs to this syllable; neighboring 릇 cores are excluded.
  sel=np.isin(il,chosen);sup=np.isin(io,chosen)&(distance_transform_edt(~sel)<=8)
  patch_pixels=rgba[y0:y1,x0:x1].copy();patch_pixels[:,:,3]*=sup
  patch=Image.fromarray(patch_pixels,'RGBA')
  pix[:370,:,3]=0
  layer=Image.fromarray(pix,'RGBA');layer.alpha_composite(patch,(x0+149,y0-108));pix=np.array(layer)
 if slug=='hwaaaa':
  # The original last 아 intersects 뷰. Reuse the preceding intact 아 at native scale.
  copied=rgba.copy();yy,xx=np.indices(alpha.shape);copied[:,:,3][(yy<187)&(xx>1449)]=0
  patch=Image.fromarray(copied,'RGBA').crop((1397,177,1474,244))
  pix[242:,:,3]=0
  layer=Image.fromarray(pix,'RGBA');layer.alpha_composite(patch,(1407,243));cap_pixels=rgba.copy();yy,xx=np.indices(alpha.shape);cap_pixels[:,:,3]*=((owners==131)&(yy>=439));cap=Image.fromarray(cap_pixels,'RGBA').crop((985,438,1020,463));layer.alpha_composite(cap,(1449,298));pix=np.array(layer)
 im=Image.fromarray(pix,'RGBA');bbox=im.getbbox();im=im.crop(bbox);padded=Image.new('RGBA',(im.width+32,im.height+32));padded.alpha_composite(im,(16,16));padded.save(out/(slug+'-v2.png'),optimize=True)
 reports.append(dict(slug=slug,sourceBox=list(bbox),padding=16,size=list(padded.size),polygon=points,source='source-6842.png',method='original-pixel precision extraction'))
(ROOT/'docs/assets/pink-reactions/precision-extraction.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
# Review on a dark ground as well as a light one; glows must not hide missing strokes.
for name,bgcolor in [('dark','#15202b'),('light','#e5e5e5')]:
 sheet=Image.new('RGB',(1500,4*430),bgcolor);d=ImageDraw.Draw(sheet)
 for i,r in enumerate(reports):
  im=Image.open(out/(r['slug']+'-v2.png'));im=im.resize((im.width*2,im.height*2));im.thumbnail((450,370));x=i%3*500+(500-im.width)//2;y=i//3*430;sheet.paste(im,(x,y+8),im);d.text((i%3*500+12,y+397),r['slug'],fill='white' if name=='dark' else 'black')
 sheet.save(ROOT.parent/('precision-review-'+name+'.png'))
print('Extracted',len(reports),'original-pixel assets')
