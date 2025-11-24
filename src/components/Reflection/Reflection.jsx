import { useState, useEffect } from 'react';
import './Reflection.css';

function Reflection() {
  const [reflections, setReflections] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReflection, setNewReflection] = useState({
    mood: 'neutral',
    productivity: 5,
    notes: '',
    challenges: '',
    wins: ''
  });
  const [sessionHistory, setSessionHistory] = useState([]);
  const [stats, setStats] = useState({
    todaySessions: 0,
    weekSessions: 0,
    totalMinutes: 0,
    currentStreak: 0
  });

  // Load reflections and session history
  const loadData = () => {
    const savedReflections = localStorage.getItem('adhd-reflections');
    if (savedReflections) {
      setReflections(JSON.parse(savedReflections));
    }

    const savedHistory = localStorage.getItem('adhd-timer-history');
    if (savedHistory) {
      setSessionHistory(JSON.parse(savedHistory));
    }

    const savedStats = localStorage.getItem('adhd-timer-stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  };

  useEffect(() => {
    loadData();

    // Listen for session completion events from Timer
    const handleSessionCompleted = () => {
      loadData();
    };

    window.addEventListener('sessionCompleted', handleSessionCompleted);

    return () => {
      window.removeEventListener('sessionCompleted', handleSessionCompleted);
    };
  }, []);

  // Save to localStorage whenever reflections change
  useEffect(() => {
    localStorage.setItem('adhd-reflections', JSON.stringify(reflections));
  }, [reflections]);

  const addReflection = () => {
    const reflection = {
      id: Date.now(),
      ...newReflection,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      sessionsAtTime: sessionHistory.length,
      totalMinutesAtTime: stats.totalMinutes
    };

    setReflections([reflection, ...reflections]);
    setNewReflection({
      mood: 'neutral',
      productivity: 5,
      notes: '',
      challenges: '',
      wins: ''
    });
    setShowAddForm(false);
    
    // Trigger event with reflection data for AI Insights Hub
    window.dispatchEvent(new CustomEvent('reflectionAddedWithData', {
      detail: {
        reflection: reflection,
        sessionHistory: sessionHistory
      }
    }));
  };

  const deleteReflection = (id) => {
    if (window.confirm('Delete this reflection?')) {
      setReflections(reflections.filter(r => r.id !== id));
    }
  };

  const clearSessionHistory = () => {
    if (window.confirm('Clear all session history? This cannot be undone.')) {
      localStorage.removeItem('adhd-timer-history');
      setSessionHistory([]);
    }
  };

  const getMoodColor = (mood) => {
    const colors = {
      great: '#10b981',
      good: '#06b6d4',
      neutral: '#94a3b8',
      struggling: '#f59e0b',
      tough: '#ef4444'
    };
    return colors[mood] || '#94a3b8';
  };

  // Calculate session breakdown
  const focusSessions = sessionHistory.filter(s => s.type === 'focus').length;
  const breakSessions = sessionHistory.filter(s => s.type === 'break').length;
  const totalFocusMinutes = sessionHistory
    .filter(s => s.type === 'focus')
    .reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="reflection-container">
      <div className="reflection-header">
        <div className="header-content">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 13H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Reflections & Session History
          </h2>
          <p className="header-subtitle">Track your journey - Milky learns from your progress</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-reflection-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {showAddForm ? 'Cancel' : 'New Reflection'}
        </button>
      </div>

      {/* Add Reflection Form */}
      {showAddForm && (
        <div className="reflection-form">
          <h3>How was your focus session?</h3>
          
          {/* Mood Selector */}
          <div className="form-section">
            <label className="form-label">How are you feeling?</label>
            <div className="mood-selector">
              {[
                { value: 'great', label: 'Great' },
                { value: 'good', label: 'Good' },
                { value: 'neutral', label: 'Okay' },
                { value: 'struggling', label: 'Struggling' },
                { value: 'tough', label: 'Tough' }
              ].map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setNewReflection({...newReflection, mood: mood.value})}
                  className={`mood-btn ${newReflection.mood === mood.value ? 'selected' : ''}`}
                  style={{ 
                    borderColor: newReflection.mood === mood.value ? getMoodColor(mood.value) : '#334155',
                    backgroundColor: newReflection.mood === mood.value ? `${getMoodColor(mood.value)}20` : 'transparent'
                  }}
                >
                  <span className="mood-label">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Productivity Slider */}
          <div className="form-section">
            <label className="form-label">
              Productivity Level: <strong>{newReflection.productivity}/10</strong>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newReflection.productivity}
              onChange={(e) => setNewReflection({...newReflection, productivity: parseInt(e.target.value)})}
              className="productivity-slider"
            />
            <div className="slider-labels">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          {/* Wins */}
          <div className="form-section">
            <label className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              What went well?
            </label>
            <textarea
              placeholder="Celebrate your wins, big or small!"
              value={newReflection.wins}
              onChange={(e) => setNewReflection({...newReflection, wins: e.target.value})}
              className="reflection-textarea"
              rows="3"
            />
          </div>

          {/* Challenges */}
          <div className="form-section">
            <label className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
              What was challenging?
            </label>
            <textarea
              placeholder="It's okay to struggle. What made things difficult?"
              value={newReflection.challenges}
              onChange={(e) => setNewReflection({...newReflection, challenges: e.target.value})}
              className="reflection-textarea"
              rows="3"
            />
          </div>

          {/* Notes */}
          <div className="form-section">
            <label className="form-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Additional notes
            </label>
            <textarea
              placeholder="Any other thoughts or observations?"
              value={newReflection.notes}
              onChange={(e) => setNewReflection({...newReflection, notes: e.target.value})}
              className="reflection-textarea"
              rows="3"
            />
          </div>

          <button onClick={addReflection} className="save-reflection-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Save Reflection
          </button>
        </div>
      )}

      {/* Session Overview Stats */}
      {sessionHistory.length > 0 && (
        <div className="session-overview">
          <div className="overview-header">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Session Overview
            </h3>
            <button onClick={clearSessionHistory} className="clear-sessions-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Clear History
            </button>
          </div>
          <div className="overview-grid">
            <div className="overview-card">
              <svg className="overview-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="overview-value">{stats.currentStreak}</div>
              <div className="overview-label">Streak</div>
            </div>
            <div className="overview-card">
              <svg className="overview-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className="overview-value">{focusSessions}</div>
              <div className="overview-label">Focus Sessions</div>
            </div>
            <div className="overview-card">
              <svg className="overview-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.59 13.41L17 17L13.41 13.41C12.84 12.84 12 13.25 12 14.08V19C12 19.55 12.45 20 13 20H21C21.55 20 22 19.55 22 19V14.08C22 13.25 21.16 12.84 20.59 13.41Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <div className="overview-value">{breakSessions}</div>
              <div className="overview-label">Break Sessions</div>
            </div>
            <div className="overview-card">
              <svg className="overview-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className="overview-value">{totalFocusMinutes}</div>
              <div className="overview-label">Focus Minutes</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions History */}
      <div className="session-history-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Recent Sessions
        </h3>
        {sessionHistory.length === 0 ? (
          <div className="empty-sessions">
            <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <p>No sessions yet!</p>
            <p className="empty-subtext">Complete a focus or break session to see it here</p>
          </div>
        ) : (
          <div className="sessions-list">
            {sessionHistory.slice(0, 15).map(session => (
              <div key={session.id} className={`session-item ${session.type}-session`}>
                <div className="session-icon-circle">
                  {session.type === 'focus' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.59 13.41L17 17L13.41 13.41C12.84 12.84 12 13.25 12 14.08V19C12 19.55 12.45 20 13 20H21C21.55 20 22 19.55 22 19V14.08C22 13.25 21.16 12.84 20.59 13.41Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  )}
                </div>
                <div className="session-details">
                  <div className="session-type">
                    {session.type === 'focus' ? 'Focus Session' : 'Break Session'}
                  </div>
                  <div className="session-meta">
                    <span className="session-duration">{session.duration} min</span>
                    <span className="session-dot">•</span>
                    <span className="session-time">{session.completedAt}</span>
                  </div>
                </div>
                <div className="session-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reflections List */}
      <div className="reflections-section">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Your Reflections
        </h3>
        {reflections.length === 0 ? (
          <div className="empty-reflections">
            <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <p>No reflections yet!</p>
            <p className="empty-subtext">Add a reflection to track your progress and mindset</p>
          </div>
        ) : (
          <div className="reflections-list">
            {reflections.map(reflection => (
              <div key={reflection.id} className="reflection-card">
                {/* Header */}
                <div className="reflection-card-header">
                  <div className="reflection-date-time">
                    <span className="reflection-date">{reflection.date}</span>
                    <span className="reflection-time">{reflection.time}</span>
                  </div>
                  <div 
                    className="reflection-mood-badge"
                    style={{ backgroundColor: getMoodColor(reflection.mood) }}
                  >
                    {reflection.mood}
                  </div>
                </div>

                {/* Session Context */}
                <div className="reflection-context">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span className="context-item">{reflection.sessionsAtTime} sessions completed</span>
                  <span className="context-dot">•</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="context-item">{reflection.totalMinutesAtTime} total minutes</span>
                </div>

                {/* Productivity Bar */}
                <div className="productivity-display">
                  <span className="productivity-label">Productivity</span>
                  <div className="productivity-bar-container">
                    <div 
                      className="productivity-bar-fill"
                      style={{ 
                        width: `${reflection.productivity * 10}%`,
                        backgroundColor: reflection.productivity >= 7 ? '#10b981' : reflection.productivity >= 4 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <span className="productivity-value">{reflection.productivity}/10</span>
                </div>

                {/* Content Sections */}
                {reflection.wins && (
                  <div className="reflection-section wins-section">
                    <div className="section-header">
                      <svg className="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="section-title">Wins</span>
                    </div>
                    <p className="section-content">{reflection.wins}</p>
                  </div>
                )}

                {reflection.challenges && (
                  <div className="reflection-section challenges-section">
                    <div className="section-header">
                      <svg className="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="16" r="1" fill="currentColor"/>
                      </svg>
                      <span className="section-title">Challenges</span>
                    </div>
                    <p className="section-content">{reflection.challenges}</p>
                  </div>
                )}

                {reflection.notes && (
                  <div className="reflection-section notes-section">
                    <div className="section-header">
                      <svg className="section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span className="section-title">Notes</span>
                    </div>
                    <p className="section-content">{reflection.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="reflection-actions">
                  <button 
                    onClick={() => deleteReflection(reflection.id)}
                    className="action-btn-danger"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reflection;