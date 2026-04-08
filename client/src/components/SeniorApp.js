import React, { useState } from 'react';
import './SeniorApp.css';

// ── Recipe Normalizer — stepper layout for seniors ────────────────────────────
function SeniorNormalizer() {
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients]   = useState('');
  const [cuisine, setCuisine]           = useState('Indian');
  const [steps, setSteps]               = useState([]);
  const [currentStep, setCurrentStep]   = useState(0);
  const [summary, setSummary]           = useState(null);
  const [modeMessage, setModeMessage]   = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [started, setStarted]           = useState(false);

  const handleNormalize = async () => {
    if (!instructions.trim()) return;
    setLoading(true); setError(null); setSteps([]); setStarted(false);
    try {
      const res = await fetch('/api/recipes/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions,
          ingredients: ingredients.split(',').map(i => i.trim()).filter(Boolean),
          cuisine,
          userMode: 'senior',
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setSteps(data.steps || []);
      setSummary(data.summary);
      setModeMessage(data.modeMessage);
      setCurrentStep(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeStep = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="senior-section">
      <div className="senior-section-header">
        <span className="senior-section-icon">📋</span>
        <div>
          <div className="senior-section-title">Recipe Steps</div>
          <div className="senior-section-desc">One clear step at a time</div>
        </div>
      </div>
      <div className="senior-section-body">

        {!started ? (
          <>
            <div>
              <label className="senior-label">Paste your recipe instructions</label>
              <textarea className="senior-textarea"
                placeholder="e.g., 1. Heat oil in kadai. 2. Add mustard seeds. 3. Add onions and sauté."
                value={instructions}
                onChange={e => setInstructions(e.target.value)} />
            </div>
            <div>
              <label className="senior-label">Ingredients</label>
              <input className="senior-input" type="text"
                placeholder="e.g., dal, turmeric, ghee, salt"
                value={ingredients}
                onChange={e => setIngredients(e.target.value)} />
            </div>
            <div>
              <label className="senior-label">Cuisine / Region</label>
              <input className="senior-input" type="text"
                value={cuisine}
                onChange={e => setCuisine(e.target.value)} />
            </div>

            <button className="senior-btn" onClick={handleNormalize}
              disabled={loading || !instructions.trim()}>
              {loading
                ? <><span className="senior-spinner" />Please wait...</>
                : 'Show Me the Steps →'}
            </button>

            {error && (
              <div className="senior-safety-banner">
                Something went wrong. Please try again or check your internet connection.
              </div>
            )}

            {steps.length > 0 && !started && (
              <>
                {modeMessage && (
                  <div className="senior-safety-banner">{modeMessage}</div>
                )}
                {summary && (
                  <div className="senior-chips">
                    <span className="senior-chip">📝 {summary.totalSteps} total steps</span>
                    <span className="senior-chip">✅ {summary.safeSteps} safe steps</span>
                    {summary.hazardousSteps > 0 && (
                      <span className="senior-chip" style={{ background: '#FFF8E6', color: '#78350F', borderColor: '#F59E0B' }}>
                        ⚠️ {summary.hazardousSteps} steps need care
                      </span>
                    )}
                  </div>
                )}
                <button className="senior-btn" onClick={() => setStarted(true)}>
                  Start Cooking Step by Step →
                </button>
              </>
            )}
          </>
        ) : (
          /* ── Stepper view ── */
          <div className="senior-stepper">
            <div className="senior-step-progress">
              Step {currentStep + 1} of {steps.length}
              &nbsp;·&nbsp;
              {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
            </div>

            {/* Progress bar */}
            <div style={{
              height: 8, background: '#C8DDD0', borderRadius: 100,
              marginBottom: 20, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 100, background: '#3A8A6E',
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>

            {/* Safety warning if hazardous */}
            {activeStep?.isHazardous && activeStep.warnings?.[0] && (
              <div className="senior-warning-card">
                {activeStep.warnings[0]}
              </div>
            )}

            {/* Step card */}
            <div className="senior-step-card" key={currentStep}>
              <div className="senior-step-number">
                Step {activeStep?.stepNumber} of {steps.length}
              </div>
              <div className="senior-step-text">
                {activeStep?.isHazardous
                  ? activeStep.originalText   // show full text for senior (with warning above)
                  : activeStep?.displayText}
              </div>
            </div>

            {/* Navigation */}
            <div className="senior-nav-row">
              <button
                className="senior-btn senior-btn-secondary"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(s => s - 1)}>
                ← Back
              </button>
              {isLastStep ? (
                <button className="senior-btn"
                  onClick={() => { setStarted(false); setCurrentStep(0); }}>
                  🎉 All Done!
                </button>
              ) : (
                <button className="senior-btn"
                  onClick={() => setCurrentStep(s => s + 1)}>
                  Next Step →
                </button>
              )}
            </div>

            <button
              style={{ marginTop: 8 }}
              className="senior-btn senior-btn-secondary"
              onClick={() => { setStarted(false); setCurrentStep(0); }}>
              ← Back to Recipe
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Cooking Assistant — senior ────────────────────────────────────────────────
function SeniorAssistant() {
  const [question, setQuestion] = useState('');
  const [stage, setStage]       = useState('');
  const [appliance, setAppliance] = useState('');
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
        body: JSON.stringify({
          question,
          currentStage:  stage,
          applianceType: appliance,
          userMode:      'senior',
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

  const suggestions = [
    'How do I use the pressure cooker safely?',
    'How do I know when oil is hot enough?',
    'What does simmer mean?',
    'How much salt should I add?',
  ];

  return (
    <div className="senior-section">
      <div className="senior-section-header">
        <span className="senior-section-icon">🤖</span>
        <div>
          <div className="senior-section-title">Cooking Assistant</div>
          <div className="senior-section-desc">Ask any cooking question — I will guide you clearly</div>
        </div>
      </div>
      <div className="senior-section-body">

        <div>
          <label className="senior-label">Your Question</label>
          <textarea className="senior-textarea"
            placeholder="e.g., How do I know when the oil is ready? How do I use the pressure cooker?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{ minHeight: '100px' }} />
        </div>

        {/* Quick question buttons */}
        <div>
          <label className="senior-label" style={{ fontSize: 15, color: '#5a7a5a' }}>
            Common questions — tap to fill:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestions.map((s, i) => (
              <button key={i}
                onClick={() => setQuestion(s)}
                style={{
                  background: '#F3F8F5', border: '2px solid #C8DDD0',
                  borderRadius: 10, padding: '12px 16px',
                  fontFamily: 'Source Sans 3, sans-serif',
                  fontSize: 16, color: '#2d4a2d',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s ease',
                  fontWeight: 600,
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="senior-label">Which appliance are you using? (optional)</label>
          <input className="senior-input" type="text"
            placeholder="e.g., Gas stove, Pressure cooker, Tawa"
            value={appliance}
            onChange={e => setAppliance(e.target.value)} />
        </div>

        <div>
          <label className="senior-label">What step are you on? (optional)</label>
          <input className="senior-input" type="text"
            placeholder="e.g., Simmering the dal, Tempering the oil"
            value={stage}
            onChange={e => setStage(e.target.value)} />
        </div>

        <button className="senior-btn" onClick={handleAsk}
          disabled={loading || !question.trim()}>
          {loading
            ? <><span className="senior-spinner" />Getting your answer...</>
            : 'Get Answer →'}
        </button>

        {(result || error) && (
          <div>
            <div className="senior-result-label">🙏 Guidance</div>
            <div className="senior-result">
              {error
                ? 'Something went wrong. Please check your internet and try again.'
                : result?.answer}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Main Senior App ───────────────────────────────────────────────────────────
function SeniorApp({ onChangeMode }) {
  return (
    <div className="senior-app">
      <header className="senior-header">
        <div className="senior-header-left">
          <h1>Smart Indian Kitchen <span>Assistant</span></h1>
          <p>Personalised cooking guidance — clear, safe, and at your own pace</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="senior-mode-badge">👴 Senior Mode</span>
          <button className="senior-change-btn" onClick={onChangeMode}>
            Change Mode
          </button>
        </div>
      </header>

      <main className="senior-main">
        <SeniorNormalizer />
        <SeniorAssistant />
      </main>

      <footer className="senior-footer">
        Smart Indian Kitchen · Senior Mode
      </footer>
    </div>
  );
}

export default SeniorApp;