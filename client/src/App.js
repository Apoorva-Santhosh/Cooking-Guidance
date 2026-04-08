import React, { useState } from 'react';
import './App.css';
import ModeSelector from './components/ModeSelector';
import StandardApp from './components/StandardApp';
import KidsApp from './components/KidsApp';
import SeniorApp from './components/SeniorApp';

function App() {
  const [userMode, setUserMode] = useState(null);

  if (!userMode) return <ModeSelector onSelect={setUserMode} />;
  if (userMode === 'kids')   return <KidsApp   onChangeMode={() => setUserMode(null)} />;
  if (userMode === 'senior') return <SeniorApp onChangeMode={() => setUserMode(null)} />;
  return <StandardApp onChangeMode={() => setUserMode(null)} />;
}

export default App;