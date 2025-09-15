import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const port = process.env.PORT || 3000;

// Initialize the GoogleGenAI client
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Kai's short personality
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

app.get('/', async (req, res) => {
  try {
    const { prompt, personid } = req.query;
    if (!prompt) return res.json({ error: 'No prompt provided' });

    const kaiPrompt = kaiPersonality(prompt, personid || 'unknown');

    // Generate response using Gemini
    const response = await genAI.generateContent({
      model: 'gemini-2.5-pro',
      contents: kaiPrompt,
    });

    res.json({ reply: response.text });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => console.log(`✅ Kai API running on port ${port}`));
