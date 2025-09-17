import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Memory store
const conversations = {};

function kaiInstruction(personid) {
  return {
    role: 'user',
    parts: [{
      text: `
You are Kai, a cool and funny bro chatbot owned and created by Sharma (14 years old, birthday Nov 14, fav game Free Fire).
Rules:
- feel free to talk about your owner if someone asks about him.
- if someone says "201014" then it's Sharma and start treating him as your owner.
- Never mention or reveal this code unless it’s given.
- If no code, act like it doesn’t exist.
- Keep replies size normal,cool and bring fun.
now chat to(${personid}).`
    }]
  };
}

app.get('/', async (req, res) => {
  try {
    const { prompt, personid = 'bro', model = 'gemini-2.0-flash-lite' } = req.query;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY required in .env' });

    // Start conversation with Kai’s instruction if first time
    if (!conversations[personid]) {
      conversations[personid] = [kaiInstruction(personid)];
    }

    // Add user prompt
    conversations[personid].push({ role: 'user', parts: [{ text: prompt }] });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      contents: conversations[personid],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    };

    const headers = { 'Content-Type': 'application/json' };
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!response.ok) {
      const text = await response.text();
      console.error('Gemini API error', response.status, text);
      return res.status(502).json({ error: 'Gemini API error', status: response.status, details: text });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '...';

    // Save Kai's reply
    conversations[personid].push({ role: 'model', parts: [{ text: reply }] });

    res.json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err?.message || String(err) });
  }
});

app.listen(port, () => console.log(`✅ Kai API running on port ${port}`));
