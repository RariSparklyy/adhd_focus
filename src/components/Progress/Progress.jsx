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

  // Load stats from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('adhd-timer-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    const savedHistory = localStorage.getItem('adhd-timer-history');
    if (savedHistory) {
      setSessionHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Mock function to simulate completing a session
  // (We'll connect this to the Timer later)
  const mockAddSession = () => {
    const newSession = {
      id: Date.now(),
      type: 'focus',
      duration: 25,
      completedAt: new Date().toLocaleString(),
      date: new Date().toLocaleDateString()
    };

    const newHistory = [newSession, ...sessionHistory].slice(0, 10); // Keep last 10
    setSessionHistory(newHistory);
    localStorage.setItem('adhd-timer-history', JSON.stringify(newHistory));

    const newStats = {
      ...stats,
      todaySessions: stats.todaySessions + 1,
      weekSessions: stats.weekSessions + 1,
      totalMinutes: stats.totalMinutes + 25,
      currentStreak: stats.currentStreak + 1
    };
    setStats(newStats);
    localStorage.setItem('adhd-timer-stats', JSON.stringify(newStats));
  };

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
          <div className="stat-label">Day Streak</div>
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

      {/* Mock Button for Testing */}
      <div className="test-section">
        <button onClick={mockAddSession} className="mock-session-btn">
          ➕ Add Mock Session (for testing)
        </button>
      </div>

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
              <div key={session.id} className="history-item">
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