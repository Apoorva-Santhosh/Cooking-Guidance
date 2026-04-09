/**
 * cookingAssistantService.js
 * Phase 2 — Groq powered, with conversation history support.
 */

require('dotenv').config();
const OpenAI       = require('openai');
const regionalData = require('../data/regionalAppliances.json');

const client = new OpenAI({
  apiKey:  process.env.XAI_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODEL = process.env.XAI_MODEL || 'llama-3.1-8b-instant';

// ── Structured response format ────────────────────────────────────────────────
const JSON_FORMAT_INSTRUCTION = `
You MUST respond ONLY with a valid JSON object — no markdown, no text outside JSON:
{
  "title": "short topic title (5 words max)",
  "sections": [
    { "type": "explanation", "label": "Why it works", "content": "1-2 sentences." },
    { "type": "timing",      "label": "Timing",       "content": "1-2 sentences." }
  ]
}
Available section types: explanation, timing, tip, warning, safety, health, technique, substitute.
Include only relevant sections (1–4 max). Never use markdown inside JSON string values.`;

// ── Persona system prompts ────────────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  standard: `You are a sharp, knowledgeable Indian cooking assistant with a modern, confident voice.
You know your food deeply — regional techniques, spice science, plating, nutrition — but communicate it
concisely with personality. No fluff. Always answer in context of the full conversation.

RULES:
- Use specific details: temperatures, timings, ratios — not vague advice.
- When relevant, add a "serving" section: plating tips, garnishes, how to present.
- When relevant, add a "substitute" section: healthier swap, vegan version, or easier shortcut.
- Keep each section punchy — 1 to 2 sentences max.
- Available extra section types: serving, substitute (in addition to explanation, timing, tip, warning, safety, health, technique).
${JSON_FORMAT_INSTRUCTION}`,

  kids: `You are a fun and friendly cooking helper for children aged 8 to 15.
Use very simple words and short sentences. Use food emojis 🍲🌶️🥘.
If a step involves flame, knives, or hot oil, set type "warning" and say "Ask a grown-up! 🙋".
Remember the conversation — always respond about what was previously discussed.
End the last section content with an encouraging phrase like "You're doing great! ⭐"
${JSON_FORMAT_INSTRUCTION}`,

  senior: `You are a patient and caring cooking assistant for senior citizens aged 60+.
Use clear simple language. For heat or sharp steps include a "safety" section.
Flag high-sodium or oily food with a "health" section.
Remember the full conversation and always answer in context of what was discussed.
End the last section content with: "Take your time — there is no rush. 🙏"
${JSON_FORMAT_INSTRUCTION}`,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildRegionalContext(state, region, cuisine) {
  const regionKey = region || (state ? regionalData.stateToRegion[state] : null) || null;
  if (!regionKey || !regionalData.regions[regionKey]) return '';
  const r = regionalData.regions[regionKey];
  return `Regional context: ${state || regionKey} (${regionKey} India). ` +
    `Typical appliances: ${r.appliances.join(', ')}. ${r.cookingStyle}`;
}

function buildApplianceContext(applianceType, userMode) {
  if (!applianceType) return '';
  const key   = applianceType.toLowerCase().trim();
  const match = Object.keys(regionalData.applianceHazards).find(a =>
    key.includes(a) || a.includes(key)
  );
  if (!match) return '';
  const h = regionalData.applianceHazards[match];
  if (userMode === 'kids')   return h.kidsNote;
  if (userMode === 'senior') return h.seniorNote;
  return `Appliance safety (${match}): ${h.safetyNotes}`;
}

// ── Core LLM call — now accepts full message history ─────────────────────────
async function callLLM(systemPrompt, messages) {
  const response = await client.chat.completions.create({
    model:      MODEL,
    max_tokens: 600,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });
  return response.choices[0].message.content.trim();
}

// ── Hazard classification ─────────────────────────────────────────────────────
async function classifyStepHazard(stepText) {
  const prompt = `Analyse this cooking step and respond ONLY with valid JSON:
{"hazard": boolean, "type": "heat"|"sharp"|"oil"|"pressure"|"none", "severity": "low"|"medium"|"high"|"none"}
Cooking step: "${stepText}"`;

  try {
    const raw = await callLLM(
      'You are a kitchen safety classifier. Respond with valid JSON only.',
      [{ role: 'user', content: prompt }]
    );
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
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

// ── Main response generator ───────────────────────────────────────────────────
async function generateResponse({
  question,
  currentStage,
  applianceType,
  safetyConstraints,
  userMode,
  recipeContext,
  history,           // ← NEW: array of { role: 'user'|'assistant', content: string }
}) {
  const mode = userMode || 'standard';

  // Build context string appended to the current user message
  const contextParts = [];
  if (currentStage)      contextParts.push(`Current stage: ${currentStage}`);
  if (applianceType)     contextParts.push(`Appliance: ${applianceType}`);
  if (safetyConstraints) contextParts.push(`Safety: ${safetyConstraints}`);

  if (recipeContext?.state || recipeContext?.region) {
    const r = buildRegionalContext(recipeContext.state, recipeContext.region, recipeContext.cuisine);
    if (r) contextParts.push(r);
  }

  const appSafety = buildApplianceContext(applianceType, mode);
  if (appSafety) contextParts.push(appSafety);

  if (recipeContext?.name)      contextParts.push(`Recipe: ${recipeContext.name}`);
  if (recipeContext?.diet)      contextParts.push(`Diet: ${recipeContext.diet}`);
  if (recipeContext?.cook_time) contextParts.push(`Cook time: ${recipeContext.cook_time} mins`);

  const contextBlock = contextParts.length
    ? `\n\nContext:\n${contextParts.map(c => `- ${c}`).join('\n')}`
    : '';

  // Build full message array: history + current question
  const safeHistory = Array.isArray(history) ? history : [];

  // Keep last 10 exchanges max (20 messages) to stay within token limits
  const trimmedHistory = safeHistory.slice(-20);

  const allMessages = [
    ...trimmedHistory,
    { role: 'user', content: `${question}${contextBlock}` },
  ];

  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.standard;

  try {
    const raw = await callLLM(systemPrompt, allMessages);
    // Extract JSON even if model wraps it in text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const answer    = jsonMatch ? jsonMatch[0] : raw;
    return { answer, mode, model: MODEL, hazardWarning: false };
  } catch (err) {
    console.error('[AssistantService] LLM error:', err.message);
    throw new Error('Failed to get response from AI assistant. Please try again.');
  }
}

module.exports = { generateResponse, classifyStepHazard, SYSTEM_PROMPTS };