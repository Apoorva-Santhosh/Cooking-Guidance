const express = require('express');
const { askAssistant } = require('../controllers/assistant.controller');

const router = express.Router();

// POST /api/assistant/ask
router.post('/ask', askAssistant);

module.exports = router;