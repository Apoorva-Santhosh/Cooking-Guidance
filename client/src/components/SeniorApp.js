import React, { useState } from 'react';
import './SeniorApp.css';
import RecipeSearch from './RecipeSearch';
import CookingChat from './CookingChat';

// ── Senior Stepper (recipe steps one at a time) ───────────────────────────────
function SeniorStepper({ recipe, onBack }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps     = recipe.steps || [];
  const activeStep = steps[currentStep];
  const isLast    = currentStep === steps.length - 1;

  if (steps.length === 0) {
    return (
      <div className="senior-section">
        <div className="senior-section-header">
          <span className="senior-section-icon">📋</span>
          <div>
            <div className="senior-section-title">{recipe.name}</div>
            <div className="senior-section-desc">No step-by-step instructions available for this recipe.</div>
          </div>
        </div>
        <div className="senior-section-body">
          <button className="senior-btn senior-btn-secondary" onClick={onBack}>← Back to Search</button>
        </div>
      </div>
    );
  }

  return (
    <div className="senior-section">
      <div className="senior-section-header">
        <span className="senior-section-icon">📋</span>
        <div>
          <div className="senior-section-title">{recipe.name}</div>
          <div className="senior-section-desc">Step {currentStep + 1} of {steps.length}</div>
        </div>
      </div>
      <div className="senior-section-body">

        {/* Tags */}
        <div className="senior-chips">
          {recipe.diet     && <span className="senior-chip">🌿 {recipe.diet}</span>}
          {recipe.cook_time && <span className="senior-chip">⏱ {recipe.cook_time} mins</span>}
          {recipe.region   && <span className="senior-chip">📍 {recipe.region}</span>}
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: '#C8DDD0', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 100, background: '#3A8A6E',
            width: `${((currentStep + 1) / steps.length) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>

        <div className="senior-step-progress">
          Step {currentStep + 1} of {steps.length} &nbsp;·&nbsp;
          {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
        </div>

        {/* Step card */}
        <div className="senior-step-card" key={currentStep}>
          <div className="senior-step-number">Step {currentStep + 1}</div>
          <div className="senior-step-text">{activeStep}</div>
        </div>

        {/* Navigation */}
        <div className="senior-nav-row">
          <button className="senior-btn senior-btn-secondary"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(s => s - 1)}>
            ← Back
          </button>
          {isLast ? (
            <button className="senior-btn" onClick={onBack}>🎉 All Done!</button>
          ) : (
            <button className="senior-btn" onClick={() => setCurrentStep(s => s + 1)}>
              Next Step →
            </button>
          )}
        </div>

        <button className="senior-btn senior-btn-secondary" style={{ marginTop: 8 }} onClick={onBack}>
          ← Back to Search
        </button>
      </div>
    </div>
  );
}

// ── Main Senior App ───────────────────────────────────────────────────────────
function SeniorApp({ onChangeMode }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [cooking, setCooking]               = useState(false);

  const handleRecipeSelect = (recipe) => {
    setSelectedRecipe(recipe);
    setCooking(false);
  };

  return (
    <div className="senior-app">
      <header className="senior-header">
        <div className="senior-header-left">
          <h1>Smart Indian Kitchen <span>Assistant</span></h1>
          <p>Clear, safe guidance — at your own pace</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="senior-mode-badge">👴 Senior Mode</span>
          <button className="senior-change-btn" onClick={onChangeMode}>Change Mode</button>
        </div>
      </header>

      <main className="senior-main">
        {cooking && selectedRecipe ? (
          // ── Step-by-step cooking view ──
          <>
            <SeniorStepper
              recipe={selectedRecipe}
              onBack={() => setCooking(false)}
            />
            {/* Chat stays visible during cooking */}
            <CookingChat userMode="senior" selectedRecipe={selectedRecipe} />
          </>
        ) : (
          // ── Search + chat view ──
          <>
            <RecipeSearch
              onRecipeSelect={handleRecipeSelect}
              selectedRecipe={selectedRecipe}
            />

            {/* Start cooking button */}
            {selectedRecipe?.steps?.length > 0 && (
              <div className="senior-section" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="senior-section-body" style={{ padding: '20px 28px' }}>
                  <p style={{ fontSize: 17, color: '#2d4a2d', marginBottom: 14, fontWeight: 600 }}>
                    Ready to cook <em>{selectedRecipe.name}</em>?
                  </p>
                  <button className="senior-btn" onClick={() => setCooking(true)}>
                    Start Step-by-Step Cooking →
                  </button>
                </div>
              </div>
            )}

            <CookingChat userMode="senior" selectedRecipe={selectedRecipe} />
          </>
        )}
      </main>

      <footer className="senior-footer">
        Smart Indian Kitchen Assistant · Senior Mode 👴
      </footer>
    </div>
  );
}

export default SeniorApp;