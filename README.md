# HTTPS print proxy for direct network printing

This PR adds a small HTTPS-safe print proxy and a frontend helper to avoid mixed content when sending raw label data to network printers (port 9100).

## Why

- The app runs on HTTPS. Direct requests to `http://<printer-ip>:9100` are blocked by browsers as Mixed Content.
- Solution: send label data to `/api/print` on the same HTTPS origin. The server forwards it to the printer via TCP.

## What's included

- `server/printer-proxy.js` – Node/Express proxy exposing `POST /api/print` and forwarding to `PRINTER_HOST:PRINTER_PORT`.
- `server/package.json` – minimal dependencies.
- `server/.env.example` – configuration template.
- `js/direct-print-proxy.js` – client helper `window.sendToPrinter(payload, { mime, token })`.

## How to deploy

1) Install deps:
```bash
cd server
npm i
```
2) Configure env (or set environment variables):
```
PRINTER_HOST=10.192.138.219
PRINTER_PORT=9100
ACCESS_TOKEN=            # optional Bearer token required by the proxy
ALLOWED_ORIGINS=https://tlac.jednoduse.cz
```
3) Start the proxy (behind your HTTPS reverse proxy):
```bash
node printer-proxy.js
# or e.g. with PM2
# npx pm2 start printer-proxy.js --name printer-proxy
```
4) Map HTTPS `https://<your-domain>/api/print` to the Node process (example Nginx):
```
location /api/print {
  proxy_pass http://127.0.0.1:3000/api/print;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_set_header X-Forwarded-Proto https;
}
```

## Frontend usage

- Include the helper on pages that will use direct network print:
```html
<script src="js/direct-print-proxy.js"></script>
```
- Send raw data (ZPL/EPL/PCL/plain text) via HTTPS:
```js
await window.sendToPrinter('RAW_LABEL_DATA', { mime: 'text/plain' });
// For ZPL, use mime: 'application/zpl'
```

## Security

- Set `ACCESS_TOKEN` and send `Authorization: Bearer <token>` from the client to protect the endpoint.
- Restrict `ALLOWED_ORIGINS` to your domain.

## Acceptance criteria

- No Mixed Content errors when invoking `/api/print` from `https://...`.
- `GET /api/print/health` returns `{ ok: true }` via HTTPS origin.
- From browser console on tlac1.html, calling `sendToPrinter('TEST\n')` returns success (assuming the reverse proxy and Node service are running and the printer is reachable).