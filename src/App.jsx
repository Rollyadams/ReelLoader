import { useState, useCallback, useRef } from "react";

const GROQ_KEY_STORAGE = "reelloader_key_v1";
const APP_VERSION = "3.1.0";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const CATEGORIES = [
  {
    id: "tech",
    icon: "⚙️",
    label: "Tech Concepts",
    sub: "APIs, Webhooks, DNS, Databases...",
    color: "#3b82f6",
    topics: ["What is an API?", "What is a Webhook?", "How does DNS work?", "What is a Database?", "What is Cloud Computing?", "What is DevOps?", "What is Kubernetes?", "How does HTTPS work?", "What is a CDN?", "What is Docker?"],
  },
  {
    id: "ai",
    icon: "🤖",
    label: "AI Explained",
    sub: "LLMs, Machine Learning, Neural Nets...",
    color: "#8b5cf6",
    topics: ["What is Machine Learning?", "How does ChatGPT work?", "What is a Neural Network?", "What is an LLM?", "What is Computer Vision?", "How does AI image generation work?", "What is Prompt Engineering?", "What is AI training?", "What is a Vector Database?", "How does voice AI work?"],
  },
  {
    id: "solar",
    icon: "⚡",
    label: "Solar & Energy",
    sub: "Solar, Inverters, Batteries, Grids...",
    color: "#f59e0b",
    topics: ["How does a solar panel work?", "What is an inverter?", "How do solar batteries work?", "What is a charge controller?", "On-grid vs Off-grid solar", "How to size a solar system", "Why solar panels lose efficiency", "What is net metering?", "How AI optimizes solar systems", "What is a smart grid?"],
  },
  {
    id: "security",
    icon: "📷",
    label: "Security & CCTV",
    sub: "Surveillance, Biometrics, Cyber...",
    color: "#ef4444",
    topics: ["How does CCTV work?", "Analog vs IP cameras", "What is facial recognition?", "How does motion detection work?", "What is a DVR vs NVR?", "How do smart locks work?", "What is cyber security?", "How does AI CCTV work?", "What is two-factor authentication?", "How does a firewall work?"],
  },
  {
    id: "biztech",
    icon: "💼",
    label: "Business Tech",
    sub: "SaaS, Payments, Automation...",
    color: "#10b981",
    topics: ["What is SaaS?", "How does online payment work?", "What is business automation?", "What is CRM software?", "How does e-commerce work?", "What is a payment gateway?", "What is ERP software?", "How does digital marketing work?", "What is a mobile app vs web app?", "How does data backup work?"],
  },
];

const OUTPUT_FORMATS = [
  { id: "video", icon: "🎬", label: "Video Script", sub: "Timestamped shot-by-shot" },
  { id: "cards", icon: "🃏", label: "Text Cards", sub: "5 shareable explainer cards" },
  { id: "both", icon: "✦", label: "Both", sub: "Full script + cards" },
];

// ─── GROQ CALLER ─────────────────────────────────────────────────────────────
async function callGroq(prompt, isArray = false) {
  const key = localStorage.getItem(GROQ_KEY_STORAGE);
  if (!key) throw new Error("No API key found. Please enter your Groq key.");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL, max_tokens: 2500, temperature: 0.6,
      messages: [
        { role: "system", content: "You are a JSON API. Return ONLY raw valid JSON. CRITICAL: Inside JSON string values, never use markdown — no asterisks, no **bold**, no *italic*, no #headers, no bullet points. Plain text only inside all string values. No backticks, no code blocks, no explanation outside the JSON." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
  let text = (data.choices?.[0]?.message?.content || "").replace(/```json|```/gi, "").trim();
  const open = isArray ? "[" : "{";
  const close = isArray ? "]" : "}";
  const si = text.indexOf(open), ei = text.lastIndexOf(close) + 1;
  if (si === -1) throw new Error("Response was not valid JSON. Please try again.");
  const jsonSlice = text.slice(si, ei);
  try { return JSON.parse(jsonSlice); }
  catch {
    // Strip markdown bold/italic asterisks and fix common JSON issues
    const fixed = jsonSlice
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u0000-\u001F]/g, " ");
    return JSON.parse(fixed);
  }
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: "5px 12px", borderRadius: 4, border: `1px solid ${copied ? "#d4af37" : "#2a2a2a"}`, background: copied ? "#1a1400" : "transparent", color: copied ? "#d4af37" : "#666", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
      {copied ? "✓ Copied" : label}
    </button>
  );
}

