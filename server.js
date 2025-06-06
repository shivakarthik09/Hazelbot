const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://shivakarthik09.github.io'
    : 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Load knowledge base
const knowledgeBase = JSON.parse(fs.readFileSync('./knowledgeBase.json', 'utf8'));

// API endpoint for chat
app.post('/api/chat', (req, res) => {
  const { message, userId } = req.body;
  console.log('Received chat request:', message, 'for user:', userId);

  // Simulate intent matching or other logic
  const response = getResponse(message, userId);
  res.json({ response });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}${process.env.NODE_ENV === 'production' ? ' in production mode' : ''}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// ... rest of the getResponse function and other code ... 