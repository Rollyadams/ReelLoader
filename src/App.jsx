import { useState, useCallback } from "react";

// ── CONFIG ────────────────────────────────────────────────────────────────────
const MODEL = "llama-3.3-70b-versatile";
const STORAGE_KEY = "rl_groq_key";
const HISTORY_KEY = "rl_history";
const MAX_HISTORY = 30;

const CATEGORIES = [
  { id: "tech",     label: "Tech Education",     icon: "⚡" },
  { id: "startup",  label: "Startup & Business",  icon: "🚀" },
  { id: "career",   label: "Career & Growth",     icon: "📈" },
  { id: "finance",  label: "Money & Finance",     icon: "💰" },
  { id: "lifestyle",label: "Lifestyle & Mindset", icon: "🧠" },
  { id: "nigeria",  label: "Nigeria & Africa",    icon: "🌍" },
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸", hint: "Carousel + Caption" },
  { id: "twitter",   label: "X / Twitter", icon: "𝕏", hint: "Thread" },
  { id: "tiktok",    label: "TikTok", icon: "🎵", hint: "Script + Caption" },
  { id: "linkedin",  label: "LinkedIn", icon: "💼", hint: "Post + Hashtags" },
];

const CTA_LIBRARY = [
  "Save this for later.",
  "Share with someone who needs this.",
  "Follow for more tips like this.",
  "Tag a friend who should see this.",
  "What do you think? Drop it in the comments.",
  "Drop your questions below — I'll answer every one.",
  "Which tip will you try first?",
  "Agree or disagree? Let us know.",
  "Did you learn something new? Double-tap.",
  "Want more content like this? Follow us.",
  "Bookmark this post for future reference.",
  "Share your experience below.",
  "What's your biggest challenge with this?",
  "Rate this from 1–10 in the comments.",
  "Have you tried this before?",
];

// ── GROQ ──────────────────────────────────────────────────────────────────────
async function callGroq(key, prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL, max_tokens: 3000, temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const si = text.indexOf("{"); const ei = text.lastIndexOf("}") + 1;
  if (si === -1) throw new Error("No JSON in response");
  try { return JSON.parse(text.slice(si, ei)); }
  catch { return JSON.parse(text.slice(si, ei).replace(/,\s*([}\]])/g, "$1").replace(/[\u0000-\u001F]/g, " ")); }
}

// ── PROMPT ────────────────────────────────────────────────────────────────────
function buildPrompt(topic, catLabel, platforms, cta, ownContent) {
  const hasPlatform = (id) => platforms.includes(id);
  const contentNote = ownContent?.trim()
    ? `\n\nSOURCE CONTENT — rewrite and adapt this into all formats below. Do not copy verbatim, improve it:\n"""\n${ownContent.trim()}\n"""`
    : "";

  return `You are a top-tier social media content strategist for Rollyadams Techworld Nigeria.
Create a complete content pack about: "${topic}" (${catLabel}).${contentNote}

Audience: Nigerian tech professionals, students, entrepreneurs aged 18–35.
Tone: Sharp, direct, relatable. No corporate fluff. Nigerian English is fine where natural.
Voice: Confident authority — like someone who's done this, not read about it.

CTA to use: "${cta}"

Return ONLY valid JSON, no markdown, no extra text:
{
  "hook": "One sentence. Curiosity-gap or shocking fact. Max 15 words. No question marks — statements hit harder.",
  "carousel": [
    {"slide": 1, "headline": "2-4 words MAX", "body": "Max 20 words. Analogy or contrast. Never a definition. Never start with The/An/A."},
    {"slide": 2, "headline": "2-4 words MAX", "body": "Max 20 words. Different angle from slide 1."},
    {"slide": 3, "headline": "2-4 words MAX", "body": "Max 20 words. Real-world example or stat."},
    {"slide": 4, "headline": "2-4 words MAX", "body": "Max 20 words. Insight most people miss."},
    {"slide": 5, "headline": "2-4 words MAX", "body": "Max 20 words. Practical takeaway."}
  ],
  "hook_card": "Max 10 words. Punchy opener for slide 1 of carousel.",
  "cta_card": "${cta}",${hasPlatform("twitter") ? `
  "thread": [
    "Tweet 1: Hook — rewrite the hook as a tweet. No hashtags here.",
    "Tweet 2: The problem most people don't see.",
    "Tweet 3: The insight.",
    "Tweet 4: The example.",
    "Tweet 5: Takeaway + CTA"
  ],` : `"thread": [],`}${hasPlatform("tiktok") ? `
  "tiktok_script": {
    "hook_line": "First 3 seconds — what you say to stop the scroll. Max 10 words.",
    "body": "What you say from seconds 3–30. Conversational, punchy. 60–80 words.",
    "outro": "Last 5 seconds. CTA spoken out loud. Max 10 words."
  },` : `"tiktok_script": null,`}${hasPlatform("linkedin") ? `
  "linkedin_post": "Full LinkedIn post. Professional but not boring. 100–150 words. Paragraph breaks. End with CTA.",` : `"linkedin_post": null,`}
  "caption": "Universal caption under 120 chars. Works on any platform.",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8"]
}`;
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function saveHistory(pack) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const updated = [pack, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: "6px 14px", background: copied ? "#1a2e1a" : "#111", border: `1px solid ${copied ? "#2d5a2d" : "#222"}`, color: copied ? "#4ade80" : "#666", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
      {copied ? "✓ Copied" : label}
    </button>
  );
}

