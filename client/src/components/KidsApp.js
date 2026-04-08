import React, { useState } from 'react';
import './KidsApp.css';

// ── Step card ─────────────────────────────────────────────────────────────────
function KidsStepCard({ step, index }) {
  const isHazard = step.hidden || step.isHazardous;
  return (
    <div className={`kids-step ${isHazard ? 'hazard' : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}>
      <div className={`kids-step-num ${isHazard ? 'lock' : ''}`}>
        {isHazard ? '🔒' : step.stepNumber}
      </div>
      <div className="kids-step-text">{step.displayText}</div>
    </div>
  );
}

// ── Recipe Normalizer ─────────────────────────────────────────────────────────
function KidsNormalizer() {
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients]   = useState('');
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const handleNormalize = async () => {
    if (!instructions.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch('/api/recipes/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions,
          ingredients: ingredients.split(',').map(i => i.trim()).filter(Boolean),
          cuisine: 'Indian',
          userMode: 'kids',
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kids-card">
      <div className="kids-card-header">
        <span className="kids-card-emoji">📋</span>
        <div>
          <div className="kids-card-title">Recipe Helper</div>
          <div className="kids-card-desc">Let's break your recipe into easy steps!</div>
        </div>
      </div>
      <div className="kids-card-body">

        <div>
          <label className="kids-label">What are the cooking steps? 📝</label>
          <textarea className="kids-textarea"
            placeholder="e.g., 1. Wash the vegetables. 2. Mix the flour with water."
            value={instructions}
            onChange={e => setInstructions(e.target.value)} />
        </div>

        <div>
          <label className="kids-label">What ingredients do you have? 🥕</label>
          <input className="kids-input" type="text"
            placeholder="e.g., flour, sugar, milk"
            value={ingredients}
            onChange={e => setIngredients(e.target.value)} />
        </div>

        <button className="kids-btn kids-btn-teal" onClick={handleNormalize}
          disabled={loading || !instructions.trim()}>
          {loading
            ? <><span className="kids-spinner" /> Working on it...</>
            : '✨ Show Me the Steps!'}
        </button>

        {error && (
          <div className="kids-bubble error">
            Oops! Something went wrong 😅 Is the server running?
          </div>
        )}

        {result && (
          <>
            {result.modeMessage && (
              <div className="kids-banner">{result.modeMessage}</div>
            )}
            <div className="kids-chips">
              <span className="kids-chip">🔢 {result.summary.totalSteps} steps</span>
              <span className="kids-chip">✅ {result.summary.safeSteps} you can do!</span>
              {result.summary.hiddenSteps > 0 && (
                <span className="kids-chip"
                  style={{ background: '#FFE0B0', color: '#8B4A10', borderColor: '#F5A060' }}>
                  🔒 {result.summary.hiddenSteps} grown-up steps
                </span>
              )}
            </div>
            <div className="kids-steps">
              {result.steps.map((step, i) => (
                <KidsStepCard key={i} step={step} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Cooking Assistant ─────────────────────────────────────────────────────────
function KidsAssistant() {
  const [question, setQuestion] = useState('');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, userMode: 'kids' }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Why do we add spices? 🌶️',
    'What does simmering mean? 🫧',
    'Why is my dough sticky? 🤔',
    'What is tadka? 🍳',
  ];

  return (
    <div className="kids-card">
      <div className="kids-card-header">
        <span className="kids-card-emoji">🤖</span>
        <div>
          <div className="kids-card-title">Chef Bot</div>
          <div className="kids-card-desc">Ask me anything about cooking!</div>
        </div>
      </div>
      <div className="kids-card-body">

        <div>
          <label className="kids-label">What do you want to know? 💭</label>
          <textarea className="kids-textarea"
            placeholder="e.g., Why do we add salt? What is boiling?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{ minHeight: '80px' }} />
        </div>

        {/* Quick suggestion pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {suggestions.map((s, i) => (
            <button key={i} className="kids-suggestion"
              onClick={() => setQuestion(s.replace(/\s[^\w\s🌶️🫧🤔🍳]/g, '').trim())}>
              {s}
            </button>
          ))}
        </div>

        <button className="kids-btn kids-btn-teal" onClick={handleAsk}
          disabled={loading || !question.trim()}>
          {loading
            ? <><span className="kids-spinner" /> Thinking really hard...</>
            : '🙋 Ask Chef Bot!'}
        </button>

        {(result || error) && (
          <div className="kids-bubble-wrap">
            <div className="kids-avatar">🤖</div>
            <div className={`kids-bubble ${error ? 'error' : ''}`}>
              {error
                ? 'Oops! Something went wrong 😅'
                : result?.answer}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Main Kids App ─────────────────────────────────────────────────────────────
function KidsApp({ onChangeMode }) {
  return (
    <div className="kids-app">
      <header className="kids-header">
        <div className="kids-stars">⭐ 🍳 ⭐ 🥘 ⭐</div>
        <h1 className="kids-title">
          Smart <span>Kitchen</span> Helper
        </h1>
        <p className="kids-subtitle">Cook amazing Indian food — safely and with fun! 🎉</p>
        <button className="kids-change-btn" onClick={onChangeMode}>
          ← Change Mode
        </button>
      </header>

      <div className="kids-grid">
        <KidsNormalizer />
        <KidsAssistant />
      </div>

      <footer className="kids-footer">
        Smart Indian Kitchen · Kids Mode ⭐
      </footer>
    </div>
  );
}

export default KidsApp;