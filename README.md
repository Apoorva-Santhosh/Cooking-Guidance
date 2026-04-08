# Prestige SmartChef+

## 1. Project Overview

Prestige SmartChef+ is a software-first, assistive cooking intelligence prototype that demonstrates guided cooking, time-based ingredient intelligence, and safety-aware AI assistance for Indian kitchens.

## 2. Key Principles

- Assistive AI only (no automation)
- Recipe-agnostic design
- Safety runs in parallel
- User remains in control

## 3. Architecture Overview

```
Dataset → Recipe Normalization → Cooking Guidance
                     ↓
                AI Assistant
```

## 4. Tech Stack

- MERN (MongoDB, Express, React, Node)
- Rule-based AI simulation
- Public recipe dataset (seed data only)

## 5. How to Run

1. Seed DB: `cd server && node utils/seedRecipes.js`
2. Start server: `cd server && npm start`
3. Start client: `cd client && npm start`
4. Or run both: `npm run dev` (requires `concurrently` installed at root)

## 6. Disclaimer

This is a simulation-based prototype. No real appliance control or automation is implemented.