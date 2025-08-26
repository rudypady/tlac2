// HTTPS-safe print proxy: POST /api/print -> forwards raw data to PRINTER_HOST:PRINTER_PORT (e.g. 9100)
// Run with: PRINTER_HOST=10.192.138.219 PRINTER_PORT=9100 NODE_ENV=production node server/printer-proxy.js
// Put behind your HTTPS reverse proxy so frontend calls https://<your-domain>/api/print

const express = require('express');
const cors = require('cors');
const net = require('net');

const app = express();

// Config via env
const PRINTER_HOST = process.env.PRINTER_HOST || '127.0.0.1';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100', 10);
const ACCESS_TOKEN = process.env.ACCESS_TOKEN || ''; // optional simple auth
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://tlac.jednoduse.cz').split(',');

// CORS
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: false }));

// Parsers – accept raw and text
app.use(express.raw({ type: ['application/octet-stream', 'application/vnd.hp-pcl', 'application/zpl', 'application/epl'], limit: '5mb' }));
app.use(express.text({ type: ['text/plain', 'application/text'], limit: '5mb' }));

// Simple Bearer auth (optional)
function requireToken(req, res, next) {
  if (!ACCESS_TOKEN) return next();
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
  if (token && token === ACCESS_TOKEN) return next();
  return res.status(401).json({ ok: false, error: 'unauthorized' });
}

app.post('/api/print', requireToken, async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''), 'utf8');
    if (!rawBody || rawBody.length === 0) {
      return res.status(400).json({ ok: false, error: 'empty_body' });
    }

    const socket = new net.Socket();
    let replied = false;

    socket.setTimeout(15000);

    socket.connect(PRINTER_PORT, PRINTER_HOST, () => {
      socket.write(rawBody);
      socket.end();
    });

    socket.on('timeout', () => {
      if (replied) return;
      replied = true;
      socket.destroy();
      res.status(504).json({ ok: false, error: 'printer_timeout' });
    });

    socket.on('error', (err) => {
      if (replied) return;
      replied = true;
      res.status(502).json({ ok: false, error: 'printer_error', details: err.message });
    });

    socket.on('close', () => {
      if (replied) return;
      replied = true;
      res.json({ ok: true });
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'server_error', details: e.message });
  }
});

app.get('/api/print/health', (req, res) => res.json({ ok: true, host: PRINTER_HOST, port: PRINTER_PORT }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Printer proxy listening on ${PORT}, forwarding to ${PRINTER_HOST}:${PRINTER_PORT}`);
});