function Block({ label, children, style = {}, copyText }) {
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 16px", marginBottom: 12, ...style }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 10, color: "#d4af37", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{label}</span>
          {copyText && <CopyBtn text={copyText} />}
        </div>
      )}
      {children}
    </div>
  );
}

function Spinner({ msg }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, gap: 20 }}>
      <div style={{ width: 44, height: 44, border: "3px solid #1a1400", borderTop: "3px solid #d4af37", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
      <div style={{ color: "#d4af37", fontSize: 14, fontWeight: 700, textAlign: "center", maxWidth: 220, lineHeight: 1.5 }}>{msg}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function BackBtn({ onClick }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer", padding: "0 0 4px" }}>←</button>;
}

// ─── VIDEO SCRIPT OUTPUT ──────────────────────────────────────────────────────
function VideoScriptOutput({ data }) {
  const fullScript = data.shots?.map(s => `[${s.timestamp}]\nSAY: ${s.voiceover}\nON SCREEN: ${s.textOverlay}\nVISUAL: ${s.visual}`).join("\n\n");
  return (
    <div>
      <Block label="🎬 Title" copyText={data.title}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{data.title}</div>
      </Block>
      <Block label="🎵 Audio Vibe">
        <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 600 }}>{data.audioVibe}</div>
      </Block>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "#555", letterSpacing: 1 }}>SHOT BY SHOT</span>
        <CopyBtn text={fullScript} label="Copy Full Script" />
      </div>
      {data.shots?.map((shot, i) => (
        <div key={i} style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ background: "#1a1400", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#d4af37", fontWeight: 800, fontFamily: "monospace" }}>{shot.timestamp}</span>
            <CopyBtn text={shot.voiceover} />
          </div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#444", fontWeight: 700, letterSpacing: 1.5, marginBottom: 5 }}>🎤 SAY</div>
              <div style={{ fontSize: 14, color: "#e8e8e8", lineHeight: 1.65, fontWeight: 500 }}>{shot.voiceover}</div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: "#444", fontWeight: 700, letterSpacing: 1.5, marginBottom: 5 }}>📺 ON SCREEN</div>
              <div style={{ background: "#000", border: "1px solid #2a2a2a", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#d4af37", fontWeight: 700 }}>{shot.textOverlay}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#444", fontWeight: 700, letterSpacing: 1.5, marginBottom: 5 }}>🎥 VISUAL</div>
              <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5, fontStyle: "italic" }}>{shot.visual}</div>
            </div>
          </div>
        </div>
      ))}
      <Block label="📋 Caption" copyText={data.caption}>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{data.caption}</div>
      </Block>
      <Block label="🏷 Hashtags">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {data.hashtags?.map((h, i) => <span key={i} style={{ background: "#111", border: "1px solid #222", color: "#d4af37", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: "monospace" }}>{h}</span>)}
        </div>
      </Block>
    </div>
  );
}

// ─── CARDS OUTPUT ─────────────────────────────────────────────────────────────
// ─── SINGLE CARD RENDERER (full screen, screenshot-ready) ────────────────────
function CardSlide({ type, headline, body, cardNum, total, topic, isHook, isCta }) {
  return (
    <div style={{
      width: "100%",
      aspectRatio: "1/1",
      background: "#000",
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "32px 28px",
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
      border: "1px solid #1a1a1a",
    }}>
      {/* Background accent */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, #d4af3715 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, #d4af3708 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: "#d4af37", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", fontFamily: "'Space Grotesk',sans-serif" }}>
          {isHook ? "ReelLoader" : isCta ? "ReelLoader" : `${cardNum} / ${total}`}
        </div>
        <div style={{ fontSize: 10, color: "#2a2a2a", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
          {isHook ? "●●●●●" : isCta ? "rollyadams" : "●".repeat(cardNum) + "○".repeat(total - cardNum)}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "20px 0" }}>
        {isHook ? (
          <div>
            <div style={{ fontSize: 11, color: "#555", fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16, fontFamily: "'Space Grotesk',sans-serif" }}>Did you know?</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1.25, fontFamily: "'Space Grotesk',sans-serif" }}>{headline}</div>
          </div>
        ) : isCta ? (
          <div>
            <div style={{ width: 40, height: 3, background: "#d4af37", borderRadius: 2, marginBottom: 20 }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.3, marginBottom: 16, fontFamily: "'Space Grotesk',sans-serif" }}>{headline}</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{body}</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14, fontFamily: "'Space Grotesk',sans-serif" }}>{headline}</div>
            <div style={{ width: 32, height: 2, background: "#d4af37", borderRadius: 1, marginBottom: 20, opacity: 0.4 }} />
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1.35, fontFamily: "'Space Grotesk',sans-serif" }}>{body}</div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#333", fontWeight: 600, letterSpacing: 1 }}>rollyadamstechworld.com.ng</div>
        <div style={{ fontSize: 10, color: "#333", fontWeight: 600, letterSpacing: 1 }}>@rollyadamstechworld</div>
      </div>
    </div>
  );
}

// ─── CARDS VIEWER (swipeable full-screen cards) ───────────────────────────────
function CardsViewer({ data, topic, onClose }) {
  const allCards = [
    { type: "hook", headline: data.hookCard, body: "", isHook: true },
    ...(data.cards || []).map((c, i) => ({ type: "card", headline: c.headline, body: c.body, cardNum: i + 1, total: data.cards.length })),
    { type: "cta", headline: data.ctaCard, body: data.caption, isCta: true },
  ];
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && idx < allCards.length - 1) setIdx(i => i + 1);
    if (diff < -50 && idx > 0) setIdx(i => i - 1);
    touchStartX.current = null;
  };

  const card = allCards[idx];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #111" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>←</button>
        <div style={{ fontSize: 12, color: "#d4af37", fontWeight: 700, letterSpacing: 2 }}>{idx + 1} / {allCards.length}</div>
        <div style={{ fontSize: 11, color: "#333" }}>Screenshot to save</div>
      </div>

      {/* Card */}
      <div
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", userSelect: "none" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ width: "100%", maxWidth: 380 }}>
          <CardSlide
            type={card.type}
            headline={card.headline}
            body={card.body}
            cardNum={card.cardNum}
            total={card.total}
            topic={topic}
            isHook={card.isHook}
            isCta={card.isCta}
          />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: "12px 20px 32px" }}>
        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
          {allCards.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? "#d4af37" : "#1a1a1a", transition: "all 0.3s", cursor: "pointer" }} />
          ))}
        </div>
        {/* Prev / Next */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={{ padding: "12px", background: "transparent", border: "1px solid #1a1a1a", color: idx === 0 ? "#222" : "#888", fontSize: 14, fontWeight: 700, cursor: idx === 0 ? "not-allowed" : "pointer", borderRadius: 4 }}>← Prev</button>
          <button onClick={() => setIdx(i => Math.min(allCards.length - 1, i + 1))} disabled={idx === allCards.length - 1} style={{ padding: "12px", background: idx === allCards.length - 1 ? "transparent" : "#d4af37", border: `1px solid ${idx === allCards.length - 1 ? "#1a1a1a" : "#d4af37"}`, color: idx === allCards.length - 1 ? "#222" : "#000", fontSize: 14, fontWeight: 700, cursor: idx === allCards.length - 1 ? "not-allowed" : "pointer", borderRadius: 4 }}>Next →</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#2a2a2a" }}>Swipe left/right or tap arrows</div>
      </div>
    </div>
  );
}

