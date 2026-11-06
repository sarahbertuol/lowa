const {chromium}=require(process.argv[2]);const path=require("path"),os=require("os");
const out=process.argv[3];const sites=JSON.parse(process.argv[4]);
async function prep(p){
 for(const t of ["Reject","Rejeitar","Recusar","Reject all"]){const btn=p.getByRole("button",{name:t,exact:true});if(await btn.count()){await btn.first().click().catch(()=>{});break}}
 await p.evaluate(async()=>{const H=document.documentElement.scrollHeight;for(let y=0;y<H;y+=250){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0)});
 await p.waitForTimeout(1500);
 await p.addStyleTag({content:"*{animation-play-state:paused!important} [class*=whats],[class*=WhatsApp],a[href*='wa.me'][style*=fixed]{}"});}
(async()=>{const b=await chromium.launch({executablePath:path.join(os.homedir(),"AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe")});
await Promise.all(Object.entries(sites).map(async([name,[u,mode]])=>{try{
 const opt=mode==="m"?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}};
 const p=await b.newPage(opt);try{await p.goto(u,{waitUntil:"load",timeout:60000})}catch(e){}
 await p.waitForTimeout(3000);await prep(p);
 await p.screenshot({path:path.join(out,`${name}-${mode}.png`),fullPage:true});console.log("ok",name,mode);await p.close()}catch(e){console.log("ERR",name,e.message)}}));
await b.close();})();
