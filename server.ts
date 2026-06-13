import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- LM Studio Proxy Endpoints ---
  app.get("/api/lmstudio/models", async (req, res) => {
    const queryUrl = req.query.url as string;
    const lmStudioUrl = queryUrl || process.env.LM_STUDIO_URL || "http://localhost:1234";
    try {
      console.log(`Fetching models from LM Studio at ${lmStudioUrl}/v1/models...`);
      const response = await axios.get(`${lmStudioUrl}/v1/models`, { timeout: 4000 });
      res.json(response.data);
    } catch (e: any) {
      console.warn("LM Studio is offline or unreachable:", e.message);
      res.status(503).json({ error: "LM Studio is offline or unreachable at " + lmStudioUrl, details: e.message });
    }
  });

  app.post("/api/lmstudio/generate", async (req, res) => {
    const { model, prompt, temperature, lmStudioUrl: customUrl } = req.body;
    const lmStudioUrl = customUrl || process.env.LM_STUDIO_URL || "http://localhost:1234";
    
    try {
      console.log(`Sending humanization request to LM Studio at ${lmStudioUrl} for model ${model}...`);
      const response = await axios.post(`${lmStudioUrl}/v1/chat/completions`, {
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: temperature || 0.8,
        response_format: { type: "json_object" }
      }, {
        timeout: 180000 // 3 minutes for local inference
      });
      res.json(response.data);
    } catch (e: any) {
      console.error("LM Studio Generation Error:", e.message);
      // Fallback: try without response_format if some models get strict about it
      if (e.response?.status === 400 || e.message?.includes("400")) {
        try {
          console.log("Retrying without strict response_format...");
          const response = await axios.post(`${lmStudioUrl}/v1/chat/completions`, {
            model,
            messages: [{ role: "user", content: prompt }],
            temperature: temperature || 0.8
          }, {
            timeout: 180000
          });
          return res.json(response.data);
        } catch (retryError: any) {
          return res.status(500).json({ error: retryError.message });
        }
      }
      res.status(500).json({ error: e.message, details: e.response?.data });
    }
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve from the dist folder
    // When bundled in dist-server/server.js, the dist folder is at ../dist
    const distPath = path.join(__dirname, "../dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
