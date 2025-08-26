# tlac2 Print Proxy (Standalone Service)

HTTPS -> RAW TCP (9100) ZPL print proxy for Zebra printers. Accepts ZPL over HTTP(S) and forwards to a LAN printer using JetDirect/RAW.

## Why
Browsers block direct HTTP to `printer:9100` from an HTTPS site (Mixed Content). This proxy runs server-side and sends ZPL over TCP, enabling "silent" printing flows initiated from the frontend via `fetch("/api/print")`.

## Features
- `POST /api/print` with JSON `{ "zpl": "^XA...^XZ" }`
- Raw TCP forward to `PRINTER_HOST:PRINTER_PORT` (default 9100)
- Optional API key via `X-API-Key`
- Optional CORS allowlist for cross-origin usage
- Health endpoint `GET /api/health`

## Configuration
Create an `.env` file (see `.env.example`):

```
PRINTER_HOST=10.192.138.219
PRINTER_PORT=9100
PORT=3000
# Optional security
# API_KEY=super-secret-key
# CORS_ORIGIN=https://your-frontend.example.com
```

## Run (Node)
```
cd services/print-proxy
npm ci
cp .env.example .env
# edit .env to your printer IP
npm start
```

## Run (Docker)
```
cd services/print-proxy
docker build -t tlac2-print-proxy .
# Linux/macOS: pass .env values
docker run --rm -p 3000:3000 \
  -e PRINTER_HOST=10.192.138.219 \
  -e PRINTER_PORT=9100 \
  -e PORT=3000 tlac2-print-proxy
```

## Test
```
# Health
curl -s http://localhost:3000/api/health

# Send a tiny ZPL test label (prints a small CODE128 with text)
ZPL='^XA^FO20,20^A0N,30,30^FDHello^FS^FO20,70^BY2^BCN,60,N,N,N^FD123456^FS^XZ'
curl -s -X POST http://localhost:3000/api/print \
  -H 'Content-Type: application/json' \
  -d "{\"zpl\": \"${ZPL}\"}"
```

If `API_KEY` is set, include `-H 'X-API-Key: <key>'`.

## Security Notes
- Run this service behind your reverse proxy with HTTPS.
- Restrict access (firewall, VPN) so only your frontend/backends can call it.
- Use `API_KEY` if exposed beyond trusted network segments.

## Troubleshooting
- `Printer connection failed`: verify `PRINTER_HOST` and TCP reachability on port `9100`.
- Nothing prints: ensure the printer is a RAW JetDirect-capable Zebra (or compatible) and that received ZPL is valid.
- Encoding: ZPL typically expects ASCII; if sending diacritics, consider `^CI28` and appropriate fonts.