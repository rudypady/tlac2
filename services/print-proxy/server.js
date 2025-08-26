// Standalone ZPL print proxy: HTTPS/HTTP -> RAW TCP 9100
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import net from 'node:net';

dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

// Optional CORS allowlist
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : undefined;
app.use(cors({ origin: corsOrigins }));

const PRINTER_HOST = process.env.PRINTER_HOST; // required
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100', 10);
const API_KEY = process.env.API_KEY || null;

if (!PRINTER_HOST) {
  console.error('Missing PRINTER_HOST in environment!');
  process.exit(1);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, printer: `${PRINTER_HOST}:${PRINTER_PORT}` });
});

app.post('/api/print', async (req, res) => {
  try {
    if (API_KEY) {
      const headerKey = req.header('x-api-key');
      if (headerKey !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const { zpl } = req.body || {};
    if (!zpl || typeof zpl !== 'string' || zpl.trim().length < 3) {
      return res.status(400).json({ error: 'Invalid ZPL payload' });
    }

    const socket = new net.Socket();
    let responded = false;

    // Safety timeout
    socket.setTimeout(8000);

    socket.connect(PRINTER_PORT, PRINTER_HOST, () => {
      socket.write(zpl, 'utf8', () => {
        // Give printer a short flush window, then end
        setTimeout(() => socket.end(), 50);
      });
    });

    socket.on('timeout', () => {
      socket.destroy(new Error('Printer connection timeout'));
    });

    socket.on('error', (err) => {
      console.error('Printer socket error:', err);
      if (!responded) {
        responded = true;
        res.status(502).json({ error: 'Printer connection failed', details: String(err?.message || err) });
      }
    });

    socket.on('close', (hadError) => {
      if (!hadError && !responded) {
        responded = true;
        res.json({ ok: true });
      }
    });
  } catch (e) {
    console.error('Proxy error:', e);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Print proxy error' });
    }
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`Print proxy listening on :${PORT}, forwarding to ${PRINTER_HOST}:${PRINTER_PORT}`);
});