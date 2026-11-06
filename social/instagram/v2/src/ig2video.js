const {execFileSync}=require("child_process"),fs=require("fs"),path=require("path");
const [ff,dir,outDir]=process.argv.slice(2);
for(const id of fs.readdirSync(path.join(dir,"out"))){const f=path.join(dir,"out",id);if(!fs.existsSync(path.join(f,"holes.json")))continue;
 const holes=JSON.parse(fs.readFileSync(path.join(f,"holes.json")));const h=holes[0];
 const T=12,ease="(0.5-0.5*cos(PI*clip((t-1)/10,0,1)))";
 const pre=h.crop?`crop=iw:${h.crop}:0:0,`:"";
 const fc=`[1:v]${pre}scale=${h.w}:-2,crop=${h.w}:${h.h}:0:'(in_h-out_h)*${ease}'[v];[0:v][v]overlay=${h.x}:${h.y}[a];[a][2:v]overlay=0:0,format=yuv420p[o]`;
 const out=path.join(outDir,id+".mp4");
 execFileSync(ff,["-v","error","-y","-loop","1","-framerate","30","-t",""+T,"-i",path.join(f,"01.png"),"-loop","1","-framerate","30","-t",""+T,"-i",path.join(dir,h.src),"-loop","1","-framerate","30","-t",""+T,"-i",path.join(f,"top.png"),
  "-filter_complex",fc,"-map","[o]","-t",""+T,"-c:v","libx264","-preset","slow","-crf","18","-r","30","-movflags","+faststart",out]);
 console.log("ok",id)}
