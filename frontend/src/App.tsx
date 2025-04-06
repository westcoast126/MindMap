import React from 'react';
import GameScreen from './components/GameScreen'; // Import the component we created
import './index.css'; // Assuming you have Tailwind setup via index.css

function App() {
  // For now, hardcode the puzzle ID to load
  // Later, this could come from routing, user selection, etc.
  const currentPuzzleId = "puzzle_daily_free";

  return (
    <div className="App">
      <GameScreen puzzleId={currentPuzzleId} />
    </div>
  );
}

export default App;
