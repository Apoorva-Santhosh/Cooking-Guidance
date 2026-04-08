import React from 'react';
import RecipeNormalizer from './RecipeNormalizer';
import CookingAssistant from './CookingAssistant';

function StandardApp({ onChangeMode }) {
  return (
    <div className="app accent-orange" data-mode="standard">
      <header className="app-header">
        <div className="header-badge">🍛 AI-Powered Kitchen</div>
        <h1 className="app-title">
          Smart Indian Kitchen<br /><em>Assistant</em>
        </h1>
        <p className="app-subtitle">
          Personalised cooking guidance tailored for Indian kitchens.
        </p>
        <div className="mode-chip-row">
          <span className="mode-chip">👨‍🍳 Standard Mode</span>
          <button className="btn-change-mode" onClick={onChangeMode}>Change mode</button>
        </div>
        <div className="header-divider" />
      </header>
      <main className="cards-grid">
        <RecipeNormalizer userMode="standard" />
        <CookingAssistant userMode="standard" />
      </main>
      <footer className="app-footer">
        Smart Indian Kitchen · Standard Mode
      </footer>
    </div>
  );
}

export default StandardApp;