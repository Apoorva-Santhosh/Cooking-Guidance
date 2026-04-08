import React, { useState } from 'react';

// Hazard type → display colour class
const HAZARD_COLORS = {
  heat:  { bg: '#fff4e6', border: 'rgba(232,149,42,0.4)', label: '🔥 Heat', text: '#7a3b1e' },
  sharp: { bg: '#fef0f0', border: 'rgba(212,113,75,0.4)', label: '🔪 Sharp tool', text: '#993C1D' },
  oil:   { bg: '#fffbe6', border: 'rgba(201,123,26,0.35)', label: '🫙 Oil/Fat', text: '#854F0B' },
};

function HazardBadge({ type }) {
  const c = HAZARD_COLORS[type];
  if (!c) return null;
  return (
    <span style={{
      display: 'inline-block', fontSize: '10px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '100px', marginRight: 4,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    }}>
      {c.label}
    </span>
  );
}

function StepCard({ step, userMode }) {
  const isKidsHidden = userMode === 'kids' && step.hidden;
  const isSenior     = userMode === 'senior' && step.isHazardous;

  const containerStyle = {
    borderRadius: 10,
    border: step.isHazardous ? '1.5px solid rgba(232,149,42,0.3)' : '1px solid rgba(122,59,30,0.1)',
    background: isKidsHidden ? '#e6f1fb' : isSenior ? '#e8f5f0' : '#fafaf8',
    padding: '12px 14px',
    marginBottom: 10,
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: 'rgba(122,59,30,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#6b4a30', flexShrink: 0,
        }}>
          {step.stepNumber}
        </span>
        {step.hazardTypes.map(t => <HazardBadge key={t} type={t} />)}
        {isKidsHidden && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#185FA5', marginLeft: 'auto' }}>
            Needs grown-up help
          </span>
        )}
      </div>
      <p style={{ fontSize: 'inherit', color: isKidsHidden ? '#185FA5' : '#4a3728', lineHeight: 1.65, margin: 0 }}>
        {step.displayText}
      </p>
    </div>
  );
}

function RecipeNormalizer({ userMode }) {
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients]   = useState('');
  const [cuisine, setCuisine]           = useState('Indian');
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
          cuisine,
          userMode, // ← persona sent to backend
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const placeholderText = userMode === 'kids'
    ? 'e.g., 1. Mix the flour and water. 2. Heat oil in pan. 3. Add veggies.'
    : 'e.g., 1. Soak dal for 30 mins. 2. Heat oil, add mustard seeds. 3. Boil with spices.';

  return (
    <div className="feature-card">
      <div className="card-header">
        <div className="card-icon orange">📋</div>
        <div className="card-title-group">
          <h2 className="card-title">Recipe Normalizer</h2>
          <p className="card-desc">Parse raw instructions into structured, persona-aware stages</p>
        </div>
      </div>

      <div className="card-body">
        <div className="field-group">
          <label className="field-label">Raw Recipe Instructions</label>
          <textarea
            className="field-textarea"
            placeholder={placeholderText}
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="field-label">Ingredients (comma-separated)</label>
          <input className="field-input" type="text"
            placeholder="e.g., dal, turmeric, ghee, mustard seeds"
            value={ingredients} onChange={e => setIngredients(e.target.value)} />
        </div>

        <div className="field-group">
          <label className="field-label">Cuisine / Region</label>
          <input className="field-input" type="text"
            placeholder="e.g., South Indian, Punjabi"
            value={cuisine} onChange={e => setCuisine(e.target.value)} />
        </div>

        <button className="btn-primary orange" onClick={handleNormalize}
          disabled={loading || !instructions.trim()}>
          {loading ? <><span className="spinner" /> Normalizing…</> : 'Normalize Recipe'}
        </button>

        {error && (
          <div>
            <p className="result-label">Error</p>
            <div className="result-box result-error">{error}</div>
          </div>
        )}

        {result && (
          <div>
            {/* Mode message banner */}
            {result.modeMessage && (
              <div style={{
                background: userMode === 'kids' ? '#e6f1fb' : '#e8f5f0',
                border: `1px solid ${userMode === 'kids' ? 'rgba(55,138,221,0.3)' : 'rgba(58,138,110,0.3)'}`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 12,
                fontSize: 13, color: userMode === 'kids' ? '#185FA5' : '#0F6E56', fontWeight: 500,
              }}>
                {result.modeMessage}
              </div>
            )}

            {/* Summary chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {[
                { label: `${result.summary.totalSteps} steps`, bg: 'rgba(122,59,30,0.08)', color: '#6b4a30' },
                { label: `${result.summary.safeSteps} safe`, bg: 'rgba(58,138,110,0.1)', color: '#0F6E56' },
                result.summary.hazardousSteps > 0 && {
                  label: `${result.summary.hazardousSteps} need caution`,
                  bg: 'rgba(232,149,42,0.12)', color: '#c97b1a'
                },
              ].filter(Boolean).map((chip, i) => (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 10px',
                  borderRadius: 100, background: chip.bg, color: chip.color,
                }}>
                  {chip.label}
                </span>
              ))}
            </div>

            {/* Step cards */}
            <p className="result-label">Structured Steps</p>
            {result.steps.map(step => (
              <StepCard key={step.stepNumber} step={step} userMode={userMode} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeNormalizer;