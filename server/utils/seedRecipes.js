/**
 * seedRecipes.js
 *
 * Merges two Kaggle datasets and seeds MongoDB Atlas.
 *
 * Dataset A: indian_food.csv
 *   Columns: name, ingredients, diet, prep_time, cook_time,
 *            flavor_profile, course, state, region
 *
 * Dataset B: Cleaned_Indian_Food_Dataset.csv
 *   Columns: TranslatedRecipeName, TranslatedIngredients,
 *            TotalTimeInMins, Cuisine, TranslatedInstructions,
 *            URL, Cleaned-Ingredients, image-url, Ingredient-count
 *
 * Run from server/ directory:
 *   node utils/seedRecipes.js
 */

require('dotenv').config();
const fs       = require('fs');
const path     = require('path');
const { parse } = require('csv-parse/sync');
const mongoose  = require('mongoose');
const Recipe    = require('../models/recipe');

// ── File paths ────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '../data');
const FILE_A   = path.join(DATA_DIR, 'indian_food.csv');
const FILE_B   = path.join(DATA_DIR, 'Cleaned_Indian_Food_Dataset.csv');

// ── Helpers ───────────────────────────────────────────────────────────────────

// Normalise name for fuzzy matching — strip common suffixes Dataset B uses
function normaliseName(name = '') {
  return name
    .toLowerCase()
    .replace(/\s*recipe[s]?\s*$/i, '')        // strip trailing "recipe"
    .replace(/\s*-\s*restaurant style\s*$/i, '')
    .replace(/\s*\|\s*homemade\s*$/i, '')
    .replace(/[^a-z0-9 ]/g, '')               // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean Dataset A values — uses "-1" for missing
function cleanVal(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return (s === '-1' || s === '' || s === 'nan') ? null : s;
}

// Parse minutes — handles plain numbers and mixed strings
function parseMins(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (s === '-1' || s === '' || s === 'nan') return null;
  const n = parseInt(s);
  return isNaN(n) ? null : n;
}

// Split ingredient string into array
function parseIngredients(val) {
  if (!val) return [];
  return val.split(',').map(i => i.trim()).filter(Boolean);
}

// Split instruction text into step array
function parseSteps(instructions = '') {
  if (!instructions) return [];
  return instructions
    .split(/\n|(?=\b(?:step\s*)?\d+[\.\)]\s)/i)
    .map(l => l.replace(/^(step\s*)?\d+[\.\)]\s*/i, '').trim())
    .filter(l => l.length > 8);
}

// ── Load CSVs ─────────────────────────────────────────────────────────────────
function loadCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return parse(raw, {
    columns:            true,
    skip_empty_lines:   true,
    trim:               true,
    relax_quotes:       true,
    relax_column_count: true,
  });
}

// ── Merge ─────────────────────────────────────────────────────────────────────
function mergeDatasets(recordsA, recordsB) {
  // Build lookup from Dataset A keyed by normalised name
  const lookupA = new Map();
  for (const r of recordsA) {
    const key = normaliseName(r.name);
    if (key) lookupA.set(key, r);
  }

  const merged   = [];
  let matchCount = 0;

  // ── Dataset B records (have instructions) ──
  for (const b of recordsB) {
    const nameRaw    = b.TranslatedRecipeName || '';
    const key        = normaliseName(nameRaw);
    const a          = lookupA.get(key) || null;
    if (a) matchCount++;

    const instructions = b.TranslatedInstructions || '';
    if (!nameRaw || !instructions) continue;

    // TotalTimeInMins is cook+prep combined — split roughly if no A data
    const totalMins = parseMins(b.TotalTimeInMins);

    merged.push({
      name:                nameRaw,
      diet:                cleanVal(a?.diet)           || null,
      flavor_profile:      cleanVal(a?.flavor_profile) || null,
      course:              cleanVal(a?.course)          || cleanVal(b?.Course) || null,
      state:               cleanVal(a?.state)           || null,
      region:              cleanVal(a?.region)          || null,
      cuisine:             cleanVal(b?.Cuisine)         || 'Indian',
      prep_time:           parseMins(a?.prep_time)      ?? (totalMins ? Math.round(totalMins * 0.3) : null),
      cook_time:           parseMins(a?.cook_time)      ?? (totalMins ? Math.round(totalMins * 0.7) : null),
      ingredients:         parseIngredients(b['Cleaned-Ingredients'] || b.TranslatedIngredients || a?.ingredients || ''),
      instructions,
      steps:               parseSteps(instructions),
      imageUrl:            b['image-url'] || null,
      matchedBothDatasets: !!a,
    });
  }

  // ── Dataset A only records (have metadata, no instructions) ──
  const usedInB = new Set(
    recordsB.map(b => normaliseName(b.TranslatedRecipeName || ''))
  );
  let aOnly = 0;
  for (const a of recordsA) {
    const key = normaliseName(a.name);
    if (!usedInB.has(key) && a.name) {
      merged.push({
        name:                a.name,
        diet:                cleanVal(a.diet),
        flavor_profile:      cleanVal(a.flavor_profile),
        course:              cleanVal(a.course),
        state:               cleanVal(a.state),
        region:              cleanVal(a.region),
        cuisine:             cleanVal(a.region) || 'Indian',
        prep_time:           parseMins(a.prep_time),
        cook_time:           parseMins(a.cook_time),
        ingredients:         parseIngredients(a.ingredients),
        instructions:        null,
        steps:               [],
        imageUrl:            null,
        matchedBothDatasets: false,
      });
      aOnly++;
    }
  }

  return { merged, matchCount, aOnly };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 Smart Indian Kitchen — Recipe Seeder');
  console.log('========================================');

  // Validate files
  for (const [label, fp] of [['Dataset A', FILE_A], ['Dataset B', FILE_B]]) {
    if (!fs.existsSync(fp)) {
      console.error(`❌ ${label} not found: ${fp}`);
      process.exit(1);
    }
  }

  // Load
  console.log('Loading Dataset A (indian_food.csv)...');
  const recordsA = loadCSV(FILE_A);
  console.log(`  → ${recordsA.length} records`);

  console.log('Loading Dataset B (Cleaned_Indian_Food_Dataset.csv)...');
  const recordsB = loadCSV(FILE_B);
  console.log(`  → ${recordsB.length} records`);

  // Merge
  console.log('\nMerging datasets...');
  const { merged, matchCount, aOnly } = mergeDatasets(recordsA, recordsB);
  console.log(`  → Matched both datasets : ${matchCount}`);
  console.log(`  → Dataset B only        : ${recordsB.length - matchCount}`);
  console.log(`  → Dataset A only        : ${aOnly}`);
  console.log(`  → Total records         : ${merged.length}`);

  // Connect — URI hidden from terminal output
  console.log('\nConnecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected');

  // Seed
  console.log('Clearing existing recipes...');
  await Recipe.deleteMany({});

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < merged.length; i += BATCH) {
    await Recipe.insertMany(merged.slice(i, i + BATCH), { ordered: false });
    inserted += Math.min(BATCH, merged.length - i);
    process.stdout.write(`  Inserting... ${inserted}/${merged.length}\r`);
  }

  // Stats
  const withSteps  = merged.filter(r => r.steps.length > 0).length;
  const withRegion = merged.filter(r => r.region).length;
  const withDiet   = merged.filter(r => r.diet).length;
  const withImage  = merged.filter(r => r.imageUrl).length;
  const bothMatch  = merged.filter(r => r.matchedBothDatasets).length;

  console.log(`\n✅ Seeding complete — ${inserted} recipes in MongoDB Atlas`);
  console.log('\n📊 Dataset stats:');
  console.log(`   With cooking steps  : ${withSteps}`);
  console.log(`   With region/state   : ${withRegion}`);
  console.log(`   With diet info      : ${withDiet}`);
  console.log(`   With image URL      : ${withImage}`);
  console.log(`   Matched both CSVs   : ${bothMatch}`);
  console.log('\n🎉 Done. Run "npm run dev" to start the app.\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seeder failed:', err.message);
  process.exit(1);
});