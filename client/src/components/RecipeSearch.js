import React, { useState } from 'react';

const DIET_TAGS = {
  vegetarian:     { label: 'Vegetarian', cls: 'tag-veg' },
  'non vegetarian':{ label: 'Non-Veg',   cls: 'tag-nonveg' },
  vegan:          { label: 'Vegan',       cls: 'tag-veg' },
};

function RecipeSearch({ onRecipeSelect, selectedRecipe }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setResults([]); setSearched(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/recipes/search?q=${encodeURIComponent(query)}&limit=5`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResults(data.recipes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon">🔍</div>
        <div>
          <div className="card-title">Find a Recipe</div>
          <div className="card-desc">Search from 6,000+ Indian dishes</div>
        </div>
      </div>
      <div className="card-body">

        {/* Search input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            className="field-input"
            style={{ margin: 0, flex: 1 }}
            type="text"
            placeholder="e.g., Dal Tadka, Paneer Butter Masala, Idli..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="btn-primary orange"
            style={{ width: 'auto', padding: '11px 18px' }}
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? <span className="spinner" /> : 'Search'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 13, color: '#d4714b', marginBottom: 10 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results list */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((recipe) => {
              const isSelected = selectedRecipe?._id === recipe._id;
              const dietTag = recipe.diet
                ? DIET_TAGS[recipe.diet.toLowerCase()] || null
                : null;

              return (
                <div
                  key={recipe._id}
                  onClick={() => onRecipeSelect(recipe)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${isSelected ? 'rgba(232,149,42,0.5)' : 'rgba(232,149,42,0.18)'}`,
                    background: isSelected ? 'rgba(232,149,42,0.07)' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#4a3728',
                    marginBottom: 5,
                  }}>
                    {recipe.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {dietTag && <span className={`tag ${dietTag.cls}`}>{dietTag.label}</span>}
                    {recipe.cook_time && <span className="tag tag-time">⏱ {recipe.cook_time} mins</span>}
                    {recipe.region && <span className="tag tag-region">📍 {recipe.region}</span>}
                    {recipe.course && <span className="tag tag-course">🍽 {recipe.course}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No results */}
        {searched && !loading && results.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-state-text">
              No recipes found for "{query}".<br />Try a different spelling or dish name.
            </div>
          </div>
        )}

        {/* Initial empty state */}
        {!searched && (
          <div className="empty-state">
            <div className="empty-state-text">
              Search for any Indian dish to get<br />step-by-step cooking guidance.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default RecipeSearch;