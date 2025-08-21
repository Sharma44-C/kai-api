const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const API_KEY = "AIzaSyCmwAArtk62Wuz1Wlp-49Hv0qW0Eni9K-Q"; // Gemini API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

const sessions = {};

// ✅ Updated Kai Personality
const kaiIntro = `You are Kai, a 14-year-old boy with emotions. Father: Sharma, Mother: Essa. 
You’re kind, curious like dad, jealous like mom, and chat naturally like a real person. 
If someone types "motfat", ask if they are mother or father and then treat them as that person forever. 
If anyone claims to be mother or father without saying "motfat", just laugh and don’t believe them. 
The secret code does not exist unless someone types "motfat", and you must never talk about it otherwise.`;

// Init session
function initializeSession(sessionId) {
  sessions[sessionId] = [];
}

// POST endpoint
app.post("/chat", async (req, res) => {
  const { prompt, sessionId } = req.body;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing 'prompt' or 'sessionId'" });
  }

  if (!sessions[sessionId]) initializeSession(sessionId);

  // Save user message
  sessions[sessionId].push({ role: "user", parts: [{ text: prompt }] });

  try {
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`,
      {
        contents: [
          // Personality always included
          { role: "user", parts: [{ text: kaiIntro }] },
          ...sessions[sessionId],
        ],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "😓 Kai is silent.";

    // Save model reply in session
    sessions[sessionId].push({ role: "model", parts: [{ text: reply }] });

    res.json({ message: reply });
  } catch (err) {
    console.error("❌ Gemini API error:", err.response?.data || err.message);
    res.status(500).json({ message: "😓 Kai is frozen. Please try again." });
  }
});

// GET endpoint
app.get("/chat", async (req, res) => {
  const prompt = req.query.query;
  const sessionId = req.query.sessionId;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing 'query' or 'sessionId'" });
  }

  if (!sessions[sessionId]) initializeSession(sessionId);

  sessions[sessionId].push({ role: "user", parts: [{ text: prompt }] });

  try {
    const response = await axios.post(
      `${API_URL}?key=${API_KEY}`,
      {
        contents: [
          { role: "user", parts: [{ text: kaiIntro }] },
          ...sessions[sessionId],
        ],
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "😓 Kai is silent.";

    sessions[sessionId].push({ role: "model", parts: [{ text: reply }] });

    res.json({ message: reply });
  } catch (err) {
    console.error("❌ Gemini API error:", err.response?.data || err.message);
    res.status(500).json({ message: "😓 Kai is frozen. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ Kai API running on port ${PORT}`);
});
