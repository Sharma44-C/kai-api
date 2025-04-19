const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;

app.post("/kai", async (req, res) => {
  const { prompt, sessionId } = req.body;

  if (!prompt || !sessionId) {
    return res.status(400).json({ message: "Missing prompt or sessionId" });
  }

  try {
    const response = await axios.post("https://api.pawan.kr/v1/chat/completions", {
      model: "pai-001",
      messages: [
        {
          role: "system",
          content: "You are Kai, a funny AI bot owned by Sharma Zambara, a Free Fire pro coder trained by Frank Kaumba. You’re chill, funny, and always spice up conversations like a coding bro.",
        },
        {
          role: "user",
          content: prompt,
        }
      ],
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      }
    });

    res.json({ message: response.data.choices[0].message.content });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Kai is AFK right now. Try again later." });
  }
});

app.listen(3000, () => {
  console.log("Kai API running on http://localhost:3000");
});
