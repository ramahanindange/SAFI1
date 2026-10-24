import base64,json
s=open('src.html',encoding='utf-8').read()
b64=lambda p:'data:image/webp;base64,'+base64.b64encode(open(p,'rb').read()).decode()
cut={k:b64('cut/%s.webp'%k) for k in ['woman','man']}
s=s.replace('<script src="https://cdnjs','<script>(function(){var C=window.__CUT='+json.dumps(cut)+';document.querySelectorAll("img[data-cut]").forEach(function(i){i.src=C[i.dataset.cut]})})();</script>\n<script src="https://cdnjs',1)
s=s.replace('/*DATA*/',open('data.js',encoding='utf-8').read())
s=s.replace('/*S3D*/','window.__SCENE='+open('prod/scene.json').read()+';\nwindow.__BOT='+open('prod/bottles.json').read()+';\nwindow.__PROPS='+open('prod/props.json').read()+';\n'+open('safi3d.js',encoding='utf-8').read())
assert '{{' not in s
open('index.html','w',encoding='utf-8').write(s);print(len(s))
