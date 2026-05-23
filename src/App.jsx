import { useState, useCallback, useEffect } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GROQ_KEY_STORAGE = "rat_studio_key_v1";
const APP_VERSION = "2.0.0";

const FORMATS = [
  {
    id: "didyouknow",
    icon: "⚡",
    label: "Did You Know",
    sub: "5 shocking AI facts as cards",
    desc: "Scroll-stopping text cards. One shocking AI fact per card. Perfect for saves and shares.",
  },
  {
    id: "beforeafter",
    icon: "↔",
    label: "Before / After AI",
    sub: "Contrast that stops the scroll",
    desc: "Show exactly what changed. Manual vs AI. Pure contrast. No words needed to understand the value.",
  },
  {
    id: "toolofday",
    icon: "🛠",
    label: "AI Tool of the Day",
    sub: "Real tools + your services",
    desc: "One powerful AI tool explained simply. What it does, who it helps, how to start. Builds followers fast.",
  },
  {
    id: "60seconds",
    icon: "⏱",
    label: "60-Second Reel",
    sub: "Voiceover + text overlay script",
    desc: "Professional news-energy reel. Timestamped script + shot-by-shot breakdown + text overlays.",
  },
  {
    id: "thisaican",
    icon: "🔥",
    label: "This AI Can...",
    sub: "Hook → Explain → Convert",
    desc: "Open with the most shocking capability. Build curiosity. Close with your service. Maximum retention.",
  },
];

const TOPICS = [
  { id: "security", label: "AI + Security & CCTV", emoji: "📷", query: "AI security surveillance facial recognition threat detection 2025" },
  { id: "solar", label: "AI + Solar & Energy", emoji: "⚡", query: "AI energy optimization solar smart grid battery 2025" },
  { id: "webapps", label: "AI + Web & Apps", emoji: "💻", query: "AI coding tools app builders no-code automation developers 2025" },
  { id: "tools", label: "AI Tools (Global)", emoji: "🛠", query: "best AI tools productivity business ChatGPT Claude Gemini 2025" },
  { id: "breaking", label: "Breaking AI News", emoji: "🔴", query: "OpenAI Google Meta Anthropic AI breakthrough launch release 2025" },
  { id: "business", label: "AI & Business", emoji: "💼", query: "AI replacing jobs business automation ROI revenue 2025" },
];

const GROQ_MODEL = "llama-3.3-70b-versatile";

