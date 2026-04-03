import { getBrowser, getPage, disconnectBrowser, outputJSON } from './lib/browser.js';

async function debugWsFull() {
  const browser = await getBrowser({ headless: false });
  const page = await getPage(browser);

  const logs = [];
  const wsEvents = [];
  const networkErrors = [];

  // Capture ALL console messages
  page.on('console', msg => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });

  // Capture page errors
  page.on('pageerror', err => {
    logs.push({ type: 'pageerror', text: err.message });
  });

  // Monitor WebSocket via CDP
  const client = await page.createCDPSession();
  await client.send('Network.enable');

  client.on('Network.webSocketCreated', e => {
    console.log('WS Created:', e.url);
    wsEvents.push({ event: 'created', url: e.url, requestId: e.requestId });
  });

  client.on('Network.webSocketWillSendHandshakeRequest', e => {
    console.log('WS Handshake Request:', e.requestId);
    wsEvents.push({ event: 'handshake_request', requestId: e.requestId, request: e.request });
  });

  client.on('Network.webSocketHandshakeResponseReceived', e => {
    console.log('WS Handshake Response:', e.response?.status);
    wsEvents.push({
      event: 'handshake_response',
      requestId: e.requestId,
      status: e.response?.status,
      headers: e.response?.headers
    });
  });

  client.on('Network.webSocketClosed', e => {
    console.log('WS Closed:', e.requestId);
    wsEvents.push({ event: 'closed', requestId: e.requestId });
  });

  client.on('Network.webSocketFrameError', e => {
    console.log('WS Frame Error:', e.errorMessage);
    wsEvents.push({ event: 'frame_error', requestId: e.requestId, error: e.errorMessage });
  });

  client.on('Network.webSocketFrameReceived', e => {
    wsEvents.push({ event: 'frame_received', requestId: e.requestId, data: e.response?.payloadData?.substring(0, 200) });
  });

  client.on('Network.webSocketFrameSent', e => {
    wsEvents.push({ event: 'frame_sent', requestId: e.requestId, data: e.response?.payloadData?.substring(0, 200) });
  });

  // Track failed requests
  client.on('Network.loadingFailed', e => {
    if (e.type === 'WebSocket') {
      networkErrors.push({ requestId: e.requestId, error: e.errorText, canceled: e.canceled });
    }
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 20000 });

  console.log('Current URL:', page.url());

  // Wait longer and collect events
  console.log('Waiting 10s to collect WebSocket events...');
  await new Promise(r => setTimeout(r, 10000));

  // Filter for /ws connections only (not vite-hmr)
  const appWsEvents = wsEvents.filter(e => e.url?.includes('/ws') && !e.url?.includes('token='));

  outputJSON({
    success: true,
    url: page.url(),
    appWsEvents,
    allWsEvents: wsEvents,
    networkErrors,
    logs: logs.filter(l =>
      l.text?.toLowerCase().includes('websocket') ||
      l.text?.toLowerCase().includes('unauthorized') ||
      l.text?.toLowerCase().includes('error') ||
      l.type === 'error'
    ).slice(0, 20)
  });

  await disconnectBrowser();
  process.exit(0);
}

debugWsFull().catch(e => {
  console.error(JSON.stringify({ success: false, error: e.message, stack: e.stack }));
  process.exit(1);
});
