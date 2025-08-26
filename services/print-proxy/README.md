# Print Proxy Service

A standalone Node.js service that accepts ZPL (Zebra Programming Language) commands via HTTP and forwards them to a Zebra printer over TCP/IP (JetDirect port 9100).

## Features

- HTTP POST endpoint `/api/print` accepting ZPL data
- TCP connection to Zebra printers via JetDirect (port 9100)
- Optional API key authentication
- CORS support with configurable origins
- Health check endpoint
- Robust error handling and timeout protection
- Docker support

## Quick Start

### Using Node.js

1. Install dependencies:
```bash
npm install
```

2. Copy and configure environment:
```bash
cp .env.example .env
# Edit .env with your printer IP address
```

3. Start the service:
```bash
npm start
```

### Using Docker

1. Build the image:
```bash
docker build -t print-proxy .
```

2. Run the container:
```bash
docker run -p 3000:3000 -e PRINTER_HOST=192.168.1.100 print-proxy
```

## Configuration

Environment variables (see `.env.example`):

- `PRINTER_HOST` (**required**): IP address of the Zebra printer
- `PRINTER_PORT` (optional): TCP port, defaults to 9100
- `PORT` (optional): HTTP server port, defaults to 3000
- `API_KEY` (optional): If set, requires `X-API-Key` header for authentication
- `CORS_ORIGIN` (optional): Comma-separated list of allowed origins

## API Endpoints

### POST /api/print

Accepts ZPL data and sends it to the configured printer.

**Request:**
```json
{
  "zpl": "^XA^FO50,50^A0N,50,50^FDHello World^FS^XZ"
}
```

**Headers:**
- `Content-Type: application/json`
- `X-API-Key: your-key` (if API_KEY is configured)

**Response:**
```json
{
  "success": true,
  "message": "ZPL sent to printer successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "printer": "192.168.1.100:9100",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Error Handling

The service handles various error conditions:

- Missing or invalid ZPL data (400)
- Missing API key (401) 
- Printer connection timeout (408)
- Printer connection failures (500)

All errors return JSON with an `error` field describing the issue.

## Security

- Use API_KEY environment variable for authentication
- Configure CORS_ORIGIN to restrict allowed origins
- Run as non-root user in Docker
- No sensitive data is logged

## Troubleshooting

1. **Connection timeout**: Check if printer IP is correct and reachable
2. **Connection refused**: Verify printer has JetDirect enabled on port 9100
3. **CORS errors**: Add your frontend domain to CORS_ORIGIN
4. **Authentication errors**: Ensure X-API-Key header matches API_KEY