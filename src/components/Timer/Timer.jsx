import { useState, useEffect } from 'react';
import './Timer.css';

function Timer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState('focus'); // 'focus' or 'break'
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionType, setCompletionType] = useState('');
  const [sessionDuration, setSessionDuration] = useState(25); // Track original duration

  // Timer countdown logic
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished!
            clearInterval(interval);
            setIsActive(false);
            handleTimerComplete();
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

  const handleTimerComplete = () => {
    setCompletionType(sessionType);
    setShowCompletion(true);
    
    // Save session to localStorage for tracking
    saveSessionToHistory(sessionType, sessionDuration);
    
    // Auto-reset timer after showing completion
    setTimeout(() => {
      setShowCompletion(false);
      // Reset to default time
      if (sessionType === 'focus') {
        setMinutes(25);
        setSessionDuration(25);
      } else {
        setMinutes(5);
        setSessionDuration(5);
      }
      setSeconds(0);
    }, 4000);
  };

  const saveSessionToHistory = (type, duration) => {
    // Get existing stats
    const savedStats = localStorage.getItem('adhd-timer-stats');
    const stats = savedStats ? JSON.parse(savedStats) : {
      todaySessions: 0,
      weekSessions: 0,
      totalMinutes: 0,
      currentStreak: 0
    };

    // Update stats
    const newStats = {
      ...stats,
      todaySessions: stats.todaySessions + 1,
      weekSessions: stats.weekSessions + 1,
      totalMinutes: stats.totalMinutes + duration,
      currentStreak: stats.currentStreak + 1
    };
    localStorage.setItem('adhd-timer-stats', JSON.stringify(newStats));

    // Get existing history
    const savedHistory = localStorage.getItem('adhd-timer-history');
    const history = savedHistory ? JSON.parse(savedHistory) : [];

    // Add new session
    const newSession = {
      id: Date.now(),
      type: type,
      duration: duration,
      completedAt: new Date().toLocaleString(),
      date: new Date().toLocaleDateString()
    };

    const newHistory = [newSession, ...history].slice(0, 20); // Keep last 20
    localStorage.setItem('adhd-timer-history', JSON.stringify(newHistory));

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('sessionCompleted'));
  };

  const toggleTimer = () => {
    // When starting timer, save the duration
    if (!isActive) {
      setSessionDuration(minutes);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    if (sessionType === 'focus') {
      setMinutes(25);
      setSessionDuration(25);
    } else {
      setMinutes(5);
      setSessionDuration(5);
    }
    setSeconds(0);
    setShowCompletion(false);
  };

  const switchSessionType = (type) => {
    setSessionType(type);
    setIsActive(false);
    if (type === 'focus') {
      setMinutes(25);
      setSessionDuration(25);
    } else {
      setMinutes(5);
      setSessionDuration(5);
    }
    setSeconds(0);
    setShowCompletion(false);
  };

  const adjustTime = (amount) => {
    if (!isActive) {
      const newMinutes = Math.max(1, minutes + amount);
      setMinutes(newMinutes);
      setSessionDuration(newMinutes);
    }
  };

  const continueWorking = () => {
    setShowCompletion(false);
    if (sessionType === 'focus') {
      setMinutes(25);
      setSessionDuration(25);
    } else {
      setMinutes(5);
      setSessionDuration(5);
    }
    setSeconds(0);
  };

  // Calculate progress percentage
  const totalSeconds = sessionDuration * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = totalSeconds > 0 ? ((totalSeconds - currentSeconds) / totalSeconds) * 100 : 0;

  // Check if timer is at 00:00 but not active (completed state)
  const isCompleted = minutes === 0 && seconds === 0 && !isActive && !showCompletion;

  return (
    <div className="timer-container">
      {/* Completion Overlay */}
      {showCompletion && (
        <div className={`completion-overlay ${completionType === 'focus' ? 'focus-complete' : 'break-complete'}`}>
          <div className="completion-content">
            {completionType === 'focus' ? (
              <>
                <div className="completion-icon">🎉</div>
                <h2 className="completion-title">Amazing Work!</h2>
                <p className="completion-message">
                  You crushed that {sessionDuration} minute focus session! 💪
                </p>
                <div className="completion-stats">
                  <div className="stat-badge">
                    <span className="badge-icon">⭐</span>
                    <span className="badge-text">+1 Session</span>
                  </div>
                  <div className="stat-badge">
                    <span className="badge-icon">🔥</span>
                    <span className="badge-text">Streak!</span>
                  </div>
                </div>
                <div className="completion-actions">
                  <button onClick={continueWorking} className="continue-btn">
                    🚀 Keep the momentum!
                  </button>
                  <button onClick={() => switchSessionType('break')} className="break-btn">
                    ☕ Take a break
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="completion-icon">✨</div>
                <h2 className="completion-title">Break Complete!</h2>
                <p className="completion-message">
                  {sessionDuration} minutes of rest! Feeling refreshed? 💚
                </p>
                <div className="completion-actions">
                  <button onClick={() => switchSessionType('focus')} className="focus-btn">
                    🎯 Start Focus Session
                  </button>
                  <button onClick={continueWorking} className="extend-btn">
                    😌 Extend break
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
      <div className={`timer-display ${isCompleted ? 'timer-complete' : ''}`}>
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
              stroke={isCompleted ? '#10b981' : sessionType === 'focus' ? '#9333ea' : '#16a34a'}
              strokeWidth="12"
              strokeDasharray={`${2 * Math.PI * 130}`}
              strokeDashoffset={`${2 * Math.PI * 130 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="progress-circle"
            />
          </svg>
          
          {/* Time Text */}
          <div className="time-display">
            <div className={`time-text ${isCompleted ? 'time-complete' : ''}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="session-label">
              {isCompleted
                ? '✨ Session Complete!'
                : isActive
                ? sessionType === 'focus' ? 'Stay focused!' : 'Take a break'
                : sessionType === 'focus' ? 'Ready to focus?' : 'Ready to rest?'}
            </div>
          </div>
        </div>

        {/* Time Adjustment Buttons */}
        {!isActive && !isCompleted && (
          <div className="time-adjustments">
            <button onClick={() => adjustTime(-5)} className="adjust-btn">-5 min</button>
            <button onClick={() => adjustTime(-1)} className="adjust-btn">-1 min</button>
            <button onClick={() => adjustTime(1)} className="adjust-btn">+1 min</button>
            <button onClick={() => adjustTime(5)} className="adjust-btn">+5 min</button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="control-buttons">
          {!isCompleted ? (
            <>
              <button
                onClick={toggleTimer}
                className={`start-btn ${isActive ? 'pause-btn' : ''} ${sessionType === 'focus' ? 'focus-mode' : 'break-mode'}`}
              >
                {isActive ? '⏸️ Pause' : '▶️ Start'}
              </button>
              <button onClick={resetTimer} className="reset-btn">
                🔄 Reset
              </button>
            </>
          ) : (
            <>
              <button
                onClick={resetTimer}
                className={`start-btn ${sessionType === 'focus' ? 'focus-mode' : 'break-mode'}`}
              >
                ▶️ Start New Session
              </button>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Motivational Message */}
      <div className={`motivation-box ${isActive ? 'pulsing' : ''} ${isCompleted ? 'completed' : ''}`}>
        <div className="motivation-icon">
          {isCompleted ? '🎉' : isActive ? '💪' : '👋'}
        </div>
        <p className="motivation-text">
          {isCompleted
            ? sessionType === 'focus'
              ? 'Great job! Session logged and saved!'
              : 'Break complete! Ready for more focus?'
            : isActive
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
        {isCompleted && (
          <div className="completed-badge">
            Session Saved ✓
          </div>
        )}
      </div>
    </div>
  );
}

export default Timer;