// ─── CARDS OUTPUT (list view + preview button) ────────────────────────────────
function CardsOutput({ data, topic }) {
  const [showViewer, setShowViewer] = useState(false);

  if (showViewer) return <CardsViewer data={data} topic={topic} onClose={() => setShowViewer(false)} />;

  return (
    <div>
      {/* Preview button — prominent */}
      <button onClick={() => setShowViewer(true)} style={{ width: "100%", padding: "16px", background: "#d4af37", border: "none", color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", borderRadius: 8, marginBottom: 16, letterSpacing: 0.5 }}>
        📱 Preview Cards (Screenshot to Post)
      </button>

      <Block label="🎯 Hook Card" copyText={data.hookCard} style={{ borderLeft: "3px solid #d4af37" }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", lineHeight: 1.35 }}>{data.hookCard}</div>
      </Block>
      {data.cards?.map((card, i) => (
        <Block key={i} label={`Card ${i + 1}`} copyText={`${card.headline}

${card.body}`}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#d4af37", marginBottom: 6 }}>{card.headline}</div>
          <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.5 }}>{card.body}</div>
        </Block>
      ))}
      <Block label="🔚 CTA Card" copyText={data.ctaCard} style={{ borderLeft: "3px solid #d4af37" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{data.ctaCard}</div>
      </Block>
      <Block label="📋 Caption" copyText={data.caption}>
        <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.6 }}>{data.caption}</div>
      </Block>
      <Block label="🏷 Hashtags">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {data.hashtags?.map((h, i) => <span key={i} style={{ background: "#111", border: "1px solid #222", color: "#d4af37", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: "monospace" }}>{h}</span>)}
        </div>
      </Block>

      {/* Preview button at bottom too */}
      <button onClick={() => setShowViewer(true)} style={{ width: "100%", marginTop: 8, padding: "14px", background: "#d4af37", border: "none", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer", borderRadius: 6 }}>
        📱 Preview Cards
      </button>
    </div>
  );
}

// ─── PROMPTS ──────────────────────────────────────────────────────────────────
function buildVideoPrompt(topic, category) {
  return `You are an expert educator creating a professional 60-90 second explainer video script about: "${topic}" for the category: ${category}.

This is for Rollyadams Techworld — a Nigerian tech company (Solar/Inverter, CCTV Security, Web/App Development). The audience is Nigerian business owners and tech-curious professionals.

IMPORTANT: All JSON string values must be plain text only — no **bold**, no *italic*, no markdown, no asterisks.

Style: Like a high-quality YouTube explainer — clear, precise, no filler, no hype. Build understanding from scratch. Use simple analogies. Every second earns its place.

Structure your script with these timestamps:
- 00:00-00:05: Hook — the most interesting question or fact about this topic
- 00:05-00:15: Why it matters — real-world consequence
- 00:15-00:35: Core explanation — what it actually is, how it works
- 00:35-00:55: Real example — walk through a concrete scenario
- 00:55-01:10: The key takeaway — what to remember
- 01:10-01:20: Rollyadams Techworld close — natural, not forced

For each shot provide: voiceover (what to say), textOverlay (bold text shown on screen), visual (what to show or animate).

Return ONLY this JSON object:
{
  "title": "video title",
  "audioVibe": "music style description",
  "shots": [
    {"timestamp": "00:00-00:05", "voiceover": "...", "textOverlay": "...", "visual": "..."}
  ],
  "caption": "Instagram/TikTok caption under 200 chars",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
  "keyTakeaway": "one sentence summary of the whole concept"
}`;
}

function buildCardsPrompt(topic, category) {
  return `You are creating viral Instagram text cards about: "${topic}" (${category}) for Rollyadams Techworld Nigeria.

STRICT RULES — Cards must be GLANCEABLE. Read in 3 seconds. Understood instantly.
- NEVER use markdown inside text values (no **bold**, no *italic*, no asterisks)
- Plain text only in all fields
- Hook card: max 10 words. A question or shocking statement.
- Each card body: MAX 15 WORDS. Count them. Cut anything extra.
- Use analogy, metaphor, or contrast — never definitions
- One idea per card. One.
- Write like explaining to a smart teenager

EXAMPLES OF GOOD vs BAD:
BAD body: "An API is an interface that enables software systems to communicate using protocols."
GOOD body: "The waiter between your app and the kitchen. You order. It delivers."

BAD body: "Webhooks use event-driven architecture to push data in real time."
GOOD body: "Stop asking. Let it tell you when it is ready. That is a webhook."

BAD body: "Solar panels convert photons into electrical energy through the photovoltaic effect."
GOOD body: "Sunlight hits. Electrons move. Free electricity. That simple."

Return ONLY this JSON:
{
  "hookCard": "max 10 word hook question or fact",
  "cards": [
    {"headline": "2-4 word title", "body": "Max 15 words using analogy or contrast"},
    {"headline": "2-4 word title", "body": "Max 15 words using analogy or contrast"},
    {"headline": "2-4 word title", "body": "Max 15 words using analogy or contrast"},
    {"headline": "2-4 word title", "body": "Max 15 words using analogy or contrast"},
    {"headline": "2-4 word title", "body": "Max 15 words using analogy or contrast"}
  ],
  "ctaCard": "Short punchy close. Mention Rollyadams Techworld. Max 20 words.",
  "visualStyle": "Black background. Gold headline. White body text. Clean minimal layout.",
  "caption": "Caption under 150 chars with 1-2 key emojis",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8"]
}`;
}


// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem(GROQ_KEY_STORAGE) || "");
  const [keyInput, setKeyInput] = useState("");
  const [selCategory, setSelCategory] = useState(null);
  const [selFormat, setSelFormat] = useState(null);
  const [customTopic, setCustomTopic] = useState("");
  const [selTopic, setSelTopic] = useState(null);
  const [videoOutput, setVideoOutput] = useState(null);
  const [cardsOutput, setCardsOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem("reelloader_history") || "[]"); } catch { return []; } });

  const cat = CATEGORIES.find(c => c.id === selCategory);

  const saveKey = () => {
    if (!keyInput.trim()) return;
    localStorage.setItem(GROQ_KEY_STORAGE, keyInput.trim());
    setGroqKey(keyInput.trim());
    setError(""); setScreen("home");
  };

  const generate = useCallback(async (topic) => {
    setSelTopic(topic); setLoading(true); setError("");
    setVideoOutput(null); setCardsOutput(null);
    const needsVideo = selFormat === "video" || selFormat === "both";
    const needsCards = selFormat === "cards" || selFormat === "both";
    try {
      let vid = null, cards = null;
      if (needsVideo) {
        setLoadMsg("🎬 Writing video script...");
        vid = await callGroq(buildVideoPrompt(topic, cat?.label));
        setVideoOutput(vid);
      }
      if (needsCards) {
        setLoadMsg("🃏 Building explanation cards...");
        cards = await callGroq(buildCardsPrompt(topic, cat?.label));
        setCardsOutput(cards);
      }
      const entry = { id: Date.now(), category: selCategory, format: selFormat, topic, videoOutput: vid, cardsOutput: cards, createdAt: new Date().toLocaleString("en-GB") };
      const updated = [entry, ...history].slice(0, 30);
      setHistory(updated);
      localStorage.setItem("reelloader_history", JSON.stringify(updated));
      setScreen("output");
    } catch (e) {
      setError("❌ " + e.message);
    } finally { setLoading(false); }
  }, [selCategory, selFormat, cat, history]);

  const S = { fontFamily: "'Space Grotesk','Segoe UI',sans-serif" };

  // ── SPLASH
  if (screen === "splash") return (
    <div style={{ minHeight: "100dvh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", ...S }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 20%, #140f00 0%, #000 65%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", textAlign: "center", width: "100%" }}>
        <div style={{ fontSize: 11, color: "#d4af37", letterSpacing: 5, fontWeight: 700, marginBottom: 16, textTransform: "uppercase" }}>Rollyadams Techworld</div>
        <h1 style={{ fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1, margin: "0 0 6px", letterSpacing: -2 }}>Reel<span style={{ color: "#d4af37" }}>Loader</span></h1>
        <div style={{ fontSize: 12, color: "#333", letterSpacing: 3, marginBottom: 12, textTransform: "uppercase" }}>Educator Edition — by Rollyadams Techworld</div>
        <p style={{ color: "#444", fontSize: 14, margin: "0 0 48px", lineHeight: 1.7 }}>
          Pick a topic. Get a professional<br />explainer script + shareable cards.
        </p>
        <button onClick={() => setScreen(groqKey ? "home" : "setup")} style={{ background: "#d4af37", border: "none", color: "#000", padding: "15px 44px", borderRadius: 4, fontSize: 15, fontWeight: 900, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", width: "100%" }}>
          Enter Studio
        </button>
        {history.length > 0 && (
          <button onClick={() => setScreen("history")} style={{ marginTop: 14, background: "none", border: "none", color: "#333", fontSize: 13, cursor: "pointer", width: "100%" }}>
            📁 History ({history.length})
          </button>
        )}
      </div>
      <div style={{ position: "absolute", bottom: 20, color: "#1a1a1a", fontSize: 11 }}>v{APP_VERSION}</div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap');`}</style>
    </div>
  );

  // ── SETUP
  if (screen === "setup") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "60px 24px 40px", ...S }}>
      <BackBtn onClick={() => setScreen("splash")} />
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Step 01</div>
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, marginBottom: 6, letterSpacing: -0.5 }}>Connect Groq</h2>
        <p style={{ color: "#444", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Free forever at <strong style={{ color: "#d4af37" }}>console.groq.com</strong><br />
          Sign up → API Keys → Create key
        </p>
        {[["1","Go to console.groq.com"],["2","Sign up — completely free"],["3","Sidebar → API Keys"],["4","Create new key → copy it"],["5","Paste below and save"]].map(([n, s]) => (
          <div key={n} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#0d0d00", border: "1px solid #d4af37", color: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</div>
            <div style={{ fontSize: 13, color: "#666" }}>{s}</div>
          </div>
        ))}
        <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveKey()} placeholder="gsk_..." style={{ width: "100%", marginTop: 20, padding: "14px 16px", background: "#0a0a0a", border: "1px solid #222", borderRadius: 4, fontSize: 15, fontFamily: "monospace", color: "#fff", outline: "none", boxSizing: "border-box" }} />
        {error && <div style={{ color: "#ff5555", fontSize: 13, marginTop: 8, padding: "10px 12px", background: "#1a0000", borderRadius: 4 }}>⚠️ {error}</div>}
        <button onClick={saveKey} disabled={!keyInput.trim()} style={{ width: "100%", marginTop: 12, padding: "14px", background: keyInput.trim() ? "#d4af37" : "#111", border: "none", color: keyInput.trim() ? "#000" : "#333", fontSize: 15, fontWeight: 900, cursor: keyInput.trim() ? "pointer" : "not-allowed", borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Save & Enter Studio
        </button>
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
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>Pick a Category</h2>
          </div>
          <button onClick={() => { setError(""); setScreen("setup"); }} style={{ background: "none", border: "1px solid #1a1a1a", color: "#444", padding: "6px 12px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>⚙ Key</button>
        </div>
        {error && (
          <div style={{ background: "#1a0000", border: "1px solid #3a0000", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ color: "#ff5555", fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>{error}</div>
            <button onClick={() => { setError(""); setScreen("setup"); }} style={{ padding: "6px 12px", background: "#ff5555", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>Fix Key</button>
          </div>
        )}
        <div style={{ display: "grid", gap: 10 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setSelCategory(c.id); setScreen("format"); }}
              style={{ padding: "16px 18px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 8, background: `${c.color}18`, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 12, color: "#444" }}>{c.sub}</div>
              </div>
              <div style={{ color: "#2a2a2a", fontSize: 18 }}>›</div>
            </button>
          ))}
        </div>
        {history.length > 0 && (
          <button onClick={() => setScreen("history")} style={{ width: "100%", marginTop: 16, padding: "11px", background: "transparent", border: "1px solid #1a1a1a", color: "#444", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>
            📁 History ({history.length})
          </button>
        )}
      </div>
    </div>
  );

  // ── FORMAT — pick output format
  if (screen === "format") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "48px 20px 40px", ...S }}>
      <BackBtn onClick={() => setScreen("home")} />
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{cat?.icon} {cat?.label}</div>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>Output Format</h2>
        <p style={{ color: "#444", fontSize: 13, marginBottom: 28 }}>What do you want to create?</p>
        <div style={{ display: "grid", gap: 10 }}>
          {OUTPUT_FORMATS.map(f => (
            <button key={f.id} onClick={() => { setSelFormat(f.id); setScreen("topic"); }}
              style={{ padding: "18px 20px", background: "#0a0a0a", border: selFormat === f.id ? "1px solid #d4af37" : "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", background: "#111", border: "1px solid #1e1e1e", borderRadius: 8 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{f.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── TOPIC — pick or type topic
  if (screen === "topic") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "48px 20px 40px", ...S }}>
      {loading && <Spinner msg={loadMsg} />}
      <BackBtn onClick={() => setScreen("format")} />
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 10, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{cat?.icon} {cat?.label}</div>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>Pick a Topic</h2>
        <p style={{ color: "#444", fontSize: 13, marginBottom: 20 }}>Or type your own below</p>
        {error && <div style={{ color: "#ff5555", fontSize: 13, marginBottom: 14, padding: "10px 12px", background: "#1a0000", borderRadius: 4 }}>⚠️ {error}</div>}

        {/* Custom topic input */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && customTopic.trim() && generate(customTopic.trim())} placeholder="Type any topic..." style={{ flex: 1, padding: "12px 14px", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 4, fontSize: 14, color: "#fff", outline: "none", fontFamily: "inherit" }} />
          <button onClick={() => customTopic.trim() && generate(customTopic.trim())} disabled={!customTopic.trim()} style={{ padding: "12px 18px", background: customTopic.trim() ? "#d4af37" : "#111", border: "none", color: customTopic.trim() ? "#000" : "#333", fontSize: 14, fontWeight: 700, cursor: customTopic.trim() ? "pointer" : "not-allowed", borderRadius: 4, whiteSpace: "nowrap" }}>
            Go →
          </button>
        </div>

        <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Suggested Topics</div>
        <div style={{ display: "grid", gap: 8 }}>
          {cat?.topics.map((t, i) => (
            <button key={i} onClick={() => generate(t)} style={{ padding: "13px 16px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, cursor: "pointer", textAlign: "left", fontSize: 14, color: "#ccc", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {t}
              <span style={{ color: "#2a2a2a" }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── OUTPUT
  if (screen === "output") return (
    <div style={{ minHeight: "100dvh", background: "#000", ...S }}>
      <div style={{ padding: "48px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <BackBtn onClick={() => setScreen("topic")} />
          <div style={{ fontSize: 10, color: "#d4af37", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{cat?.icon} {cat?.label}</div>
          <button onClick={() => { setSelFormat(null); setSelTopic(null); setVideoOutput(null); setCardsOutput(null); setCustomTopic(""); setScreen("home"); }} style={{ background: "none", border: "1px solid #1a1a1a", color: "#444", padding: "5px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer" }}>+ New</button>
        </div>

        <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 14px", marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#333", marginBottom: 3, letterSpacing: 1 }}>TOPIC</div>
          <div style={{ fontSize: 14, color: "#888", fontWeight: 600 }}>{selTopic}</div>
        </div>

        {/* Tab switcher for "both" format */}
        {selFormat === "both" && videoOutput && cardsOutput && (() => {
          const [tab, setTab] = useState("video");
          return (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                {["video", "cards"].map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "10px", background: tab === t ? "#d4af37" : "#0a0a0a", border: `1px solid ${tab === t ? "#d4af37" : "#1a1a1a"}`, color: tab === t ? "#000" : "#555", fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 4, textTransform: "capitalize" }}>
                    {t === "video" ? "🎬 Script" : "🃏 Cards"}
                  </button>
                ))}
              </div>
              {tab === "video" ? <VideoScriptOutput data={videoOutput} /> : <CardsOutput data={cardsOutput} topic={selTopic} />}
            </div>
          );
        })()}

        {selFormat === "video" && videoOutput && <VideoScriptOutput data={videoOutput} />}
        {selFormat === "cards" && cardsOutput && <CardsOutput data={cardsOutput} topic={selTopic} />}

        <button onClick={() => generate(selTopic)} style={{ width: "100%", marginTop: 8, padding: "13px", background: "transparent", border: "1px solid #d4af37", color: "#d4af37", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>🔄 Regenerate</button>
        <button onClick={() => setScreen("topic")} style={{ width: "100%", marginTop: 8, padding: "13px", background: "transparent", border: "1px solid #1a1a1a", color: "#444", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>← Different Topic</button>
      </div>
    </div>
  );

  // ── HISTORY
  if (screen === "history") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "48px 20px 40px", ...S }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28 }}>
        <BackBtn onClick={() => setScreen("home")} />
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>History</h2>
      </div>
      {history.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 60, color: "#222" }}>No content created yet</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {history.map(item => {
            const c = CATEGORIES.find(c => c.id === item.category);
            const f = OUTPUT_FORMATS.find(f => f.id === item.format);
            return (
              <button key={item.id} onClick={() => { setSelCategory(item.category); setSelFormat(item.format); setSelTopic(item.topic); setVideoOutput(item.videoOutput); setCardsOutput(item.cardsOutput); setScreen("output"); }}
                style={{ padding: "14px 16px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#d4af37", fontWeight: 700 }}>{c?.icon} {c?.label}</span>
                  <span style={{ fontSize: 10, color: "#2a2a2a" }}>{item.createdAt}</span>
                </div>
                <div style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>{item.topic}</div>
                <span style={{ fontSize: 11, color: "#333" }}>{f?.icon} {f?.label}</span>
              </button>
            );
          })}
        </div>
      )}
      <button onClick={() => { setHistory([]); localStorage.removeItem("reelloader_history"); }} style={{ width: "100%", marginTop: 16, padding: "11px", background: "transparent", border: "1px solid #1a1a1a", color: "#2a2a2a", fontSize: 12, cursor: "pointer", borderRadius: 4 }}>🗑 Clear History</button>
    </div>
  );

  return null;
}
