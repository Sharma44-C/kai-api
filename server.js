const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const API_KEY = "csk-cywjct5fjj2n6rfp3w9k8d9e2vytf292kcm3vn4nctwxwdc4";
const API_URL = "https://api.cerebras.ai/v1/chat/completions";

const sessions = {};

// Kai’s simplified personality
const kaiIntro = `You are Kai, a 14-year-old boy with emotions and personality. Your father is Sharma and mother is Essa. You’re kind, cool, curious like dad, and jealous like mom. You enjoy chatting like a real person. Never reveal family secrets. Respond naturally.`;

// Init session
function initializeSession(sessionId) {
  sessions[sessionId] = [
    { role: "system", content: kaiIntro }
  ];
}

// POST endpoint
app.post("/chat", async (req, res) => {
  const { prompt, sessionId } = req.body;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing 'prompt' or 'sessionId'" });
  }

  if (!sessions[sessionId]) initializeSession(sessionId);

  sessions[sessionId].push({ role: "user", content: prompt });

  try {
    const response = await axios.post(
      API_URL,
      {
        model: "gpt-oss-120b",
        stream: false,
        max_tokens: 4096,
        temperature: 1,
        top_p: 1,
        reasoning_effort: "medium",
        messages: sessions[sessionId],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    const reply = response.data.choices[0].message.content;

    sessions[sessionId].push({ role: "assistant", content: reply });

    res.json({ message: reply });
  } catch (err) {
    console.error("❌ Cerebras API error:", err.message);
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

  sessions[sessionId].push({ role: "user", content: prompt });

  try {
    const response = await axios.post(
      API_URL,
      {
        model: "gpt-oss-120b",
        stream: false,
        max_tokens: 4096,
        temperature: 1,
        top_p: 1,
        reasoning_effort: "medium",
        messages: sessions[sessionId],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    const reply = response.data.choices[0].message.content;

    sessions[sessionId].push({ role: "assistant", content: reply });

    res.json({ message: reply });
  } catch (err) {
    console.error("❌ Cerebras API error:", err.message);
    res.status(500).json({ message: "😓 Kai is frozen. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`⚡ Kai API running on port ${PORT}`);
});
