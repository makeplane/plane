import { getBrowser, getPage, disconnectBrowser, outputJSON } from './lib/browser.js';

async function debugWs() {
  const browser = await getBrowser();
  const page = await getPage(browser);

  const logs = [];
  const wsEvents = [];

  // Capture console
  page.on('console', msg => {
    logs.push({ type: msg.type(), text: msg.text() });
  });

  // Monitor WebSocket via CDP
  const client = await page.createCDPSession();
  await client.send('Network.enable');

  client.on('Network.webSocketCreated', e => wsEvents.push({ event: 'created', ...e }));
  client.on('Network.webSocketWillSendHandshakeRequest', e => wsEvents.push({ event: 'handshake', ...e }));
  client.on('Network.webSocketHandshakeResponseReceived', e => wsEvents.push({ event: 'response', ...e }));
  client.on('Network.webSocketClosed', e => wsEvents.push({ event: 'closed', ...e }));
  client.on('Network.webSocketFrameError', e => wsEvents.push({ event: 'error', ...e }));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 15000 });

  // Wait for WS connections
  await new Promise(r => setTimeout(r, 5000));

  outputJSON({
    success: true,
    url: page.url(),
    logs: logs.filter(l => l.text.toLowerCase().includes('websocket') || l.text.toLowerCase().includes('ws') || l.type === 'error'),
    wsEvents
  });

  await disconnectBrowser();
  process.exit(0);
}

debugWs().catch(e => {
  console.error(JSON.stringify({ success: false, error: e.message }));
  process.exit(1);
});
