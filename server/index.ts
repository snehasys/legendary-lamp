import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getSandboxToken(): string {
  const tokenPath = path.join(process.env.HOME || "/home/ubuntu", ".secrets", "sandbox_api_token");
  try {
    return fs.readFileSync(tokenPath, "utf-8").trim();
  } catch {
    console.warn("Sandbox token not found at", tokenPath);
    return "";
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Parse JSON bodies
  app.use(express.json());

  // Data API proxy - forwards requests to Manus API
  app.post("/api/data", async (req, res) => {
    try {
      const { apiId, query } = req.body;
      const runtimeApiHost = process.env.RUNTIME_API_HOST || "https://api.manus.im";
      const sandboxToken = getSandboxToken();

      if (!sandboxToken) {
        res.status(500).json({ error: "Sandbox token not configured" });
        return;
      }

      const apiResp = await fetch(
        `${runtimeApiHost}/apiproxy.v1.ApiProxyService/CallApi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-sandbox-token": sandboxToken,
          },
          body: JSON.stringify({ apiId, query }),
        }
      );

      const data = await apiResp.json() as Record<string, unknown>;
      if (data.code) {
        // API returned an error
        res.status(400).json(data);
      } else if (data.jsonData) {
        res.setHeader("Content-Type", "application/json");
        res.send(data.jsonData);
      } else {
        res.json(data);
      }
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
