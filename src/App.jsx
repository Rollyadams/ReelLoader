import { useState, useCallback, useRef, useEffect } from "react";

const KEY_STORAGE = "reelloader_v4";
const HISTORY_STORAGE = "reelloader_history_v4";
const APP_VERSION = "4.0.0";
const MODEL = "llama-3.3-70b-versatile";

const clean = (s) => (s || "").replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/#{1,6}\s/g, "").trim();

const CATEGORIES = [
  { id: "tech", icon: "⚙️", label: "Tech Concepts", color: "#3b82f6",
    topics: ["What is an API?", "What is a Webhook?", "How does DNS work?", "What is Cloud Computing?", "What is a Database?", "What is DevOps?", "How does HTTPS work?", "What is Docker?", "What is Kubernetes?", "What is a CDN?"] },
  { id: "ai", icon: "🤖", label: "AI Explained", color: "#8b5cf6",
    topics: ["How does ChatGPT work?", "What is Machine Learning?", "What is a Neural Network?", "What is Prompt Engineering?", "How does AI image generation work?", "What is an LLM?", "What is Computer Vision?", "How does voice AI work?", "What is AI training?", "What is a Vector Database?"] },
  { id: "solar", icon: "⚡", label: "Solar & Energy", color: "#f59e0b",
    topics: ["How does a solar panel work?", "What is an inverter?", "How do solar batteries work?", "What is a charge controller?", "On-grid vs Off-grid solar", "How to size a solar system", "How AI optimizes solar systems", "What is net metering?", "Why solar panels lose efficiency", "What is a smart grid?"] },
  { id: "security", icon: "📷", label: "Security & CCTV", color: "#ef4444",
    topics: ["How does CCTV work?", "Analog vs IP cameras", "What is facial recognition?", "How does motion detection work?", "What is a DVR vs NVR?", "How do smart locks work?", "How does AI CCTV work?", "What is cyber security?", "What is two-factor authentication?", "How does a firewall work?"] },
  { id: "biztech", icon: "💼", label: "Business Tech", color: "#10b981",
    topics: ["What is SaaS?", "How does online payment work?", "What is business automation?", "What is CRM software?", "How does e-commerce work?", "What is a payment gateway?", "How does digital marketing work?", "What is a mobile app vs web app?", "How does data backup work?", "What is ERP software?"] },
];

