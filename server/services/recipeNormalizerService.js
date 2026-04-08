/**
 * recipeNormalizerService.js
 *
 * Phase 2 — uses Grok for smarter hazard classification per step.
 * Falls back to keyword matching if Grok is unavailable.
 */

const { classifyStepHazard } = require('./cookingAssistantService');
const regionalData = require('../data/regionalAppliances.json');

// ── Parse raw instruction text into step array ────────────────────────────────
function parseSteps(rawInstructions) {
  return rawInstructions
    .split(/\n|(?=\b(?:step\s*)?\d+[\.\)]\s)/i)
    .map(l => l.replace(/^(step\s*)?\d+[\.\)]\s*/i, '').trim())
    .filter(l => l.length > 10);
}

// ── Apply persona filter based on hazard classification ───────────────────────
function applyPersonaFilter(step, hazardResult, index, userMode) {
  const { hazard, type, severity } = hazardResult;
  const applianceInfo = type !== 'none'
    ? regionalData.applianceHazards[type] || null
    : null;

  let displayText = step;
  let hidden      = false;
  let warnings    = [];

  if (userMode === 'kids' && hazard) {
    hidden      = true;
    const warn  = applianceInfo?.kidsNote || 'Ask a grown-up to help with this step! 🙋';
    displayText = warn;
    warnings    = [warn];
  }

  if (userMode === 'senior' && hazard) {
    const warn  = applianceInfo?.seniorNote || `⚠️ Safety: Take care with this step.`;
    displayText = `${warn}\n\n${step}`;
    warnings    = [warn];
  }

  return {
    stepNumber:   index + 1,
    originalText: step,
    displayText,
    isHazardous:  hazard,
    hazardType:   type,
    severity,
    hidden,
    warnings,
  };
}

// ── Lookup required appliances from region ────────────────────────────────────
function getRequiredAppliances(state, region) {
  const regionKey = region ||
    (state ? regionalData.stateToRegion[state] : null) || null;
  if (!regionKey || !regionalData.regions[regionKey]) return [];
  return regionalData.regions[regionKey].appliances;
}

// ── Main normalize function ───────────────────────────────────────────────────
async function normalizeRecipe({ instructions, ingredients, cuisine, userMode, recipeMetadata }) {
  const mode     = userMode || 'standard';
  const rawSteps = parseSteps(instructions);

  // Classify each step (parallel Grok calls for speed)
  const hazardResults = await Promise.all(
    rawSteps.map(step => classifyStepHazard(step))
  );

  const annotatedSteps = rawSteps.map((step, i) =>
    applyPersonaFilter(step, hazardResults[i], i, mode)
  );

  // Summary counts
  const hazardCount = annotatedSteps.filter(s => s.isHazardous).length;
  const hiddenCount = annotatedSteps.filter(s => s.hidden).length;
  const safeCount   = annotatedSteps.filter(s => !s.isHazardous).length;

  // Regional appliance suggestions
  const suggestedAppliances = getRequiredAppliances(
    recipeMetadata?.state, recipeMetadata?.region
  );

  const modeMessages = {
    standard: null,
    kids: hiddenCount > 0
      ? `👧 Kids Mode: ${hiddenCount} step(s) need a grown-up's help. The rest you can do yourself!`
      : `👧 Kids Mode: Great news — this recipe looks safe for you to follow along!`,
    senior: hazardCount > 0
      ? `👴 Senior Mode: ${hazardCount} step(s) have safety notes — please read them carefully before starting.`
      : `👴 Senior Mode: This recipe is straightforward and safe to follow at your own pace.`,
  };

  return {
    cuisine,
    ingredients,
    userMode: mode,
    modeMessage: modeMessages[mode],
    recipeMetadata: recipeMetadata || null,
    suggestedAppliances,
    summary: {
      totalSteps:    rawSteps.length,
      safeSteps:     safeCount,
      hazardousSteps: hazardCount,
      hiddenSteps:   hiddenCount,
    },
    steps: annotatedSteps,
  };
}

module.exports = { normalizeRecipe };