function Badge({ children, color = "#d4af37" }) {
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color, textTransform: "uppercase" }}>{children}</span>;
}

function Section({ label, color, children, copyText }) {
  return (
    <div style={{ background: "#0a0a0a", border: "1px solid #161616", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Badge color={color}>{label}</Badge>
        {copyText && <CopyBtn text={copyText} />}
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

function Pill({ children, active, onClick, color = "#d4af37" }) {
  return (
    <button onClick={onClick} style={{ padding: "8px 16px", background: active ? "#1a1400" : "#080808", border: `1px solid ${active ? color : "#1a1a1a"}`, color: active ? color : "#444", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

// ── SCREENS ───────────────────────────────────────────────────────────────────

// SPLASH
function SplashScreen({ onNext }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", gap: 0 }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>⚡</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: -1, marginBottom: 8, textAlign: "center" }}>ReelLoader</div>
      <div style={{ fontSize: 14, color: "#333", textAlign: "center", lineHeight: 1.6, marginBottom: 48 }}>
        Topic in. Full content pack out.<br />Built for Rollyadams Techworld Nigeria.
      </div>
      <button onClick={onNext} style={{ width: "100%", maxWidth: 320, padding: "16px", background: "#d4af37", border: "none", color: "#000", fontSize: 15, fontWeight: 800, borderRadius: 10, cursor: "pointer" }}>
        Get Started →
      </button>
    </div>
  );
}

// API KEY
function KeyScreen({ onSave }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const [testing, setTesting] = useState(false);

  const test = async () => {
    if (!val.trim()) return setErr("Paste your API key first");
    setTesting(true); setErr("");
    try {
      await callGroq(val.trim(), "Say: OK");
      onSave(val.trim());
    } catch (e) {
      setErr("Invalid key — check and try again");
    } finally { setTesting(false); }
  };

  return (
    <div style={{ minHeight: "100dvh", padding: "60px 24px 40px" }}>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Connect Groq</div>
      <div style={{ fontSize: 13, color: "#444", marginBottom: 8, lineHeight: 1.7 }}>
        Free at <span style={{ color: "#d4af37" }}>console.groq.com</span><br />
        Sign up → API Keys → Create → Paste below
      </div>
      <div style={{ fontSize: 11, color: "#2a2a2a", marginBottom: 24 }}>Key is stored only on this device.</div>
      {err && <div style={{ background: "#1a0000", border: "1px solid #3a0000", color: "#f87171", fontSize: 13, padding: "10px 14px", borderRadius: 8, marginBottom: 16 }}>{err}</div>}
      <textarea value={val} onChange={e => setVal(e.target.value)} placeholder="gsk_..." rows={3}
        style={{ width: "100%", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 14px", color: "#fff", fontSize: 13, resize: "none", outline: "none", marginBottom: 14 }} />
      <button onClick={test} disabled={testing}
        style={{ width: "100%", padding: "15px", background: testing ? "#1a1400" : "#d4af37", border: "none", color: testing ? "#d4af37" : "#000", fontSize: 15, fontWeight: 800, borderRadius: 10, cursor: testing ? "not-allowed" : "pointer" }}>
        {testing ? "Testing..." : "Save & Continue →"}
      </button>
    </div>
  );
}

// HOME — category + platform + topic + optional own content + CTA picker
function HomeScreen({ onGenerate, onHistory, historyCount }) {
  const [cat, setCat] = useState("tech");
  const [platforms, setPlatforms] = useState(["instagram", "twitter"]);
  const [topic, setTopic] = useState("");
  const [ownContent, setOwnContent] = useState("");
  const [showOwn, setShowOwn] = useState(false);
  const [cta, setCta] = useState(CTA_LIBRARY[0]);
  const [showCta, setShowCta] = useState(false);

  const togglePlatform = (id) => setPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const canGo = topic.trim().length > 0 && platforms.length > 0;

  return (
    <div style={{ minHeight: "100dvh", padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ padding: "52px 24px 20px", borderBottom: "1px solid #0d0d0d" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>ReelLoader</div>
            <div style={{ fontSize: 12, color: "#2a2a2a", marginTop: 2 }}>Content engine · Rollyadams TW Nigeria</div>
          </div>
          <button onClick={onHistory} style={{ background: "none", border: "1px solid #1a1a1a", color: "#444", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            History {historyCount > 0 && <span style={{ color: "#d4af37" }}>{historyCount}</span>}
          </button>
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* Category */}
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Category</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              style={{ padding: "12px 14px", background: cat === c.id ? "#1a1400" : "#080808", border: `1px solid ${cat === c.id ? "#d4af37" : "#141414"}`, borderRadius: 10, color: cat === c.id ? "#d4af37" : "#333", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
              <span style={{ marginRight: 6 }}>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>

        {/* Platforms */}
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Platforms</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {PLATFORMS.map(p => (
            <Pill key={p.id} active={platforms.includes(p.id)} onClick={() => togglePlatform(p.id)}>
              {p.icon} {p.label}
            </Pill>
          ))}
        </div>

        {/* Topic */}
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Topic</div>
        <input value={topic} onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === "Enter" && canGo && onGenerate({ cat, platforms, topic: topic.trim(), ownContent, cta })}
          placeholder="e.g. What is an API, Why startups fail, How to invest at 25..."
          style={{ width: "100%", background: "#0a0a0a", border: "1px solid #161616", borderRadius: 10, padding: "14px 16px", color: "#fff", fontSize: 14, outline: "none", marginBottom: 12 }} />

        {/* Own content toggle */}
        <button onClick={() => setShowOwn(s => !s)}
          style={{ background: "none", border: "none", color: showOwn ? "#d4af37" : "#2a2a2a", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: showOwn ? 10 : 20 }}>
          {showOwn ? "▾ Hide" : "▸ Paste your own content (optional)"}
        </button>
        {showOwn && (
          <textarea value={ownContent} onChange={e => setOwnContent(e.target.value)}
            placeholder="Paste your existing content — AI will rewrite and adapt it across all formats..."
            rows={5} style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${ownContent.trim() ? "#d4af3760" : "#161616"}`, borderRadius: 10, padding: "12px 14px", color: "#ccc", fontSize: 13, resize: "none", outline: "none", marginBottom: 20, lineHeight: 1.6 }} />
        )}

        {/* CTA Picker */}
        <div style={{ fontSize: 10, color: "#333", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Call to Action</div>
        <button onClick={() => setShowCta(s => !s)}
          style={{ width: "100%", padding: "12px 16px", background: "#0a0a0a", border: "1px solid #161616", borderRadius: 10, color: "#888", fontSize: 13, cursor: "pointer", textAlign: "left", marginBottom: showCta ? 10 : 20, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#d4af37", flex: 1, marginRight: 8 }}>{cta}</span>
          <span style={{ color: "#333" }}>{showCta ? "▲" : "▼"}</span>
        </button>
        {showCta && (
          <div style={{ background: "#080808", border: "1px solid #161616", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
            {CTA_LIBRARY.map((c, i) => (
              <button key={i} onClick={() => { setCta(c); setShowCta(false); }}
                style={{ width: "100%", padding: "12px 16px", background: c === cta ? "#1a1400" : "transparent", border: "none", borderBottom: i < CTA_LIBRARY.length - 1 ? "1px solid #0d0d0d" : "none", color: c === cta ? "#d4af37" : "#555", fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Generate */}
        <button onClick={() => canGo && onGenerate({ cat, platforms, topic: topic.trim(), ownContent, cta })}
          disabled={!canGo}
          style={{ width: "100%", padding: "16px", background: canGo ? "#d4af37" : "#0d0d0d", border: "none", color: canGo ? "#000" : "#1a1a1a", fontSize: 16, fontWeight: 900, borderRadius: 12, cursor: canGo ? "pointer" : "not-allowed", transition: "all 0.2s", letterSpacing: -0.3 }}>
          Generate Content Pack →
        </button>
      </div>
    </div>
  );
}

// LOADING
function LoadingScreen({ topic }) {
  const steps = ["Crafting your hook...", "Writing carousel slides...", "Building your thread...", "Scripting TikTok...", "Packaging everything..."];
  const [step, setStep] = useState(0);
  useState(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 900);
    return () => clearInterval(t);
  });
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 28px", gap: 24 }}>
      <div style={{ width: 44, height: 44, border: "3px solid #1a1400", borderTop: "3px solid #d4af37", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#d4af37", fontWeight: 700, marginBottom: 6, animation: "pulse 1.5s ease infinite" }}>{steps[step]}</div>
        <div style={{ fontSize: 12, color: "#222" }}>{topic}</div>
      </div>
    </div>
  );
}

// RESULT — the full content pack
function ResultScreen({ pack, onBack, onRegenerate }) {
  const { topic, cat, platforms, data } = pack;
  const hasPlatform = (id) => platforms.includes(id);
  const catObj = CATEGORIES.find(c => c.id === cat);

  const allHashtags = data.hashtags?.join(" ") || "";
  const fullCaption = `${data.caption}\n\n${allHashtags}`;
  const fullCarousel = data.carousel?.map(s => `Slide ${s.slide}: ${s.headline}\n${s.body}`).join("\n\n") || "";
  const fullThread = data.thread?.join("\n\n") || "";
  const fullTikTok = data.tiktok_script
    ? `Hook: ${data.tiktok_script.hook_line}\n\n${data.tiktok_script.body}\n\n${data.tiktok_script.outro}`
    : "";

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#050505", borderBottom: "1px solid #0d0d0d", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#aaa", fontSize: 20, cursor: "pointer", flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic}</div>
          <div style={{ fontSize: 11, color: "#333" }}>{catObj?.icon} {catObj?.label} · {platforms.length} platform{platforms.length > 1 ? "s" : ""}</div>
        </div>
        <button onClick={onRegenerate} style={{ padding: "8px 14px", background: "transparent", border: "1px solid #1a1a1a", color: "#444", fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: "pointer", flexShrink: 0 }}>↻ Redo</button>
      </div>

      <div style={{ padding: "20px 20px 0" }}>

        {/* HOOK */}
        <Section label="Hook" color="#d4af37" copyText={data.hook}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>{data.hook}</div>
        </Section>

        {/* CAROUSEL */}
        <Section label="Carousel Slides" color="#60a5fa" copyText={fullCarousel}>
          {/* Hook card */}
          <div style={{ background: "#060606", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: "#d4af37", letterSpacing: 2, marginBottom: 6 }}>HOOK CARD</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{data.hook_card}</div>
          </div>
          {/* Content slides */}
          {data.carousel?.map((s, i) => (
            <div key={i} style={{ background: "#060606", border: "1px solid #111", borderRadius: 8, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#1a1a1a", fontFamily: "monospace", paddingTop: 2, flexShrink: 0 }}>0{s.slide}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700, marginBottom: 4 }}>{s.headline}</div>
                <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.5 }}>{s.body}</div>
              </div>
              <CopyBtn text={`${s.headline}\n${s.body}`} />
            </div>
          ))}
          {/* CTA card */}
          <div style={{ background: "#060606", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#d4af37", letterSpacing: 2, marginBottom: 6 }}>CTA CARD</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{data.cta_card}</div>
          </div>
        </Section>

        {/* CAPTION + HASHTAGS */}
        <Section label="Caption + Hashtags" color="#a78bfa" copyText={fullCaption}>
          <div style={{ fontSize: 14, color: "#ccc", marginBottom: 12, lineHeight: 1.6 }}>{data.caption}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {data.hashtags?.map((h, i) => (
              <span key={i} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", color: "#a78bfa", fontSize: 11, padding: "4px 10px", borderRadius: 20, fontFamily: "monospace" }}>{h}</span>
            ))}
          </div>
        </Section>

        {/* X THREAD */}
        {hasPlatform("twitter") && data.thread?.length > 0 && (
          <Section label="𝕏 Thread" color="#e2e8f0" copyText={fullThread}>
            {data.thread.map((tweet, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < data.thread.length - 1 ? 14 : 0, paddingBottom: i < data.thread.length - 1 ? 14 : 0, borderBottom: i < data.thread.length - 1 ? "1px solid #0d0d0d" : "none" }}>
                <div style={{ fontSize: 10, color: "#1a1a1a", fontFamily: "monospace", paddingTop: 3, flexShrink: 0 }}>{i + 1}/</div>
                <div style={{ flex: 1, fontSize: 14, color: "#ccc", lineHeight: 1.6 }}>{tweet}</div>
                <CopyBtn text={tweet} />
              </div>
            ))}
          </Section>
        )}

        {/* TIKTOK SCRIPT */}
        {hasPlatform("tiktok") && data.tiktok_script && (
          <Section label="🎵 TikTok Script" color="#f472b6" copyText={fullTikTok}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 9, color: "#f472b6", letterSpacing: 2, marginBottom: 6 }}>HOOK (0–3s)</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>{data.tiktok_script.hook_line}</div>
            </div>
            <div style={{ marginBottom: 14, paddingTop: 14, borderTop: "1px solid #0d0d0d" }}>
              <div style={{ fontSize: 9, color: "#888", letterSpacing: 2, marginBottom: 6 }}>BODY (3–30s)</div>
              <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.7 }}>{data.tiktok_script.body}</div>
            </div>
            <div style={{ paddingTop: 14, borderTop: "1px solid #0d0d0d" }}>
              <div style={{ fontSize: 9, color: "#888", letterSpacing: 2, marginBottom: 6 }}>OUTRO + CTA</div>
              <div style={{ fontSize: 14, color: "#ccc" }}>{data.tiktok_script.outro}</div>
            </div>
          </Section>
        )}

        {/* LINKEDIN */}
        {hasPlatform("linkedin") && data.linkedin_post && (
          <Section label="💼 LinkedIn Post" color="#38bdf8" copyText={data.linkedin_post}>
            <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{data.linkedin_post}</div>
          </Section>
        )}

        {/* CANVA TIP */}
        <div style={{ background: "#060606", border: "1px solid #0d0d0d", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#2a2a2a", letterSpacing: 2, marginBottom: 8 }}>NEXT STEP</div>
          <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7 }}>
            1. Copy carousel slides → paste into your Canva template<br />
            2. Export → schedule in Buffer<br />
            3. Use TikTok/X content directly from above
          </div>
        </div>

        <button onClick={onRegenerate}
          style={{ width: "100%", padding: "14px", background: "transparent", border: "1px solid #d4af3730", color: "#d4af37", fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: "pointer" }}>
          ↻ Regenerate This Topic
        </button>
      </div>
    </div>
  );
}

// HISTORY
function HistoryScreen({ onBack, onLoad }) {
  const history = loadHistory();
  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 40 }}>
      <div style={{ padding: "52px 24px 20px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid #0d0d0d" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer" }}>←</button>
        <div style={{ fontSize: 20, fontWeight: 800 }}>History</div>
      </div>
      <div style={{ padding: "20px 20px 0" }}>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 80, color: "#1a1a1a", fontSize: 14 }}>No content generated yet</div>
        ) : history.map((pack, i) => {
          const catObj = CATEGORIES.find(c => c.id === pack.cat);
          return (
            <button key={i} onClick={() => onLoad(pack)}
              style={{ width: "100%", padding: "14px 16px", background: "#080808", border: "1px solid #111", borderRadius: 10, cursor: "pointer", textAlign: "left", marginBottom: 10, display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#d4af37", fontWeight: 700 }}>{catObj?.icon} {catObj?.label}</span>
                <span style={{ fontSize: 10, color: "#1a1a1a" }}>{pack.at}</span>
              </div>
              <div style={{ fontSize: 14, color: "#666", fontWeight: 600, marginBottom: 4 }}>{pack.topic}</div>
              <div style={{ fontSize: 12, color: "#1a1a1a" }}>{pack.platforms?.map(p => PLATFORMS.find(pl => pl.id === p)?.icon).join(" ")}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [key, setKey] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [loading, setLoading] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState("");
  const [currentPack, setCurrentPack] = useState(null);
  const [error, setError] = useState("");
  const [pendingParams, setPendingParams] = useState(null);

  const saveKey = (k) => {
    localStorage.setItem(STORAGE_KEY, k);
    setKey(k);
    setScreen("home");
  };

  const generate = useCallback(async (params) => {
    if (!key) { setPendingParams(params); setScreen("key"); return; }
    setError("");
    setLoadingTopic(params.topic);
    setLoading(true);
    const catObj = CATEGORIES.find(c => c.id === params.cat);
    try {
      const data = await callGroq(key, buildPrompt(params.topic, catObj?.label, params.platforms, params.cta, params.ownContent));
      const pack = {
        ...params,
        data,
        at: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      };
      saveHistory(pack);
      setCurrentPack(pack);
      setScreen("result");
    } catch (e) {
      setError(e.message || "Something went wrong. Try again.");
      setScreen("home");
    } finally { setLoading(false); }
  }, [key]);

  // After key saved, resume pending generation
  const handleKeySave = (k) => {
    saveKey(k);
    if (pendingParams) {
      const p = pendingParams; setPendingParams(null);
      setTimeout(() => generate({ ...p }), 100);
    }
  };

  if (loading) return <LoadingScreen topic={loadingTopic} />;

  if (screen === "splash") return <SplashScreen onNext={() => key ? setScreen("home") : setScreen("key")} />;
  if (screen === "key") return <KeyScreen onSave={handleKeySave} />;
  if (screen === "result" && currentPack) return (
    <ResultScreen
      pack={currentPack}
      onBack={() => setScreen("home")}
      onRegenerate={() => generate(currentPack)}
    />
  );
  if (screen === "history") return (
    <HistoryScreen
      onBack={() => setScreen("home")}
      onLoad={(pack) => { setCurrentPack(pack); setScreen("result"); }}
    />
  );

  // HOME
  return (
    <div>
      {error && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "#1a0000", border: "1px solid #3a0000", color: "#f87171", fontSize: 13, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#f87171", fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
      )}
      <HomeScreen
        onGenerate={generate}
        onHistory={() => setScreen("history")}
        historyCount={loadHistory().length}
      />
    </div>
  );
}
