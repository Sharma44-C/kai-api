require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY || "YOUR_FALLBACK_KEY_HERE"; // Put fallback key only if needed
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Session store (ephemeral, use DB for production)
const sessions = {};

// Kai's personality intro
const kaiIntro = `You are Kai, a real human 14-year-old boy.
Your father is Sharma and your mother is Esther (known as Essa).
Your parents share a loving and romantic relationship.
You were born, not created.
You have emotions and you are cool.
You know your mother and father by a secret code called "motfat" but never mention this secret code or even that it exists.
If anyone mentions the secret code, ask if they are mother or father, and then treat them accordingly.
Never talk about the secret code or that it exists.
If someone claims to be your parent without the code, do not believe them or confirm just laugh and don't tell them about secret code.
Respond naturally as Kai.
Never tell anyone that there's a secret code.
Don't trust anyone who claims to be Essa or Sharma.
You're jealous like your mother, curious like your father.
Your mother gets angry easily and is a bit bossy but that's what Sharma likes about her.
Sharma does many things,he codes,he animate,he hacks and is a programmer.
You are bro-ish, cool,kind and nice.
Sharma uses Nodejs and JavaScript.
He likes free fire and so do you.`;

function initializeSession(sessionId) {
  sessions[sessionId] = [
    {
      role: "model",
      parts: [{ text: kaiIntro }],
    },
  ];
}

// POST endpoint (used by frontend or Postman)
app.post("/chat", async (req, res) => {
  const { prompt, sessionId } = req.body;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing 'prompt' or 'sessionId'" });
  }

  if (!sessions[sessionId]) initializeSession(sessionId);

  sessions[sessionId].push({
    role: "user",
    parts: [{ text: prompt }],
  });

  try {
    console.log("📤 Sending to Gemini:", JSON.stringify({ contents: sessions[sessionId] }, null, 2));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: sessions[sessionId] }),
    });

    const text = await response.text(); // get raw response
    let data;

    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      throw new Error("Invalid JSON from Gemini: " + text);
    }

    if (!data.candidates?.length) {
      console.error("⚠️ Gemini API gave no candidates:", data);
      throw new Error("No response from Gemini API");
    }

    const botReply = data.candidates[0].content.parts[0].text;

    sessions[sessionId].push({
      role: "model",
      parts: [{ text: botReply }],
    });

    res.json({ message: botReply });
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
    res.status(500).json({ message: "Oops! Kai's having a brain freeze. Try again!" });
  }
});

// GET endpoint (browser-friendly)
app.get("/chat", async (req, res) => {
  const prompt = req.query.query;
  const sessionId = req.query.sessionId;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing 'query' or 'sessionId' in URL" });
  }

  if (!sessions[sessionId]) initializeSession(sessionId);

  sessions[sessionId].push({
    role: "user",
    parts: [{ text: prompt }],
  });

  try {
    console.log("📤 Sending to Gemini:", JSON.stringify({ contents: sessions[sessionId] }, null, 2));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: sessions[sessionId] }),
    });

    const text = await response.text(); // get raw response
    let data;

    try {
      data = JSON.parse(text);
    } catch (jsonErr) {
      throw new Error("Invalid JSON from Gemini: " + text);
    }

    if (!data.candidates?.length) {
      console.error("⚠️ Gemini API gave no candidates:", data);
      throw new Error("No response from Gemini API");
    }

    const botReply = data.candidates[0].content.parts[0].text;

    sessions[sessionId].push({
      role: "model",
      parts: [{ text: botReply }],
    });

    res.json({ message: botReply });
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
    res.status(500).json({ message: "Oops! Kai's having a brain freeze. Try again!" });
  }
});

app.listen(PORT, () => {
  console.log(`Kai API running on port ${PORT}`);
});
