import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const KILO_API_URL = "https://api.kilocode.ai/v1/chat/completions"; // example
const KILO_MODEL = "kilocode-1";

app.post("/api/ai", async (req, res) => {
  try {
    const prompt = req.body.prompt; // use prompt instead of messages
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    const response = await fetch("https://api.kilocode.ai/v1/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "kilocode-1",
        prompt: prompt,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    const output = data?.choices?.[0]?.text || "(no output)";
    res.json({ output });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => console.log(`Proxy running at http://localhost:${PORT}`));
