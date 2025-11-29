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
      type: type, // This is 'focus' or 'break'
      duration: duration,
      completedAt: new Date().toLocaleString(),
      date: new Date().toLocaleDateString()
    };

    const newHistory = [newSession, ...history].slice(0, 20); // Keep last 20
    localStorage.setItem('adhd-timer-history', JSON.stringify(newHistory));

    // --- CHANGED THIS BLOCK ---
    // Dispatch custom event with DETAILS so AI knows the type
    window.dispatchEvent(new CustomEvent('sessionCompleted', {
      detail: {
        session: newSession,
        stats: newStats
      }
    }));
    // --------------------------
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
                <svg className="completion-icon" width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className="completion-title">Amazing Work!</h2>
                <p className="completion-message">
                  You crushed that {sessionDuration} minute focus session!
                </p>
                <div className="completion-stats">
                  <div className="stat-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="badge-text">+1 Session</span>
                  </div>
                  <div className="stat-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="badge-text">Streak!</span>
                  </div>
                </div>
                <div className="completion-actions">
                  <button onClick={continueWorking} className="continue-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Keep the momentum!
                  </button>
                  <button onClick={() => switchSessionType('break')} className="break-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.59 13.41L17 17L13.41 13.41C12.84 12.84 12 13.25 12 14.08V19C12 19.55 12.45 20 13 20H21C21.55 20 22 19.55 22 19V14.08C22 13.25 21.16 12.84 20.59 13.41Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Take a break
                  </button>
                </div>
              </>
            ) : (
              <>
                <svg className="completion-icon" width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <h2 className="completion-title">Break Complete!</h2>
                <p className="completion-message">
                  {sessionDuration} minutes of rest! Feeling refreshed?
                </p>
                <div className="completion-actions">
                  <button onClick={() => switchSessionType('focus')} className="focus-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                    Start Focus Session
                  </button>
                  <button onClick={continueWorking} className="extend-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Extend break
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
          Focus Time
        </button>
        <button
          onClick={() => switchSessionType('break')}
          className={`session-btn ${sessionType === 'break' ? 'active-break' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.59 13.41L17 17L13.41 13.41C12.84 12.84 12 13.25 12 14.08V19C12 19.55 12.45 20 13 20H21C21.55 20 22 19.55 22 19V14.08C22 13.25 21.16 12.84 20.59 13.41Z" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Break Time
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
              stroke="#334155"
              strokeWidth="12"
            />
            <circle
              cx="140"
              cy="140"
              r="130"
              fill="none"
              stroke={isCompleted ? '#10b981' : sessionType === 'focus' ? '#8b5cf6' : '#10b981'}
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
                ? 'Session Complete!'
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
                {isActive ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                      <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 3L19 12L5 21V3Z" fill="currentColor"/>
                    </svg>
                    Start
                  </>
                )}
              </button>
              <button onClick={resetTimer} className="reset-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 15C4.01717 16.4332 4.87913 17.7146 6.01547 18.7246C7.1518 19.7345 8.52547 20.4402 10.0083 20.7757C11.4911 21.1112 13.0348 21.0657 14.4952 20.6432C15.9556 20.2208 17.2853 19.4353 18.36 18.36C19.4347 17.2853 20.2208 15.9556 20.6432 14.4952C21.0657 13.0348 21.1112 11.4911 20.7757 10.0083C20.4402 8.52547 19.7345 7.1518 18.7246 6.01547C17.7146 4.87913 16.4332 4.01717 15 3.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reset
              </button>
            </>
          ) : (
            <>
              <button
                onClick={resetTimer}
                className={`start-btn ${sessionType === 'focus' ? 'focus-mode' : 'break-mode'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 3L19 12L5 21V3Z" fill="currentColor"/>
                </svg>
                Start New Session
              </button>
            </>
          )}
        </div>
      </div>

      {/* Enhanced Motivational Message */}
      <div className={`motivation-box ${isActive ? 'pulsing' : ''} ${isCompleted ? 'completed' : ''}`}>
        <svg className="motivation-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {isCompleted ? (
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          ) : isActive ? (
            <>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </>
          ) : (
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2"/>
          )}
        </svg>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Session Saved
          </div>
        )}
      </div>
    </div>
  );
}

export default Timer;