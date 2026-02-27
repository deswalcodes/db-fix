const express = require('express');
const connectDB = require('./db');
const identifyRouter = require('./routes/identify');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies — REQUIRED per assignment (JSON body, not form-data)
app.use(express.json());

// Connect to MongoDB
connectDB();

// Mount the identify route
app.use('/', identifyRouter);

// Health check
app.get('/', (req, res) => res.send('Bitespeed API is running'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