// ─── GROQ ─────────────────────────────────────────────────────────────────────
async function groq(prompt, isArray = false) {
  const key = localStorage.getItem(KEY_STORAGE);
  if (!key) throw new Error("No API key. Tap ⚙ to add your Groq key.");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL, max_tokens: 2500, temperature: 0.6,
      messages: [
        { role: "system", content: "You are a JSON API. Return ONLY raw valid JSON — no markdown, no backticks, no asterisks inside string values, no bold, no italic, no explanation. Plain text in all string values. NEVER include brand names, company names, or website URLs inside shot voiceover or textOverlay fields." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  let text = (data.choices?.[0]?.message?.content || "").replace(/```json|```/gi, "").trim();
  const o = isArray ? "[" : "{", c = isArray ? "]" : "}";
  const si = text.indexOf(o), ei = text.lastIndexOf(c) + 1;
  if (si === -1) throw new Error("Invalid response. Please try again.");
  let parsed;
  try { parsed = JSON.parse(text.slice(si, ei)); }
  catch { parsed = JSON.parse(text.slice(si, ei).replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").replace(/,\s*([}\]])/g, "$1").replace(/[\u0000-\u001F]/g, " ")); }
  if (!parsed) return parsed;
  // Force-clean brand from last video shot
  if (Array.isArray(parsed?.shots) && parsed.shots.length > 0) {
    const last = parsed.shots[parsed.shots.length - 1];
    const nb = (s) => (s||"").replace(/rollyadams[\w\s]*?(nigeria)?/gi,"").replace(/rollyadamstechworld\.com\.ng/gi,"").replace(/\s{2,}/g," ").trim();
    last.voiceover = nb(last.voiceover);
    last.textOverlay = nb(last.textOverlay);
    last.visual = nb(last.visual);
  }
  return parsed;
}

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
function cardsPrompt(topic, catLabel) {
  return `Create 5 Instagram carousel cards explaining: "${topic}" (${catLabel}) for Rollyadams Techworld Nigeria.

RULES — plain text only, no markdown, no asterisks:
- Hook card: shocking question or fact, max 10 words
- Each card body: MAX 15 WORDS using analogy or contrast, never a definition
- Headlines: 2-4 words
- CTA: simple warm engagement ask — like, share, follow. No brand mention. Max 15 words.

GOOD body example: "The waiter between your app and the kitchen. You order. It delivers."
BAD body example: "An API is an interface that enables software systems to communicate."

Return ONLY this JSON:
{"hookCard":"max 10 word hook","cards":[{"headline":"2-4 words","body":"max 15 word analogy"},{"headline":"2-4 words","body":"max 15 word analogy"},{"headline":"2-4 words","body":"max 15 word analogy"},{"headline":"2-4 words","body":"max 15 word analogy"},{"headline":"2-4 words","body":"max 15 word analogy"}],"ctaCard":"simple engagement CTA like: If you found this helpful, like and share. Max 15 words.","caption":"caption under 150 chars","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8"]}`;
}

function videoPrompt(topic, catLabel, style) {
  const styleGuide = style === "A"
    ? "Style A: Text-only animation. Bold words appear/fade on black. Like motivational reels. Each shot: 1 powerful sentence or phrase. Short, punchy, rhythm-driven."
    : "Style B: Educational slides. Each shot has a headline, explanation, and visual direction. Like explainer videos. Clear, informative, builds understanding.";

  return `Write a 60-second educational video script about: "${topic}" (${catLabel}) for Rollyadams Techworld Nigeria.

${styleGuide}

Plain text only in all fields — no markdown, no asterisks, no bold formatting.

6 shots total. Each shot is 8-12 seconds.
Shot 1: Hook — most shocking or interesting fact
Shot 2: Why it matters to the viewer
Shot 3: Core concept explained simply
Shot 4: Real-world example
Shot 5: Key insight or takeaway
Shot 6: Simple closing line only. Example voiceover: "If you found this helpful, like and share." Example textOverlay: "Like. Share. Follow." NO brand names, NO company names, NO website URLs in shot 6.

Return ONLY this JSON:
{"title":"plain video title","audioVibe":"music description","keyTakeaway":"one sentence","shots":[{"timestamp":"00:00-00:10","textOverlay":"2-5 bold words for screen","voiceover":"what to say out loud","visual":"what to show or animate"},{"timestamp":"00:10-00:20","textOverlay":"2-5 bold words","voiceover":"spoken sentence","visual":"visual direction"},{"timestamp":"00:20-00:30","textOverlay":"2-5 bold words","voiceover":"spoken sentence","visual":"visual direction"},{"timestamp":"00:30-00:40","textOverlay":"2-5 bold words","voiceover":"spoken sentence","visual":"visual direction"},{"timestamp":"00:40-00:50","textOverlay":"2-5 bold words","voiceover":"spoken sentence","visual":"visual direction"},{"timestamp":"00:50-01:00","textOverlay":"2-5 bold words","voiceover":"spoken sentence","visual":"visual direction"}],"caption":"caption under 150 chars","hashtags":["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8"]}`;
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [c, setC] = useState(false);
  return <button onClick={() => { navigator.clipboard?.writeText(text); setC(true); setTimeout(() => setC(false), 2000); }} style={{ padding: "5px 12px", borderRadius: 4, border: `1px solid ${c ? "#d4af37" : "#2a2a2a"}`, background: c ? "#1a1400" : "transparent", color: c ? "#d4af37" : "#555", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{c ? "✓" : "Copy"}</button>;
}

function Spinner({ msg }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, gap: 20 }}>
      <div style={{ width: 44, height: 44, border: "3px solid #1a1400", borderTop: "3px solid #d4af37", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
      <div style={{ color: "#d4af37", fontSize: 14, fontWeight: 700, textAlign: "center", maxWidth: 240, lineHeight: 1.6 }}>{msg}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800;900&display=swap');`}</style>
    </div>
  );
}

const S = { fontFamily: "'Space Grotesk','Segoe UI',sans-serif" };

// ─── CARD SLIDE ───────────────────────────────────────────────────────────────
function CardSlide({ headline, body, num, total, isHook, isCta, topic }) {
  return (
    <div style={{ width: "100%", aspectRatio: "1/1", background: "#000", borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "28px 26px", boxSizing: "border-box", position: "relative", overflow: "hidden", border: "1px solid #1a1a1a" }}>
      <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,#d4af3712 0%,transparent 70%)", pointerEvents: "none" }} />
      {/* Top */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#d4af37", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>ReelLoader</span>
        <span style={{ fontSize: 10, color: "#2a2a2a" }}>{isHook ? "●●●●●●●" : isCta ? "✦" : `${num}/${total}`}</span>
      </div>
      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 0" }}>
        {isHook ? (
          <>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>Did you know?</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.25 }}>{clean(headline)}</div>
          </>
        ) : isCta ? (
          <>
            <div style={{ width: 36, height: 3, background: "#d4af37", borderRadius: 2, marginBottom: 18 }} />
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.3, marginBottom: 12 }}>{clean(headline)}</div>
            {body && <div style={{ fontSize: 12, color: "#666" }}>{clean(body)}</div>}
          </>
        ) : (
          <>
            <div style={{ fontSize: 11, color: "#d4af37", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>{clean(headline)}</div>
            <div style={{ width: 28, height: 2, background: "#d4af37", opacity: 0.3, borderRadius: 1, marginBottom: 18 }} />
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>{clean(body)}</div>
          </>
        )}
      </div>
      {/* Bottom */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, color: "#2a2a2a" }}>rollyadamstechworld.com.ng</span>
        <span style={{ fontSize: 9, color: "#2a2a2a" }}>@rollyadamstechworld</span>
      </div>
    </div>
  );
}

// ─── CARDS VIEWER ─────────────────────────────────────────────────────────────
function CardsViewer({ data, topic, onClose }) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef(null);
  const allCards = [
    { isHook: true, headline: data.hookCard },
    ...(data.cards || []).map((c, i) => ({ headline: c.headline, body: c.body, num: i + 1, total: data.cards.length })),
    { isCta: true, headline: data.ctaCard },
  ];
  const onTouchStart = e => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (!touchX.current) return;
    const d = touchX.current - e.changedTouches[0].clientX;
    if (d > 50 && idx < allCards.length - 1) setIdx(i => i + 1);
    if (d < -50 && idx > 0) setIdx(i => i - 1);
    touchX.current = null;
  };
  const c = allCards[idx];
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000, display: "flex", flexDirection: "column", ...S }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #111" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>←</button>
        <div style={{ fontSize: 11, color: "#d4af37", fontWeight: 700 }}>{idx + 1} / {allCards.length}</div>
        <div style={{ fontSize: 10, color: "#2a2a2a" }}>Screenshot to save</div>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", userSelect: "none" }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <CardSlide {...c} topic={topic} />
        </div>
      </div>
      <div style={{ padding: "10px 20px 32px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 14 }}>
          {allCards.map((_, i) => <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? "#d4af37" : "#1a1a1a", transition: "all 0.3s", cursor: "pointer" }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={{ padding: "13px", background: "transparent", border: "1px solid #1a1a1a", color: idx === 0 ? "#222" : "#888", fontSize: 14, fontWeight: 700, cursor: idx === 0 ? "not-allowed" : "pointer", borderRadius: 4 }}>← Prev</button>
          <button onClick={() => setIdx(i => Math.min(allCards.length - 1, i + 1))} disabled={idx === allCards.length - 1} style={{ padding: "13px", background: idx === allCards.length - 1 ? "transparent" : "#d4af37", border: `1px solid ${idx === allCards.length - 1 ? "#1a1a1a" : "#d4af37"}`, color: idx === allCards.length - 1 ? "#222" : "#000", fontSize: 14, fontWeight: 700, cursor: idx === allCards.length - 1 ? "not-allowed" : "pointer", borderRadius: 4 }}>Next →</button>
        </div>
        <div style={{ marginTop: 14, background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 6, letterSpacing: 1 }}>CAPTION</div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5, marginBottom: 8 }}>{data.caption}</div>
          <CopyBtn text={`${data.caption}\n\n${data.hashtags?.join(" ")}`} />
        </div>
      </div>
    </div>
  );
}

// ─── VIDEO ANIMATOR ───────────────────────────────────────────────────────────
function VideoAnimator({ data, style, onClose }) {
  const [phase, setPhase] = useState("ready"); // ready | playing | recording | done
  const [shotIdx, setShotIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [videoURL, setVideoURL] = useState("");
  const [exportProgress, setExportProgress] = useState(0);
  const canvasRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const shots = data.shots || [];
  const touchX = useRef(null);

  const speak = (text, onEnd) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(clean(text));
    utt.rate = 0.88; utt.pitch = 0.92; utt.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    // Prefer deeper male voice — closest to Nigerian English tone
    const v = voices.find(v => v.name.includes("David") && v.lang.startsWith("en"))
      || voices.find(v => v.name.includes("James") && v.lang.startsWith("en"))
      || voices.find(v => v.name.includes("Daniel") && v.lang.startsWith("en"))
      || voices.find(v => v.name.includes("Male") && v.lang.startsWith("en"))
      || voices.find(v => v.lang === "en-GB")
      || voices.find(v => v.lang.startsWith("en"))
      || voices[0];
    if (v) utt.voice = v;
    utt.onend = onEnd; utt.onerror = onEnd;
    window.speechSynthesis.speak(utt);
  };

  // Manual browse
  const onTouchStart = e => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = e => {
    if (!touchX.current) return;
    const d = touchX.current - e.changedTouches[0].clientX;
    if (d > 50 && shotIdx < shots.length - 1) setShotIdx(i => i + 1);
    if (d < -50 && shotIdx > 0) setShotIdx(i => i - 1);
    touchX.current = null;
  };

  // Play preview
  const playPreview = useCallback(() => {
    setPhase("playing"); setShotIdx(0);
    let i = 0;
    const next = () => {
      if (i >= shots.length) { setPhase("ready"); setShotIdx(0); return; }
      setVisible(false);
      setTimeout(() => {
        setShotIdx(i);
        setVisible(true);
        speak(shots[i].voiceover, () => {
          i++;
          setTimeout(next, 600);
        });
      }, 150);
    };
    next();
  }, [shots]);

  // Canvas export
  const drawShotOnCanvas = (canvas, shot, videoStyle) => {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);

    if (videoStyle === "A") {
      // Style A: each word stacked, alternating white/gold
      const words = clean(shot.textOverlay).toUpperCase().split(" ");
      const fontSize = Math.floor(W * 0.09);
      ctx.font = `900 ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      const lineH = Math.floor(fontSize * 1.15);
      const totalH = words.length * lineH;
      const startY = H / 2 - totalH / 2 + fontSize * 0.8;
      words.forEach((w, wi) => {
        ctx.fillStyle = wi % 2 === 0 ? "#ffffff" : "#d4af37";
        ctx.fillText(w, W / 2, startY + wi * lineH);
      });
    } else {
      // Style B: slide layout
      ctx.fillStyle = "#d4af37";
      ctx.font = `bold ${Math.floor(W * 0.055)}px Space Grotesk, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(clean(shot.textOverlay), W / 2, H * 0.3);
      ctx.fillStyle = "rgba(212,175,55,0.3)";
      ctx.fillRect(W * 0.1, H * 0.35, W * 0.8, 2);
      ctx.fillStyle = "#cccccc";
      ctx.font = `${Math.floor(W * 0.038)}px Space Grotesk, sans-serif`;
      const words = clean(shot.voiceover).split(" ");
      let line = "", lines = [], maxW = W * 0.8;
      for (const w of words) { const t = line + w + " "; if (ctx.measureText(t).width > maxW && line) { lines.push(line.trim()); line = w + " "; } else line = t; }
      if (line) lines.push(line.trim());
      lines.slice(0, 3).forEach((l, li) => ctx.fillText(l, W / 2, H * 0.45 + li * Math.floor(W * 0.05)));
    }

    // Branding
    ctx.fillStyle = "#2a2a2a";
    ctx.font = `${Math.floor(W * 0.025)}px Space Grotesk, sans-serif`;
    ctx.textAlign = "left"; ctx.fillText("rollyadamstechworld.com.ng", W * 0.05, H * 0.95);
    ctx.textAlign = "right"; ctx.fillText("@rollyadamstechworld", W * 0.95, H * 0.95);

    // Timestamp
    ctx.fillStyle = "#333";
    ctx.font = `${Math.floor(W * 0.028)}px monospace`;
    ctx.textAlign = "center"; ctx.fillText(shot.timestamp, W / 2, H * 0.05);
  };

  const exportVideo = useCallback(async () => {
    if (!canvasRef.current) return;
    setPhase("recording"); setExportProgress(0);
    const canvas = canvasRef.current;
    canvas.width = 720; canvas.height = 1280;
    const stream = canvas.captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3000000 });
    chunksRef.current = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start(100);
    recorderRef.current = recorder;

    let mouthState = false, blinkInterval = null;
    const stopBlink = () => { if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; } };

    for (let i = 0; i < shots.length; i++) {
      setShotIdx(i);
      setExportProgress(Math.round((i / shots.length) * 90));
      stopBlink();
      drawShotOnCanvas(canvas, shots[i], style);
      blinkInterval = setInterval(() => {
        mouthState = !mouthState;
        drawShotOnCanvas(canvas, shots[i], style);
      }, 300);
      await new Promise(resolve => {
        const utt = new SpeechSynthesisUtterance(clean(shots[i].voiceover));
        utt.rate = 0.88; utt.pitch = 0.92; utt.volume = 1;
        const voices = window.speechSynthesis.getVoices();
        const v = voices.find(v => v.name.includes("David") && v.lang.startsWith("en"))
          || voices.find(v => v.name.includes("James") && v.lang.startsWith("en"))
          || voices.find(v => v.name.includes("Daniel") && v.lang.startsWith("en"))
          || voices.find(v => v.name.includes("Male") && v.lang.startsWith("en"))
          || voices.find(v => v.lang === "en-GB")
          || voices.find(v => v.lang.startsWith("en"))
          || voices[0];
        if (v) utt.voice = v;
        utt.onend = () => { stopBlink(); setTimeout(resolve, 300); };
        utt.onerror = () => { stopBlink(); resolve(); };
        window.speechSynthesis.speak(utt);
      });
    }

    stopBlink();
    setExportProgress(95);
    await new Promise(r => setTimeout(r, 500));
    recorder.stop();
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoURL(URL.createObjectURL(blob));
      setExportProgress(100);
      setPhase("done");
    };
  }, [shots, style]);

  const shot = shots[shotIdx] || {};

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000, display: "flex", flexDirection: "column", ...S }}>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #111" }}>
        <button onClick={() => { window.speechSynthesis.cancel(); onClose(); }} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#d4af37", fontWeight: 700 }}>{clean(data.title)}</div>
          <div style={{ fontSize: 10, color: "#333" }}>Style {style} · Shot {shotIdx + 1}/{shots.length}</div>
        </div>
        <div style={{ fontSize: 10, color: "#2a2a2a" }}>{phase === "playing" ? "▶" : "●"}</div>
      </div>

      {/* Video stage */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", userSelect: "none" }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div style={{ width: "100%", maxWidth: 320, aspectRatio: "9/16", background: "#000", borderRadius: 14, border: "1px solid #1a1a1a", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "24px 20px", boxSizing: "border-box", position: "relative", overflow: "hidden", transition: "opacity 0.15s ease", opacity: visible ? 1 : 0 }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%,#d4af3710 0%,transparent 60%)", pointerEvents: "none" }} />

          {/* Top */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: "#d4af37", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>ReelLoader</span>
            <span style={{ fontSize: 9, fontFamily: "monospace", color: "#2a2a2a" }}>{shot.timestamp}</span>
          </div>

          {/* Content */}
          {style === "A" ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0", flexDirection: "column", gap: 8 }}>
              {clean(shot.textOverlay).split(" ").map((word, wi) => (
                <div key={wi} style={{ fontSize: 36, fontWeight: 900, color: wi % 2 === 0 ? "#fff" : "#d4af37", lineHeight: 1.1, textAlign: "center", textTransform: "uppercase", letterSpacing: -1 }}>{word}</div>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "16px 0", gap: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#d4af37", textAlign: "center", lineHeight: 1.2 }}>{clean(shot.textOverlay)}</div>
              <div style={{ height: 2, background: "rgba(212,175,55,0.2)", borderRadius: 1 }} />
              <div style={{ fontSize: 13, color: "#ccc", textAlign: "center", lineHeight: 1.6, fontStyle: "italic" }}>{clean(shot.voiceover)}</div>
              <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: 1.5, marginBottom: 4 }}>VISUAL</div>
                <div style={{ fontSize: 11, color: "#555" }}>{clean(shot.visual)}</div>
              </div>
            </div>
          )}

          {/* Progress */}
          <div>
            <div style={{ height: 2, background: "#111", borderRadius: 1, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${((shotIdx + 1) / shots.length) * 100}%`, background: "#d4af37", transition: "width 0.3s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 8, color: "#1a1a1a" }}>rollyadamstechworld.com.ng</span>
              <span style={{ fontSize: 8, color: "#1a1a1a" }}>@rollyadamstechworld</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {phase === "ready" && (
        <div style={{ padding: "10px 20px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={playPreview} style={{ padding: "14px", background: "#0a0a0a", border: "1px solid #2a2a2a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>▶ Preview</button>
          <button onClick={exportVideo} style={{ padding: "14px", background: "#d4af37", border: "none", color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>⬇ Export MP4</button>
          <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "center", gap: 8 }}>
            {shots.map((_, i) => <div key={i} onClick={() => setShotIdx(i)} style={{ width: i === shotIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === shotIdx ? "#d4af37" : "#1a1a1a", transition: "all 0.3s", cursor: "pointer" }} />)}
          </div>
          <div style={{ gridColumn: "1/-1", fontSize: 11, color: "#2a2a2a", textAlign: "center" }}>Swipe to browse shots manually</div>
        </div>
      )}

      {phase === "playing" && (
        <div style={{ padding: "10px 20px 32px" }}>
          <button onClick={() => { window.speechSynthesis.cancel(); setPhase("ready"); setShotIdx(0); }} style={{ width: "100%", padding: "14px", background: "#1a1a1a", border: "none", color: "#888", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>⏹ Stop Preview</button>
        </div>
      )}

      {phase === "recording" && (
        <div style={{ padding: "20px 20px 32px" }}>
          <div style={{ height: 6, background: "#111", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", width: `${exportProgress}%`, background: "#d4af37", transition: "width 0.4s" }} />
          </div>
          <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 700, textAlign: "center", marginBottom: 6 }}>Rendering... {exportProgress}%</div>
          <div style={{ color: "#2a2a2a", fontSize: 11, textAlign: "center" }}>Keep screen on · Unmute your phone</div>
        </div>
      )}

      {phase === "done" && (
        <div style={{ padding: "10px 20px 32px", display: "grid", gap: 10 }}>
          <a href={videoURL} download="reelloader-video.webm" style={{ display: "block", padding: "15px", background: "#d4af37", border: "none", color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", borderRadius: 6, textAlign: "center", textDecoration: "none" }}>⬇ Download Video</a>
          <button onClick={() => { setPhase("ready"); setExportProgress(0); setVideoURL(""); setShotIdx(0); }} style={{ padding: "13px", background: "transparent", border: "1px solid #1a1a1a", color: "#555", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>🔄 Export Again</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [key, setKey] = useState(() => localStorage.getItem(KEY_STORAGE) || "");
  const [keyInput, setKeyInput] = useState("");
  const [selCat, setSelCat] = useState(null);
  const [selOutput, setSelOutput] = useState(null); // "cards" | "video"
  const [selVideoStyle, setSelVideoStyle] = useState(null); // "A" | "B"
  const [customTopic, setCustomTopic] = useState("");
  const [selTopic, setSelTopic] = useState(null);
  const [cardsData, setCardsData] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem(HISTORY_STORAGE) || "[]"); } catch { return []; } });
  const [showCardsViewer, setShowCardsViewer] = useState(false);
  const [showVideoAnimator, setShowVideoAnimator] = useState(false);

  const cat = CATEGORIES.find(c => c.id === selCat);

  const saveKey = () => {
    if (!keyInput.trim()) return;
    localStorage.setItem(KEY_STORAGE, keyInput.trim());
    setKey(keyInput.trim()); setError(""); setScreen("home");
  };

  const generate = useCallback(async (topic) => {
    setSelTopic(topic); setLoading(true); setError("");
    setCardsData(null); setVideoData(null);
    try {
      if (selOutput === "cards") {
        setLoadMsg("🃏 Building your cards...");
        const d = await groq(cardsPrompt(topic, cat?.label));
        setCardsData(d);
        const entry = { id: Date.now(), cat: selCat, output: "cards", style: null, topic, data: d, at: new Date().toLocaleString("en-GB") };
        const updated = [entry, ...history].slice(0, 30);
        setHistory(updated); localStorage.setItem(HISTORY_STORAGE, JSON.stringify(updated));
        setScreen("result");
      } else {
        setLoadMsg("🎬 Writing video script...");
        const d = await groq(videoPrompt(topic, cat?.label, selVideoStyle));
        setVideoData(d);
        const entry = { id: Date.now(), cat: selCat, output: "video", style: selVideoStyle, topic, data: d, at: new Date().toLocaleString("en-GB") };
        const updated = [entry, ...history].slice(0, 30);
        setHistory(updated); localStorage.setItem(HISTORY_STORAGE, JSON.stringify(updated));
        setScreen("result");
      }
    } catch (e) { setError("❌ " + e.message); }
    finally { setLoading(false); }
  }, [selCat, selOutput, selVideoStyle, cat, history]);

  if (showCardsViewer && cardsData) return <CardsViewer data={cardsData} topic={selTopic} onClose={() => setShowCardsViewer(false)} />;
  if (showVideoAnimator && videoData) return <VideoAnimator data={videoData} style={selVideoStyle} onClose={() => setShowVideoAnimator(false)} />;

  // ── SPLASH
  if (screen === "splash") return (
    <div style={{ minHeight: "100dvh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", ...S }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 20%,#140f00 0%,#000 60%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", textAlign: "center", width: "100%" }}>
        <div style={{ fontSize: 11, color: "#d4af37", letterSpacing: 5, fontWeight: 700, marginBottom: 14, textTransform: "uppercase" }}>Rollyadams Techworld</div>
        <h1 style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1, margin: "0 0 6px", letterSpacing: -2 }}>Reel<span style={{ color: "#d4af37" }}>Loader</span></h1>
        <div style={{ fontSize: 11, color: "#2a2a2a", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase" }}>Educator Edition v{APP_VERSION}</div>
        <p style={{ color: "#444", fontSize: 14, margin: "0 0 48px", lineHeight: 1.7 }}>Pick a topic. Get cards or an animated video.<br />Screenshot or download. Post.</p>
        <button onClick={() => setScreen(key ? "home" : "setup")} style={{ width: "100%", background: "#d4af37", border: "none", color: "#000", padding: "15px", borderRadius: 4, fontSize: 15, fontWeight: 900, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>Enter Studio</button>
        {history.length > 0 && <button onClick={() => setScreen("history")} style={{ marginTop: 14, background: "none", border: "none", color: "#2a2a2a", fontSize: 13, cursor: "pointer", width: "100%" }}>📁 History ({history.length})</button>}
      </div>
      <div style={{ position: "absolute", bottom: 20, color: "#111", fontSize: 11 }}>v{APP_VERSION}</div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800;900&display=swap');`}</style>
    </div>
  );

  // ── SETUP
  if (screen === "setup") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "60px 24px 40px", ...S }}>
      <button onClick={() => setScreen("splash")} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>←</button>
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>One-time setup</div>
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, marginBottom: 24 }}>Connect Groq</h2>
        <p style={{ color: "#444", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>Free at <strong style={{ color: "#d4af37" }}>console.groq.com</strong><br />Sign up → API Keys → Create key → Paste below</p>
        <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveKey()} placeholder="gsk_..." style={{ width: "100%", padding: "14px 16px", background: "#0a0a0a", border: "1px solid #222", borderRadius: 4, fontSize: 15, fontFamily: "monospace", color: "#fff", outline: "none", boxSizing: "border-box" }} />
        {error && <div style={{ color: "#ff5555", fontSize: 13, marginTop: 8, padding: "10px 12px", background: "#1a0000", borderRadius: 4 }}>⚠️ {error}</div>}
        <button onClick={saveKey} disabled={!keyInput.trim()} style={{ width: "100%", marginTop: 12, padding: "14px", background: keyInput.trim() ? "#d4af37" : "#111", border: "none", color: keyInput.trim() ? "#000" : "#333", fontSize: 15, fontWeight: 900, cursor: keyInput.trim() ? "pointer" : "not-allowed", borderRadius: 4 }}>Save & Enter →</button>
      </div>
    </div>
  );

  // ── HOME — pick category
  if (screen === "home") return (
    <div style={{ minHeight: "100dvh", background: "#000", ...S }}>
      {loading && <Spinner msg={loadMsg} />}
      <div style={{ padding: "48px 20px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>ReelLoader</div>
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900 }}>Pick a Category</h2>
          </div>
          <button onClick={() => { setError(""); setScreen("setup"); }} style={{ background: "none", border: "1px solid #1a1a1a", color: "#444", padding: "6px 12px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>⚙ Key</button>
        </div>
        {error && <div style={{ background: "#1a0000", border: "1px solid #3a0000", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}><div style={{ color: "#ff5555", fontSize: 13, marginBottom: 8 }}>{error}</div><button onClick={() => { setError(""); setScreen("setup"); }} style={{ padding: "6px 12px", background: "#ff5555", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>Fix Key</button></div>}
        <div style={{ display: "grid", gap: 10 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setSelCat(c.id); setScreen("outputType"); }} style={{ padding: "16px 18px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 8, background: `${c.color}18`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{c.label}</div><div style={{ fontSize: 12, color: "#444" }}>{c.topics.slice(0, 2).join(", ")}...</div></div>
              <div style={{ color: "#2a2a2a", fontSize: 18 }}>›</div>
            </button>
          ))}
        </div>
        {history.length > 0 && <button onClick={() => setScreen("history")} style={{ width: "100%", marginTop: 16, padding: "11px", background: "transparent", border: "1px solid #1a1a1a", color: "#444", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>📁 History ({history.length})</button>}
      </div>
    </div>
  );

  // ── OUTPUT TYPE
  if (screen === "outputType") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "48px 20px 40px", ...S }}>
      <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>←</button>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{cat?.icon} {cat?.label}</div>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 6 }}>What to create?</h2>
        <p style={{ color: "#444", fontSize: 13, marginBottom: 28 }}>Pick your output format</p>
        <div style={{ display: "grid", gap: 12 }}>
          <button onClick={() => { setSelOutput("cards"); setScreen("topic"); }} style={{ padding: "22px 20px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, cursor: "pointer", textAlign: "left", display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 32 }}>🃏</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Carousel Cards</div>
              <div style={{ fontSize: 12, color: "#555" }}>7 designed cards · Screenshot each · Post as carousel</div>
            </div>
          </button>
          <button onClick={() => { setSelOutput("video"); setScreen("videoStyle"); }} style={{ padding: "22px 20px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, cursor: "pointer", textAlign: "left", display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ fontSize: 32 }}>🎬</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Animated Video</div>
              <div style={{ fontSize: 12, color: "#555" }}>60-sec reel · AI voice · Download MP4</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // ── VIDEO STYLE
  if (screen === "videoStyle") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "48px 20px 40px", ...S }}>
      <button onClick={() => setScreen("outputType")} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>←</button>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>Video Style</div>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Choose a style</h2>
        <p style={{ color: "#444", fontSize: 13, marginBottom: 28 }}>Both work well for educational content</p>
        <div style={{ display: "grid", gap: 12 }}>
          <button onClick={() => { setSelVideoStyle("A"); setScreen("topic"); }} style={{ padding: "22px 20px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>STYLE A</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Bold Text Animation</div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>Powerful words appear on black background. Like motivational reels. High impact, minimal design.</div>
            <div style={{ marginTop: 12, background: "#000", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>WHAT IS AN API?</div>
            </div>
          </button>
          <button onClick={() => { setSelVideoStyle("B"); setScreen("topic"); }} style={{ padding: "22px 20px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
            <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>STYLE B</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Educational Slides</div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6 }}>Headline + explanation + visual direction. Like a proper explainer video. Builds understanding.</div>
            <div style={{ marginTop: 12, background: "#000", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#d4af37", marginBottom: 6 }}>WHAT IS AN API?</div>
              <div style={{ fontSize: 11, color: "#555" }}>The waiter between your app and the kitchen...</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // ── TOPIC
  if (screen === "topic") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "48px 20px 40px", ...S }}>
      {loading && <Spinner msg={loadMsg} />}
      <button onClick={() => setScreen(selOutput === "video" ? "videoStyle" : "outputType")} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>←</button>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{cat?.icon} {cat?.label} · {selOutput === "cards" ? "🃏 Cards" : `🎬 Style ${selVideoStyle}`}</div>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Pick a Topic</h2>
        <p style={{ color: "#444", fontSize: 13, marginBottom: 20 }}>Or type your own</p>
        {error && <div style={{ color: "#ff5555", fontSize: 13, marginBottom: 14, padding: "10px 12px", background: "#1a0000", borderRadius: 4 }}>⚠️ {error}</div>}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && customTopic.trim() && generate(customTopic.trim())} placeholder="Type any topic..." style={{ flex: 1, padding: "12px 14px", background: "#0a0a0a", border: "1px solid #222", borderRadius: 4, fontSize: 14, color: "#fff", outline: "none", fontFamily: "inherit" }} />
          <button onClick={() => customTopic.trim() && generate(customTopic.trim())} disabled={!customTopic.trim()} style={{ padding: "12px 18px", background: customTopic.trim() ? "#d4af37" : "#111", border: "none", color: customTopic.trim() ? "#000" : "#333", fontSize: 14, fontWeight: 700, cursor: customTopic.trim() ? "pointer" : "not-allowed", borderRadius: 4 }}>Go →</button>
        </div>
        <div style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Suggested</div>
        <div style={{ display: "grid", gap: 8 }}>
          {cat?.topics.map((t, i) => (
            <button key={i} onClick={() => generate(t)} style={{ padding: "13px 16px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, cursor: "pointer", textAlign: "left", fontSize: 14, color: "#ccc", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {t}<span style={{ color: "#2a2a2a" }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── RESULT
  if (screen === "result") return (
    <div style={{ minHeight: "100dvh", background: "#000", ...S }}>
      <div style={{ padding: "48px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => setScreen("topic")} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>←</button>
          <div style={{ fontSize: 10, color: "#d4af37", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{selOutput === "cards" ? "🃏 Cards" : `🎬 Style ${selVideoStyle}`}</div>
          <button onClick={() => { setScreen("home"); setCardsData(null); setVideoData(null); }} style={{ background: "none", border: "1px solid #1a1a1a", color: "#444", padding: "5px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>+ New</button>
        </div>

        <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 14px", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#333", marginBottom: 3 }}>TOPIC</div>
          <div style={{ fontSize: 14, color: "#888", fontWeight: 600 }}>{selTopic}</div>
        </div>

        {/* CARDS RESULT */}
        {selOutput === "cards" && cardsData && (
          <div>
            <button onClick={() => setShowCardsViewer(true)} style={{ width: "100%", padding: "16px", background: "#d4af37", border: "none", color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", borderRadius: 8, marginBottom: 16 }}>
              📱 View Cards — Screenshot to Post
            </button>
            <div style={{ background: "#0a0a0a", border: "1px solid #d4af3730", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 2, marginBottom: 8 }}>HOOK CARD</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{clean(cardsData.hookCard)}</div>
            </div>
            {cardsData.cards?.map((c, i) => (
              <div key={i} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 6 }}>CARD {i + 1}</div>
                <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, marginBottom: 4 }}>{clean(c.headline)}</div>
                <div style={{ fontSize: 14, color: "#ccc" }}>{clean(c.body)}</div>
              </div>
            ))}
            <div style={{ background: "#0a0a0a", border: "1px solid #d4af3330", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 2, marginBottom: 6 }}>CTA</div>
              <div style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>{clean(cardsData.ctaCard)}</div>
            </div>
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>CAPTION + HASHTAGS</div>
                <CopyBtn text={`${cardsData.caption}\n\n${cardsData.hashtags?.join(" ")}`} />
              </div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{cardsData.caption}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {cardsData.hashtags?.map((h, i) => <span key={i} style={{ background: "#111", border: "1px solid #1e1e1e", color: "#d4af37", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: "monospace" }}>{h}</span>)}
              </div>
            </div>
            <button onClick={() => setShowCardsViewer(true)} style={{ width: "100%", marginTop: 4, padding: "14px", background: "#d4af37", border: "none", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer", borderRadius: 6 }}>📱 View Cards</button>
          </div>
        )}

        {/* VIDEO RESULT */}
        {selOutput === "video" && videoData && (
          <div>
            <button onClick={() => setShowVideoAnimator(true)} style={{ width: "100%", padding: "16px", background: "#d4af37", border: "none", color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", borderRadius: 8, marginBottom: 16 }}>
              🎬 Animate & Export Video
            </button>
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 2, marginBottom: 6 }}>TITLE</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{clean(videoData.title)}</div>
            </div>
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 6 }}>KEY TAKEAWAY</div>
              <div style={{ fontSize: 13, color: "#ccc" }}>{clean(videoData.keyTakeaway)}</div>
            </div>
            {videoData.shots?.map((shot, i) => (
              <div key={i} style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ background: "#1a1400", padding: "7px 14px" }}>
                  <span style={{ fontSize: 11, color: "#d4af37", fontWeight: 800, fontFamily: "monospace" }}>{shot.timestamp}</span>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{clean(shot.textOverlay)}</div>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 6, fontStyle: "italic" }}>{clean(shot.voiceover)}</div>
                  <div style={{ fontSize: 11, color: "#444" }}>📷 {clean(shot.visual)}</div>
                </div>
              </div>
            ))}
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>CAPTION + HASHTAGS</div>
                <CopyBtn text={`${videoData.caption}\n\n${videoData.hashtags?.join(" ")}`} />
              </div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{videoData.caption}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {videoData.hashtags?.map((h, i) => <span key={i} style={{ background: "#111", border: "1px solid #1e1e1e", color: "#d4af37", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: "monospace" }}>{h}</span>)}
              </div>
            </div>
            <button onClick={() => setShowVideoAnimator(true)} style={{ width: "100%", marginTop: 4, padding: "14px", background: "#d4af37", border: "none", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer", borderRadius: 6 }}>🎬 Animate & Export</button>
          </div>
        )}

        <button onClick={() => generate(selTopic)} style={{ width: "100%", marginTop: 10, padding: "13px", background: "transparent", border: "1px solid #d4af37", color: "#d4af37", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>🔄 Regenerate</button>
      </div>
    </div>
  );

  // ── HISTORY
  if (screen === "history") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "48px 20px 40px", ...S }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28 }}>
        <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>←</button>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900 }}>History</h2>
      </div>
      {history.length === 0 ? <div style={{ textAlign: "center", paddingTop: 60, color: "#222" }}>No content yet</div> : (
        <div style={{ display: "grid", gap: 10 }}>
          {history.map(item => {
            const c = CATEGORIES.find(c => c.id === item.cat);
            return (
              <button key={item.id} onClick={() => {
                setSelCat(item.cat); setSelOutput(item.output); setSelVideoStyle(item.style); setSelTopic(item.topic);
                if (item.output === "cards") setCardsData(item.data); else setVideoData(item.data);
                setScreen("result");
              }} style={{ padding: "14px 16px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#d4af37", fontWeight: 700 }}>{c?.icon} {item.output === "cards" ? "🃏 Cards" : `🎬 Style ${item.style}`}</span>
                  <span style={{ fontSize: 10, color: "#2a2a2a" }}>{item.at}</span>
                </div>
                <div style={{ fontSize: 13, color: "#888" }}>{item.topic}</div>
              </button>
            );
          })}
        </div>
      )}
      <button onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_STORAGE); }} style={{ width: "100%", marginTop: 16, padding: "11px", background: "transparent", border: "1px solid #1a1a1a", color: "#2a2a2a", fontSize: 12, cursor: "pointer", borderRadius: 4 }}>🗑 Clear History</button>
    </div>
  );

  return null;
}
