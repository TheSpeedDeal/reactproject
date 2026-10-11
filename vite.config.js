import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

// Helper to load appsettings.json or fallback to appsettings.example.json
function loadAppSettings() {
  const p = path.resolve(process.cwd(), 'appsettings.json');
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch (e) {
      console.warn('Could not parse appsettings.json:', e);
    }
  }
  const examplePath = path.resolve(process.cwd(), 'appsettings.example.json');
  if (fs.existsSync(examplePath)) {
    try {
      return JSON.parse(fs.readFileSync(examplePath, 'utf-8'));
    } catch {
      // ignore
    }
  }
  return {};
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'appsettings-loader-middleware',
      configureServer(server) {
        // Endpoint to load appsettings.json for local frontend runtime
        server.middlewares.use('/api/appsettings', (_req, res) => {
          res.setHeader('Content-Type', 'application/json');
          const settings = loadAppSettings();
          res.end(JSON.stringify(settings));
        });
      }
    }
  ],
})
