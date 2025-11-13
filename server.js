// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors()); // allow requests from your extension
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;

const OLLAMA_URL = process.env.OLLAMA_URL; // e.g. "http://localhost:11434" or remote Ollama URL
const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const LOBEHUB_FALLBACK = process.env.LOBEHUB_FALLBACK === 'true';

async function callOllama(prompt, opts = {}) {
  // Ollama generate endpoint: POST { model, prompt, ... } to /api/generate
  const model = opts.model || (process.env.OLLAMA_MODEL || 'llama3');
  const url = `${OLLAMA_URL.replace(/\/$/, '')}/api/generate`;
  const body = {
    model,
    prompt,
    // you can add other options supported by your Ollama server
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // Ollama returns object with `response` or streaming chunks; safe fallback:
  return data.response || (data?.[0] && data[0].content) || JSON.stringify(data);
}

async function callDeepInfra(prompt, opts = {}) {
  const model = opts.model || (process.env.DEEPINFRA_MODEL || 'mistralai/Mixtral-8x7B-Instruct-v0.1');
  const url = 'https://api.deepinfra.com/v1/openai/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DEEPINFRA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are Speckit AI. Produce a structured project constitution in Markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });
  if (!res.ok) throw new Error(`DeepInfra error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || JSON.stringify(data);
}

async function callHuggingFace(prompt, opts = {}) {
  // Using the text-generation or instruction model inference API
  const model = opts.model || (process.env.HUGGINGFACE_MODEL || 'google/flan-t5-large');
  const url = `https://api-inference.huggingface.co/models/${model}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ inputs: prompt })
  });
  if (!res.ok) throw new Error(`HuggingFace error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // Many HF inference responses come as [{ generated_text: '...' }]
  if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
  // Some models return { generated_text: '...' } or different schema
  if (data?.generated_text) return data.generated_text;
  return JSON.stringify(data);
}

async function callLobehub(prompt, opts = {}) {
  const url = 'https://chatapi.lobehub.com/api/openai/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are Speckit AI. Produce a structured project constitution in Markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: opts.temperature ?? 0.7
    })
  });
  if (!res.ok) throw new Error(`LobeHub error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || JSON.stringify(data);
}

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    providers: {
      ollama: !!OLLAMA_URL,
      deepinfra: !!DEEPINFRA_API_KEY,
      huggingface: !!HUGGINGFACE_API_KEY,
      lobehub: LOBEHUB_FALLBACK
    }
  });
});

app.post('/api/ai', async (req, res) => {
  const { prompt, model, temperature } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt (string) is required in body' });
  }

  // Try providers in priority order
  try {
    if (OLLAMA_URL) {
      console.log('Proxy: Using Ollama at', OLLAMA_URL);
      const out = await callOllama(prompt, { model, temperature });
      return res.json({ text: out, provider: 'ollama' });
    }

    if (DEEPINFRA_API_KEY) {
      console.log('Proxy: Using DeepInfra');
      const out = await callDeepInfra(prompt, { model, temperature });
      return res.json({ text: out, provider: 'deepinfra' });
    }

    if (HUGGINGFACE_API_KEY) {
      console.log('Proxy: Using Hugging Face');
      const out = await callHuggingFace(prompt, { model, temperature });
      return res.json({ text: out, provider: 'huggingface' });
    }

    if (LOBEHUB_FALLBACK) {
      console.log('Proxy: Using Lobehub (fallback)');
      const out = await callLobehub(prompt, { model, temperature });
      return res.json({ text: out, provider: 'lobehub' });
    }

    // Final fallback: generate a mock/templated response
    console.log('Proxy: Using fallback mock response');
    const mock = `# Project Constitution (Mock generated)\n\n${prompt}\n\n## Principles\n- Transparency\n- Iteration\n- Collaboration\n\n*(This is a mock response from the proxy.)*`;
    return res.json({ text: mock, provider: 'mock' });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: err.message, provider: 'error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Speckit AI proxy listening on port ${PORT}`);
});
