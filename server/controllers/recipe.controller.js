/**
 * recipe.controller.js
 * Handles POST /api/recipes/normalize
 */
const { normalizeRecipe } = require('../services/recipeNormalizerService');
const Recipe = require('../models/recipe');

const VALID_MODES = ['standard', 'kids', 'senior'];

// POST /api/recipes/normalize
exports.normalizeRecipe = async (req, res) => {
  try {
    const { instructions, ingredients, cuisine, userMode, recipeName } = req.body;

    if (!instructions?.trim()) {
      return res.status(400).json({ error: 'Recipe instructions are required.' });
    }

    const mode = VALID_MODES.includes(userMode) ? userMode : 'standard';

    // Optionally fetch metadata from DB if recipeName provided
    let recipeMetadata = null;
    if (recipeName) {
      recipeMetadata = await Recipe.findOne({
        name: { $regex: new RegExp(recipeName, 'i') },
      }).lean();
    }

    const result = await normalizeRecipe({
      instructions: instructions.trim(),
      ingredients:  Array.isArray(ingredients) ? ingredients : [],
      cuisine:      cuisine?.trim() || 'Indian',
      userMode:     mode,
      recipeMetadata,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('[RecipeController]', err.message);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
};

// GET /api/recipes/search?q=dal&diet=vegetarian&region=North&course=main+course
exports.searchRecipes = async (req, res) => {
  try {
    const { q, diet, region, course, state, limit = 10 } = req.query;
    const filter = {};

    if (q)      filter.name   = { $regex: new RegExp(q, 'i') };
    if (diet)   filter.diet   = { $regex: new RegExp(diet, 'i') };
    if (region) filter.region = { $regex: new RegExp(region, 'i') };
    if (state)  filter.state  = { $regex: new RegExp(state, 'i') };
    if (course) filter.course = { $regex: new RegExp(course, 'i') };

    const recipes = await Recipe.find(filter)
      .limit(parseInt(limit))
      .select('name diet region state course flavor_profile prep_time cook_time cuisine ingredients')
      .lean();

    return res.status(200).json({ count: recipes.length, recipes });
  } catch (err) {
    console.error('[RecipeController:search]', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
