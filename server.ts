import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- GitHub OAuth Routes ---

  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL}/api/auth/github/callback`;
    const scope = "repo";
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    res.json({ url });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    try {
      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const { access_token } = response.data;

      if (access_token) {
        res.cookie("github_token", access_token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
        
        res.send(`
          <html>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS' }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <p>Authentication successful. This window should close automatically.</p>
            </body>
          </html>
        `);
      } else {
        res.status(400).send("Failed to obtain access token");
      }
    } catch (error) {
      console.error("GitHub OAuth Error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/api/auth/github/status", (req, res) => {
    const token = req.cookies.github_token;
    res.json({ isAuthenticated: !!token });
  });

  app.post("/api/auth/github/logout", (req, res) => {
    res.clearCookie("github_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.json({ success: true });
  });

  // --- GitHub API Proxy Routes ---

  app.get("/api/github/user", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${token}` },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || {});
    }
  });

  app.get("/api/github/repos", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const response = await axios.get("https://api.github.com/user/repos?sort=updated&per_page=100", {
        headers: { Authorization: `token ${token}` },
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || {});
    }
  });

  app.post("/api/github/sync", async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const { owner, repo, path, content, message, sha } = req.body;

    try {
      const response = await axios.put(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        {
          message,
          content: Buffer.from(content).toString("base64"),
          sha,
        },
        {
          headers: { Authorization: `token ${token}` },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || {});
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
