const {chromium}=require(process.argv[2]);const path=require("path"),os=require("os");
const out=process.argv[3];const sites=JSON.parse(process.argv[4]);
async function prep(p){
 for(const t of ["Reject","Rejeitar","Recusar","Reject all"]){const btn=p.getByRole("button",{name:t,exact:true});if(await btn.count()){await btn.first().click().catch(()=>{});break}}
 await p.evaluate(async()=>{const H=document.documentElement.scrollHeight;for(let y=0;y<H;y+=300){scrollTo(0,y);await new Promise(r=>setTimeout(r,90))}scrollTo(0,0)});
 await p.waitForTimeout(1200);}
(async()=>{const b=await chromium.launch({executablePath:path.join(os.homedir(),"AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe")});
await Promise.all(Object.entries(sites).map(async([name,u])=>{
 try{
 const d=await b.newPage({viewport:{width:1440,height:900}});
 try{await d.goto(u,{waitUntil:"load",timeout:60000})}catch(e){}
 await d.waitForTimeout(3000);await prep(d);
 const H=await d.evaluate(()=>document.documentElement.scrollHeight);
 const stops=[0,0.22,0.45,0.68].map(f=>Math.round(Math.min(f*H,H-900)));
 for(let i=0;i<stops.length;i++){await d.evaluate(y=>scrollTo(0,y),stops[i]);await d.waitForTimeout(1300);await d.screenshot({path:path.join(out,`${name}-d${i}.png`)})}
 await d.close();
 const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 try{await m.goto(u,{waitUntil:"load",timeout:60000})}catch(e){}
 await m.waitForTimeout(3000);await prep(m);
 await m.screenshot({path:path.join(out,`${name}-m0.png`)});
 const Hm=await m.evaluate(()=>document.documentElement.scrollHeight);
 await m.evaluate(y=>scrollTo(0,y),Math.round(Hm*0.3));await m.waitForTimeout(1300);await m.screenshot({path:path.join(out,`${name}-m1.png`)});
 await m.close();console.log("ok",name,H);
 }catch(e){console.log("ERR",name,e.message)}
}));
await b.close();})();
