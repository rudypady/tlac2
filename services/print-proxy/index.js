const express = require('express');
const cors = require('cors');
const net = require('net');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PRINTER_HOST = process.env.PRINTER_HOST;
const PRINTER_PORT = process.env.PRINTER_PORT || 9100;
const API_KEY = process.env.API_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS configuration
const corsOptions = {};
if (CORS_ORIGIN) {
  corsOptions.origin = CORS_ORIGIN.split(',').map(origin => origin.trim());
}
app.use(cors(corsOptions));

// API Key middleware
const requireApiKey = (req, res, next) => {
  if (API_KEY) {
    const providedKey = req.headers['x-api-key'];
    if (!providedKey || providedKey !== API_KEY) {
      return res.status(401).json({ error: 'Invalid or missing API key' });
    }
  }
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    printer: PRINTER_HOST ? `${PRINTER_HOST}:${PRINTER_PORT}` : 'not configured',
    timestamp: new Date().toISOString()
  });
});

// Print endpoint
app.post('/api/print', requireApiKey, async (req, res) => {
  let responseStatus = 500;
  let responseData = { error: 'Internal server error' };
  let responseSent = false;

  try {
    const { zpl } = req.body;
    
    if (!zpl || typeof zpl !== 'string') {
      responseStatus = 400;
      responseData = { error: 'Missing or invalid ZPL data' };
      return res.status(responseStatus).json(responseData);
    }

    if (!PRINTER_HOST) {
      responseStatus = 500;
      responseData = { error: 'Printer host not configured' };
      return res.status(responseStatus).json(responseData);
    }

    // Create TCP connection to printer
    const client = new net.Socket();
    const timeout = 10000; // 10 seconds timeout

    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (!responseSent) {
        client.destroy();
        responseStatus = 408;
        responseData = { error: 'Printer connection timeout' };
        res.status(responseStatus).json(responseData);
        responseSent = true;
      }
    }, timeout);

    client.connect(PRINTER_PORT, PRINTER_HOST, () => {
      console.log(`Connected to printer at ${PRINTER_HOST}:${PRINTER_PORT}`);
      
      // Send ZPL data
      client.write(zpl);
      
      // Close connection after sending
      client.end();
    });

    client.on('close', () => {
      console.log('Connection to printer closed');
      if (!responseSent) {
        clearTimeout(timeoutId);
        responseStatus = 200;
        responseData = { 
          success: true, 
          message: 'ZPL sent to printer successfully',
          timestamp: new Date().toISOString()
        };
        res.status(responseStatus).json(responseData);
        responseSent = true;
      }
    });

    client.on('error', (err) => {
      console.error('Printer connection error:', err);
      if (!responseSent) {
        clearTimeout(timeoutId);
        responseStatus = 500;
        responseData = { error: `Printer connection failed: ${err.message}` };
        res.status(responseStatus).json(responseData);
        responseSent = true;
      }
    });

  } catch (error) {
    console.error('Print request error:', error);
    if (!responseSent) {
      responseStatus = 500;
      responseData = { error: `Print request failed: ${error.message}` };
      res.status(responseStatus).json(responseData);
      responseSent = true;
    }
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Print proxy server running on port ${PORT}`);
  console.log(`Printer: ${PRINTER_HOST ? `${PRINTER_HOST}:${PRINTER_PORT}` : 'not configured'}`);
  console.log(`API Key: ${API_KEY ? 'configured' : 'not configured'}`);
  console.log(`CORS Origins: ${CORS_ORIGIN || 'all origins allowed'}`);
});