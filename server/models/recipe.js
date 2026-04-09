const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name:                { type: String, required: true, index: true },
  diet:                { type: String, default: null },
  flavor_profile:      { type: String, default: null },
  course:              { type: String, default: null },
  state:               { type: String, default: null, index: true },
  region:              { type: String, default: null, index: true },
  cuisine:             { type: String, default: 'Indian' },
  prep_time:           { type: Number, default: null },
  cook_time:           { type: Number, default: null },
  ingredients:         [String],
  instructions:        { type: String, default: null },
  steps:               [String],
  imageUrl:            { type: String, default: null },
  matchedBothDatasets: { type: Boolean, default: false },
}, { timestamps: true });

recipeSchema.index({ name: 'text', ingredients: 'text' });

module.exports = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);