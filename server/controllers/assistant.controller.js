/**
 * assistant.controller.js
 * Handles POST /api/assistant/ask
 */
const { generateResponse } = require('../services/cookingAssistantService');

const VALID_MODES = ['standard', 'kids', 'senior'];

exports.askAssistant = async (req, res) => {
  try {
    const {
      question, currentStage, applianceType,
      safetyConstraints, userMode, recipeContext,
    } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const mode = VALID_MODES.includes(userMode) ? userMode : 'standard';

    const result = await generateResponse({
      question:          question.trim(),
      currentStage:      currentStage?.trim()      || '',
      applianceType:     applianceType?.trim()     || '',
      safetyConstraints: safetyConstraints?.trim() || '',
      userMode:          mode,
      recipeContext:     recipeContext             || null,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('[AssistantController]', err.message);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
};
