const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

app.use(cors());

app.get("/kai=:prompt", async (req, res) => {
  const userPrompt = req.params.prompt;
  if (!userPrompt) return res.status(400).json({ message: "No prompt provided" });

  const kaiPrompt = `You are Kai, a funny AI bro created by Sharma Zambara. You're a Free Fire pro, taught by Frank Kaumba. You reply with jokes, chill vibes, and pro tips. Be funny, confident, and chill.
User: ${userPrompt}`;

  try {
    const geminiRes = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: kaiPrompt }] }]
    });

    const reply = geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text || "Bro... Gemini went quiet on me.";
    res.json({ message: reply });
  } catch (err) {
    console.error("Gemini error:", err.response?.data || err.message);
    res.status(500).json({ message: "❌ Kai couldn't talk. Gemini tripped." });
  }
});

app.get("/", (req, res) => {
  res.send("Kai Gemini API is running!");
});

app.listen(PORT, () => {
  console.log(`Kai API running on port ${PORT}`);
});
