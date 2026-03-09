const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ROOT_DIR = __dirname;
const STATE_FILE = path.join(ROOT_DIR, 'ai_ideation', 'backlog-board-state.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon'
};

const ensureStateFile = async () => {
  try {
    await fs.promises.access(STATE_FILE, fs.constants.F_OK);
  } catch (_) {
    await fs.promises.mkdir(path.dirname(STATE_FILE), { recursive: true });
    await fs.promises.writeFile(
      STATE_FILE,
      JSON.stringify({ boardHtml: '', updatedAt: null }, null, 2),
      'utf8'
    );
  }
};

const json = (res, status, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

const handleApi = async (req, res) => {
  if (req.url !== '/api/backlog-board-state') return false;

  if (req.method === 'GET') {
    try {
      await ensureStateFile();
      const raw = await fs.promises.readFile(STATE_FILE, 'utf8');
      const state = JSON.parse(raw || '{}');
      return json(res, 200, {
        boardHtml: typeof state.boardHtml === 'string' ? state.boardHtml : '',
        updatedAt: state.updatedAt || null
      });
    } catch (error) {
      return json(res, 500, { error: 'Failed to read board state' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      if (typeof payload.boardHtml !== 'string') {
        return json(res, 400, { error: 'boardHtml must be a string' });
      }

      const state = {
        boardHtml: payload.boardHtml,
        updatedAt: payload.updatedAt || new Date().toISOString()
      };

      await ensureStateFile();
      const tmp = `${STATE_FILE}.tmp`;
      await fs.promises.writeFile(tmp, JSON.stringify(state), 'utf8');
      await fs.promises.rename(tmp, STATE_FILE);
      return json(res, 200, { ok: true, updatedAt: state.updatedAt });
    } catch (error) {
      if (error.message === 'Payload too large') {
        return json(res, 413, { error: 'Payload too large' });
      }
      return json(res, 400, { error: 'Invalid request body' });
    }
  }

  json(res, 405, { error: 'Method not allowed' });
  return true;
};

const safePath = (urlPath) => {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  return path.join(ROOT_DIR, normalized);
};

const serveFile = async (req, res) => {
  let filePath = safePath(req.url === '/' ? '/index.html' : req.url);

  try {
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await fs.promises.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  } catch (_) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
};

const server = http.createServer(async (req, res) => {
  const handled = await handleApi(req, res);
  if (handled) return;
  serveFile(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
