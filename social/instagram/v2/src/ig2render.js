const {chromium}=require(process.argv[2]);const path=require("path"),os=require("os"),fs=require("fs"),{pathToFileURL}=require("url");
const dir=process.argv[3],out=process.argv[4],only=process.argv[5];
delete require.cache[path.join(dir,"posts.js")];const {POSTS}=require(path.join(dir,"posts.js"));
(async()=>{const b=await chromium.launch({executablePath:path.join(os.homedir(),"AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe"),args:["--allow-file-access-from-files"]});
const base=pathToFileURL(path.join(dir,"render.html")).href;
for(const P of POSTS){if(only&&!only.split(",").includes(P.id))continue;const f=path.join(out,P.id);fs.rmSync(f,{recursive:true,force:true});fs.mkdirSync(f,{recursive:true});
 for(let i=0;i<P.slides.length;i++){const w=P.slides[i].w||1080;const p=await b.newPage({viewport:{width:w,height:1350}});
  await p.goto(`${base}?p=${P.id}&s=${i}`);await p.waitForFunction(()=>window.done,null,{timeout:30000});
  if(P.pano){for(let k=0;k<P.pano;k++)await p.screenshot({path:path.join(f,`${String(k+1).padStart(2,"0")}.png`),clip:{x:k*1080,y:0,width:1080,height:1350}})}
  else await (await p.$(".slide")).screenshot({path:path.join(f,`${String(i+1).padStart(2,"0")}.png`)});
  if(P.video){const holes=await p.evaluate(()=>window.holes());fs.writeFileSync(path.join(f,"holes.json"),JSON.stringify(holes));
   await p.goto(`${base}?p=${P.id}&s=${i}&mode=top`);await p.waitForFunction(()=>window.done,null,{timeout:30000});
   await (await p.$(".slide")).screenshot({path:path.join(f,"top.png"),omitBackground:true})}
  await p.close()}
 console.log(P.id)}
await b.close()})();
