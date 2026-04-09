import React, { useState, useRef, useEffect } from 'react';

// ── Parse structured JSON response ────────────────────────────────────────────
function parseAIResponse(raw) {
  if (!raw) return null;
  try {
    // Handle case where senior/kids modes get raw JSON string passed through
    const cleaned = typeof raw === 'string'
      ? raw.replace(/```json|```/g, '').trim()
      : JSON.stringify(raw);
    const parsed = JSON.parse(cleaned);
    if (parsed.sections && Array.isArray(parsed.sections)) return parsed;
    return null;
  } catch {
    return null;
  }
}

const SECTION_ICONS = {
  explanation: '💡', timing: '⏱', tip: '✨',
  warning: '⚠️', safety: '🛡️', health: '🥗',
  technique: '👨‍🍳', substitute: '🔄', serving: '🍽️', default: '📌',
};

// ── AI message renderer ───────────────────────────────────────────────────────
function AIMessage({ content }) {
  const structured = parseAIResponse(content);

  if (structured) {
    return (
      <div className="msg-ai">
        <div className="ai-avatar">🤖</div>
        <div className="ai-response-card">
          {structured.title && (
            <div className="ai-response-title">{structured.title}</div>
          )}
          <div className="ai-tip-rows">
            {structured.sections.map((sec, i) => (
              <div className="tip-row" key={i}>
                <div className="tip-icon">
                  {SECTION_ICONS[sec.type] || SECTION_ICONS.default}
                </div>
                <div>
                  {sec.label && <div className="tip-label">{sec.label}</div>}
                  <div className="tip-val">{sec.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Plain text fallback
  return (
    <div className="msg-ai">
      <div className="ai-avatar">🤖</div>
      <div className="ai-plain">{content}</div>
    </div>
  );
}

// ── Main CookingChat ──────────────────────────────────────────────────────────
function CookingChat({ userMode, selectedRecipe, chatStyles }) {
  const [messages, setMessages] = useState([]);  // { role: 'user'|'ai', content: string }
  const [history, setHistory]   = useState([]);  // { role: 'user'|'assistant', content: string } for API
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const messagesEndRef           = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset chat when recipe changes
  useEffect(() => {
    if (selectedRecipe) {
      const welcomeContent = JSON.stringify({
        title: `About ${selectedRecipe.name}`,
        sections: [
          selectedRecipe.diet && {
            type: 'health', label: 'Diet',
            content: selectedRecipe.diet.charAt(0).toUpperCase() + selectedRecipe.diet.slice(1),
          },
          selectedRecipe.region && {
            type: 'technique', label: 'Origin',
            content: `${selectedRecipe.state || selectedRecipe.region} — ${selectedRecipe.region} Indian cuisine`,
          },
          selectedRecipe.cook_time && {
            type: 'timing', label: 'Cook time',
            content: `${selectedRecipe.cook_time} minutes total`,
          },
          {
            type: 'tip', label: 'Ready to cook?',
            content: 'Ask me anything — techniques, substitutions, timing, or safety tips.',
          },
        ].filter(Boolean),
      });
      setMessages([{ role: 'ai', content: welcomeContent }]);
      setHistory([]);  // reset history on new recipe
    } else {
      setMessages([]);
      setHistory([]);
    }
  }, [selectedRecipe]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');

    // Add user message to display
    setMessages(prev => [...prev, { role: 'user', content: question }]);

    // Build new history entry for API (use raw JSON string as assistant content)
    const newHistory = [...history, { role: 'user', content: question }];

    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/assistant/ask`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userMode,
          recipeContext: selectedRecipe ? {
            name:      selectedRecipe.name,
            diet:      selectedRecipe.diet,
            region:    selectedRecipe.region,
            state:     selectedRecipe.state,
            cuisine:   selectedRecipe.cuisine,
            cook_time: selectedRecipe.cook_time,
          } : null,
          history: newHistory,  // ← send full conversation history
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      // Add AI reply to display
      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);

      // Update history with assistant reply (raw JSON string)
      setHistory([...newHistory, { role: 'assistant', content: data.answer }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Something went wrong. Please check your connection and try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const suggestions = selectedRecipe ? [
    `How do I know when ${selectedRecipe.name} is ready?`,
    'What spices can I substitute?',
    'How do I avoid burning it?',
  ] : [
    'What is tadka?',
    'How do I use a pressure cooker safely?',
    'How do I make crispy dosa?',
  ];

  // Allow parent (KidsApp / SeniorApp) to pass custom styles
  const wrapperStyle = chatStyles?.wrapper || {};
  const inputStyle   = chatStyles?.input   || {};
  const btnStyle     = chatStyles?.btn     || {};

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', ...wrapperStyle }}>
      <div className="card-header">
        <div className="card-icon green">🤖</div>
        <div>
          <div className="card-title">Cooking Assistant</div>
          <div className="card-desc">
            {selectedRecipe
              ? `Guiding you through ${selectedRecipe.name}`
              : 'Ask any Indian cooking question'}
          </div>
        </div>
      </div>

      <div className="card-body" style={{ flex: 1 }}>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-text">
                {selectedRecipe
                  ? `Ask me anything about cooking ${selectedRecipe.name}.`
                  : 'Search for a recipe or ask a general cooking question.'}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            msg.role === 'user' ? (
              <div className="msg-user" key={i}>
                <div className="msg-user-bubble">{msg.content}</div>
              </div>
            ) : (
              <AIMessage key={i} content={msg.content} />
            )
          ))}

          {loading && (
            <div className="msg-ai">
              <div className="ai-avatar">🤖</div>
              <div className="ai-plain" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{
                  borderColor: 'rgba(107,74,48,0.2)',
                  borderTopColor: '#9b7a5e',
                }} />
                <span style={{ color: '#9b7a5e', fontSize: 13 }}>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions — show only at start of conversation */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {suggestions.map((s, i) => (
              <button key={i}
                onClick={() => setInput(s)}
                style={{
                  background: 'rgba(232,149,42,0.08)',
                  border: '1px solid rgba(232,149,42,0.25)',
                  borderRadius: 100,
                  padding: '4px 12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#c97b1a',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  ...inputStyle,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <div className="chat-input-row">
          <input
            className="field-input"
            style={{ margin: 0 }}
            type="text"
            placeholder={selectedRecipe
              ? `Ask about ${selectedRecipe.name}...`
              : 'Ask any cooking question...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="btn-send"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={btnStyle}
          >
            {loading ? <span className="spinner" /> : 'Ask →'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default CookingChat;