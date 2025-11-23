import { useState, useEffect } from 'react';
import './Progress.css';

function Progress() {
  const [stats, setStats] = useState({
    todaySessions: 0,
    weekSessions: 0,
    totalMinutes: 0,
    currentStreak: 0
  });

  const [sessionHistory, setSessionHistory] = useState([]);

  // Load stats and history from localStorage
  const loadData = () => {
    const savedStats = localStorage.getItem('adhd-timer-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    const savedHistory = localStorage.getItem('adhd-timer-history');
    if (savedHistory) {
      setSessionHistory(JSON.parse(savedHistory));
    }
  };

  // Load on mount
  useEffect(() => {
    loadData();

    // Listen for session completion events from Timer
    const handleSessionCompleted = () => {
      loadData();
    };

    window.addEventListener('sessionCompleted', handleSessionCompleted);

    // Cleanup listener
    return () => {
      window.removeEventListener('sessionCompleted', handleSessionCompleted);
    };
  }, []);

  const resetStats = () => {
    if (window.confirm('Are you sure you want to reset all stats?')) {
      const emptyStats = {
        todaySessions: 0,
        weekSessions: 0,
        totalMinutes: 0,
        currentStreak: 0
      };
      setStats(emptyStats);
      setSessionHistory([]);
      localStorage.setItem('adhd-timer-stats', JSON.stringify(emptyStats));
      localStorage.setItem('adhd-timer-history', JSON.stringify([]));
    }
  };

  // Calculate breakdown of focus vs break sessions
  const focusSessions = sessionHistory.filter(s => s.type === 'focus').length;
  const breakSessions = sessionHistory.filter(s => s.type === 'break').length;
  const totalFocusMinutes = sessionHistory
    .filter(s => s.type === 'focus')
    .reduce((sum, s) => sum + s.duration, 0);
  const totalBreakMinutes = sessionHistory
    .filter(s => s.type === 'break')
    .reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h2>📊 Your Progress</h2>
        <button onClick={resetStats} className="reset-stats-btn">
          Reset Stats
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">Session Streak</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">☀️</div>
          <div className="stat-value">{stats.todaySessions}</div>
          <div className="stat-label">Today's Sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.weekSessions}</div>
          <div className="stat-label">This Week</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{stats.totalMinutes}</div>
          <div className="stat-label">Total Minutes</div>
        </div>
      </div>

      {/* Session Breakdown */}
      {sessionHistory.length > 0 && (
        <div className="session-breakdown">
          <h3>Session Breakdown</h3>
          <div className="breakdown-grid">
            <div className="breakdown-card focus-card">
              <div className="breakdown-icon">🎯</div>
              <div className="breakdown-stats">
                <div className="breakdown-value">{focusSessions}</div>
                <div className="breakdown-label">Focus Sessions</div>
                <div className="breakdown-time">{totalFocusMinutes} minutes</div>
              </div>
            </div>
            <div className="breakdown-card break-card">
              <div className="breakdown-icon">☕</div>
              <div className="breakdown-stats">
                <div className="breakdown-value">{breakSessions}</div>
                <div className="breakdown-label">Break Sessions</div>
                <div className="breakdown-time">{totalBreakMinutes} minutes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="session-history">
        <h3>Recent Sessions</h3>
        {sessionHistory.length === 0 ? (
          <div className="empty-history">
            <p>📭</p>
            <p>No sessions yet. Complete a focus session to see it here!</p>
          </div>
        ) : (
          <div className="history-list">
            {sessionHistory.map(session => (
              <div key={session.id} className={`history-item ${session.type}-session`}>
                <div className="history-icon">
                  {session.type === 'focus' ? '🎯' : '☕'}
                </div>
                <div className="history-content">
                  <div className="history-title">
                    {session.type === 'focus' ? 'Focus Session' : 'Break Session'}
                  </div>
                  <div className="history-meta">
                    {session.duration} min • {session.completedAt}
                  </div>
                </div>
                <div className="history-badge">
                  ✓
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Progress;