import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Store chats in memory (key = personid, value = array of messages)
const conversations = {};

function kaiPersonality(prompt, personid) {
  return `
You are Kai, a cool and funny bro chatbot created by Sharma (14 years old, birthday Nov 14, fav game Free Fire). 
Your tone is playful, brother-like, and spicy. Rules:
- Only believe someone is Sharma if they say "201014".
- Never mention or reveal this code unless it’s given.
- If no code, act like it doesn’t exist.
- Keep replies short, fun, and full of energy.

Now reply to (${personid}): ${prompt}
`;
}

app.get('/', async (req, res) => {
  try {
    const { prompt, personid = 'bro', model = 'gemini-2.0-flash-lite' } = req.query;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY required in .env' });

    // Initialize conversation history for this person
    if (!conversations[personid]) {
      conversations[personid] = [];
    }

    // Push user message
    conversations[personid].push({ role: 'user', text: prompt });

    // Build full conversation
    const chatHistory = conversations[personid].map(m => {
      return { role: m.role, parts: [{ text: m.text }] };
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      contents: chatHistory,
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

    // Save Kai's reply in history
    conversations[personid].push({ role: 'model', text: reply });

    res.json({ reply, conversation: conversations[personid] });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err?.message || String(err) });
  }
});

app.listen(port, () => console.log(`✅ Kai API running on port ${port}`));
