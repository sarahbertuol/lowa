const {chromium}=require(process.argv[2]);const path=require("path"),os=require("os"),fs=require("fs"),{pathToFileURL}=require("url");
const dir=process.argv[3],out=process.argv[4],only=process.argv[5];
const {POSTS,ORDER}=require(path.join(dir,"posts.js"));
(async()=>{const b=await chromium.launch({executablePath:path.join(os.homedir(),"AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe"),args:["--allow-file-access-from-files"]});
const p=await b.newPage({viewport:{width:1080,height:1350}});const base=pathToFileURL(path.join(dir,"render.html")).href;
for(const [oi,id] of ORDER.entries()){if(only&&!only.split(",").includes(id))continue;const P=POSTS.find(x=>x.id===id);
 const f=path.join(out,`${String(oi+1).padStart(2,"0")}-${id}`);fs.mkdirSync(f,{recursive:true});
 for(let i=0;i<P.slides.length;i++){await p.goto(`${base}?p=${id}&s=${i}`);await p.waitForFunction(()=>window.done,null,{timeout:30000});
  await (await p.$(".slide")).screenshot({path:path.join(f,`${String(i+1).padStart(2,"0")}.png`)})}
 console.log(id,P.slides.length)}
await b.close()})();
