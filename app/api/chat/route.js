import { SYSTEM_PROMPT } from "../../../lib/knowledge";

// Run on the Node.js runtime so process.env is available.
export const runtime = "nodejs";

// Free-tier Google Gemini model. You can change this to another Flash model
// (e.g. "gemini-2.5-flash-lite") if you want.
const MODEL = "gemini-2.5-flash";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "No messages provided." }, { status: 400 });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return Response.json(
        { error: "Server is not configured. Missing GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    // Convert our messages to Gemini's format:
    //  - roles are "user" and "model" (not "assistant")
    //  - keep the last 20 turns and cap each message length (basic abuse guard)
    const contents = messages.slice(-20).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "").slice(0, 4000) }],
    }));

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      MODEL +
      ":generateContent";

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 1000 },
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("Gemini API error:", upstream.status, detail);
      return Response.json({ error: "Upstream error." }, { status: 502 });
    }

    const data = await upstream.json();
    const text = ((data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts) || [])
      .map((p) => p.text || "")
      .join("")
      .trim();

    return Response.json({ text });
  } catch (e) {
    console.error("Chat route error:", e);
    return Response.json({ error: "Server error." }, { status: 500 });
  }
}
