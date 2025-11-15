import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// ROOT TEST
app.get("/", (req, res) => {
  res.send("Speckit AI Proxy Running...");
});

// AI ENDPOINT (FINAL FIXED VERSION)
app.post("/api/ai", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    console.log("Received prompt:", prompt);

    // ⭐ FINAL FIX: Correct Kilocode endpoint
    const response = await fetch("https://api.kilocode.ai/v1/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "kilocode-free",   // ⭐ this is the free model
        prompt: prompt,
        max_tokens: 500
      }),
    });

    // Parse Kilocode response safely
    const data = await response.json();
    console.log("Kilocode response:", data);

    // Extract output text
    const output = data?.text || "No AI response received.";

    res.json({ output });

  } catch (err) {
    console.error("Proxy Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// START SERVER
app.listen(5000, () => {
  console.log("Proxy server running on http://localhost:5000");
});
