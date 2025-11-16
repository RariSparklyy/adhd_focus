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

  // Load reflections from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adhd-reflections');
    if (saved) {
      setReflections(JSON.parse(saved));
    }
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
      aiSummary: null, // Placeholder for AI feature
      aiInsights: null  // Placeholder for AI feature
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
  };

  const deleteReflection = (id) => {
    if (window.confirm('Delete this reflection?')) {
      setReflections(reflections.filter(r => r.id !== id));
    }
  };

  const generateAISummary = (id) => {
    // Placeholder for AI feature
    alert('AI Summary Generation will be added later! 🤖\n\nThis will analyze your reflection and generate insights about:\n• Productivity patterns\n• Common challenges\n• Suggested improvements\n• Motivational feedback');
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      great: '😄',
      good: '🙂',
      neutral: '😐',
      struggling: '😟',
      tough: '😰'
    };
    return emojis[mood] || '😐';
  };

  const getMoodColor = (mood) => {
    const colors = {
      great: '#10b981',
      good: '#3b82f6',
      neutral: '#6b7280',
      struggling: '#f59e0b',
      tough: '#ef4444'
    };
    return colors[mood] || '#6b7280';
  };

  return (
    <div className="reflection-container">
      <div className="reflection-header">
        <div className="header-content">
          <h2>📔 Daily Reflections</h2>
          <p className="header-subtitle">Track your progress and generate AI insights</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-reflection-btn"
        >
          {showAddForm ? '✕ Cancel' : '➕ New Reflection'}
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
                { value: 'great', label: 'Great', emoji: '😄' },
                { value: 'good', label: 'Good', emoji: '🙂' },
                { value: 'neutral', label: 'Okay', emoji: '😐' },
                { value: 'struggling', label: 'Struggling', emoji: '😟' },
                { value: 'tough', label: 'Tough', emoji: '😰' }
              ].map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setNewReflection({...newReflection, mood: mood.value})}
                  className={`mood-btn ${newReflection.mood === mood.value ? 'selected' : ''}`}
                >
                  <span className="mood-emoji">{mood.emoji}</span>
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
            <label className="form-label">🎉 What went well?</label>
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
            <label className="form-label">💪 What was challenging?</label>
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
            <label className="form-label">📝 Additional notes</label>
            <textarea
              placeholder="Any other thoughts or observations?"
              value={newReflection.notes}
              onChange={(e) => setNewReflection({...newReflection, notes: e.target.value})}
              className="reflection-textarea"
              rows="3"
            />
          </div>

          <button onClick={addReflection} className="save-reflection-btn">
            💾 Save Reflection
          </button>
        </div>
      )}

      {/* Weekly Summary Stats */}
      {reflections.length > 0 && (
        <div className="weekly-summary">
          <h3>📊 This Week's Overview</h3>
          <div className="summary-stats">
            <div className="summary-stat">
              <div className="stat-icon-large">📝</div>
              <div className="stat-value-large">{reflections.length}</div>
              <div className="stat-label-small">Total Reflections</div>
            </div>
            <div className="summary-stat">
              <div className="stat-icon-large">⭐</div>
              <div className="stat-value-large">
                {reflections.length > 0 
                  ? (reflections.reduce((sum, r) => sum + r.productivity, 0) / reflections.length).toFixed(1)
                  : 0}
              </div>
              <div className="stat-label-small">Avg Productivity</div>
            </div>
            <div className="summary-stat">
              <div className="stat-icon-large">😊</div>
              <div className="stat-value-large">
                {getMoodEmoji(reflections[0]?.mood)}
              </div>
              <div className="stat-label-small">Latest Mood</div>
            </div>
          </div>

          {/* AI Insights Placeholder */}
          <div className="ai-insights-placeholder">
            <div className="ai-icon">🤖</div>
            <div className="ai-text">
              <strong>AI Insights Coming Soon!</strong>
              <p>Your reflections will be analyzed to provide personalized productivity insights and patterns.</p>
            </div>
            <button className="generate-insights-btn" onClick={() => generateAISummary()}>
              Generate AI Insights
            </button>
          </div>
        </div>
      )}

      {/* Reflections List */}
      <div className="reflections-list">
        {reflections.length === 0 ? (
          <div className="empty-reflections">
            <div className="empty-icon">📔</div>
            <p>No reflections yet!</p>
            <p className="empty-subtext">Start tracking your journey to build better habits</p>
          </div>
        ) : (
          reflections.map(reflection => (
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
                  {getMoodEmoji(reflection.mood)}
                </div>
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
                    <span className="section-icon">🎉</span>
                    <span className="section-title">Wins</span>
                  </div>
                  <p className="section-content">{reflection.wins}</p>
                </div>
              )}

              {reflection.challenges && (
                <div className="reflection-section challenges-section">
                  <div className="section-header">
                    <span className="section-icon">💪</span>
                    <span className="section-title">Challenges</span>
                  </div>
                  <p className="section-content">{reflection.challenges}</p>
                </div>
              )}

              {reflection.notes && (
                <div className="reflection-section notes-section">
                  <div className="section-header">
                    <span className="section-icon">📝</span>
                    <span className="section-title">Notes</span>
                  </div>
                  <p className="section-content">{reflection.notes}</p>
                </div>
              )}

              {/* AI Summary Placeholder */}
              <div className="ai-summary-section">
                <div className="ai-summary-header">
                  <span className="ai-icon-small">🤖</span>
                  <span>AI Summary</span>
                </div>
                {reflection.aiSummary ? (
                  <p className="ai-summary-content">{reflection.aiSummary}</p>
                ) : (
                  <div className="ai-summary-placeholder-box">
                    <p>AI analysis not generated yet</p>
                    <button 
                      onClick={() => generateAISummary(reflection.id)}
                      className="generate-summary-btn"
                    >
                      Generate Summary
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="reflection-actions">
                <button 
                  onClick={() => generateAISummary(reflection.id)}
                  className="action-btn-secondary"
                >
                  🤖 AI Insights
                </button>
                <button 
                  onClick={() => deleteReflection(reflection.id)}
                  className="action-btn-danger"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Reflection;