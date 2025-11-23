import { useState, useEffect } from 'react';
import './AIInsightsHub.css';
import { generateComprehensiveInsights, testOllamaConnection } from '../../services/aiService';

function AIInsightsHub() {
  const [updates, setUpdates] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [autoGenerate, setAutoGenerate] = useState(false);

  // Check Ollama status
  useEffect(() => {
    const checkOllama = async () => {
      const status = await testOllamaConnection();
      setOllamaStatus(status);
    };
    checkOllama();
  }, []);

  // Load saved updates
  useEffect(() => {
    const saved = localStorage.getItem('adhd-ai-updates');
    if (saved) {
      setUpdates(JSON.parse(saved));
    }
  }, []);

  // Save updates whenever they change
  useEffect(() => {
    localStorage.setItem('adhd-ai-updates', JSON.stringify(updates));
  }, [updates]);

  // Listen for data updates from other components
  useEffect(() => {
    const handleDataUpdate = () => {
      if (autoGenerate && ollamaStatus?.connected) {
        generateInsights();
      }
    };

    window.addEventListener('sessionCompleted', handleDataUpdate);
    window.addEventListener('taskUpdated', handleDataUpdate);
    window.addEventListener('deadlineUpdated', handleDataUpdate);
    window.addEventListener('reflectionAdded', handleDataUpdate);

    return () => {
      window.removeEventListener('sessionCompleted', handleDataUpdate);
      window.removeEventListener('taskUpdated', handleDataUpdate);
      window.removeEventListener('deadlineUpdated', handleDataUpdate);
      window.removeEventListener('reflectionAdded', handleDataUpdate);
    };
  }, [autoGenerate, ollamaStatus]);

  const generateInsights = async () => {
    if (!ollamaStatus?.connected) {
      alert('Ollama is not connected. Please start Ollama.');
      return;
    }

    setIsGenerating(true);

    try {
      // Gather all data from localStorage
      const sessions = JSON.parse(localStorage.getItem('adhd-timer-history') || '[]');
      const tasks = JSON.parse(localStorage.getItem('adhd-tasks') || '[]');
      const deadlines = JSON.parse(localStorage.getItem('adhd-deadlines') || '[]');
      const reflections = JSON.parse(localStorage.getItem('adhd-reflections') || '[]');
      const stats = JSON.parse(localStorage.getItem('adhd-timer-stats') || '{}');

      const allData = {
        sessions,
        tasks,
        deadlines,
        reflections,
        stats
      };

      const result = await generateComprehensiveInsights(allData);

      if (result.success) {
        // Create new update
        const newUpdate = {
          id: Date.now(),
          content: result.insights,
          timestamp: new Date().toLocaleString(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString()
        };

        // Add to beginning of array, keep only last 5
        setUpdates([newUpdate, ...updates].slice(0, 5));
      } else {
        alert(`Failed to generate insights: ${result.error}`);
      }
    } catch (error) {
      console.error('Insights generation error:', error);
      alert('An error occurred while generating insights.');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearUpdates = () => {
    if (window.confirm('Clear all AI updates?')) {
      setUpdates([]);
      localStorage.removeItem('adhd-ai-updates');
    }
  };

  return (
    <div className="ai-insights-hub">
      <div className="hub-header">
        <div className="hub-title-section">
          <h2>🤖 AI Insights Hub</h2>
          <p className="hub-subtitle">Your productivity update log</p>
        </div>
        <div className="hub-controls">
          <label className="auto-generate-toggle">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
            />
            <span>Auto-update</span>
          </label>
          <button
            onClick={generateInsights}
            className="generate-hub-btn"
            disabled={isGenerating || !ollamaStatus?.connected}
          >
            {isGenerating ? '⏳ Analyzing...' : '🔄 New Update'}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="hub-status-bar">
        <div className={`status-indicator ${ollamaStatus?.connected ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          <span>{ollamaStatus?.connected ? 'AI Online' : 'AI Offline'}</span>
        </div>
        {updates.length > 0 && (
          <button onClick={clearUpdates} className="clear-btn">
            🗑️ Clear All
          </button>
        )}
      </div>

      {/* Updates Feed */}
      <div className="updates-feed">
        {updates.length === 0 && !isGenerating && (
          <div className="feed-empty">
            <div className="empty-icon">📊</div>
            <h3>No updates yet</h3>
            <p>Click "New Update" to get AI insights on your productivity</p>
          </div>
        )}

        {isGenerating && (
          <div className="update-card generating">
            <div className="update-header">
              <div className="loading-pulse"></div>
              <span className="update-status">Generating update...</span>
            </div>
            <div className="update-body">
              <div className="loading-spinner-small"></div>
              <p>Analyzing your productivity data...</p>
            </div>
          </div>
        )}

        {updates.map((update, index) => (
          <div key={update.id} className={`update-card ${index === 0 ? 'latest' : ''}`}>
            <div className="update-header">
              <span className="update-icon">💡</span>
              <div className="update-meta">
                <span className="update-date">{update.date}</span>
                <span className="update-time">{update.time}</span>
              </div>
              {index === 0 && <span className="latest-badge">Latest</span>}
            </div>
            <div className="update-body">
              <p className="update-content">{update.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Data Sources Footer */}
      <div className="hub-footer">
        <span className="footer-label">Data sources:</span>
        <div className="sources-tags">
          <span className="source-tag">⏱️ Sessions</span>
          <span className="source-tag">📝 Tasks</span>
          <span className="source-tag">⏰ Deadlines</span>
          <span className="source-tag">📔 Reflections</span>
        </div>
      </div>
    </div>
  );
}

export default AIInsightsHub;