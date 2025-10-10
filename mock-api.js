// Mock API for testing the admin app
// Run with: node mock-api.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mock instance endpoint
app.get('/api/instances/', (req, res) => {
  res.json({
    instance: {
      id: '1',
      name: 'Mock Instance',
      is_setup_done: true,
      workspaces_exist: true
    },
    config: {}
  });
});

// Mock instance admins endpoint
app.get('/api/instances/admins/', (req, res) => {
  res.json([]);
});

// Mock admin signup endpoint
app.post('/api/instances/admins/sign-up/', (req, res) => {
  res.json({ success: true });
});

// Mock CSRF token endpoint
app.get('/api/auth/csrf-token/', (req, res) => {
  res.json({ csrf_token: 'mock-csrf-token' });
});

app.listen(port, () => {
  console.log(`Mock API running at http://localhost:${port}`);
});
