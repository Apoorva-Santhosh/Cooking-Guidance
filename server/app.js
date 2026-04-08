const express = require('express');
const cors = require('cors');
const recipeRoutes = require('./routes/recipe.routes');
const assistantRoutes = require('./routes/assistant.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/assistant', assistantRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

module.exports = app;