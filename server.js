import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/ai", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    const response = await fetch("https://api.kilocode.ai/v1/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "kilocode-1",
        prompt: prompt,
        temperature: 0.5
      })
    });

    const data = await response.json();

    return res.json({
      output: data?.choices?.[0]?.text || "No output returned"
    });

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed: " + err.message });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("AI Proxy running on port", process.env.PORT || 5000);
});
