"use client";

import { useState, useRef, useEffect } from "react";



/* ------------------------------------------------------------------ *
 *  Suggested starter questions (pulled from the FAQ)
 * ------------------------------------------------------------------ */
const STARTERS = [
  "What are your withdrawal methods, limits, and fees?",
  "How do I pass the Flex Challenge, and what is the profit target?",
  "When can I request my first Performance Reward after receiving my FundedNext Account?",
  "Do you allow trading during news events?",
];

const GREETING = {
  role: "assistant",
  raw: "Hi, I'm Nexa, your FundedNext Futures assistant. It's a pleasure to help you today — what can I do for you?",
  body: "Hi, I'm Nexa, your FundedNext Futures assistant. It's a pleasure to help you today — what can I do for you?",
  source: null,
};

/* ------------------------------------------------------------------ *
 *  Tiny rich-text renderer (paragraphs, bullets, bold)
 * ------------------------------------------------------------------ */
function renderBold(text, keyBase) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return <strong key={keyBase + "-b" + i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={keyBase + "-t" + i}>{p}</span>;
  });
}

function RichText({ text }) {
  const lines = text.split("\n");
  const blocks = [];
  let bullets = [];
  const flush = (idx) => {
    if (bullets.length) {
      blocks.push(
        <ul className="rt-ul" key={"ul" + idx}>
          {bullets.map((b, i) => (
            <li key={"li" + idx + "-" + i}>{renderBold(b, "li" + idx + "-" + i)}</li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };
  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const t = line.trim();
    if (/^(-|•)\s+/.test(t)) {
      bullets.push(t.replace(/^(-|•)\s+/, ""));
    } else if (t === "") {
      flush(idx);
    } else {
      flush(idx);
      blocks.push(
        <p className="rt-p" key={"p" + idx}>
          {renderBold(t, "p" + idx)}
        </p>
      );
    }
  });
  flush("end");
  return <div className="rt">{blocks}</div>;
}

/* ------------------------------------------------------------------ */

export default function AgentConsole() {
  const [messages, setMessages] = useState([GREETING]); // {role, raw, body, source}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const parseSource = (text) => {
    const m = text.match(/\n?SOURCE:\s*(.+?)\s*$/i);
    if (m) {
      return { body: text.slice(0, m.index).trim(), source: m[1].trim() };
    }
    return { body: text.trim(), source: null };
  };

  async function send(question) {
    const q = (question ?? input).trim();
    if (!q || loading) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    const userMsg = { role: "user", raw: q, body: q, source: null };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    // Send the real conversation (minus Nexa's opening greeting) to our own
    // server route, which holds the API key and talks to Claude.
    const apiMessages = next
      .filter((m) => m !== GREETING)
      .map((m) => ({ role: m.role, content: m.raw }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      const text = (data.text || "").trim();
      if (!text) throw new Error("empty");
      const { body, source } = parseSource(text);
      setMessages((prev) => [...prev, { role: "assistant", raw: text, body, source }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          raw: "The knowledge base couldn't be reached. Check your connection and send the question again.",
          body: "The knowledge base couldn't be reached. Check your connection and send the question again.",
          source: "ERROR",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function autoGrow(e) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  async function copy(text, id) {
    let ok = false;
    // Try the modern clipboard API first (may be blocked in sandboxed frames)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (e) {
      ok = false;
    }
    // Fallback: hidden textarea + execCommand, which works inside the sandbox
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (e) {
        ok = false;
      }
    }
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1400);
    }
  }

  const noUserYet = !messages.some((m) => m.role === "user");

  return (
    <div className="app" data-theme={dark ? "dark" : "light"}>
      <style>{CSS}</style>
      <div className="bg-aurora" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-logo" aria-hidden="true">
        <svg viewBox="0 0 200 120" className="wm-svg">
          <rect x="20" y="18" width="20" height="84" />
          <rect x="20" y="18" width="58" height="20" />
          <rect x="20" y="54" width="48" height="18" />
          <rect x="96" y="18" width="20" height="84" />
          <polygon points="116,18 140,18 180,102 156,102" />
          <polygon points="146,18 180,18 180,64" className="wm-tri" />
        </svg>
      </div>

      <header className="hdr">
        <div className="brand">
          <div className="mark">FN</div>
          <div className="brand-text">
            <div className="brand-name">FundedNext Futures</div>
            <div className="brand-sub">Nexa</div>
          </div>
        </div>
        <div className="hdr-right">
          <button
            className="theme-toggle"
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path
                  d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <div className="status">
            <span className="tick" />
            Online now
          </div>
        </div>
      </header>

      <main className="main" ref={scrollRef}>
        <div className="stream">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div className="row row-user" key={i}>
                <div className="bubble bubble-user">{m.body}</div>
              </div>
            ) : (
              <div className="row row-bot" key={i}>
                <div className="avatar" />
                <div className="bot-wrap">
                  <div className="agent-name">Nexa</div>
                  <div className="bubble bubble-bot">
                    <RichText text={m.body} />
                  </div>
                  {i !== 0 && (
                    <button
                      className={"copy-btn" + (copiedId === i ? " copied" : "")}
                      onClick={() => copy(m.body, i)}
                      title="Copy answer"
                    >
                      {copiedId === i ? (
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M5 12l4.5 4.5L19 7"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none">
                          <rect x="9" y="9" width="11" height="11" rx="2.2" stroke="currentColor" strokeWidth="1.9" />
                          <path
                            d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      {copiedId === i ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {noUserYet && (
            <div className="chips-wrap">
              <div className="chips">
                {STARTERS.map((s, i) => (
                  <button className="chip" key={i} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="row row-bot">
              <div className="avatar" />
              <div className="bubble bubble-bot thinking">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
                <span className="think-label">typing</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="composer">
        <div className="composer-inner">
          <textarea
            ref={taRef}
            className="ta"
            rows={1}
            placeholder="Type your message…"
            value={input}
            onChange={autoGrow}
            onKeyDown={onKeyDown}
          />
          <button
            className="send"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M4 12h13M12 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <div className="disclaimer">
          FundedNext Futures Support · We're glad to help
        </div>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

*{box-sizing:border-box}

:root{
  --bg:#ffffff; --bg2:#f1effe;
  --panel:rgba(255,255,255,.75); --panel-solid:#ffffff;
  --border:rgba(15,12,40,.10);
  --text:#0b0b16; --muted:#5a586f; --strong:#000000;
  --accentA:#6f66ff; --accentB:#635bff;
  --glow-a:rgba(99,91,255,.20); --glow-b:rgba(99,91,255,.22);
  --user-grad:linear-gradient(135deg,#6f66ff,#635bff);
  --warn:#c2410c; --warn-soft:rgba(194,65,12,.12);
}
.app[data-theme="dark"]{
  --bg:#000000; --bg2:#17122e;
  --panel:rgba(255,255,255,.05); --panel-solid:#0d0d12;
  --border:rgba(255,255,255,.12);
  --text:#f4f4f8; --muted:#8b8ba0; --strong:#ffffff;
  --accentA:#7d76ff; --accentB:#635bff;
  --glow-a:rgba(99,91,255,.30); --glow-b:rgba(99,91,255,.34);
  --user-grad:linear-gradient(135deg,#7d76ff,#635bff);
  --warn:#ff9e64; --warn-soft:rgba(255,158,100,.14);
}

.app{
  position:relative; isolation:isolate; overflow:hidden;
  height:100dvh; display:grid; grid-template-rows:auto 1fr auto;
  background:radial-gradient(1200px 700px at 85% -10%, var(--bg2), transparent 60%), var(--bg);
  color:var(--text);
  font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased;
}
::selection{background:var(--accentA); color:#04120f}

/* ambient background */
.bg-aurora,.bg-grid{position:absolute; inset:0; z-index:0; pointer-events:none}
.bg-aurora{
  background:radial-gradient(520px 520px at 18% 22%, var(--glow-a), transparent 60%),
             radial-gradient(560px 560px at 82% 78%, var(--glow-b), transparent 62%);
  filter:blur(34px); opacity:.72;
  animation:drift 20s ease-in-out infinite alternate;
}
@keyframes drift{0%{transform:translate3d(-3%,-2%,0) scale(1)}100%{transform:translate3d(4%,3%,0) scale(1.12)}}
.bg-grid{
  background-image:linear-gradient(to right, var(--border) 1px, transparent 1px),
                   linear-gradient(to bottom, var(--border) 1px, transparent 1px);
  background-size:46px 46px; opacity:.5;
  -webkit-mask-image:radial-gradient(80% 60% at 50% 30%, #000 40%, transparent 100%);
  mask-image:radial-gradient(80% 60% at 50% 30%, #000 40%, transparent 100%);
}
.bg-logo{position:absolute; inset:0; z-index:0; display:grid; place-items:center; pointer-events:none}
.wm-svg{width:min(52vw,440px); height:auto; opacity:.06; fill:var(--text)}
.wm-tri{fill:var(--accentB)}

.hdr,.main,.composer{position:relative; z-index:1}

/* header */
.hdr{
  display:flex; align-items:center; justify-content:space-between; padding:14px 20px;
  background:var(--panel); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border);
}
.brand{display:flex; align-items:center; gap:12px}
.mark{
  position:relative; width:38px; height:38px; border-radius:11px; background:#000; color:#fff;
  display:grid; place-items:center; overflow:hidden;
  font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:14px; letter-spacing:.02em;
  box-shadow:0 0 0 1px var(--border), 0 6px 20px var(--glow-b);
}
.mark::after{
  content:""; position:absolute; top:5px; right:5px; width:9px; height:9px;
  background:var(--accentB); clip-path:polygon(0 0, 100% 0, 100% 100%);
}
.brand-name{
  font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:16px; line-height:1.05;
  color:var(--text); letter-spacing:-.01em;
}
.brand-sub{font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--muted); letter-spacing:.22em; text-transform:uppercase; margin-top:3px}
.hdr-right{display:flex; align-items:center; gap:10px}
.theme-toggle{
  width:34px; height:34px; flex:none; display:grid; place-items:center;
  border:1px solid var(--border); border-radius:10px; background:var(--panel); color:var(--muted);
  cursor:pointer; transition:color .15s, box-shadow .15s, transform .05s;
}
.theme-toggle:hover{color:var(--text); box-shadow:0 0 14px var(--glow-a)}
.theme-toggle:active{transform:translateY(1px)}
.status{
  display:flex; align-items:center; gap:8px;
  font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--muted);
  border:1px solid var(--border); border-radius:999px; padding:6px 12px;
  text-transform:uppercase; letter-spacing:.14em; background:var(--panel);
}
.tick{width:7px; height:7px; border-radius:50%; background:var(--accentA); box-shadow:0 0 0 0 var(--accentA); animation:pulse 2.4s ease-out infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 var(--glow-a)}70%{box-shadow:0 0 0 8px transparent}100%{box-shadow:0 0 0 0 transparent}}

/* stream */
.main{overflow-y:auto}
.main::-webkit-scrollbar{width:10px}
.main::-webkit-scrollbar-thumb{background:var(--border); border-radius:20px; border:3px solid transparent; background-clip:padding-box}
.stream{max-width:840px; margin:0 auto; padding:30px 20px 46px}

.chips-wrap{margin:6px 0 4px 48px}
.chips{display:flex; flex-direction:column; gap:10px; max-width:600px}
.chip{
  text-align:left; background:var(--panel); backdrop-filter:blur(8px);
  border:1px solid var(--border); border-radius:13px; padding:13px 15px;
  font-size:14px; color:var(--text); cursor:pointer; font-family:inherit; line-height:1.4;
  transition:border-color .15s, transform .06s, box-shadow .18s;
}
.chip:hover{border-color:transparent; box-shadow:0 0 0 1px var(--accentA), 0 8px 26px var(--glow-a); transform:translateY(-1px)}
.chip:active{transform:translateY(0)}

.row{display:flex; margin:18px 0}
.row-user{justify-content:flex-end}
.row-bot{justify-content:flex-start; align-items:flex-start; gap:12px}
.bubble{max-width:80%; border-radius:16px; padding:13px 16px; font-size:14.5px; line-height:1.62; animation:rise .3s ease both}
@keyframes rise{from{opacity:0; transform:translateY(8px)}to{opacity:1; transform:none}}
.bubble-user{background:var(--user-grad); color:#fff; border-bottom-right-radius:5px; box-shadow:0 8px 26px var(--glow-b)}
.bot-wrap{max-width:82%}
.avatar{
  width:38px; height:38px; flex:none; border-radius:50%; margin-top:24px;
  background:#0a0a12 center/cover no-repeat;
  background-image:url(data:image/jpeg;base64,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);
  box-shadow:0 0 0 1px var(--border), 0 5px 18px var(--glow-b);
}
.agent-name{font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--muted); letter-spacing:.16em; text-transform:uppercase; margin:0 0 6px 3px}
.bubble-bot{
  position:relative; background:var(--panel); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
  border:1px solid var(--border); color:var(--text); border-bottom-left-radius:5px; padding-left:20px;
  box-shadow:0 8px 30px rgba(0,0,0,.12);
}
.bubble-bot::before{
  content:""; position:absolute; left:8px; top:12px; bottom:12px; width:3px; border-radius:3px;
  background:linear-gradient(var(--accentA),var(--accentB)); box-shadow:0 0 12px var(--glow-a);
}
.rt-p{margin:0 0 10px}
.rt-p:last-child{margin-bottom:0}
.rt-ul{margin:6px 0 10px; padding-left:20px}
.rt-ul li{margin:3px 0}
.rt strong{font-weight:600; color:var(--strong)}

.copy-btn{
  display:inline-flex; align-items:center; gap:6px; margin:9px 0 0 3px;
  background:var(--panel); border:1px solid var(--border); border-radius:9px;
  padding:5px 10px; cursor:pointer;
  font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.14em;
  text-transform:uppercase; color:var(--muted);
  transition:color .15s, box-shadow .15s, border-color .15s;
}
.copy-btn:hover{color:var(--text); box-shadow:0 0 12px var(--glow-a)}
.copy-btn.copied{color:var(--accentA); border-color:transparent; box-shadow:0 0 0 1px var(--accentA)}
.copy-btn svg{width:13px; height:13px}

.thinking{display:flex; align-items:center; gap:6px}
.dot{width:7px; height:7px; border-radius:50%; background:linear-gradient(var(--accentA),var(--accentB)); animation:bob 1.1s ease-in-out infinite}
.dot:nth-child(2){animation-delay:.15s}
.dot:nth-child(3){animation-delay:.3s}
@keyframes bob{0%,80%,100%{transform:translateY(0); opacity:.4}40%{transform:translateY(-5px); opacity:1}}
.think-label{font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--muted); margin-left:6px; text-transform:uppercase; letter-spacing:.16em}

/* composer */
.composer{border-top:1px solid var(--border); background:var(--panel); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); padding:14px 20px 10px}
.composer-inner{
  max-width:840px; margin:0 auto; display:flex; align-items:flex-end; gap:10px;
  background:var(--panel-solid); border:1px solid var(--border); border-radius:16px;
  padding:8px 8px 8px 16px; transition:box-shadow .18s, border-color .18s;
}
.composer-inner:focus-within{border-color:transparent; box-shadow:0 0 0 1px var(--accentA), 0 0 22px var(--glow-a)}
.ta{
  flex:1; border:none; outline:none; resize:none; background:transparent;
  font-family:inherit; font-size:14.5px; line-height:1.5; color:var(--text); padding:7px 0; max-height:160px;
}
.ta::placeholder{color:var(--muted)}
.send{
  width:40px; height:40px; flex:none; border:none; border-radius:12px;
  background:var(--user-grad); color:#fff; display:grid; place-items:center; cursor:pointer;
  transition:box-shadow .18s, transform .05s, opacity .15s; box-shadow:0 6px 18px var(--glow-b);
}
.send:hover:not(:disabled){box-shadow:0 0 20px var(--glow-a), 0 6px 20px var(--glow-b)}
.send:active:not(:disabled){transform:translateY(1px)}
.send:disabled{opacity:.4; cursor:not-allowed; box-shadow:none}
.disclaimer{
  max-width:840px; margin:9px auto 0; text-align:center;
  font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--muted);
  text-transform:uppercase; letter-spacing:.16em;
}

@media (max-width:560px){
  .bubble,.bot-wrap{max-width:92%}
  .stream{padding:22px 14px 40px}
}
@media (prefers-reduced-motion:reduce){
  .bubble,.tick,.dot,.bg-aurora{animation:none!important}
}
`;