// ─── PROMPTS PER FORMAT ───────────────────────────────────────────────────────
function buildPrompt(format, topic, news) {
  const base = `You are a viral social media content strategist for Rollyadams Techworld — a Nigerian tech company offering Solar/Inverter systems, CCTV Security, and Website & App Development. You create content for Instagram Reels and TikTok that stops scrolling, drives saves, and builds followers.`;

  const story = `NEWS STORY:\nTitle: "${news.title}"\nSummary: "${news.summary}"`;

  const prompts = {
    didyouknow: `${base}\n\n${story}\n\nCreate 5 "Did You Know" fact cards about this AI story. Each card must:\n- Open with "Did you know..." or a shocking stat\n- Be 1-2 punchy sentences max\n- Get progressively more mind-blowing\n- Card 5 should naturally mention Rollyadams Techworld\n\nAlso generate:\n- A viral caption (under 150 chars)\n- 8 hashtags\n- Best time to post\n\nReturn ONLY valid JSON:\n{"cards":[{"number":1,"headline":"Did you know...","body":"1-2 sentences"},...],"caption":"...","hashtags":["#tag",...],"postTime":"...","visualTip":"Brief tip on how to design these cards visually"}`,

    beforeafter: `${base}\n\n${story}\n\nCreate a "Before AI vs After AI" comparison post. Make the contrast dramatic and undeniable.\n\nFormat:\n- 3 comparison points (before → after)\n- Each point: short, punchy, specific numbers where possible\n- Hook line for the post\n- Tie point 3 to Rollyadams Techworld naturally\n\nAlso generate:\n- Viral caption\n- 8 hashtags\n- Visual direction (colors, layout)\n\nReturn ONLY valid JSON:\n{"hook":"...","comparisons":[{"label":"Point 1","before":"...","after":"..."},...],"caption":"...","hashtags":["#tag",...],"visualDirection":"...","postTime":"..."}`,

    toolofday: `${base}\n\n${story}\n\nCreate an "AI Tool of the Day" post. Feature a REAL, important AI tool related to this story.\n\nInclude:\n- Tool name and what it actually does\n- Who it's for (be specific)\n- 3 killer features\n- Price (free/paid/freemium)\n- One line connecting it to Rollyadams Techworld's services\n- A "Try it" call to action\n\nAlso: suggest a SECOND tool that pairs well with the first.\n\nReturn ONLY valid JSON:\n{"toolName":"...","tagline":"...","whatItDoes":"...","whoItsFor":"...","features":["...","...","..."],"pricing":"...","rolladamsAngle":"...","cta":"...","pairWith":{"name":"...","reason":"..."},"caption":"...","hashtags":["#tag",...],"postTime":"..."}`,

    "60seconds": `${base}\n\n${story}\n\nWrite a complete 60-second Instagram Reel / TikTok script. Professional, news-energy, authoritative.\n\nFormat — Shot by shot WITH timestamps:\n- 00:00-00:03: Hook (most shocking statement)\n- 00:03-00:10: Context (what is this?)\n- 00:10-00:25: The main story (3 key points)\n- 00:25-00:45: Why it matters to YOU (viewer)\n- 00:45-00:55: What to do next\n- 00:55-01:00: Rollyadams Techworld close\n\nFor EACH shot provide:\n- Voiceover text (what to say)\n- Text overlay (bold text on screen)\n- Visual suggestion (what to show)\n\nReturn ONLY valid JSON:\n{"title":"...","shots":[{"timestamp":"00:00-00:03","voiceover":"...","textOverlay":"...","visual":"..."},...],"caption":"...","hashtags":["#tag",...],"audioVibe":"...","postTime":"..."}`,

    thisaican: `${base}\n\n${story}\n\nWrite a "This AI Can..." hook-format script. Maximum curiosity gap. Built for retention.\n\nStructure:\n1. HOOK: Open with the single most shocking capability (1 sentence, starts with "This AI can...")\n2. PROOF: 3 specific examples of what it can do (each under 15 words)\n3. TWIST: The part most people don't know (the surprising detail)\n4. STAKES: What happens to people/businesses that ignore this\n5. BRIDGE: How Rollyadams Techworld helps you stay ahead\n6. CTA: Clear next step\n\nAlso provide:\n- Text overlays for each section\n- Thumbnail text (what to write on the cover image)\n- Full caption\n- 8 hashtags\n\nReturn ONLY valid JSON:\n{"hook":"...","proof":["...","...","..."],"twist":"...","stakes":"...","bridge":"...","cta":"...","textOverlays":{"hook":"...","proof":"...","twist":"...","stakes":"...","bridge":"..."},"thumbnailText":"...","caption":"...","hashtags":["#tag",...],"postTime":"..."}`,
  };

  return prompts[format];
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <button onClick={copy} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #333", background: copied ? "#d4af37" : "transparent", color: copied ? "#000" : "#888", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", fontFamily: "'Space Grotesk',sans-serif" }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function Tag({ text }) {
  return <span style={{ display: "inline-block", background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#d4af37", fontSize: 12, padding: "3px 10px", borderRadius: 20, margin: "3px 3px 3px 0", fontFamily: "monospace" }}>{text}</span>;
}

function Card({ children, style = {} }) {
  return <div style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: "18px 20px", marginBottom: 14, ...style }}>{children}</div>;
}

function Label({ children }) {
  return <div style={{ fontSize: 10, color: "#d4af37", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "'Space Grotesk',sans-serif" }}>{children}</div>;
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10, fontFamily: "'Space Grotesk',sans-serif" }}>{children}</div>;
}

