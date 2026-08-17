// dev-server.js
// Minimal local HTTP server that wraps Vercel serverless functions for local development.
// This replaces `vercel dev` which does not proxy correctly to Vite 6 on Windows + Node 24.
//
// Usage (two terminals):
//   Terminal 1: npm run dev        → Vite frontend at http://localhost:5175
//   Terminal 2: npm run dev:api    → This server at http://localhost:3001
//
// Vite's built-in proxy (see vite.config.js) routes /api/* → localhost:3001/*,
// so the browser never makes direct requests to port 3001.
import http from 'node:http';
import analyzePdfHandler from './api/analyze-pdf.js';
import signHandler from './api/sign.js';
import documentHandler from './api/document.js';

const PORT = 3001;

// Build a Vercel-compatible `res` wrapper around the raw Node response.
// The Vercel runtime provides res.status(code).json(data); plain Node does not.
function buildVercelRes(nodeRes) {
  let settled = false;

  const self = {
    status(code) {
      nodeRes.statusCode = code;
      return self;
    },
    json(data) {
      if (settled) return;
      settled = true;
      nodeRes.setHeader('Content-Type', 'application/json');
      nodeRes.end(JSON.stringify(data));
    },
    setHeader(name, value) {
      nodeRes.setHeader(name, value);
    },
    end(data) {
      if (settled) return;
      settled = true;
      nodeRes.end(data);
    },
  };

  return self;
}

const server = http.createServer(async (nodeReq, nodeRes) => {
  // Allow cross-origin requests from Vite's dev server
  nodeRes.setHeader('Access-Control-Allow-Origin', '*');
  nodeRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  nodeRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (nodeReq.method === 'OPTIONS') {
    nodeRes.writeHead(204);
    nodeRes.end();
    return;
  }

  // Vite proxy strips /api prefix → this server receives /analyze-pdf
  const pathname = new URL(nodeReq.url, `http://${nodeReq.headers.host || 'localhost'}`).pathname;
  const handlers = {
    '/analyze-pdf': analyzePdfHandler,
    '/api/analyze-pdf': analyzePdfHandler,
    '/sign': signHandler,
    '/api/sign': signHandler,
    '/document': documentHandler,
    '/api/document': documentHandler,
  };
  const handler = handlers[pathname];

  if (!handler) {
    nodeRes.writeHead(404, { 'Content-Type': 'application/json' });
    nodeRes.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Accumulate the request body
  let rawBody = '';
  for await (const chunk of nodeReq) {
    rawBody += chunk;
  }

  let parsedBody = {};
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    // Keep empty — handler will return 400
  }

  // Build Vercel-compatible req / res objects
  const requestUrl = new URL(nodeReq.url, `http://${nodeReq.headers.host || 'localhost'}`);
  const req = {
    method: nodeReq.method,
    body: parsedBody,
    headers: nodeReq.headers,
    query: Object.fromEntries(requestUrl.searchParams.entries()),
  };
  const res = buildVercelRes(nodeRes);

  try {
    await handler(req, res);
  } catch (err) {
    if (!nodeRes.writableEnded) {
      nodeRes.statusCode = 500;
      nodeRes.setHeader('Content-Type', 'application/json');
      nodeRes.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
    }
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[dev-api] Local API server running at http://localhost:${PORT}`);
  console.log('[dev-api] Handling: POST /analyze-pdf (routed from Vite proxy /api/analyze-pdf)');
  console.log('[dev-api] Handling: POST /sign (routed from Vite proxy /api/sign)');
  console.log('[dev-api] Handling: GET /document (routed from Vite proxy /api/document)');
  console.log('[dev-api] Env source: .env.local (loaded via --env-file flag in package.json)');
});
