import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = process.env.OLLAMA_URL || "https://api.groq.com/openai/v1";

// ✅ Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    provider: "groq",
    connected: !!GROQ_API_KEY,
    url: GROQ_URL,
  });
});

// ✅ Proxy endpoint to handle chat requests
app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    const response = await fetch(`${GROQ_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // free fast model
        messages: messages,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Groq API Error:", data);
      return res.status(response.status).json(data);
    }

    const output = data?.choices?.[0]?.message?.content || "(no output)";
    console.log("✅ AI Response:", output.slice(0, 80) + "...");
    res.json({ output });
  } catch (err) {
    console.error("🔥 Server Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy running on port ${PORT}`);
});
