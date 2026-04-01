const express = require('express');
const path = require('path');
const briefingHandler = require('./api/briefing');

const app = express();
app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, 'public')));

// Briefing API endpoint
app.post('/api/briefing', briefingHandler);

// All other routes serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Briefing server running on port ${PORT}`);
});
