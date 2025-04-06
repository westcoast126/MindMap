import React, { useState, useEffect } from 'react';

interface TimerProps {
  initialTimeSeconds: number;
  onTimeUp: () => void;
  isRunning: boolean; // Control timer start/stop
}

const Timer: React.FC<TimerProps> = ({ initialTimeSeconds, onTimeUp, isRunning }) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeSeconds);

  useEffect(() => {
    // Reset timer when initialTimeSeconds changes (e.g., new puzzle)
    setTimeLeft(initialTimeSeconds);
  }, [initialTimeSeconds]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
        // If not running or time is already up, clear interval
        if (timeLeft <= 0 && isRunning) {
           // Ensure onTimeUp is called only once when timer hits zero while running
           onTimeUp();
        }
        return; // Don't start interval
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => {
        const newTime = prevTime - 1;
        if (newTime <= 0) {
          clearInterval(intervalId); // Stop interval
          onTimeUp(); // Signal time is up
          return 0;
        }
        return newTime;
      });
    }, 1000); // Update every second

    // Cleanup function to clear interval when component unmounts or isRunning changes
    return () => clearInterval(intervalId);
  }, [timeLeft, isRunning, onTimeUp]);

  // Format time remaining (MM:SS)
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="p-2 text-center font-mono text-lg bg-gray-800 text-white rounded">
      Time: {formattedTime}
    </div>
  );
};

export default Timer; 