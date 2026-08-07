# Nexa — FundedNext Futures Assistant

A public support chatbot ("Nexa") for FundedNext Futures, built with Next.js and
Google's Gemini API. The chat interface runs in the browser; a small server route
holds your API key and talks to Gemini, so the key is never exposed to visitors.

**Cost:** this can run completely free — Google Gemini has a free API tier (no
credit card) and Netlify has a free hosting tier that allows business use.

---

## What you need

1. A **Google account** (for the free Gemini API key)
2. A **GitHub** account — https://github.com (free)
3. A **Netlify** account — https://netlify.com (free; sign in with GitHub)

---

## Step 1 — Get your free Gemini API key (~3 min, no card)

1. Go to **https://aistudio.google.com** and sign in with your Google account.
2. Click **"Get API key"** (left menu), then **Create API key**.
3. Copy the key and keep it somewhere safe — you'll paste it in Step 3.

No credit card and no billing setup is required for the free tier.

Note: on the free tier, Google may use messages to improve their models. That's
fine for general FAQ answers; if clients might enter sensitive personal details,
consider Gemini's paid tier or Google Vertex AI later (those don't train on your
data).

---

## Step 2 — Put the project on GitHub (~5 min)

1. Unzip this project folder.
2. On github.com, click **New repository**, name it `nexa-fundednext`, create it.
3. On the new repo page, choose **uploading an existing file**, then drag in
   **all the files and folders** from this project (including the `app` and `lib`
   folders). Commit.

---

## Step 3 — Deploy for free on Netlify (~5 min)

1. Go to https://netlify.com and sign in **with GitHub**.
2. Click **Add new site → Import an existing project**, pick your
   `nexa-fundednext` repo. Netlify detects Next.js automatically — leave defaults.
3. Open **Site settings → Environment variables** and add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** the key you copied in Step 1
4. Click **Deploy**.
5. Netlify gives you a public URL like `https://nexa-fundednext.netlify.app`.
   Share it — anyone can chat with Nexa.

(You can also use Vercel with the same steps, but Vercel's free tier is for
non-commercial use only, so a business bot there needs its $20/month Pro plan.
Netlify's free tier allows commercial use.)

---

## Run it on your own computer first (optional)

1. Install Node.js 18+ from https://nodejs.org
2. In this folder run:
   ```
   npm install
   ```
3. Create a file named `.env.local` (copy `.env.example`) and paste your key:
   ```
   GEMINI_API_KEY=your-google-gemini-key-here
   ```
4. Start it:
   ```
   npm run dev
   ```
5. Open http://localhost:3000

---

## Updating what Nexa knows

All of Nexa's knowledge and behaviour lives in **`lib/knowledge.js`**:
- `KNOWLEDGE_BASE` — the FundedNext Futures facts she answers from. Edit this to
  add or fix information. No retraining needed — she just reads it.
- `SYSTEM_PROMPT` — her personality, tone, glossary, and rules.

After editing, save and push the change to GitHub. Netlify redeploys
automatically within a minute.

To change which Gemini model she uses, edit the `MODEL` line in
`app/api/chat/route.js` (currently `gemini-2.5-flash`).

---

## Good to know about the free tier

- Gemini's free tier has generous daily limits but is rate-limited. If Nexa ever
  gets very busy and hits the cap, replies will pause until the daily reset — it
  won't bill you. If you outgrow it, you can enable Gemini billing for higher
  limits.

---

## How it's put together

- `app/page.js` — the chat interface (runs in the browser).
- `app/api/chat/route.js` — the server function that holds your API key and calls
  Gemini. The browser never sees the key.
- `lib/knowledge.js` — the knowledge base and system prompt (server-side only, so
  visitors can't read them).
