// sendToPrinter via HTTPS proxy to avoid Mixed Content.
// Usage: await sendToPrinter(rawPayload, { mime: 'text/plain', token: '...' });

async function sendToPrinter(payload, { mime = 'text/plain', token = '' } = {}) {
  const url = `${location.origin}/api/print`;
  const headers = { 'Content-Type': mime };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const body = typeof payload === 'string' ? payload : new Uint8Array(payload);
    const resp = await fetch(url, { method: 'POST', headers, body });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.ok) {
      const msg = data.error || `HTTP ${resp.status}`;
      throw new Error(`Print proxy error: ${msg}`);
    }
    console.log('Direct print: sent via HTTPS proxy');
    return true;
  } catch (err) {
    console.error('Direct print error via proxy:', err);
    try {
      const blob = new Blob([payload], { type: mime });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `print_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (_) {}
    throw new Error('Priame pripojenie nie je k dispozícii. Súbor bol stiahnutý na manuálne odoslanie.');
  }
}

window.sendToPrinter = sendToPrinter;