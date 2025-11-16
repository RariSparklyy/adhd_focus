import { useState, useEffect } from 'react';
import './Timer.css';

function Timer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState('focus'); // 'focus' or 'break'

  // Timer countdown logic
  useEffect(() => {
    let interval = null;

    if (isActive && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsActive(false);
            alert('Timer finished! 🎉');
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (sessionType === 'focus') {
      setMinutes(25);
    } else {
      setMinutes(5);
    }
    setSeconds(0);
  };

  const switchSessionType = (type) => {
    setSessionType(type);
    setIsActive(false);
    if (type === 'focus') {
      setMinutes(25);
    } else {
      setMinutes(5);
    }
    setSeconds(0);
  };

  const adjustTime = (amount) => {
    if (!isActive) {
      setMinutes(Math.max(1, minutes + amount));
    }
  };

  // Calculate progress percentage
  const totalSeconds = sessionType === 'focus' ? 25 * 60 : 5 * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

  return (
    <div className="timer-container">
      {/* Session Type Selector */}
      <div className="session-selector">
        <button
          onClick={() => switchSessionType('focus')}
          className={`session-btn ${sessionType === 'focus' ? 'active-focus' : ''}`}
        >
          🎯 Focus Time
        </button>
        <button
          onClick={() => switchSessionType('break')}
          className={`session-btn ${sessionType === 'break' ? 'active-break' : ''}`}
        >
          ☕ Break Time
        </button>
      </div>

      {/* Timer Display */}
      <div className="timer-display">
        {/* Progress Circle */}
        <div className="progress-ring">
          <svg width="280" height="280">
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="none"
              stroke={sessionType === 'focus' ? '#9333ea' : '#16a34a'}
              strokeWidth="12"
              strokeDasharray={`${2 * Math.PI * 130}`}
              strokeDashoffset={`${2 * Math.PI * 130 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="progress-circle"
            />
          </svg>
          
          {/* Time Text */}
          <div className="time-display">
            <div className="time-text">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="session-label">
              {sessionType === 'focus' ? 'Stay focused!' : 'Take a break'}
            </div>
          </div>
        </div>

        {/* Time Adjustment Buttons */}
        {!isActive && (
          <div className="time-adjustments">
            <button onClick={() => adjustTime(-5)} className="adjust-btn">-5 min</button>
            <button onClick={() => adjustTime(-1)} className="adjust-btn">-1 min</button>
            <button onClick={() => adjustTime(1)} className="adjust-btn">+1 min</button>
            <button onClick={() => adjustTime(5)} className="adjust-btn">+5 min</button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="control-buttons">
          <button
            onClick={toggleTimer}
            className={`start-btn ${isActive ? 'pause-btn' : ''} ${sessionType === 'focus' ? 'focus-mode' : 'break-mode'}`}
          >
            {isActive ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button onClick={resetTimer} className="reset-btn">
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Enhanced Motivational Message */}
      <div className={`motivation-box ${isActive ? 'pulsing' : ''}`}>
        <div className="motivation-icon">
          {isActive ? '💪' : '👋'}
        </div>
        <p className="motivation-text">
          {isActive
            ? sessionType === 'focus' 
              ? 'Stay focused! You\'re building momentum!' 
              : 'Relax and recharge! You earned this break!'
            : sessionType === 'focus'
            ? 'Ready to crush your goals? Hit start!'
            : 'Time for a well-deserved break!'}
        </p>
        {isActive && (
          <div className="progress-percentage-display">
            {Math.round(progress)}% Complete
          </div>
        )}
      </div>
    </div>
  );
}

export default Timer;