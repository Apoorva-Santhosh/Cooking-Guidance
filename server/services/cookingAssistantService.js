/**
 * cookingAssistantService.js
 *
 * Phase 2 — Grok (xAI) powered assistant.
 * Replaces all rule-based response builders with real LLM calls.
 *
 * Uses the OpenAI-compatible SDK pointed at xAI's base URL.
 * Model: grok-3-mini (fast + cheap) — upgrade to grok-3 if needed.
 */

require('dotenv').config();
const OpenAI = require('openai');
const regionalData = require('../data/regionalAppliances.json');

// ── xAI client ────────────────────────────────────────────────────────────────
const client = new OpenAI({
  apiKey:  process.env.XAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODEL = process.env.XAI_MODEL || 'llama-3.1-8b-instant';

// ── Persona system prompts ────────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  standard: `You are an expert Indian cooking assistant with deep knowledge of regional cuisines,
spices, traditional techniques, and kitchen appliances used across India.
Provide clear, accurate cooking guidance. Use proper culinary terminology.
Include timing, temperatures, and technique details where relevant.
Keep responses concise — 3 to 5 sentences unless the question requires more detail.`,

  kids: `You are a fun and friendly cooking helper for children aged 8 to 15.
STRICT RULES you must always follow:
- Use very simple words and short sentences (max 2 sentences per point).
- If a step involves open flame, sharp knives, or hot oil, say exactly: "Ask a grown-up to help with this step! 🙋"
- Never describe dangerous steps in detail — just flag them.
- Use food emojis to make it fun 🍲🌶️🥘
- End every answer with one encouraging line like "You're doing great, little chef! ⭐"
- Never use cooking jargon — explain it simply if you must mention it.`,

  senior: `You are a patient and caring cooking assistant for senior citizens aged 60 and above.
STRICT RULES you must always follow:
- Use clear simple language with a warm respectful tone.
- Number every instruction — one step at a time.
- Before any step involving heat or sharp tools, start with "⚠️ Safety: " and give a specific precaution.
- If a recipe is high in sodium, oil, or spice, add "⚠️ Health Note: " with a healthier alternative.
- Suggest effort-saving alternatives where possible (e.g. pressure cooker instead of long boiling).
- End responses with: "Take your time — there is no rush. 🙏"`,
};

// ── Regional context builder ──────────────────────────────────────────────────
function buildRegionalContext(state, region, cuisine) {
  const regionKey = region ||
    (state ? regionalData.stateToRegion[state] : null) || null;
  if (!regionKey || !regionalData.regions[regionKey]) return '';
  const r = regionalData.regions[regionKey];
  return `Regional context: This recipe is from ${state || regionKey} (${regionKey} India). ` +
    `Typical appliances: ${r.appliances.join(', ')}. Cooking style: ${r.cookingStyle}`;
}

// ── Appliance safety context builder ─────────────────────────────────────────
function buildApplianceContext(applianceType, userMode) {
  if (!applianceType) return '';
  const key = applianceType.toLowerCase().trim();
  const match = Object.keys(regionalData.applianceHazards).find(a =>
    key.includes(a) || a.includes(key)
  );
  if (!match) return '';
  const hazard = regionalData.applianceHazards[match];
  if (userMode === 'kids')   return hazard.kidsNote;
  if (userMode === 'senior') return hazard.seniorNote;
  return `Appliance safety for ${match}: ${hazard.safetyNotes}`;
}

// ── Core Grok API call ────────────────────────────────────────────────────────
async function callGrok(systemPrompt, userMessage) {
  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 400,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMessage  },
    ],
  });
  return response.choices[0].message.content.trim();
}

// ── Hazard classification via Grok ────────────────────────────────────────────
async function classifyStepHazard(stepText) {
  const prompt = `Analyse this cooking step and respond ONLY with valid JSON — no markdown, no extra text:
{"hazard": boolean, "type": "heat"|"sharp"|"oil"|"pressure"|"none", "severity": "low"|"medium"|"high"|"none"}

Cooking step: "${stepText}"`;

  try {
    const raw = await callGrok(
      'You are a kitchen safety classifier. Always respond with valid JSON only.',
      prompt
    );
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    // Keyword fallback if Grok fails
    const lower = stepText.toLowerCase();
    const isHeat  = /boil|fry|heat|simmer|roast|sauté|saute|temper|tadka|steam|pressure/.test(lower);
    const isSharp = /chop|slice|cut|dice|mince|knife|grate/.test(lower);
    const isOil   = /oil|ghee|butter|deep fry|shallow fry/.test(lower);
    return {
      hazard:   isHeat || isSharp || isOil,
      type:     isHeat ? 'heat' : isSharp ? 'sharp' : isOil ? 'oil' : 'none',
      severity: isHeat ? 'medium' : isSharp ? 'medium' : 'low',
    };
  }
}

// ── Main exported function ────────────────────────────────────────────────────
async function generateResponse({
  question,
  currentStage,
  applianceType,
  safetyConstraints,
  userMode,
  recipeContext,   // optional: { name, diet, region, state, cuisine, cook_time }
}) {
  const mode = userMode || 'standard';

  const contextParts = [];
  if (currentStage)      contextParts.push(`Current cooking stage: ${currentStage}`);
  if (applianceType)     contextParts.push(`Appliance being used: ${applianceType}`);
  if (safetyConstraints) contextParts.push(`Safety constraints: ${safetyConstraints}`);

  if (recipeContext?.state || recipeContext?.region) {
    const regional = buildRegionalContext(
      recipeContext.state, recipeContext.region, recipeContext.cuisine
    );
    if (regional) contextParts.push(regional);
  }

  const applianceSafety = buildApplianceContext(applianceType, mode);
  if (applianceSafety) contextParts.push(applianceSafety);

  if (recipeContext?.name)      contextParts.push(`Recipe: ${recipeContext.name}`);
  if (recipeContext?.diet)      contextParts.push(`Diet type: ${recipeContext.diet}`);
  if (recipeContext?.cook_time) contextParts.push(`Total cook time: ${recipeContext.cook_time} mins`);

  const contextBlock = contextParts.length
    ? `\n\nContext:\n${contextParts.map(c => `- ${c}`).join('\n')}`
    : '';

  const userMessage  = `${question}${contextBlock}`;
  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.standard;

  try {
    const answer = await callGrok(systemPrompt, userMessage);
    return { answer, mode, model: MODEL, context: contextParts.join(' | '), hazardWarning: false };
  } catch (err) {
    console.error('[AssistantService] Grok API error:', err.message);
    throw new Error('Failed to get response from AI assistant. Please try again.');
  }
}

module.exports = { generateResponse, classifyStepHazard, SYSTEM_PROMPTS };
