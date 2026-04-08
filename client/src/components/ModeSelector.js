import React, { useState } from 'react';
import './ModeSelector.css';

const MODES = [
  {
    id: 'standard',
    emoji: '👨‍🍳',
    name: 'Standard',
    age: 'All ages',
    features: [
      'Full recipe instructions',
      'Technical cooking terms',
      'All steps displayed',
      'Complete assistant Q&A',
    ],
  },
  {
    id: 'kids',
    emoji: '👧',
    name: 'Kids Mode',
    age: 'Ages 8–15',
    features: [
      'Simple, fun language',
      'No heat or knife steps',
      'Encouraging responses',
      'Short easy sentences',
    ],
  },
  {
    id: 'senior',
    emoji: '👴',
    name: 'Senior Mode',
    age: '60+ years',
    features: [
      'Large clear text',
      'Extra safety reminders',
      'Low-sodium flags',
      'Step-by-step pacing',
    ],
  },
];

function ModeSelector({ onSelect }) {
  const [selected, setSelected] = useState(null);

  const btnClass = selected
    ? `btn-enter ${selected === 'kids' ? 'kids-btn' : selected === 'senior' ? 'senior-btn' : ''}`
    : 'btn-enter';

  return (
    <div className="mode-page">
      {/* Header */}
      <div className="mode-header">
        <div className="mode-badge">🍛 AI-Powered Kitchen</div>
        <h1 className="mode-title">
          Smart Indian Kitchen<br /><em>Assistant</em>
        </h1>
        <p className="mode-subtitle">
          Personalised cooking guidance for every home cook —
          powered by AI, built for Indian kitchens.
        </p>
        <div className="mode-divider" />
      </div>

      {/* Persona picker */}
      <p className="who-label">Who's cooking today?</p>

      <div className="mode-cards">
        {MODES.map((mode) => (
          <div
            key={mode.id}
            className={`mode-card ${mode.id} ${selected === mode.id ? 'selected' : ''}`}
            onClick={() => setSelected(mode.id)}
          >
            <span className="mode-emoji">{mode.emoji}</span>
            <div className="mode-name">{mode.name}</div>
            <span className="mode-age">{mode.age}</span>
            <ul className="mode-features">
              {mode.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mode-cta">
        <button
          className={btnClass}
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          {selected
            ? `Enter as ${MODES.find(m => m.id === selected).name} →`
            : 'Select a mode to continue'}
        </button>
        {!selected && <p className="select-hint">Pick a card above to get started</p>}
      </div>
    </div>
  );
}

export default ModeSelector;