// ─── OUTPUT RENDERERS ─────────────────────────────────────────────────────────
function DidYouKnowOutput({ data }) {
  return (
    <div>
      <Card style={{ background: "linear-gradient(135deg,#1a1500,#111)" }}>
        <Label>📋 Caption</Label>
        <div style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{data.caption}</div>
        <CopyBtn text={data.caption} />
      </Card>
      <Card>
        <Label>🎨 Visual Tip</Label>
        <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6 }}>{data.visualTip}</div>
      </Card>
      {data.cards?.map((card, i) => (
        <Card key={i} style={{ borderLeft: "3px solid #d4af37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#d4af37", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, flexShrink: 0 }}>{card.number}</div>
            <CopyBtn text={`${card.headline}\n\n${card.body}`} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#d4af37", marginBottom: 8, lineHeight: 1.3, fontFamily: "'Space Grotesk',sans-serif" }}>{card.headline}</div>
          <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.6 }}>{card.body}</div>
        </Card>
      ))}
      <Card>
        <Label>🏷 Hashtags</Label>
        <div>{data.hashtags?.map((h, i) => <Tag key={i} text={h} />)}</div>
      </Card>
      <Card>
        <Label>🕐 Best Time to Post</Label>
        <div style={{ color: "#d4af37", fontSize: 14, fontWeight: 700 }}>{data.postTime}</div>
      </Card>
    </div>
  );
}

function BeforeAfterOutput({ data }) {
  return (
    <div>
      <Card style={{ background: "linear-gradient(135deg,#1a1500,#111)", borderLeft: "3px solid #d4af37" }}>
        <Label>🎯 Hook Line</Label>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.4, fontFamily: "'Space Grotesk',sans-serif" }}>{data.hook}</div>
      </Card>
      {data.comparisons?.map((c, i) => (
        <Card key={i}>
          <Label>Point {i + 1} — {c.label}</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "#1a0000", border: "1px solid #440000", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 10, color: "#ff4444", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>BEFORE</div>
              <div style={{ fontSize: 13, color: "#ffaaaa", lineHeight: 1.5 }}>{c.before}</div>
            </div>
            <div style={{ background: "#001a00", border: "1px solid #004400", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 10, color: "#44ff44", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>AFTER AI</div>
              <div style={{ fontSize: 13, color: "#aaffaa", lineHeight: 1.5 }}>{c.after}</div>
            </div>
          </div>
        </Card>
      ))}
      <Card style={{ background: "linear-gradient(135deg,#1a1500,#111)" }}>
        <Label>📋 Caption</Label>
        <div style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{data.caption}</div>
        <CopyBtn text={data.caption} />
      </Card>
      <Card>
        <Label>🎨 Visual Direction</Label>
        <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6 }}>{data.visualDirection}</div>
      </Card>
      <Card>
        <Label>🏷 Hashtags</Label>
        <div>{data.hashtags?.map((h, i) => <Tag key={i} text={h} />)}</div>
      </Card>
      <Card>
        <Label>🕐 Best Time to Post</Label>
        <div style={{ color: "#d4af37", fontSize: 14, fontWeight: 700 }}>{data.postTime}</div>
      </Card>
    </div>
  );
}

function ToolOfDayOutput({ data }) {
  return (
    <div>
      <Card style={{ background: "linear-gradient(135deg,#0a0a1a,#111)", border: "1px solid #d4af37" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#d4af37", fontFamily: "'Space Grotesk',sans-serif" }}>{data.toolName}</div>
          <span style={{ background: "#1a1a00", border: "1px solid #d4af37", color: "#d4af37", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}>{data.pricing}</span>
        </div>
        <div style={{ fontSize: 14, color: "#888", fontStyle: "italic", marginBottom: 12 }}>{data.tagline}</div>
        <div style={{ fontSize: 14, color: "#ddd", lineHeight: 1.6 }}>{data.whatItDoes}</div>
      </Card>
      <Card>
        <Label>👤 Who It's For</Label>
        <div style={{ color: "#ccc", fontSize: 14, lineHeight: 1.6 }}>{data.whoItsFor}</div>
      </Card>
      <Card>
        <Label>⚡ 3 Killer Features</Label>
        {data.features?.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#d4af37", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.5, paddingTop: 2 }}>{f}</div>
          </div>
        ))}
      </Card>
      <Card style={{ borderLeft: "3px solid #d4af37" }}>
        <Label>🇳🇬 Rollyadams Angle</Label>
        <div style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.6 }}>{data.rolladamsAngle}</div>
      </Card>
      <Card style={{ background: "#0a1a0a", border: "1px solid #1a4a1a" }}>
        <Label>🔗 Pair With</Label>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#4ade80", marginBottom: 6 }}>{data.pairWith?.name}</div>
        <div style={{ fontSize: 13, color: "#888" }}>{data.pairWith?.reason}</div>
      </Card>
      <Card style={{ background: "linear-gradient(135deg,#1a1500,#111)" }}>
        <Label>📋 Caption</Label>
        <div style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{data.caption}</div>
        <CopyBtn text={data.caption} />
      </Card>
      <Card>
        <Label>🏷 Hashtags</Label>
        <div>{data.hashtags?.map((h, i) => <Tag key={i} text={h} />)}</div>
      </Card>
    </div>
  );
}

function SixtySecondsOutput({ data }) {
  const fullScript = data.shots?.map(s => `[${s.timestamp}]\nSAY: ${s.voiceover}\nON SCREEN: ${s.textOverlay}\nSHOW: ${s.visual}`).join("\n\n");
  return (
    <div>
      <Card style={{ background: "linear-gradient(135deg,#1a1500,#111)", borderLeft: "3px solid #d4af37" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <Label>🎬 Script Title</Label>
          <CopyBtn text={fullScript} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "'Space Grotesk',sans-serif" }}>{data.title}</div>
      </Card>
      <Card>
        <Label>🎵 Audio Vibe</Label>
        <div style={{ color: "#d4af37", fontSize: 14, fontWeight: 600 }}>{data.audioVibe}</div>
      </Card>
      {data.shots?.map((shot, i) => (
        <Card key={i} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ background: "#1a1500", padding: "10px 16px", borderBottom: "1px solid #2a2a2a" }}>
            <span style={{ fontSize: 12, color: "#d4af37", fontWeight: 800, fontFamily: "monospace" }}>{shot.timestamp}</span>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <div style={{ marginBottom: 12 }}>
              <Label>🎤 Say</Label>
              <div style={{ fontSize: 15, color: "#fff", lineHeight: 1.6, fontWeight: 600 }}>{shot.voiceover}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Label>📺 On Screen</Label>
              <div style={{ background: "#000", border: "1px solid #333", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#d4af37", fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{shot.textOverlay}</div>
            </div>
            <div>
              <Label>🎥 Visual</Label>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5, fontStyle: "italic" }}>{shot.visual}</div>
            </div>
          </div>
        </Card>
      ))}
      <Card style={{ background: "linear-gradient(135deg,#1a1500,#111)" }}>
        <Label>📋 Caption</Label>
        <div style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{data.caption}</div>
        <CopyBtn text={data.caption} />
      </Card>
      <Card>
        <Label>🏷 Hashtags</Label>
        <div>{data.hashtags?.map((h, i) => <Tag key={i} text={h} />)}</div>
      </Card>
    </div>
  );
}

