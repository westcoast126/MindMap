import React from 'react';

interface ScoreDisplayProps {
  score: number;
  moves: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, moves }) => {
  return (
    <div className="flex justify-around p-2 bg-gray-100 border-t text-center">
       <div>
         <span className="text-xs text-gray-500 uppercase">Score</span>
         <p className="text-lg font-semibold">{score}</p>
       </div>
       <div>
         <span className="text-xs text-gray-500 uppercase">Moves</span>
         <p className="text-lg font-semibold">{moves}</p>
       </div>
        {/* TODO: Add high score display? */}
    </div>
  );
};

export default ScoreDisplay; 