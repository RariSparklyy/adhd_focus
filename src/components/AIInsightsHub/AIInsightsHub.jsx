import { useState, useEffect } from 'react';
import './AIInsightsHub.css';
import { generateComprehensiveInsights, testOllamaConnection } from '../../services/aiService';

function AIInsightsHub() {
  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoGenerate, setAutoGenerate] = useState(false);

  // Check Ollama status
  useEffect(() => {
    const checkOllama = async () => {
      const status = await testOllamaConnection();
      setOllamaStatus(status);
    };
    checkOllama();
  }, []);

  // Load saved insights
  useEffect(() => {
    const saved = localStorage.getItem('adhd-ai-insights');
    if (saved) {
      const data = JSON.parse(saved);
      setInsights(data.insights);
      setLastUpdated(data.timestamp);
    }
  }, []);

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
        setInsights(result.insights);
        const timestamp = new Date().toLocaleString();
        setLastUpdated(timestamp);

        // Save to localStorage
        localStorage.setItem('adhd-ai-insights', JSON.stringify({
          insights: result.insights,
          timestamp: timestamp
        }));
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

  return (
    <div className="ai-insights-hub">
      <div className="hub-header">
        <div className="hub-title-section">
          <h2>🤖 AI Insights Hub</h2>
          <p className="hub-subtitle">Personalized productivity analysis</p>
        </div>
        <div className="hub-controls">
          <label className="auto-generate-toggle">
            <input
              type="checkbox"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
            />
            <span>Auto-generate on updates</span>
          </label>
          <button
            onClick={generateInsights}
            className="generate-hub-btn"
            disabled={isGenerating || !ollamaStatus?.connected}
          >
            {isGenerating ? '⏳ Analyzing...' : '🔄 Generate Insights'}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="hub-status-bar">
        <div className={`status-indicator ${ollamaStatus?.connected ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          <span>{ollamaStatus?.connected ? 'AI Online' : 'AI Offline'}</span>
        </div>
        {lastUpdated && (
          <div className="last-updated">
            Last updated: {lastUpdated}
          </div>
        )}
      </div>

      {/* Insights Display */}
      <div className="insights-content">
        {!insights && !isGenerating && (
          <div className="insights-empty">
            <div className="empty-icon">🧠</div>
            <h3>No insights yet</h3>
            <p>Click "Generate Insights" to analyze your productivity data</p>
          </div>
        )}

        {isGenerating && (
          <div className="insights-loading">
            <div className="loading-spinner"></div>
            <p>Analyzing your productivity data...</p>
          </div>
        )}

        {insights && !isGenerating && (
          <div className="insights-display">
            <div className="insights-icon">💡</div>
            <div className="insights-text">{insights}</div>
          </div>
        )}
      </div>

      {/* Data Sources */}
      <div className="data-sources">
        <h4>Data Sources:</h4>
        <div className="sources-grid">
          <div className="source-item">⏱️ Focus Sessions</div>
          <div className="source-item">📝 Tasks</div>
          <div className="source-item">⏰ Deadlines</div>
          <div className="source-item">📔 Reflections</div>
        </div>
      </div>
    </div>
  );
}

export default AIInsightsHub;