function ThisAICanOutput({ data }) {
  const sections = [
    { label: "🔥 HOOK", content: data.hook, overlay: data.textOverlays?.hook, highlight: true },
    { label: "✅ Proof Points", content: data.proof?.join("\n"), overlay: data.textOverlays?.proof },
    { label: "😱 The Twist", content: data.twist, overlay: data.textOverlays?.twist },
    { label: "⚠️ The Stakes", content: data.stakes, overlay: data.textOverlays?.stakes },
    { label: "🇳🇬 Bridge", content: data.bridge, overlay: data.textOverlays?.bridge },
    { label: "👉 CTA", content: data.cta },
  ];
  return (
    <div>
      <Card style={{ background: "#000", border: "2px solid #d4af37", marginBottom: 20 }}>
        <Label>🖼 Thumbnail Text</Label>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#d4af37", lineHeight: 1.3, fontFamily: "'Space Grotesk',sans-serif" }}>{data.thumbnailText}</div>
      </Card>
      {sections.map((s, i) => (
        <Card key={i} style={s.highlight ? { borderLeft: "3px solid #d4af37", background: "#0a0a00" } : {}}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Label>{s.label}</Label>
            <CopyBtn text={s.content} />
          </div>
          <div style={{ fontSize: s.highlight ? 17 : 14, color: s.highlight ? "#fff" : "#ccc", lineHeight: 1.6, fontWeight: s.highlight ? 700 : 400, whiteSpace: "pre-line" }}>{s.content}</div>
          {s.overlay && (
            <div style={{ marginTop: 10, background: "#000", border: "1px solid #333", borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>ON SCREEN</div>
              <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700 }}>{s.overlay}</div>
            </div>
          )}
        </Card>
      ))}
      <Card style={{ background: "linear-gradient(135deg,#1a1500,#111)" }}>
        <Label>📋 Caption</Label>
        <div style={{ color: "#e0e0e0", fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{data.caption}</div>
        <CopyBtn text={data.caption} />
      </Card>
      <Card>
        <Label>🏷 Hashtags</Label>
        <div>{data.hashtags?.map((h, i) => <Tag key={i} text={h} />)}</div>
      </Card>
      <Card>
        <Label>🕐 Best Time to Post</Label>
        <div style={{ color: "#d4af37", fontSize: 14, fontWeight: 700 }}>{data.postTime}</div>
      </Card>
    </div>
  );
}

function renderOutput(formatId, data) {
  if (!data) return null;
  const map = { didyouknow: DidYouKnowOutput, beforeafter: BeforeAfterOutput, toolofday: ToolOfDayOutput, "60seconds": SixtySecondsOutput, thisaican: ThisAICanOutput };
  const Component = map[formatId];
  return Component ? <Component data={data} /> : null;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem(GROQ_KEY_STORAGE) || "");
  const [keyInput, setKeyInput] = useState("");
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newsItems, setNewsItems] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => { try { return JSON.parse(localStorage.getItem("rat_history") || "[]"); } catch { return []; } });

  const saveKey = () => {
    if (!keyInput.trim()) return;
    localStorage.setItem(GROQ_KEY_STORAGE, keyInput.trim());
    setGroqKey(keyInput.trim());
    setError("");
    setScreen("home");
  };

  const callGroq = useCallback(async (prompt) => {
    const key = localStorage.getItem(GROQ_KEY_STORAGE) || groqKey;
    if (!key) throw new Error("No API key. Please add your Groq key.");
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 2000, temperature: 0.7, messages: [{ role: "user", content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const si = clean.indexOf("{"), ei = clean.lastIndexOf("}") + 1;
    if (si === -1) throw new Error("Invalid response format");
    return JSON.parse(clean.slice(si, ei));
  }, [groqKey]);

  const fetchNews = useCallback(async (topicId) => {
    const t = TOPICS.find(x => x.id === topicId);
    setLoading(true); setError(""); setLoadMsg("🔍 Finding viral AI stories...");
    setSelectedTopic(topicId);
    try {
      const result = await callGroq(`You are a viral content researcher. Find 5 shocking, scroll-stopping AI news stories about: "${t.query}".\n\nPick stories that would make someone stop scrolling. Focus on: record-breaking demos, AI replacing human jobs, shocking capabilities, major product launches, controversies, breakthroughs.\n\nMake headlines punchy and specific — never generic. Think: "ChatGPT just destroyed a $200k industry in one update" not "AI advances continue".\n\nReturn ONLY valid JSON array:\n[{"title":"punchy headline","summary":"2 sentences on why this is shocking","source":"Publication","pubDate":"2025"}]\n\nReturn exactly 5 items.`);
      setNewsItems(Array.isArray(result) ? result : []);
      setScreen("news");
    } catch (e) {
      setError("❌ " + e.message);
    } finally { setLoading(false); }
  }, [callGroq]);

  const generateContent = useCallback(async (news) => {
    setSelectedNews(news);
    setLoading(true); setError(""); setLoadMsg("✍️ Crafting viral content...");
    try {
      const prompt = buildPrompt(selectedFormat, selectedTopic, news);
      const result = await callGroq(prompt);
      setOutput(result);
      const entry = { id: Date.now(), format: selectedFormat, topic: selectedTopic, newsTitle: news.title, output: result, createdAt: new Date().toLocaleString("en-GB") };
      const updated = [entry, ...history].slice(0, 20);
      setHistory(updated);
      localStorage.setItem("rat_history", JSON.stringify(updated));
      setScreen("output");
    } catch (e) {
      setError("❌ " + e.message);
    } finally { setLoading(false); }
  }, [selectedFormat, selectedTopic, callGroq, history]);

  const fmt = FORMATS.find(f => f.id === selectedFormat);
  const topic = TOPICS.find(t => t.id === selectedTopic);

  const S = { fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif" };

  if (screen === "splash") return (
    <div style={{ minHeight: "100dvh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", ...S }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, #1a1400 0%, #000 60%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#d4af37", letterSpacing: 5, textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>Rollyadams Techworld</div>
        <h1 style={{ fontSize: 52, fontWeight: 900, color: "#fff", lineHeight: 1, margin: "0 0 8px", letterSpacing: -2 }}>RAT<br /><span style={{ color: "#d4af37" }}>Studio</span></h1>
        <p style={{ color: "#555", fontSize: 15, margin: "16px 0 48px", lineHeight: 1.6 }}>5 viral content formats.<br />One AI-powered studio.</p>
        <button onClick={() => setScreen(groqKey ? "home" : "setup")} style={{ background: "#d4af37", border: "none", color: "#000", padding: "16px 48px", borderRadius: 4, fontSize: 16, fontWeight: 900, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>
          Launch Studio
        </button>
        {history.length > 0 && <button onClick={() => setScreen("history")} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", color: "#444", fontSize: 13, cursor: "pointer" }}>📁 History ({history.length})</button>}
      </div>
      <div style={{ position: "absolute", bottom: 20, color: "#222", fontSize: 11 }}>v{APP_VERSION}</div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap');`}</style>
    </div>
  );

  if (screen === "setup") return (
    <div style={{ minHeight: "100dvh", background: "#000", padding: "0 24px", ...S }}>
      <div style={{ paddingTop: 60 }}>
        <button onClick={() => setScreen("splash")} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", marginBottom: 32 }}>←</button>
        <div style={{ fontSize: 11, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>Step 01</div>
        <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, marginBottom: 8, letterSpacing: -0.5 }}>Connect Groq</h2>
        <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>Free at <strong style={{ color: "#d4af37" }}>console.groq.com</strong><br />Sign up → API Keys → Create key</p>
        {[["1", "Go to console.groq.com"], ["2", "Sign up — completely free"], ["3", "Sidebar → API Keys"], ["4", "Create new key → copy"], ["5", "Paste below"]].map(([n, s]) => (
          <div key={n} style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#1a1500", border: "1px solid #d4af37", color: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</div>
            <div style={{ fontSize: 14, color: "#888" }}>{s}</div>
          </div>
        ))}
        <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === "Enter" && saveKey()} placeholder="gsk_..." style={{ width: "100%", marginTop: 24, padding: "14px 16px", background: "#0a0a0a", border: "1px solid #333", borderRadius: 4, fontSize: 15, fontFamily: "monospace", color: "#fff", outline: "none", boxSizing: "border-box" }} />
        {error && <div style={{ color: "#ff4444", fontSize: 13, marginTop: 8, padding: "8px 12px", background: "#1a0000", borderRadius: 4 }}>⚠️ {error}</div>}
        <button onClick={saveKey} disabled={!keyInput.trim()} style={{ width: "100%", marginTop: 14, padding: "15px", background: keyInput.trim() ? "#d4af37" : "#1a1a1a", border: "none", color: keyInput.trim() ? "#000" : "#444", fontSize: 15, fontWeight: 900, cursor: keyInput.trim() ? "pointer" : "not-allowed", borderRadius: 4, letterSpacing: 1, textTransform: "uppercase" }}>
          Save & Enter Studio
        </button>
      </div>
    </div>
  );

  if (screen === "home") return (
    <div style={{ minHeight: "100dvh", background: "#000", ...S }}>
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, gap: 20 }}>
          <div style={{ width: 48, height: 48, border: "3px solid #1a1500", borderTop: "3px solid #d4af37", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ color: "#d4af37", fontSize: 15, fontWeight: 700 }}>{loadMsg}</div>
          <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      <div style={{ padding: "48px 20px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>RAT Studio</div>
            <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, letterSpacing: -0.5 }}>Choose Format</h2>
          </div>
          <button onClick={() => { setError(""); setScreen("setup"); }} style={{ background: "none", border: "1px solid #222", color: "#555", padding: "6px 12px", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>⚙ Key</button>
        </div>

        {error && (
          <div style={{ background: "#1a0000", border: "1px solid #440000", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ color: "#ff4444", fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>{error}</div>
            <button onClick={() => { setError(""); setScreen("setup"); }} style={{ padding: "6px 14px", background: "#ff4444", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>Fix API Key</button>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {FORMATS.map(f => (
            <button key={f.id} onClick={() => { setSelectedFormat(f.id); setScreen("topic"); }} style={{ padding: "18px 20px", background: "#0a0a0a", border: selectedFormat === f.id ? "1px solid #d4af37" : "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", textAlign: "left", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ fontSize: 24, flexShrink: 0, width: 44, height: 44, background: "#111", border: "1px solid #222", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>{f.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{f.sub}</div>
              </div>
              <div style={{ color: "#333", fontSize: 18, paddingTop: 8 }}>›</div>
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <button onClick={() => setScreen("history")} style={{ width: "100%", marginTop: 20, padding: "12px", background: "transparent", border: "1px solid #1a1a1a", color: "#555", fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>
            📁 Content History ({history.length})
          </button>
        )}
      </div>
    </div>
  );

  if (screen === "topic") return (
    <div style={{ minHeight: "100dvh", background: "#000", ...S }}>
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, gap: 20 }}>
          <div style={{ width: 48, height: 48, border: "3px solid #1a1500", borderTop: "3px solid #d4af37", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ color: "#d4af37", fontSize: 15, fontWeight: 700 }}>{loadMsg}</div>
        </div>
      )}
      <div style={{ padding: "48px 20px 40px" }}>
        <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", marginBottom: 24 }}>←</button>
        <div style={{ fontSize: 11, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{fmt?.icon} {fmt?.label}</div>
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>Pick Topic</h2>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 28 }}>Groq finds the hottest stories for it</p>
        {error && <div style={{ color: "#ff4444", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "#1a0000", borderRadius: 4 }}>⚠️ {error}</div>}
        <div style={{ display: "grid", gap: 10 }}>
          {TOPICS.map(t => (
            <button key={t.id} onClick={() => fetchNews(t.id)} style={{ padding: "16px 18px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 22 }}>{t.emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>Tap to find stories</div>
              </div>
              <div style={{ marginLeft: "auto", color: "#333", fontSize: 16 }}>›</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === "news") return (
    <div style={{ minHeight: "100dvh", background: "#000", ...S }}>
      {loading && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, gap: 20 }}>
          <div style={{ width: 48, height: 48, border: "3px solid #1a1500", borderTop: "3px solid #d4af37", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ color: "#d4af37", fontSize: 15, fontWeight: 700 }}>{loadMsg}</div>
        </div>
      )}
      <div style={{ padding: "48px 20px 40px" }}>
        <button onClick={() => setScreen("topic")} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer", marginBottom: 24 }}>←</button>
        <div style={{ fontSize: 11, color: "#d4af37", letterSpacing: 3, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{topic?.emoji} {topic?.label}</div>
        <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 6 }}>Pick a Story</h2>
        <p style={{ color: "#555", fontSize: 13, marginBottom: 24 }}>Tap one to generate {fmt?.label} content</p>
        {error && <div style={{ color: "#ff4444", fontSize: 13, marginBottom: 16, padding: "10px 14px", background: "#1a0000", borderRadius: 4 }}>⚠️ {error}</div>}
        <div style={{ display: "grid", gap: 12 }}>
          {newsItems.map((n, i) => (
            <button key={i} onClick={() => generateContent(n)} style={{ padding: "18px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.4 }}>{n.title}</div>
              {n.summary && <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5, marginBottom: 10 }}>{n.summary.slice(0, 100)}...</div>}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#d4af37" }}>{n.source}</span>
                <span style={{ fontSize: 11, color: "#333" }}>{n.pubDate}</span>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => fetchNews(selectedTopic)} style={{ width: "100%", marginTop: 14, padding: "12px", background: "transparent", border: "1px solid #1a1a1a", color: "#555", fontSize: 13, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>🔄 Refresh Stories</button>
      </div>
    </div>
  );

  if (screen === "output") return (
    <div style={{ minHeight: "100dvh", background: "#000", ...S }}>
      <div style={{ padding: "48px 20px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button onClick={() => setScreen("news")} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>←</button>
          <div style={{ fontSize: 11, color: "#d4af37", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{fmt?.icon} {fmt?.label}</div>
          <button onClick={() => { setSelectedFormat(null); setSelectedTopic(null); setOutput(null); setScreen("home"); }} style={{ background: "none", border: "1px solid #222", color: "#555", padding: "6px 10px", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>+ New</button>
        </div>
        <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#444", marginBottom: 4 }}>STORY</div>
          <div style={{ fontSize: 13, color: "#888", lineHeight: 1.4 }}>{selectedNews?.title}</div>
        </div>
        {renderOutput(selectedFormat, output)}
        <button onClick={() => generateContent(selectedNews)} style={{ width: "100%", marginTop: 8, padding: "14px", background: "transparent", border: "1px solid #d4af37", color: "#d4af37", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>🔄 Regenerate</button>
        <button onClick={() => setScreen("news")} style={{ width: "100%", marginTop: 10, padding: "14px", background: "transparent", border: "1px solid #1a1a1a", color: "#555", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>← Pick Different Story</button>
      </div>
    </div>
  );

  if (screen === "history") return (
    <div style={{ minHeight: "100dvh", background: "#000", ...S }}>
      <div style={{ padding: "48px 20px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>←</button>
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>History</h2>
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "#333" }}>No content yet</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {history.map((item) => {
              const f = FORMATS.find(f => f.id === item.format);
              return (
                <button key={item.id} onClick={() => { setSelectedFormat(item.format); setSelectedTopic(item.topic); setSelectedNews({ title: item.newsTitle }); setOutput(item.output); setScreen("output"); }} style={{ padding: "16px", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#d4af37", fontWeight: 700 }}>{f?.icon} {f?.label}</span>
                    <span style={{ fontSize: 11, color: "#333" }}>{item.createdAt}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#888", lineHeight: 1.4 }}>{item.newsTitle}</div>
                </button>
              );
            })}
          </div>
        )}
        <button onClick={() => { setHistory([]); localStorage.removeItem("rat_history"); }} style={{ width: "100%", marginTop: 20, padding: "12px", background: "transparent", border: "1px solid #1a1a1a", color: "#333", fontSize: 13, cursor: "pointer", borderRadius: 4 }}>🗑 Clear History</button>
      </div>
    </div>
  );

  return null;
}
