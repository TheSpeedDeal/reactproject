import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Helper to format SharePoint / OneDrive URLs for binary downloading
function formatSharePointUrl(inputUrl) {
  try {
    const u = new URL(inputUrl.trim());
    if (
      u.hostname.includes('sharepoint.com') ||
      u.hostname.includes('1drv.ms') ||
      u.hostname.includes('onedrive.live.com')
    ) {
      if (u.searchParams.has('web')) u.searchParams.delete('web');
      if (u.searchParams.has('action')) u.searchParams.delete('action');
      u.searchParams.set('download', '1');
      return u.toString();
    }
    return inputUrl.trim();
  } catch {
    return inputUrl.trim();
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sharepoint-proxy-middleware',
      configureServer(server) {
        server.middlewares.use('/api/fetch-remote', async (req, res) => {
          try {
            const parsedReq = new URL(req.url, 'http://localhost');
            const targetUrl = parsedReq.searchParams.get('url');

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing target url parameter' }));
              return;
            }

            const downloadUrl = formatSharePointUrl(targetUrl);

            // Fetch using Node's native fetch (follows redirects, bypasses browser CORS)
            const response = await fetch(downloadUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Accept:
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream, */*'
              },
              redirect: 'follow'
            });

            if (!response.ok) {
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: `SharePoint / Remote server returned HTTP ${response.status} (${response.statusText})`
                })
              );
              return;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Forward content type or default to excel mime
            const contentType =
              response.headers.get('content-type') ||
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

            // Forward content-disposition header if available
            const contentDisposition = response.headers.get('content-disposition');
            if (contentDisposition) {
              res.setHeader('Content-Disposition', contentDisposition);
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', buffer.length);
            res.end(buffer);
          } catch (err) {
            console.error('SharePoint proxy fetch error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to fetch remote file: ' + err.message }));
          }
        });
      }
    }
  ],
})
