import { useState, useRef, useEffect, useCallback } from "react";

const GROQ_KEY_STORAGE = "rat_groq_key";
const APP_VERSION = "1.3.0";

const NEWS_TOPICS = [
  { id: "cctv", label: "AI + Security", query: "AI security surveillance cameras 2025", emoji: "📷", color: "#e74c3c" },
  { id: "solar", label: "AI + Solar & Energy", query: "AI solar energy power Nigeria 2025", emoji: "⚡", color: "#f39c12" },
  { id: "webdev", label: "AI + Web & Apps", query: "AI web development tools 2025", emoji: "💻", color: "#3498db" },
  { id: "general", label: "Hot AI News", query: "artificial intelligence news Africa 2025", emoji: "🤖", color: "#2ecc71" },
];

function drawConfusedGuy(ctx, x, y, size, speaking, dim) {
  ctx.save(); ctx.globalAlpha = dim ? 0.4 : 1;
  const s = size / 120; ctx.translate(x - size / 2, y - size / 2); ctx.scale(s, s);
  ctx.fillStyle = "#1e3a5f"; roundRect(ctx, 30, 70, 60, 46, 10); ctx.fill();
  ctx.fillStyle = "#fff"; roundRect(ctx, 48, 70, 11, 20, 2); ctx.fill(); roundRect(ctx, 61, 70, 11, 20, 2); ctx.fill();
  ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.moveTo(60,73); ctx.lineTo(55,87); ctx.lineTo(60,92); ctx.lineTo(65,87); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#f0b97a"; roundRect(ctx, 52, 57, 16, 15, 5); ctx.fill();
  ctx.beginPath(); ctx.ellipse(60, 44, 27, 29, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#2c1a0e"; ctx.beginPath(); ctx.ellipse(60, 17, 27, 11, 0, 0, Math.PI*2); ctx.fill(); ctx.fillRect(33,17,54,13);
  ctx.fillStyle="white"; ctx.beginPath(); ctx.ellipse(49,42,6.5,speaking?7.5:5.5,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(71,42,6.5,speaking?7.5:5.5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#1a1a2e"; ctx.beginPath(); ctx.arc(50.5,43,3.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(72.5,43,3.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="white"; ctx.beginPath(); ctx.arc(51.5,41.5,1.1,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(73.5,41.5,1.1,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#2c1a0e"; ctx.lineWidth=2.5; ctx.lineCap="round";
  ctx.beginPath(); ctx.moveTo(43,33); ctx.quadraticCurveTo(49.5,28.5,56,33); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(64,33); ctx.quadraticCurveTo(70.5,28.5,77,33); ctx.stroke();
  if(speaking){ctx.fillStyle="#c0392b"; ctx.beginPath(); ctx.ellipse(60,58.5,7.5,5.5,0,0,Math.PI*2); ctx.fill();}
  else{ctx.strokeStyle="#c0392b"; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(52,58); ctx.quadraticCurveTo(60,64,68,58); ctx.stroke();}
  ctx.fillStyle="#dfa060"; ctx.beginPath(); ctx.ellipse(33,44,5,7.5,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(87,44,5,7.5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#1e3a5f"; roundRect(ctx,12,72,18,9,4.5); ctx.fill(); roundRect(ctx,90,72,18,9,4.5); ctx.fill();
  if(!speaking){ctx.fillStyle="white"; ctx.beginPath(); ctx.arc(96,20,15,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="#1e3a5f"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(96,20,15,0,Math.PI*2); ctx.stroke(); ctx.fillStyle="#1e3a5f"; ctx.font="bold 17px sans-serif"; ctx.textAlign="center"; ctx.fillText("?",96,26);}
  ctx.restore();
}

function drawSmartGuy(ctx, x, y, size, speaking, dim) {
  ctx.save(); ctx.globalAlpha = dim ? 0.4 : 1;
  const s = size / 120; ctx.translate(x - size / 2, y - size / 2); ctx.scale(s, s);
  ctx.fillStyle="#0f3460"; roundRect(ctx,28,70,64,46,10); ctx.fill();
  ctx.fillStyle="#0a2040"; roundRect(ctx,33,77,20,16,4); ctx.fill();
  ctx.fillStyle="#2ecc71"; roundRect(ctx,39,73,3.5,14,1.5); ctx.fill();
  ctx.fillStyle="#e74c3c"; roundRect(ctx,45,73,3.5,12,1.5); ctx.fill();
  ctx.fillStyle="#c97c4a"; roundRect(ctx,52,57,16,15,5); ctx.fill();
  ctx.beginPath(); ctx.ellipse(60,43,26,28,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#1a0800"; ctx.beginPath(); ctx.ellipse(60,16,26,10,0,0,Math.PI*2); ctx.fill(); ctx.fillRect(34,16,52,12);
  ctx.strokeStyle="#1a1a2e"; ctx.lineWidth=2.2;
  roundRect(ctx,41,37,15,11,4.5); ctx.stroke(); roundRect(ctx,64,37,15,11,4.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(56,42.5); ctx.lineTo(64,42.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(34,42.5); ctx.lineTo(41,42.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(79,42.5); ctx.lineTo(86,42.5); ctx.stroke();
  ctx.fillStyle="white"; ctx.beginPath(); ctx.ellipse(48.5,42.5,4.5,speaking?5.5:4,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(71.5,42.5,4.5,speaking?5.5:4,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#1a1a2e"; ctx.beginPath(); ctx.arc(49.5,43,2.8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(72.5,43,2.8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="white"; ctx.beginPath(); ctx.arc(50.5,41.5,0.9,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(73.5,41.5,0.9,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="#1a0800"; ctx.lineWidth=2.5; ctx.lineCap="round";
  ctx.beginPath(); ctx.moveTo(43,34); ctx.quadraticCurveTo(48.5,31,54,34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(66,34); ctx.quadraticCurveTo(71.5,31,77,34); ctx.stroke();
  if(speaking){ctx.fillStyle="#7b1f1f"; ctx.beginPath(); ctx.ellipse(60,57,7,4.5,0,0,Math.PI*2); ctx.fill();}
  else{ctx.strokeStyle="#7b1f1f"; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(52,56); ctx.quadraticCurveTo(60,61,68,56); ctx.stroke();}
  ctx.fillStyle="#b36840"; ctx.beginPath(); ctx.ellipse(34,43,5,7.5,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(86,43,5,7.5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#0f3460"; roundRect(ctx,10,72,18,9,4.5); ctx.fill(); roundRect(ctx,92,72,18,9,4.5); ctx.fill();
  if(speaking){ctx.fillStyle="#fff9e0"; ctx.beginPath(); ctx.arc(96,18,15,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="#f39c12"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(96,18,15,0,Math.PI*2); ctx.stroke(); ctx.font="16px sans-serif"; ctx.textAlign="center"; ctx.fillText("💡",96,24);}
  ctx.restore();
}

function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

function drawFrame(canvas,script,currentLine,displayLine,selectedNews,topicEmoji,mouthOpen){
  const ctx=canvas.getContext("2d"),W=canvas.width,H=canvas.height;
  const grad=ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,"#0d1b2e"); grad.addColorStop(0.5,"#0a2540"); grad.addColorStop(1,"#081828");
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#2ecc71"; ctx.font="bold 22px sans-serif"; ctx.textAlign="center"; ctx.fillText("Rollyadams Techworld",W/2,52);
  if(selectedNews?.title){ctx.fillStyle="rgba(46,204,113,0.12)"; roundRect(ctx,20,68,W-40,56,12); ctx.fill(); ctx.strokeStyle="rgba(46,204,113,0.3)"; ctx.lineWidth=1.5; roundRect(ctx,20,68,W-40,56,12); ctx.stroke(); ctx.fillStyle="#4ade80"; ctx.font="bold 18px sans-serif"; ctx.fillText((topicEmoji+" "+selectedNews.title).slice(0,55)+"...",W/2,102);}
  const charY=H*0.48,charSize=140;
  const g1s=currentLine>=0&&script[currentLine]?.speaker===0&&mouthOpen;
  const g2s=currentLine>=0&&script[currentLine]?.speaker===1&&mouthOpen;
  const g1d=currentLine>=0&&script[currentLine]?.speaker===1;
  const g2d=currentLine>=0&&script[currentLine]?.speaker===0;
  drawConfusedGuy(ctx,W*0.27,charY,charSize,g1s,g1d); drawSmartGuy(ctx,W*0.73,charY,charSize,g2s,g2d);
  ctx.font="bold 16px sans-serif"; ctx.textAlign="center"; ctx.fillStyle="#4b6a8a";
  ctx.fillText("Guy 1",W*0.27,charY+charSize*0.5+18); ctx.fillText("Guy 2",W*0.73,charY+charSize*0.5+18);
  if(displayLine&&currentLine>=0){
    const barY=H-140; ctx.fillStyle="rgba(8,20,40,0.93)"; roundRect(ctx,16,barY,W-32,90,14); ctx.fill();
    const sc=script[currentLine]?.speaker===0?"● GUY 1":"● GUY 2"; const sc2=script[currentLine]?.speaker===0?"#7dd3fc":"#4ade80";
    ctx.fillStyle=sc2; ctx.font="bold 14px sans-serif"; ctx.fillText(sc,W/2,barY+22);
    ctx.fillStyle="#f8fafc"; ctx.font="bold 20px sans-serif";
    const words=displayLine.split(" "); let l="",lines=[];
    for(const w of words){const t=l+w+" "; if(ctx.measureText(t).width>W-64&&l){lines.push(l.trim());l=w+" ";}else l=t;} if(l)lines.push(l.trim());
    lines.slice(0,2).forEach((ln,i)=>ctx.fillText(ln,W/2,barY+48+i*26));
  }
  if(script.length>0&&currentLine>=0){
    const dotY=H-36,ds=18,tw=script.length*ds,sx=W/2-tw/2;
    script.forEach((_,i)=>{ctx.fillStyle=i===currentLine?"#2ecc71":i<currentLine?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.12)"; const dw=i===currentLine?20:7; roundRect(ctx,sx+i*ds-dw/2,dotY-3.5,dw,7,3.5); ctx.fill();});
  }
}

function ConfusedGuy({speaking=false,size=120,dim=false}){
  return(<svg width={size} height={size} viewBox="0 0 120 120" fill="none" style={{transition:"filter 0.3s,transform 0.3s",filter:dim?"brightness(0.45)":"brightness(1)",transform:speaking?"scale(1.06)":"scale(1)"}}>
    <rect x="30" y="70" width="60" height="46" rx="10" fill="#1e3a5f"/>
    <rect x="48" y="70" width="11" height="20" rx="2" fill="#fff"/><rect x="61" y="70" width="11" height="20" rx="2" fill="#fff"/>
    <polygon points="60,73 55,87 60,92 65,87" fill="#2ecc71"/>
    <rect x="52" y="57" width="16" height="15" rx="5" fill="#f0b97a"/>
    <ellipse cx="60" cy="44" rx="27" ry="29" fill="#f0b97a"/>
    <ellipse cx="60" cy="17" rx="27" ry="11" fill="#2c1a0e"/><rect x="33" y="17" width="54" height="13" fill="#2c1a0e"/>
    <ellipse cx="49" cy="42" rx="6.5" ry={speaking?7.5:5.5} fill="white"/><ellipse cx="71" cy="42" rx="6.5" ry={speaking?7.5:5.5} fill="white"/>
    <circle cx="50.5" cy="43" r="3.2" fill="#1a1a2e"/><circle cx="72.5" cy="43" r="3.2" fill="#1a1a2e"/>
    <circle cx="51.5" cy="41.5" r="1.1" fill="white"/><circle cx="73.5" cy="41.5" r="1.1" fill="white"/>
    <path d="M43 33 Q49.5 28.5 56 33" stroke="#2c1a0e" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M64 33 Q70.5 28.5 77 33" stroke="#2c1a0e" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {speaking?<ellipse cx="60" cy="58.5" rx="7.5" ry="5.5" fill="#c0392b"/>:<path d="M52 58 Q60 64 68 58" stroke="#c0392b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
    <ellipse cx="33" cy="44" rx="5" ry="7.5" fill="#dfa060"/><ellipse cx="87" cy="44" rx="5" ry="7.5" fill="#dfa060"/>
    <rect x="12" y="72" width="18" height="9" rx="4.5" fill="#1e3a5f"/><rect x="90" y="72" width="18" height="9" rx="4.5" fill="#1e3a5f"/>
    {!speaking&&(<g><circle cx="96" cy="20" r="15" fill="white" stroke="#1e3a5f" strokeWidth="2"/><text x="96" y="26" textAnchor="middle" fontSize="17" fill="#1e3a5f" fontWeight="bold" fontFamily="sans-serif">?</text></g>)}
  </svg>);
}

function SmartGuy({speaking=false,size=120,dim=false}){
  return(<svg width={size} height={size} viewBox="0 0 120 120" fill="none" style={{transition:"filter 0.3s,transform 0.3s",filter:dim?"brightness(0.45)":"brightness(1)",transform:speaking?"scale(1.06)":"scale(1)"}}>
    <rect x="28" y="70" width="64" height="46" rx="10" fill="#0f3460"/>
    <rect x="33" y="77" width="20" height="16" rx="4" fill="#0a2040"/>
    <rect x="39" y="73" width="3.5" height="14" rx="1.5" fill="#2ecc71"/><rect x="45" y="73" width="3.5" height="12" rx="1.5" fill="#e74c3c"/>
    <rect x="52" y="57" width="16" height="15" rx="5" fill="#c97c4a"/>
    <ellipse cx="60" cy="43" rx="26" ry="28" fill="#c97c4a"/>
    <ellipse cx="60" cy="16" rx="26" ry="10" fill="#1a0800"/><rect x="34" y="16" width="52" height="12" fill="#1a0800"/>
    <rect x="41" y="37" width="15" height="11" rx="4.5" fill="none" stroke="#1a1a2e" strokeWidth="2.2"/>
    <rect x="64" y="37" width="15" height="11" rx="4.5" fill="none" stroke="#1a1a2e" strokeWidth="2.2"/>
    <line x1="56" y1="42.5" x2="64" y2="42.5" stroke="#1a1a2e" strokeWidth="2.2"/>
    <line x1="34" y1="42.5" x2="41" y2="42.5" stroke="#1a1a2e" strokeWidth="1.8"/>
    <line x1="79" y1="42.5" x2="86" y2="42.5" stroke="#1a1a2e" strokeWidth="1.8"/>
    <ellipse cx="48.5" cy="42.5" rx="4.5" ry={speaking?5.5:4} fill="white"/><ellipse cx="71.5" cy="42.5" rx="4.5" ry={speaking?5.5:4} fill="white"/>
    <circle cx="49.5" cy="43" r="2.8" fill="#1a1a2e"/><circle cx="72.5" cy="43" r="2.8" fill="#1a1a2e"/>
    <circle cx="50.5" cy="41.5" r="0.9" fill="white"/><circle cx="73.5" cy="41.5" r="0.9" fill="white"/>
    <path d="M43 34 Q48.5 31 54 34" stroke="#1a0800" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M66 34 Q71.5 31 77 34" stroke="#1a0800" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {speaking?<ellipse cx="60" cy="57" rx="7" ry="4.5" fill="#7b1f1f"/>:<path d="M52 56 Q60 61 68 56" stroke="#7b1f1f" strokeWidth="2.5" fill="none" strokeLinecap="round"/>}
    <ellipse cx="34" cy="43" rx="5" ry="7.5" fill="#b36840"/><ellipse cx="86" cy="43" rx="5" ry="7.5" fill="#b36840"/>
    <rect x="10" y="72" width="18" height="9" rx="4.5" fill="#0f3460"/><rect x="92" y="72" width="18" height="9" rx="4.5" fill="#0f3460"/>
    {speaking&&(<g><circle cx="96" cy="18" r="15" fill="#fff9e0" stroke="#f39c12" strokeWidth="2"/><text x="96" y="24" textAnchor="middle" fontSize="16" fontFamily="sans-serif">💡</text></g>)}
  </svg>);
}

function SubtitleBar({text,speaker}){
  if(!text)return null;
  return(<div style={{position:"absolute",bottom:56,left:14,right:14,background:"rgba(8,20,40,0.93)",borderRadius:14,padding:"10px 16px",textAlign:"center",backdropFilter:"blur(12px)",border:"1px solid rgba(255,255,255,0.08)"}}>
    <div style={{fontSize:10,color:speaker===0?"#7dd3fc":"#4ade80",fontFamily:"'Nunito',sans-serif",fontWeight:900,marginBottom:4,letterSpacing:1.5,textTransform:"uppercase"}}>{speaker===0?"● Guy 1":"● Guy 2"}</div>
    <div style={{fontSize:14,color:"#f8fafc",fontFamily:"'Nunito',sans-serif",fontWeight:700,lineHeight:1.5}}>{text}</div>
  </div>);
}

function ProgressDots({total,current}){
  return(<div style={{display:"flex",justifyContent:"center",gap:5,padding:"8px 0"}}>
    {Array.from({length:total}).map((_,i)=>(<div key={i} style={{width:i===current?22:7,height:7,borderRadius:3.5,background:i===current?"#2ecc71":i<current?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.15)",transition:"all 0.35s ease"}}/>))}
  </div>);
}

function Screen({children,bg="#f0f4f8",style={}}){
  return(<div style={{minHeight:"100dvh",width:"100%",maxWidth:430,margin:"0 auto",background:bg,fontFamily:"'Nunito',sans-serif",position:"relative",overflowX:"hidden",...style}}>{children}</div>);
}

function TopNav({onBack,title,light=false}){
  return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 12px",background:light?"rgba(255,255,255,0.08)":"transparent"}}>
    <button onClick={onBack} style={{background:light?"rgba(255,255,255,0.12)":"#f1f5f9",border:"none",width:38,height:38,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:light?"#fff":"#0a2540"}}>←</button>
    <div style={{fontSize:15,fontWeight:800,color:light?"#fff":"#0a2540"}}>{title}</div>
    <div style={{width:38}}/>
  </div>);
}

function LoadingOverlay({message}){
  return(<div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(10,37,64,0.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,backdropFilter:"blur(6px)"}}>
    <div style={{display:"flex",gap:16}}>
      <div style={{animation:"float 2s ease-in-out infinite"}}><ConfusedGuy speaking={false} size={70}/></div>
      <div style={{animation:"float 2s ease-in-out infinite 1s"}}><SmartGuy speaking={true} size={70}/></div>
    </div>
    <div style={{color:"#2ecc71",fontSize:15,fontWeight:800,textAlign:"center",maxWidth:220}}>{message}</div>
    <div style={{display:"flex",gap:6}}>
      {[0,1,2].map(i=>(<div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#2ecc71",animation:`pulse 1.2s ease-in-out infinite ${i*0.2}s`}}/>))}
    </div>
  </div>);
}

export default function App(){
  const [screen,setScreen]=useState("splash");
  const [groqKey,setGroqKey]=useState(()=>localStorage.getItem(GROQ_KEY_STORAGE)||"");
  const [keyInput,setKeyInput]=useState("");
  const [topic,setTopic]=useState(null);
  const [newsItems,setNewsItems]=useState([]);
  const [selectedNews,setSelectedNews]=useState(null);
  const [script,setScript]=useState([]);
  const [loading,setLoading]=useState(false);
  const [loadMsg,setLoadMsg]=useState("");
  const [error,setError]=useState("");
  const [approvedQueue,setApprovedQueue]=useState(()=>{try{return JSON.parse(localStorage.getItem("rat_queue")||"[]");}catch{return[];}});
  const [playing,setPlaying]=useState(false);
  const [currentLine,setCurrentLine]=useState(-1);
  const [displayLine,setDisplayLine]=useState("");
  const [mouthOpen,setMouthOpen]=useState(false);
  const playingRef=useRef(false);
  const canvasRef=useRef(null);
  const [exporting,setExporting]=useState(false);
  const [exportProgress,setExportProgress]=useState(0);
  const [videoURL,setVideoURL]=useState("");

  const topicObj=()=>NEWS_TOPICS.find(t=>t.id===topic)||NEWS_TOPICS[3];
  const saveQueue=(q)=>{setApprovedQueue(q);localStorage.setItem("rat_queue",JSON.stringify(q));};
  const saveKey=()=>{if(!keyInput.trim())return;localStorage.setItem(GROQ_KEY_STORAGE,keyInput.trim());setGroqKey(keyInput.trim());setError("");setScreen("topicSelect");};

  const fetchNews=useCallback(async(topicId)=>{
    const key=localStorage.getItem(GROQ_KEY_STORAGE)||groqKey;
    if(!key){setError("No API key found. Please enter your Groq API key first.");setScreen("setup");return;}
    setLoading(true);setError("");setLoadMsg("📡 Searching latest AI news...");setTopic(topicId);
    const t=NEWS_TOPICS.find(x=>x.id===topicId);
    try{
      const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body:JSON.stringify({
          model:"llama-3.3-70b-versatile",max_tokens:1000,temperature:0.3,
          messages:[{role:"user",content:`List 5 recent AI technology news stories about: "${t.query}". Relevant to Nigerian/African businesses.\n\nReturn ONLY a JSON array, absolutely no other text:\n[{"title":"headline","summary":"2-3 sentence summary","source":"Publication","pubDate":"2025"}]\n\nReturn exactly 5 items.`}]
        })
      });
      const data=await res.json();
      if(!res.ok){throw new Error(data.error?.message||`HTTP ${res.status}`);}
      const text=data.choices?.[0]?.message?.content||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const si=clean.indexOf("["),ei=clean.lastIndexOf("]")+1;
      if(si===-1)throw new Error("No JSON found in response: "+clean.slice(0,100));
      const parsed=JSON.parse(clean.slice(si,ei));
      if(!parsed.length)throw new Error("Empty news list returned");
      setNewsItems(parsed.filter(i=>i.title?.length>5));
      setScreen("news");
    }catch(e){
      setError("❌ "+e.message);
      setScreen("topicSelect");
    }finally{setLoading(false);}
  },[groqKey]);

  const generateScript=useCallback(async(news)=>{
    const key=localStorage.getItem(GROQ_KEY_STORAGE)||groqKey;
    setSelectedNews(news);setLoading(true);setError("");setLoadMsg("✍️ Writing your script...");
    try{
      const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${key}`},
        body:JSON.stringify({
          model:"llama3-8b-8192",max_tokens:900,temperature:0.8,
          messages:[
            {role:"system",content:`Write short punchy explainer scripts for Instagram Reels for Rollyadams Techworld Nigeria (Solar, CCTV, Web/Apps). Guy 1 (speaker 0) = confused businessman, short questions. Guy 2 (speaker 1) = tech expert, clear answers. English. 6-8 lines. Max 20 words per line. End mentioning Rollyadams Techworld.`},
            {role:"user",content:`Script for: "${news.title}"\n\nReturn ONLY valid JSON array:\n[{"speaker":0,"line":"..."},{"speaker":1,"line":"..."}]`}
          ]
        })
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error?.message||`HTTP ${res.status}`);
      const text=data.choices?.[0]?.message?.content||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean.slice(clean.indexOf("["),clean.lastIndexOf("]")+1));
      if(!Array.isArray(parsed)||!parsed.length)throw new Error("Empty script");
      setScript(parsed);setScreen("script");
    }catch(e){setError("❌ "+e.message);setScreen("news");}
    finally{setLoading(false);}
  },[groqKey]);

  const speak=useCallback((text,speaker,onEnd)=>{
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(text);
    utt.rate=speaker===0?0.88:1.0;utt.pitch=speaker===0?0.95:1.1;utt.volume=1;
    const voices=window.speechSynthesis.getVoices();
    const v=voices.find(v=>v.lang.startsWith("en"))||voices[0];
    if(v)utt.voice=v;
    utt.onend=()=>{if(playingRef.current)onEnd();};
    utt.onerror=()=>{if(playingRef.current)onEnd();};
    window.speechSynthesis.speak(utt);
  },[]);

  const playScript=useCallback(()=>{
    if(!script.length)return;
    playingRef.current=true;setPlaying(true);setCurrentLine(0);
    let idx=0;
    const playLine=()=>{
      if(!playingRef.current||idx>=script.length){setPlaying(false);setCurrentLine(-1);setDisplayLine("");setMouthOpen(false);playingRef.current=false;return;}
      setCurrentLine(idx);setDisplayLine(script[idx].line);setMouthOpen(true);
      speak(script[idx].line,script[idx].speaker,()=>{setMouthOpen(false);idx++;setTimeout(playLine,350);});
    };
    playLine();
  },[script,speak]);

  const stopPlay=useCallback(()=>{playingRef.current=false;window.speechSynthesis.cancel();setPlaying(false);setCurrentLine(-1);setDisplayLine("");setMouthOpen(false);},[]);

  const exportVideo=useCallback(async()=>{
    if(!script.length||!canvasRef.current)return;
    setExporting(true);setExportProgress(0);setVideoURL("");
    const canvas=canvasRef.current;canvas.width=540;canvas.height=960;
    const canvasStream=canvas.captureStream(30);
    const mimeType=MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";
    const recorder=new MediaRecorder(canvasStream,{mimeType,videoBitsPerSecond:2500000});
    const chunks=[];
    recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
    drawFrame(canvas,[],- 1,"",selectedNews,topicObj().emoji,false);
    recorder.start(100);
    let mouthState=false,blinkInterval=null;
    const stopBlink=()=>{if(blinkInterval){clearInterval(blinkInterval);blinkInterval=null;}};
    const processLine=(idx)=>new Promise((resolve)=>{
      if(idx>=script.length){resolve();return;}
      const line=script[idx];setCurrentLine(idx);setDisplayLine(line.line);
      stopBlink();mouthState=true;
      blinkInterval=setInterval(()=>{mouthState=!mouthState;drawFrame(canvas,script,idx,line.line,selectedNews,topicObj().emoji,mouthState);},180);
      setExportProgress(Math.round((idx/script.length)*90));
      const utt=new SpeechSynthesisUtterance(line.line);
      utt.rate=line.speaker===0?0.88:1.0;utt.pitch=line.speaker===0?0.95:1.1;
      const voices=window.speechSynthesis.getVoices();const v=voices.find(v=>v.lang.startsWith("en"))||voices[0];if(v)utt.voice=v;
      utt.onend=()=>{stopBlink();mouthState=false;drawFrame(canvas,script,idx,line.line,selectedNews,topicObj().emoji,false);setTimeout(resolve,350);};
      utt.onerror=()=>{stopBlink();resolve();};
      window.speechSynthesis.speak(utt);
    });
    for(let i=0;i<script.length;i++)await processLine(i);
    setCurrentLine(-1);setDisplayLine("");
    drawFrame(canvas,script,-1,"",selectedNews,topicObj().emoji,false);
    await new Promise(r=>setTimeout(r,800));
    setExportProgress(95);recorder.stop();
    recorder.onstop=()=>{const blob=new Blob(chunks,{type:"video/webm"});setVideoURL(URL.createObjectURL(blob));setExportProgress(100);setExporting(false);setScreen("done");};
  },[script,selectedNews,topic]);

  const approvePost=()=>{saveQueue([{id:Date.now(),topic:topicObj().label,topicEmoji:topicObj().emoji,news:selectedNews,script,approvedAt:new Date().toLocaleString("en-GB")},...approvedQueue]);setScreen("approved");};

  useEffect(()=>{window.speechSynthesis.getVoices();window.speechSynthesis.onvoiceschanged=()=>window.speechSynthesis.getVoices();return()=>{window.speechSynthesis.cancel();};},[]);

  if(screen==="splash")return(
    <Screen bg="linear-gradient(160deg,#0a1628 0%,#0f2744 50%,#0a2540 100%)">
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100dvh",padding:"0 28px"}}>
        <div style={{display:"flex",gap:28,alignItems:"flex-end",marginBottom:36}}>
          <div style={{animation:"float 3.2s ease-in-out infinite"}}><ConfusedGuy speaking={false} size={95}/></div>
          <div style={{animation:"float 3.2s ease-in-out infinite 1.6s"}}><SmartGuy speaking={true} size={95}/></div>
        </div>
        <div style={{fontSize:11,color:"#2ecc71",letterSpacing:4,textTransform:"uppercase",fontWeight:900,marginBottom:10}}>Rollyadams Techworld</div>
        <h1 style={{color:"#fff",fontSize:36,fontWeight:900,textAlign:"center",margin:"0 0 12px",lineHeight:1.15}}>AI Content<br/>Engine</h1>
        <p style={{color:"#7dd3fc",fontSize:15,textAlign:"center",margin:"0 0 52px",lineHeight:1.65,maxWidth:260}}>Find AI news → Script → Animated video → Download</p>
        <button onClick={()=>setScreen(groqKey?"topicSelect":"setup")} style={{background:"linear-gradient(135deg,#2ecc71,#1fa355)",border:"none",color:"#fff",padding:"17px 52px",borderRadius:50,fontSize:17,fontWeight:900,cursor:"pointer",boxShadow:"0 8px 36px rgba(46,204,113,0.38)"}}>Get Started →</button>
        {approvedQueue.length>0&&<button onClick={()=>setScreen("queue")} style={{marginTop:16,background:"none",border:"none",color:"#4b6a8a",fontSize:13,cursor:"pointer",fontWeight:700}}>📋 Queue ({approvedQueue.length})</button>}
        <div style={{position:"absolute",bottom:20,color:"#1e3a5f",fontSize:11}}>v{APP_VERSION}</div>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.97)}}`}</style>
    </Screen>
  );

  if(screen==="setup")return(
    <Screen>
      <TopNav onBack={()=>setScreen("splash")} title="API Setup"/>
      <div style={{padding:"24px 24px 40px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:52,marginBottom:14}}>🔑</div>
          <h2 style={{color:"#0a2540",fontSize:24,fontWeight:900,marginBottom:8}}>Connect Groq AI</h2>
          <p style={{color:"#64748b",fontSize:14,lineHeight:1.7}}>Free at <strong style={{color:"#0f3460"}}>console.groq.com</strong><br/>Sign up → API Keys → Create key</p>
        </div>
        {[["1","Go to console.groq.com"],["2","Sign up (free)"],["3","Click API Keys in sidebar"],["4","Create key → copy it"],["5","Paste below"]].map(([n,s])=>(
          <div key={n} style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"#0f3460",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,flexShrink:0}}>{n}</div>
            <div style={{fontSize:14,color:"#334155",fontWeight:600}}>{s}</div>
          </div>
        ))}
        <input type="password" value={keyInput} onChange={e=>setKeyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveKey()} placeholder="gsk_..." style={{width:"100%",padding:"15px 16px",borderRadius:14,border:"2px solid #e2e8f0",fontSize:15,fontFamily:"monospace",boxSizing:"border-box",outline:"none",color:"#0a2540",background:"#f8fafc",marginTop:20}}/>
        {error&&<div style={{color:"#e74c3c",fontSize:13,marginTop:8,padding:"8px 12px",background:"#fef2f2",borderRadius:8}}>⚠️ {error}</div>}
        <button onClick={saveKey} disabled={!keyInput.trim()} style={{width:"100%",marginTop:14,padding:16,borderRadius:14,border:"none",background:keyInput.trim()?"linear-gradient(135deg,#0a2540,#0f3460)":"#e2e8f0",color:keyInput.trim()?"#fff":"#94a3b8",fontSize:16,fontWeight:800,cursor:keyInput.trim()?"pointer":"not-allowed"}}>Save & Continue →</button>
      </div>
    </Screen>
  );

  if(screen==="topicSelect")return(
    <Screen>
      {loading&&<LoadingOverlay message={loadMsg}/>}
      <div style={{padding:"48px 24px 40px"}}>
        <div style={{marginBottom:28}}>
          <div style={{fontSize:12,color:"#94a3b8",fontWeight:800,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Today's Content</div>
          <h2 style={{color:"#0a2540",fontSize:26,fontWeight:900}}>Pick a Topic</h2>
          <p style={{color:"#64748b",fontSize:14,marginTop:4}}>Groq AI finds the latest news for it</p>
        </div>
        {error&&(
          <div style={{background:"#fef2f2",border:"2px solid #fecaca",borderRadius:12,padding:"14px 16px",marginBottom:20}}>
            <div style={{color:"#e74c3c",fontSize:14,fontWeight:700,marginBottom:6}}>Error</div>
            <div style={{color:"#7f1d1d",fontSize:13,lineHeight:1.5}}>{error}</div>
            <button onClick={()=>{setError("");setScreen("setup");}} style={{marginTop:10,padding:"8px 16px",borderRadius:8,border:"none",background:"#e74c3c",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Re-enter API Key</button>
          </div>
        )}
        <div style={{display:"grid",gap:14}}>
          {NEWS_TOPICS.map(t=>(
            <button key={t.id} onClick={()=>fetchNews(t.id)} style={{padding:20,borderRadius:16,border:"2px solid #e8f0fe",background:"#fff",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:16,boxShadow:"0 2px 12px rgba(0,0,0,0.05)"}}>
              <div style={{width:52,height:52,borderRadius:14,background:`${t.color}18`,border:`2px solid ${t.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{t.emoji}</div>
              <div><div style={{fontSize:16,fontWeight:800,color:"#0a2540"}}>{t.label}</div><div style={{fontSize:12,color:"#94a3b8",marginTop:2,fontWeight:600}}>Tap to find latest news</div></div>
              <div style={{marginLeft:"auto",color:"#cbd5e1",fontSize:18}}>›</div>
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:24}}>
          <button onClick={()=>{setError("");setScreen("setup");}} style={{flex:1,padding:12,borderRadius:12,border:"2px solid #e2e8f0",background:"transparent",color:"#94a3b8",fontSize:13,fontWeight:700,cursor:"pointer"}}>⚙️ API Key</button>
          {approvedQueue.length>0&&<button onClick={()=>setScreen("queue")} style={{flex:1,padding:12,borderRadius:12,border:"2px solid #e2e8f0",background:"transparent",color:"#0f3460",fontSize:13,fontWeight:700,cursor:"pointer"}}>📋 Queue ({approvedQueue.length})</button>}
        </div>
      </div>
    </Screen>
  );

  if(screen==="news")return(
    <Screen>
      {loading&&<LoadingOverlay message={loadMsg}/>}
      <TopNav onBack={()=>setScreen("topicSelect")} title={topicObj().label}/>
      <div style={{padding:"8px 20px 40px"}}>
        <p style={{color:"#64748b",fontSize:13,marginBottom:20,fontWeight:600}}>Pick a story to build your script</p>
        {error&&<div style={{color:"#e74c3c",fontSize:13,marginBottom:16,padding:"12px 16px",background:"#fef2f2",borderRadius:12}}>⚠️ {error}</div>}
        {newsItems.length===0&&!loading?(
          <div style={{textAlign:"center",paddingTop:60}}>
            <div style={{fontSize:40,marginBottom:12}}>📭</div>
            <div style={{color:"#94a3b8",fontWeight:700}}>No stories found</div>
            <button onClick={()=>setScreen("topicSelect")} style={{marginTop:20,padding:"12px 28px",borderRadius:12,background:"#0f3460",color:"#fff",border:"none",cursor:"pointer",fontWeight:800}}>Try Another Topic</button>
          </div>
        ):(
          <div style={{display:"grid",gap:14}}>
            {newsItems.map((n,i)=>(
              <button key={i} onClick={()=>generateScript(n)} style={{padding:18,borderRadius:16,border:"2px solid #e8f0fe",background:"#fff",cursor:"pointer",textAlign:"left",boxShadow:"0 2px 10px rgba(0,0,0,0.05)"}}>
                <div style={{fontSize:15,fontWeight:800,color:"#0a2540",marginBottom:8,lineHeight:1.45}}>{n.title}</div>
                {n.summary&&<div style={{fontSize:12,color:"#64748b",lineHeight:1.55,marginBottom:10}}>{n.summary.slice(0,110)}...</div>}
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontSize:11,color:"#94a3b8",fontWeight:700}}>{n.source}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{n.pubDate}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        <button onClick={()=>fetchNews(topic)} style={{width:"100%",marginTop:16,padding:13,borderRadius:12,border:"2px solid #e2e8f0",background:"transparent",color:"#0f3460",fontSize:14,fontWeight:800,cursor:"pointer"}}>🔄 Refresh Stories</button>
      </div>
    </Screen>
  );

  if(screen==="script")return(
    <Screen>
      {loading&&<LoadingOverlay message={loadMsg}/>}
      <TopNav onBack={()=>setScreen("news")} title="Review Script"/>
      <div style={{padding:"8px 20px 120px"}}>
        <p style={{color:"#64748b",fontSize:13,marginBottom:16,fontWeight:600}}>Edit any line before exporting</p>
        <div style={{background:"#f0f9ff",border:"2px solid #bae6fd",borderRadius:14,padding:14,marginBottom:20}}>
          <div style={{fontSize:10,color:"#0284c7",fontWeight:900,letterSpacing:1.5,textTransform:"uppercase",marginBottom:5}}>{topicObj().emoji} Story</div>
          <div style={{fontSize:13,color:"#0a2540",fontWeight:700,lineHeight:1.5}}>{selectedNews?.title}</div>
        </div>
        <div style={{display:"grid",gap:12}}>
          {script.map((line,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:line.speaker===0?"#f8fafc":"#f0fdf4",border:`2px solid ${line.speaker===0?"#e2e8f0":"#bbf7d0"}`,borderRadius:14,padding:14}}>
              <div style={{flexShrink:0,marginTop:2}}>{line.speaker===0?<ConfusedGuy speaking={false} size={38}/>:<SmartGuy speaking={false} size={38}/>}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:10,fontWeight:900,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6,color:line.speaker===0?"#64748b":"#16a34a"}}>{line.speaker===0?"Guy 1":"Guy 2"}</div>
                <textarea value={line.line} onChange={e=>{const u=[...script];u[i]={...u[i],line:e.target.value};setScript(u);}} rows={2} style={{width:"100%",border:"none",background:"transparent",fontSize:14,color:"#0a2540",fontFamily:"'Nunito',sans-serif",fontWeight:700,resize:"none",outline:"none",lineHeight:1.55,boxSizing:"border-box"}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"#fff",borderTop:"2px solid #e2e8f0",padding:"14px 20px 24px",display:"flex",gap:10,boxSizing:"border-box",boxShadow:"0 -4px 24px rgba(0,0,0,0.08)"}}>
        <button onClick={()=>generateScript(selectedNews)} style={{flex:1,padding:14,borderRadius:12,border:"2px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:13,fontWeight:800,cursor:"pointer"}}>🔄 Redo</button>
        <button onClick={approvePost} style={{flex:1,padding:14,borderRadius:12,border:"2px solid #bbf7d0",background:"#f0fdf4",color:"#16a34a",fontSize:13,fontWeight:800,cursor:"pointer"}}>✅ Approve</button>
        <button onClick={()=>setScreen("preview")} style={{flex:2,padding:14,borderRadius:12,border:"none",background:"linear-gradient(135deg,#0a2540,#0f3460)",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer"}}>▶ Preview</button>
      </div>
    </Screen>
  );

  if(screen==="preview")return(
    <div style={{minHeight:"100dvh",width:"100%",maxWidth:430,margin:"0 auto",background:"#08111e",fontFamily:"'Nunito',sans-serif",position:"relative",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <TopNav onBack={()=>{stopPlay();setScreen("script");}} title="Preview" light/>
      <div style={{flex:1,position:"relative",background:"linear-gradient(180deg,#0d1b2e 0%,#0a2540 55%,#081828 100%)",display:"flex",flexDirection:"column"}}>
        <div style={{textAlign:"center",paddingTop:14,paddingBottom:6}}>
          <div style={{fontSize:11,color:"#2ecc71",fontWeight:900,letterSpacing:3,textTransform:"uppercase"}}>Rollyadams Techworld</div>
        </div>
        {selectedNews&&(<div style={{margin:"0 16px 12px",background:"rgba(46,204,113,0.1)",border:"1px solid rgba(46,204,113,0.25)",borderRadius:10,padding:"9px 14px",textAlign:"center"}}><div style={{fontSize:12,color:"#4ade80",fontWeight:700,lineHeight:1.4}}>{selectedNews.title?.slice(0,65)}...</div></div>)}
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:16,padding:"0 12px",position:"relative"}}>
          <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
            <ConfusedGuy speaking={playing&&currentLine>=0&&script[currentLine]?.speaker===0&&mouthOpen} dim={playing&&currentLine>=0&&script[currentLine]?.speaker===1} size={115}/>
            <div style={{fontSize:10,color:"#4b6a8a",fontWeight:800,letterSpacing:1,marginTop:6,textTransform:"uppercase"}}>Guy 1</div>
          </div>
          <div style={{width:1.5,height:70,background:"linear-gradient(180deg,transparent 0%,#2ecc71 50%,transparent 100%)",opacity:0.4,flexShrink:0}}/>
          <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
            <SmartGuy speaking={playing&&currentLine>=0&&script[currentLine]?.speaker===1&&mouthOpen} dim={playing&&currentLine>=0&&script[currentLine]?.speaker===0} size={115}/>
            <div style={{fontSize:10,color:"#4b6a8a",fontWeight:800,letterSpacing:1,marginTop:6,textTransform:"uppercase"}}>Guy 2</div>
          </div>
        </div>
        <SubtitleBar text={playing&&currentLine>=0?displayLine:""} speaker={playing&&currentLine>=0?script[currentLine]?.speaker:0}/>
        {playing&&script.length>0&&<ProgressDots total={script.length} current={currentLine}/>}
      </div>
      <canvas ref={canvasRef} style={{display:"none"}}/>
      <div style={{padding:"14px 18px 32px",background:"#08111e"}}>
        {!playing?(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button onClick={playScript} style={{padding:15,borderRadius:14,border:"none",background:"linear-gradient(135deg,#2ecc71,#1fa355)",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer"}}>▶ Play</button>
            <button onClick={exportVideo} style={{padding:15,borderRadius:14,border:"none",background:"linear-gradient(135deg,#e74c3c,#c0392b)",color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer"}}>⬇ Export</button>
            <button onClick={()=>setScreen("script")} style={{padding:13,borderRadius:12,border:"2px solid #1e3a5f",background:"transparent",color:"#4b6a8a",fontSize:13,fontWeight:800,cursor:"pointer"}}>← Edit</button>
            <button onClick={approvePost} style={{padding:13,borderRadius:12,border:"2px solid #16a34a",background:"transparent",color:"#2ecc71",fontSize:13,fontWeight:800,cursor:"pointer"}}>✅ Approve</button>
          </div>
        ):(
          <button onClick={stopPlay} style={{width:"100%",padding:16,borderRadius:14,border:"none",background:"#e74c3c",color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer"}}>⏹ Stop</button>
        )}
      </div>
      {exporting&&(
        <div style={{position:"fixed",inset:0,background:"rgba(8,17,30,0.96)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,zIndex:999}}>
          <div style={{display:"flex",gap:16}}>
            <div style={{animation:"float 2s ease-in-out infinite"}}><ConfusedGuy speaking={false} size={70}/></div>
            <div style={{animation:"float 2s ease-in-out infinite 1s"}}><SmartGuy speaking={true} size={70}/></div>
          </div>
          <div style={{color:"#2ecc71",fontSize:16,fontWeight:800}}>Rendering video...</div>
          <div style={{width:240,height:8,background:"#1e3a5f",borderRadius:4,overflow:"hidden"}}>
            <div style={{width:`${exportProgress}%`,height:"100%",background:"linear-gradient(90deg,#2ecc71,#1fa355)",borderRadius:4,transition:"width 0.3s ease"}}/>
          </div>
          <div style={{color:"#4b6a8a",fontSize:13,fontWeight:700}}>{exportProgress}%</div>
          <div style={{color:"#2a4a6a",fontSize:12,textAlign:"center",maxWidth:220}}>Keep screen on & unmute your phone</div>
        </div>
      )}
    </div>
  );

  if(screen==="approved")return(
    <Screen>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100dvh",padding:"0 28px",textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:16}}>✅</div>
        <h2 style={{color:"#0a2540",fontSize:28,fontWeight:900,marginBottom:8}}>Approved!</h2>
        <p style={{color:"#64748b",fontSize:15,lineHeight:1.7,marginBottom:36}}>Script saved to your queue.<br/>Go to Preview to export the video.</p>
        <div style={{display:"grid",gap:12,width:"100%"}}>
          <button onClick={()=>setScreen("preview")} style={{padding:16,borderRadius:14,border:"none",background:"linear-gradient(135deg,#0a2540,#0f3460)",color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer"}}>🎬 Export Video</button>
          <button onClick={()=>setScreen("queue")} style={{padding:14,borderRadius:14,border:"2px solid #e2e8f0",background:"#f8fafc",color:"#0a2540",fontSize:15,fontWeight:800,cursor:"pointer"}}>📋 View Queue ({approvedQueue.length})</button>
          <button onClick={()=>{setScreen("topicSelect");setScript([]);setSelectedNews(null);}} style={{padding:14,borderRadius:14,border:"none",background:"transparent",color:"#94a3b8",fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Create Another</button>
        </div>
      </div>
    </Screen>
  );

  if(screen==="done")return(
    <Screen>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100dvh",padding:"0 28px",textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:16}}>🎉</div>
        <h2 style={{color:"#0a2540",fontSize:28,fontWeight:900,marginBottom:8}}>Video Ready!</h2>
        <p style={{color:"#64748b",fontSize:14,lineHeight:1.7,marginBottom:32}}>Download and post to Instagram Reels or TikTok</p>
        <div style={{display:"grid",gap:12,width:"100%"}}>
          {videoURL&&<a href={videoURL} download="rollyadams-reel.webm" style={{display:"block",padding:17,borderRadius:14,background:"linear-gradient(135deg,#2ecc71,#1fa355)",color:"#fff",fontSize:16,fontWeight:900,textDecoration:"none",boxSizing:"border-box",boxShadow:"0 6px 24px rgba(46,204,113,0.35)"}}>⬇ Download Video</a>}
          <button onClick={()=>setScreen("preview")} style={{padding:14,borderRadius:14,border:"2px solid #e2e8f0",background:"#f8fafc",color:"#0a2540",fontSize:15,fontWeight:800,cursor:"pointer"}}>🔁 Export Again</button>
          <button onClick={()=>{setScreen("topicSelect");setScript([]);setSelectedNews(null);setVideoURL("");}} style={{padding:14,borderRadius:14,border:"none",background:"transparent",color:"#94a3b8",fontSize:14,fontWeight:700,cursor:"pointer"}}>+ New Post</button>
        </div>
        <div style={{marginTop:32,background:"#f0f9ff",border:"2px solid #bae6fd",borderRadius:14,padding:18,width:"100%",textAlign:"left"}}>
          <div style={{fontSize:12,color:"#0284c7",fontWeight:900,letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>📱 Posting Tips</div>
          {["Post 9–11am or 6–8pm WAT for best reach","Add 5–8 hashtags in caption","Pin post to your profile","Share to your story same day"].map((tip,i)=>(<div key={i} style={{fontSize:13,color:"#0a2540",fontWeight:600,marginBottom:6}}>• {tip}</div>))}
        </div>
      </div>
    </Screen>
  );

  if(screen==="queue")return(
    <Screen>
      <TopNav onBack={()=>setScreen("topicSelect")} title={`Queue (${approvedQueue.length})`}/>
      <div style={{padding:"8px 20px 40px"}}>
        {approvedQueue.length===0?(
          <div style={{textAlign:"center",paddingTop:60}}><div style={{fontSize:40,marginBottom:12}}>📭</div><div style={{color:"#94a3b8",fontWeight:700}}>No approved posts yet</div></div>
        ):(
          <div style={{display:"grid",gap:14}}>
            {approvedQueue.map((post,i)=>(
              <div key={post.id} style={{background:"#fff",border:"2px solid #e2e8f0",borderRadius:16,padding:18,boxShadow:"0 2px 10px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:13,fontWeight:800,color:"#0f3460"}}>{post.topicEmoji} {post.topic}</span>
                  <span style={{fontSize:11,color:"#94a3b8"}}>{post.approvedAt}</span>
                </div>
                <div style={{fontSize:14,color:"#0a2540",fontWeight:700,marginBottom:10,lineHeight:1.4}}>{post.news?.title?.slice(0,70)}...</div>
                <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>{post.script?.length} lines</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setScript(post.script);setSelectedNews(post.news);setTopic(NEWS_TOPICS.find(t=>t.label===post.topic)?.id||"general");setScreen("preview");}} style={{flex:1,padding:10,borderRadius:10,border:"none",background:"#0f3460",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>▶ Preview & Export</button>
                  <button onClick={()=>saveQueue(approvedQueue.filter((_,j)=>j!==i))} style={{padding:"10px 14px",borderRadius:10,border:"2px solid #fee2e2",background:"transparent",color:"#e74c3c",fontSize:13,fontWeight:800,cursor:"pointer"}}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );

  return null;
}
