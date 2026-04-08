/**
 * routes/recipe.routes.js
 * Phase 2 — added search endpoint
 */
const express = require('express');
const router  = express.Router();
const {
  normalizeRecipe,
  searchRecipes,
} = require('../controllers/recipe.controller');

// POST /api/recipes/normalize
router.post('/normalize', normalizeRecipe);

// GET /api/recipes/search?q=dal&diet=vegetarian&region=North&course=main+course
router.get('/search', searchRecipes);

module.exports = router;