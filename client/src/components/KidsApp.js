import React, { useState } from 'react';
import './KidsApp.css';
import CookingChat from './CookingChat';

function KidsStepCard({ step, stepNumber, index }) {
  const isHazard = step.isHazardous || step.hidden;
  return (
    <div className={`kids-step ${isHazard ? 'hazard' : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}>
      <div className={`kids-step-num ${isHazard ? 'lock' : ''}`}>
        {isHazard ? '🔒' : stepNumber}
      </div>
      <div className="kids-step-text">{step.displayText || step}</div>
    </div>
  );
}

// ── Kids Recipe Steps ─────────────────────────────────────────────────────────
function KidsRecipeSteps({ recipe, onClose }) {
  const steps = recipe.steps || [];

  if (steps.length === 0) {
    return (
      <div className="kids-card">
        <div className="kids-card-header">
          <span className="kids-card-emoji">📋</span>
          <div>
            <div className="kids-card-title">{recipe.name}</div>
            <div className="kids-card-desc">No steps available for this recipe.</div>
          </div>
        </div>
        <div className="kids-card-body">
          <button className="kids-btn kids-btn-teal" onClick={onClose}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="kids-card">
      <div className="kids-card-header">
        <span className="kids-card-emoji">📋</span>
        <div>
          <div className="kids-card-title">{recipe.name}</div>
          <div className="kids-card-desc">Here are your cooking steps! 🎉</div>
        </div>
      </div>
      <div className="kids-card-body">
        <div className="kids-banner">
          🔒 means ask a grown-up for that step!
        </div>
        <div className="kids-steps">
          {steps.map((step, i) => (
            <KidsStepCard
              key={i}
              step={typeof step === 'string' ? { displayText: step, isHazardous: false } : step}
              stepNumber={i + 1}
              index={i}
            />
          ))}
        </div>
        <button className="kids-btn kids-btn-teal" onClick={onClose}>← Search Another Recipe</button>
      </div>
    </div>
  );
}

// ── Kids Recipe Search wrapper (styled for kids) ──────────────────────────────
function KidsRecipeSearchCard({ onRecipeSelect, selectedRecipe, onStartCooking }) {
  return (
    <div className="kids-card">
      <div className="kids-card-header">
        <span className="kids-card-emoji">🔍</span>
        <div>
          <div className="kids-card-title">Find a Recipe</div>
          <div className="kids-card-desc">Search for your favourite dish! 🍛</div>
        </div>
      </div>
      <div className="kids-card-body">
        {/* Reuse RecipeSearch but inside kids card styling */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <RecipeSearchInline
            onRecipeSelect={onRecipeSelect}
            selectedRecipe={selectedRecipe}
          />
        </div>
        {selectedRecipe && (
          <button className="kids-btn" onClick={onStartCooking}>
            Let's Cook {selectedRecipe.name}! 🎉
          </button>
        )}
      </div>
    </div>
  );
}

// ── Inline search (kids-styled inputs) ───────────────────────────────────────
function RecipeSearchInline({ onRecipeSelect, selectedRecipe }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setResults([]); setSearched(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/recipes/search?q=${encodeURIComponent(query)}&limit=4`);
      const data = await res.json();
      setResults(data.recipes || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ width: '100%' }}>
      <label className="kids-label">What do you want to make? 🍳</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input className="kids-input" style={{ flex: 1 }}
          placeholder="e.g., Dal, Idli, Paneer..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="kids-btn kids-btn-teal"
          style={{ width: 'auto', padding: '10px 16px', fontSize: 13 }}
          onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? <span className="kids-spinner" /> : '🔍'}
        </button>
      </div>

      {results.map(r => (
        <div key={r._id}
          onClick={() => onRecipeSelect(r)}
          style={{
            padding: '10px 12px', borderRadius: 12, marginBottom: 7, cursor: 'pointer',
            background: selectedRecipe?._id === r._id ? '#FFF0C0' : '#FFF8E8',
            border: `2px solid ${selectedRecipe?._id === r._id ? '#E8A020' : '#E8C070'}`,
            fontWeight: 700, fontSize: 13, color: '#5A3A0A',
            boxShadow: '0 2px 0 #C9A040',
          }}>
          {r.name}
          {r.cook_time && <span style={{ fontWeight: 500, color: '#C96D0A', marginLeft: 8, fontSize: 11 }}>⏱ {r.cook_time}m</span>}
        </div>
      ))}

      {searched && !loading && results.length === 0 && (
        <div style={{ fontSize: 12, color: '#C96D0A', fontWeight: 700 }}>
          Hmm, nothing found! Try another name 🤔
        </div>
      )}
    </div>
  );
}

// ── Kids Chat wrapper (with kids styling applied to CookingChat) ──────────────
function KidsChatCard({ selectedRecipe }) {
  return (
    <div style={{
      background: '#FFFBF0',
      borderRadius: 22,
      border: '3.5px solid #E8A020',
      boxShadow: '0 5px 0 #C96D0A',
      overflow: 'hidden',
    }}>
      {/* Custom kids header */}
      <div style={{
        background: 'linear-gradient(180deg, #3DBFB8, #2AA09A)',
        borderBottom: '3px solid #1E857F',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 28 }}>🤖</span>
        <div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: 16, color: '#fff' }}>Chef Bot</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.82)', fontWeight: 700 }}>
            {selectedRecipe ? `Helping with ${selectedRecipe.name}!` : 'Ask me anything!'}
          </div>
        </div>
      </div>
      {/* Reuse CookingChat internals but without its own card-header */}
      <CookingChat
        userMode="kids"
        selectedRecipe={selectedRecipe}
        chatStyles={{ wrapper: { border: 'none', borderRadius: 0, boxShadow: 'none' } }}
      />
    </div>
  );
}

// ── Main Kids App ─────────────────────────────────────────────────────────────
function KidsApp({ onChangeMode }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [cooking, setCooking]               = useState(false);

  return (
    <div className="kids-app">
      <header className="kids-header">
        <div className="kids-stars">⭐ 🍳 ⭐ 🥘 ⭐</div>
        <h1 className="kids-title">Smart <span>Kitchen</span> Helper</h1>
        <p className="kids-subtitle">Cook amazing Indian food — safely and with fun! 🎉</p>
        <button className="kids-change-btn" onClick={onChangeMode}>← Change Mode</button>
      </header>

      <div className="kids-grid">
        {cooking && selectedRecipe ? (
          <>
            <KidsRecipeSteps recipe={selectedRecipe} onClose={() => setCooking(false)} />
            <KidsChatCard selectedRecipe={selectedRecipe} />
          </>
        ) : (
          <>
            <KidsRecipeSearchCard
              onRecipeSelect={setSelectedRecipe}
              selectedRecipe={selectedRecipe}
              onStartCooking={() => setCooking(true)}
            />
            <KidsChatCard selectedRecipe={selectedRecipe} />
          </>
        )}
      </div>

      <footer className="kids-footer">Smart Indian Kitchen Assistant · Kids Mode ⭐</footer>
    </div>
  );
}

export default KidsApp;