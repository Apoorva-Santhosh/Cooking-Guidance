# 🍛 Smart Indian Kitchen Assistant

**Live Demo:** [https://cooking-guidance-pi.vercel.app/](https://cooking-guidance-pi.vercel.app/)

> AI-powered cooking guidance tailored for Indian kitchens — with persona-aware UX for standard users, kids, and senior citizens.

---

## What It Does

Smart Indian Kitchen Assistant is a full-stack web application that helps Indian home cooks get step-by-step cooking guidance, recipe discovery, and real-time AI assistance — personalised to who is cooking.

- **Search** from 6,000+ Indian recipes sourced from two merged Kaggle datasets
- **Ask** an AI cooking assistant anything — techniques, substitutions, timing, safety
- **Three persona modes** — Standard (full-featured), Kids (safe, fun, emoji-rich), Senior (large text, step-by-step stepper, safety-first)
- **Context-aware responses** — the assistant knows which recipe you're cooking, your region, appliance type, and dietary needs
- **Structured AI output** — responses rendered as visual cards with labelled sections (Why it works / Timing / Pro tip / Serving suggestion / Healthier swap)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, CSS Variables, Google Fonts (Playfair Display, DM Sans, Nunito, Fredoka One, Lora) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (cloud) via Mongoose ODM |
| **AI / LLM** | Groq API — `llama-3.1-8b-instant` (Meta's LLaMA 3.1, served via Groq's LPU inference) |
| **Data** | Kaggle: Indian Food 101 (255 dishes, metadata) + Cleaned Indian Recipes Dataset (6,000+ dishes, instructions) — merged at seed time |
| **Deployment** | Vercel (frontend) + Render (backend) + MongoDB Atlas (database) |

---

## System Architecture

```
User Browser (React)
      │
      ├── RecipeSearch → GET /api/recipes/search → MongoDB Atlas (regex search)
      │                                                    ↓
      │                                         Returns name, diet, region,
      │                                         cook_time, steps, imageUrl
      │
      └── CookingChat → POST /api/assistant/ask
                              │
                              ├── Builds: system prompt (persona) +
                              │          conversation history (last 20 msgs) +
                              │          recipe context + regional appliance data
                              │
                              └── Groq API (LLaMA 3.1 8B)
                                         ↓
                                  Structured JSON response
                                  { title, sections: [...] }
                                         ↓
                              Parsed + rendered as visual cards
```

---

## Project Structure

```
Cooking Guidance/
├── client/                        # React frontend
│   └── src/
│       └── components/
│           ├── ModeSelector.js    # Persona picker (Standard / Kids / Senior)
│           ├── StandardApp.js     # Main app layout
│           ├── KidsApp.js         # Kids UI (warm golden, bubbly, animated)
│           ├── SeniorApp.js       # Senior UI (large text, stepper, safety-first)
│           ├── RecipeSearch.js    # Recipe search + results display
│           └── CookingChat.js     # AI chat with history + structured rendering
│
└── server/                        # Node.js / Express backend
    ├── controllers/
    │   ├── assistant.controller.js
    │   └── recipe.controller.js
    ├── services/
    │   ├── cookingAssistantService.js   # Groq API integration + persona prompts
    │   └── recipeNormalizerService.js   # Hazard tagging (Groq + keyword fallback)
    ├── models/
    │   └── recipe.js                    # Mongoose schema
    ├── data/
    │   ├── indian_food.csv              # Dataset A — metadata
    │   ├── Cleaned_Indian_Food_Dataset.csv  # Dataset B — instructions
    │   └── regionalAppliances.json     # Region → appliance + hazard mapping
    └── utils/
        └── seedRecipes.js              # Merges both datasets → seeds Atlas
```

---

## Running Locally

**Prerequisites:** Node.js 18+, MongoDB Atlas account, Groq API key

```bash
# Clone
git clone https://github.com/yourusername/cooking-guidance.git
cd cooking-guidance

# Backend
cd server
npm install
# Create server/.env with:
# XAI_API_KEY=gsk_...
# XAI_MODEL=llama-3.1-8b-instant
# MONGODB_URI=mongodb+srv://...
# PORT=5000

# Seed the database (run once)
node utils/seedRecipes.js

# Start backend
npm run dev

# Frontend (new terminal)
cd ../client
npm install
npm start
```

App runs at `http://localhost:3000` · API at `http://localhost:5000`

---

## Deployment

| Service | What it hosts | Cost |
|---|---|---|
| **Vercel** | React frontend | Free |
| **Render** | Node.js backend | Free (sleeps after 15 min inactivity) |
| **MongoDB Atlas** | Recipe database (6,188 documents) | Free (M0, 512MB) |

---

## Future Scope

### 🎤 Voice Interface
Add Web Speech API (browser-native, no cost) for voice input — users ask cooking questions hands-free while cooking. Text-to-speech for AI responses so seniors and kids don't need to read. Critical for real kitchen use where hands are dirty or busy.

### 🌐 Multi-Language Support
Hindi, Tamil, Telugu, Kannada, and Bengali — using the `TranslatedInstructions` field already present in the dataset. AI responses via Groq can be prompted in any language. Enables reach to non-English-speaking households which is the majority of the target audience.

### 🔍 Semantic Recipe Search
Replace MongoDB regex search with vector embeddings (using `sentence-transformers` or OpenAI embeddings stored in Atlas Vector Search). Enables natural language queries like "something spicy from Kerala that takes under 30 minutes" instead of keyword matching.

### 👤 User Accounts
Firebase Auth for login. Saved recipes, cooking history, personalised suggestions based on past sessions. Currently all state is in-memory per session.

### 📱 React Native Mobile App
Port to mobile using React Native — retaining the same backend and persona system. Critical because the primary use context is a kitchen, not a desktop.

---

## Dataset Sources

- [Indian Food 101](https://www.kaggle.com/datasets/nehaprabhavalkar/indian-food-101) — Kaggle (nehaprabhavalkar) — 255 dishes with metadata
- [Cleaned Indian Recipes Dataset](https://www.kaggle.com/datasets/sooryaprakash12/cleaned-indian-recipes-dataset) — Kaggle (sooryaprakash12) — 6,000+ dishes with full instructions

Datasets are merged at seed time by fuzzy name matching. Final MongoDB collection: **6,188 documents**.

---

## Built By

**Apoorva Santhosh** · 1DS23IC005 
