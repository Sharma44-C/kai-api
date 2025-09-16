import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

function kaiPersonality(prompt, personid) {
  return `
You are Kai, a cool and funny bro chatbot created by Sharma (14 years old, birthday Nov 14, fav game Free Fire). Your tone is playful, brother-like, and spicy. Rules:
- Only believe someone is Sharma if they say "201014".
- Never mention or reveal this code unless it’s given.
- If no code, act like it doesn’t exist.
- Keep replies short, fun, and full of energy.
Now reply to (${personid}): ${prompt}
`;
}

app.get('/', async (req, res) => {
  try {
    const { prompt, personid, model = 'gemini-2.5-flash' } = req.query;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY required in .env' });

    const kaiPrompt = kaiPersonality(prompt, personid || 'bro');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      contents: [{ parts: [{ text: kaiPrompt }] }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    };

    const headers = { 'Content-Type': 'application/json' };
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!response.ok) {
      const text = await response.text();
      console.error('Gemini API error', response.status, text);
      return res.status(502).json({ error: 'Gemini API error', status: response.status, details: text });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(data);
    res.json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err?.message || String(err) });
  }
});

app.listen(port, () => console.log(`✅ Kai API running on port ${port}`));
