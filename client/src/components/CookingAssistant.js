import React, { useState } from 'react';

const MODE_PLACEHOLDERS = {
  standard: 'e.g., Why do I simmer on low heat?',
  kids:     'e.g., Why do we add spices? What is boiling?',
  senior:   'e.g., How do I use the pressure cooker safely?',
};

function CookingAssistant({ userMode }) {
  const [question, setQuestion]   = useState('');
  const [stage, setStage]         = useState('');
  const [appliance, setAppliance] = useState('');
  const [safety, setSafety]       = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true); setResult(null); setError(null);

    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          currentStage: stage,
          applianceType: appliance,
          safetyConstraints: safety,
          userMode, 
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

  // Kids mode: show simplified field set
  const isKids   = userMode === 'kids';
  const isSenior = userMode === 'senior';

  return (
    <div className="feature-card">
      <div className="card-header">
        <div className="card-icon green">🤖</div>
        <div className="card-title-group">
          <h2 className="card-title">Cooking Assistant</h2>
          <p className="card-desc">
            {isKids   ? 'Ask anything about cooking in simple words!'
            : isSenior ? 'Safe, step-by-step cooking guidance'
            :            'Real-time cooking guidance and safety tips'}
          </p>
        </div>
      </div>

      <div className="card-body">
        <div className="field-group">
          <label className="field-label">
            {isKids ? 'What do you want to know? 🤔' : 'Your Question'}
          </label>
          <textarea
            className="field-textarea"
            placeholder={MODE_PLACEHOLDERS[userMode] || MODE_PLACEHOLDERS.standard}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{ minHeight: isKids ? '70px' : '80px' }}
          />
        </div>

        {/* Kids mode: hide technical fields */}
        {!isKids && (
          <>
            <div className="field-group">
              <label className="field-label">Current Stage</label>
              <input className="field-input" type="text"
                placeholder="e.g., Tempering, Simmering, Kneading"
                value={stage} onChange={e => setStage(e.target.value)} />
            </div>

            <div className="field-group">
              <label className="field-label">Appliance Type</label>
              <input className="field-input" type="text"
                placeholder="e.g., Gas stove, Pressure cooker, Tawa"
                value={appliance} onChange={e => setAppliance(e.target.value)} />
            </div>

            {!isKids && (
              <div className="field-group">
                <label className="field-label">Safety Constraints</label>
                <input className="field-input" type="text"
                  placeholder="e.g., Monitor heat, Avoid splatter"
                  value={safety} onChange={e => setSafety(e.target.value)} />
              </div>
            )}
          </>
        )}

        <button className="btn-primary green" onClick={handleAsk}
          disabled={loading || !question.trim()}>
          {loading
            ? <><span className="spinner" /> {isKids ? 'Thinking… 🤔' : 'Thinking…'}</>
            : isKids ? 'Ask! 🙋' : 'Ask Assistant'}
        </button>

        {error && (
          <div>
            <p className="result-label">Error</p>
            <div className="result-box result-error">{error}</div>
          </div>
        )}

        {result && (
          <div>
            {/* Hazard warning banner for kids */}
            {result.hazardWarning && (
              <div style={{
                background: '#e6f1fb', border: '1px solid rgba(55,138,221,0.3)',
                borderRadius: 10, padding: '8px 12px', marginBottom: 10,
                fontSize: 12, color: '#185FA5', fontWeight: 600,
              }}>
                🙋 This involves heat or sharp tools — please get a grown-up!
              </div>
            )}

            <p className="result-label">
              {isKids ? '👩‍🍳 Answer' : isSenior ? '🙏 Guidance' : 'Response'}
            </p>
            <div className="result-box result-success" style={{
              fontSize: isSenior ? '15px' : 'inherit',
              lineHeight: isSenior ? 1.9 : 1.7,
            }}>
              {result.answer}
            </div>

            {/* Mode badge */}
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <span style={{
                fontSize: 11, color: '#9b7a5e', fontStyle: 'italic',
              }}>
                {userMode === 'kids' ? '👧 Kids Mode response'
                : userMode === 'senior' ? '👴 Senior Mode response'
                : '👨‍🍳 Standard response'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CookingAssistant;