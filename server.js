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
    const messages = req.body.messages;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "No messages provided" });
    }

    const response = await fetch(KILO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: KILO_MODEL,
        messages: messages,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const output = data?.choices?.[0]?.message?.content || "(no output)";
    res.json({ output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Proxy running at http://localhost:${PORT}`));
