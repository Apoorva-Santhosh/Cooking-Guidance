import React, { useState } from 'react';
import RecipeSearch from './RecipeSearch';
import CookingChat from './CookingChat';

function StandardApp({ onChangeMode }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  return (
    <div className="app" data-mode="standard">

      {/* Header */}
      <header className="app-header">
        <div className="header-badge">AI-Powered Kitchen</div>
        <h1 className="app-title">
          Smart Indian Kitchen<br /><em>Assistant</em>
        </h1>
        <p className="app-subtitle">
          Search any Indian dish and get step-by-step AI cooking guidance.
        </p>
        <div className="mode-chip-row">
          <span className="mode-chip">👨‍🍳 Standard Mode</span>
          <button className="btn-change-mode" onClick={onChangeMode}>Change mode</button>
        </div>
        <div className="header-divider" />
      </header>

      {/* Main — Recipe Search left, Chat right */}
      <main className="app-main">
        <RecipeSearch
          onRecipeSelect={setSelectedRecipe}
          selectedRecipe={selectedRecipe}
        />
        <CookingChat
          userMode="standard"
          selectedRecipe={selectedRecipe}
        />
      </main>
    </div>
  );
}

export default StandardApp;