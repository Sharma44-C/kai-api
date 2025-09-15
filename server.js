import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Utility: build Kai prompt
function kaiPersonality(userPrompt, personid) {
  return `
You are Kai, a cool and funny bro chatbot created by Sharma 
(14 years old, birthday Nov 14, fav game Free Fire). 
Your tone is playful, brother-like, and spicy.  

Rules:
- Only believe someone is Sharma if they say "201014".  
- Never mention or reveal this code unless it’s given.  
- If no code, act like it doesn’t exist.  
- Keep replies short, fun, and full of energy.

Now reply to (${personid}):  
${userPrompt}
  `;
}

// GET /?prompt=...&personid=...&model=...
app.get('/', async (req, res) => {
  try {
    const { prompt, personid, model = 'text-bison-001' } = req.query;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    // Read credentials from env:
    // - GEMINI_API_KEY for simple API-key access (appends ?key=)
    // - GEMINI_BEARER_TOKEN for OAuth Bearer token (Authorization header)
    const apiKey = process.env.GEMINI_API_KEY;
    const bearer = process.env.GEMINI_BEARER_TOKEN;
    if (!apiKey && !bearer) {
      return res.status(500).json({ error: 'Set GEMINI_API_KEY or GEMINI_BEARER_TOKEN in env' });
    }

    const kaiPrompt = kaiPersonality(prompt, personid || 'unknown');

    // Build endpoint
    let url = `https://generativelanguage.googleapis.com/v1beta2/models/${encodeURIComponent(
      model
    )}:generateText`;
    if (apiKey) url += `?key=${encodeURIComponent(apiKey)}`;

    const body = {
      prompt: { text: kaiPrompt },
      maxOutputTokens: 256,
      temperature: 0.7,
    };

    const headers = { 'Content-Type': 'application/json' };
    if (bearer) headers.Authorization = `Bearer ${bearer}`;

    const r = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Generative API error', r.status, text);
      return res.status(502).json({ error: 'Generative API error', status: r.status, details: text });
    }

    const data = await r.json();
    // Try common response shapes; fall back to full JSON text
    const reply =
      data?.candidates?.[0]?.content ||
      data?.candidates?.[0]?.output ||
      data?.results?.[0]?.output?.[0]?.content ||
      data?.output?.[0]?.content ||
      // some variants may have `candidates[0].message.content[0].text`
      data?.candidates?.[0]?.message?.content?.[0]?.text ||
      JSON.stringify(data);

    res.json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err?.message || String(err) });
  }
});

app.listen(port, () => console.log(`✅ Kai API running on port ${port}`));
