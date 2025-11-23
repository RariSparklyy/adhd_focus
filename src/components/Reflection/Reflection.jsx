import { useState, useEffect } from 'react';
import './Reflection.css';
import { generateReflectionInsights, generatePatternInsights, testOllamaConnection } from '../../services/aiService';

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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);

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

  // Check Ollama connection on mount
  useEffect(() => {
    const checkOllama = async () => {
      console.log('Checking Ollama connection...');
      const status = await testOllamaConnection();
      console.log('Ollama Status:', status);
      setOllamaStatus(status);
    };
    checkOllama();
  }, []);

  const addReflection = () => {
    const reflection = {
      id: Date.now(),
      ...newReflection,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      aiSummary: null,
      aiInsights: null,
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
  };

  const deleteReflection = (id) => {
    if (window.confirm('Delete this reflection?')) {
      setReflections(reflections.filter(r => r.id !== id));
    }
  };

  const generateAISummary = async (id) => {
    console.log('=== Generate AI Summary Called ===');
    console.log('Reflection ID:', id);
    console.log('Ollama Status:', ollamaStatus);
    
    const reflection = reflections.find(r => r.id === id);
    console.log('Found Reflection:', reflection);
    
    if (!reflection) {
      console.error('Reflection not found!');
      return;
    }

    // Check Ollama status first
    if (!ollamaStatus?.connected) {
      alert(
        '❌ Ollama Not Connected\n\n' +
        'Please make sure:\n' +
        '1. Ollama is installed\n' +
        '2. Ollama is running (check http://localhost:11434)\n' +
        '3. The model "llama3.2" is downloaded\n\n' +
        'Then refresh the page and try again.'
      );
      return;
    }

    if (!ollamaStatus?.hasModel) {
      alert(
        '❌ Model Not Found\n\n' +
        'Please download the model by running:\n' +
        'ollama pull llama3.2\n\n' +
        'Then refresh the page and try again.'
      );
      return;
    }

    setIsGeneratingAI(true);
    console.log('Starting AI generation...');

    try {
      // Generate AI insights
      console.log('Calling generateReflectionInsights...');
      const result = await generateReflectionInsights(reflection, sessionHistory);
      console.log('AI Result:', result);

      if (result.success) {
        // Update the reflection with AI summary
        const updatedReflections = reflections.map(r => 
          r.id === id ? { ...r, aiSummary: result.summary } : r
        );
        setReflections(updatedReflections);

        alert('✅ AI Summary Generated!\n\nCheck your reflection below.');
      } else {
        alert(
          '❌ AI Generation Failed\n\n' +
          `Error: ${result.error}\n\n` +
          'Make sure Ollama is running at http://localhost:11434'
        );
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      alert(
        '❌ Unexpected Error\n\n' +
        `${error.message}\n\n` +
        'Please check the console for details.'
      );
    } finally {
      setIsGeneratingAI(false);
      console.log('AI generation complete');
    }
  };

  const generatePatternAnalysis = async () => {
    console.log('=== Generate Pattern Analysis Called ===');
    
    if (reflections.length === 0) {
      alert('No reflections yet! Add some reflections first.');
      return;
    }

    // Check Ollama status
    if (!ollamaStatus?.connected) {
      alert(
        '❌ Ollama Not Connected\n\n' +
        'Please make sure Ollama is running.\n' +
        'Check: http://localhost:11434'
      );
      return;
    }

    setIsGeneratingAI(true);
    console.log('Starting pattern analysis...');

    try {
      const result = await generatePatternInsights(reflections, sessionHistory);
      console.log('Pattern Analysis Result:', result);

      if (result.success) {
        alert(
          '🤖 AI Pattern Analysis\n\n' +
          result.insights
        );
      } else {
        alert(
          '❌ AI Generation Failed\n\n' +
          `Error: ${result.error}`
        );
      }
    } catch (error) {
      console.error('Pattern Analysis Error:', error);
      alert('❌ Unexpected Error\n\n' + error.message);
    } finally {
      setIsGeneratingAI(false);
      console.log('Pattern analysis complete');
    }
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
          <h2>📔 Reflections & Session History</h2>
          <p className="header-subtitle">Track your journey and generate AI insights</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-reflection-btn"
        >
          {showAddForm ? '✕ Cancel' : '➕ New Reflection'}
        </button>
      </div>

      {/* Ollama Status Indicator */}
      {ollamaStatus && (
        <div className={`ollama-status ${ollamaStatus.connected ? 'connected' : 'disconnected'}`}>
          <span className="status-icon">{ollamaStatus.connected ? '🟢' : '🔴'}</span>
          <span className="status-text">
            {ollamaStatus.connected 
              ? `AI Ready (${ollamaStatus.hasModel ? 'Model loaded' : 'Model missing'})` 
              : 'AI Offline - Start Ollama to enable'}
          </span>
        </div>
      )}

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

      {/* Session Overview Stats */}
      {sessionHistory.length > 0 && (
        <div className="session-overview">
          <h3>📊 Session Overview</h3>
          <div className="overview-grid">
            <div className="overview-card">
              <div className="overview-icon">🔥</div>
              <div className="overview-value">{stats.currentStreak}</div>
              <div className="overview-label">Streak</div>
            </div>
            <div className="overview-card">
              <div className="overview-icon">🎯</div>
              <div className="overview-value">{focusSessions}</div>
              <div className="overview-label">Focus Sessions</div>
            </div>
            <div className="overview-card">
              <div className="overview-icon">☕</div>
              <div className="overview-value">{breakSessions}</div>
              <div className="overview-label">Break Sessions</div>
            </div>
            <div className="overview-card">
              <div className="overview-icon">⏱️</div>
              <div className="overview-value">{totalFocusMinutes}</div>
              <div className="overview-label">Focus Minutes</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions History */}
      <div className="session-history-section">
        <h3>📝 Recent Sessions</h3>
        {sessionHistory.length === 0 ? (
          <div className="empty-sessions">
            <div className="empty-icon">📭</div>
            <p>No sessions yet!</p>
            <p className="empty-subtext">Complete a focus or break session to see it here</p>
          </div>
        ) : (
          <div className="sessions-list">
            {sessionHistory.slice(0, 15).map(session => (
              <div key={session.id} className={`session-item ${session.type}-session`}>
                <div className="session-icon-circle">
                  {session.type === 'focus' ? '🎯' : '☕'}
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
                  ✓
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Insights Placeholder */}
      {sessionHistory.length > 0 && (
        <div className="ai-insights-placeholder">
          <div className="ai-icon">🤖</div>
          <div className="ai-text">
            <strong>AI Pattern Analysis Available!</strong>
            <p>
              {ollamaStatus?.connected 
                ? `Generate insights from your ${sessionHistory.length} sessions and ${reflections.length} reflections.`
                : '⚠️ Ollama not connected. Start Ollama to enable AI features.'}
            </p>
          </div>
          <button 
            className="generate-insights-btn" 
            onClick={generatePatternAnalysis}
            disabled={isGeneratingAI || !ollamaStatus?.connected}
          >
            {isGeneratingAI ? '⏳ Generating...' : 'Generate AI Insights'}
          </button>
        </div>
      )}

      {/* Reflections List */}
      <div className="reflections-section">
        <h3>💭 Your Reflections</h3>
        {reflections.length === 0 ? (
          <div className="empty-reflections">
            <div className="empty-icon">📔</div>
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
                    {getMoodEmoji(reflection.mood)}
                  </div>
                </div>

                {/* Session Context */}
                <div className="reflection-context">
                  <span className="context-item">
                    📊 {reflection.sessionsAtTime} sessions completed
                  </span>
                  <span className="context-dot">•</span>
                  <span className="context-item">
                    ⏱️ {reflection.totalMinutesAtTime} total minutes
                  </span>
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

                {/* AI Summary Section */}
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
                        disabled={isGeneratingAI || !ollamaStatus?.connected}
                      >
                        {isGeneratingAI ? '⏳ Generating...' : 'Generate Summary'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="reflection-actions">
                  <button 
                    onClick={() => generateAISummary(reflection.id)}
                    className="action-btn-secondary"
                    disabled={isGeneratingAI || !ollamaStatus?.connected}
                  >
                    {isGeneratingAI ? '⏳ Generating...' : '🤖 AI Insights'}
                  </button>
                  <button 
                    onClick={() => deleteReflection(reflection.id)}
                    className="action-btn-danger"
                  >
                    🗑️ Delete
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