// server.js
import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // npm install node-fetch@2

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Port
const PORT = process.env.PORT || 5000;

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Kilocode AI Proxy is running" });
});

// Proxy endpoint to handle AI requests
app.post("/api/ai", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "No messages array provided" });
    }

    // Simulate Kilocode AI response (replace this with actual API logic if available)
    const userMessage = messages.map(m => m.content).join("\n");
    const output = `# AI Response for command:\n${userMessage}\n\n(This is a simulated response for testing)`;

    return res.json({ output });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Kilocode AI Proxy running on port ${PORT}`);
});
