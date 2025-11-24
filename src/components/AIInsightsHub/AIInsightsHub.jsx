import { useState, useEffect, useRef } from 'react';
import './AIInsightsHub.css';
import { generateComprehensiveInsights, generateDeadlineReminders, testOllamaConnection } from '../../services/aiService';

function AIInsightsHub() {
  const [updates, setUpdates] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const lastDeadlineCheck = useRef(Date.now());
  const deadlineReminderInterval = useRef(null);

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

  // Deadline reminder system - checks based on urgency
  useEffect(() => {
    if (!ollamaStatus?.connected) return;

    const checkDeadlineReminders = async () => {
      const deadlines = JSON.parse(localStorage.getItem('adhd-deadlines') || '[]');
      if (deadlines.length === 0) return;

      const now = new Date();
      
      // Calculate urgency levels
      const urgencyLevels = deadlines.map(d => {
        const dueDate = new Date(d.dueDate);
        const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { deadline: d, urgency: 'overdue', days: diffDays };
        if (diffDays <= 2) return { deadline: d, urgency: 'urgent', days: diffDays };
        if (diffDays <= 7) return { deadline: d, urgency: 'soon', days: diffDays };
        return null;
      }).filter(Boolean);

      if (urgencyLevels.length === 0) return;

      // Determine check frequency based on most urgent deadline
      const mostUrgent = urgencyLevels[0];
      let checkInterval;
      
      if (mostUrgent.urgency === 'overdue') {
        checkInterval = 30 * 60 * 1000; // Every 30 minutes for overdue
      } else if (mostUrgent.urgency === 'urgent') {
        checkInterval = 60 * 60 * 1000; // Every hour for urgent (≤2 days)
      } else {
        checkInterval = 4 * 60 * 60 * 1000; // Every 4 hours for soon (3-7 days)
      }

      const timeSinceLastCheck = Date.now() - lastDeadlineCheck.current;
      
      if (timeSinceLastCheck >= checkInterval) {
        await generateDeadlineReminderUpdate(deadlines);
        lastDeadlineCheck.current = Date.now();
      }
    };

    // Initial check
    checkDeadlineReminders();

    // Set up periodic checking
    deadlineReminderInterval.current = setInterval(checkDeadlineReminders, 15 * 60 * 1000); // Check every 15 minutes

    return () => {
      if (deadlineReminderInterval.current) {
        clearInterval(deadlineReminderInterval.current);
      }
    };
  }, [ollamaStatus]);

  // Generate deadline reminder update
  const generateDeadlineReminderUpdate = async (deadlines) => {
    try {
      const result = await generateDeadlineReminders(deadlines);

      if (result.success && result.reminders) {
        const newUpdate = {
          id: Date.now(),
          content: result.reminders,
          timestamp: new Date().toLocaleString(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          type: 'deadline-reminder',
          urgencyLevel: result.urgencyLevel || 'normal'
        };

        setUpdates([newUpdate, ...updates].slice(0, 10));
      }
    } catch (error) {
      console.error('Deadline reminder error:', error);
    }
  };

  // Listen for data updates from other components
  useEffect(() => {
    const handleDataUpdate = () => {
      if (autoGenerate && ollamaStatus?.connected) {
        generateInsights();
      }
    };

    window.addEventListener('sessionCompleted', handleDataUpdate);
    window.addEventListener('taskUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('sessionCompleted', handleDataUpdate);
      window.removeEventListener('taskUpdated', handleDataUpdate);
    };
  }, [autoGenerate, ollamaStatus]);

  // Listen for deadline events with data
  useEffect(() => {
    const handleDeadlineAdded = async (event) => {
      if (event.detail && ollamaStatus?.connected) {
        const { deadline, allDeadlines } = event.detail;
        await generateDeadlineInsight(deadline, allDeadlines);
      }
    };

    window.addEventListener('deadlineAddedWithData', handleDeadlineAdded);

    return () => {
      window.removeEventListener('deadlineAddedWithData', handleDeadlineAdded);
    };
  }, [ollamaStatus, updates]);

  // Generate insights specifically from a deadline
  const generateDeadlineInsight = async (deadline, allDeadlines) => {
    if (!ollamaStatus?.connected) {
      return;
    }

    setIsGenerating(true);

    try {
      const { generateDeadlineInsights } = await import('../../services/aiService');
      
      const result = await generateDeadlineInsights(deadline, allDeadlines);

      if (result.success) {
        const newUpdate = {
          id: Date.now(),
          content: result.insights,
          timestamp: new Date().toLocaleString(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          type: 'deadline',
          deadlineTitle: deadline.title,
          priority: deadline.priority
        };

        setUpdates([newUpdate, ...updates].slice(0, 10));
      }
    } catch (error) {
      console.error('Deadline insight error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate insights specifically from a reflection
  const generateReflectionInsight = async (reflectionData, sessionHistory) => {
    if (!ollamaStatus?.connected) {
      return;
    }

    setIsGenerating(true);

    try {
      const { generateReflectionInsights } = await import('../../services/aiService');
      
      const result = await generateReflectionInsights(reflectionData, sessionHistory);

      if (result.success) {
        const newUpdate = {
          id: Date.now(),
          content: result.summary,
          timestamp: new Date().toLocaleString(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          type: 'reflection',
          mood: reflectionData.mood
        };

        setUpdates([newUpdate, ...updates].slice(0, 10));
      }
    } catch (error) {
      console.error('Reflection insight error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Listen for reflection events with data
  useEffect(() => {
    const handleReflectionAdded = (event) => {
      if (event.detail && ollamaStatus?.connected) {
        const { reflection, sessionHistory } = event.detail;
        generateReflectionInsight(reflection, sessionHistory);
      }
    };

    window.addEventListener('reflectionAddedWithData', handleReflectionAdded);

    return () => {
      window.removeEventListener('reflectionAddedWithData', handleReflectionAdded);
    };
  }, [ollamaStatus, updates]);

  const generateInsights = async () => {
    if (!ollamaStatus?.connected) {
      alert('Ollama is not connected. Please start Ollama.');
      return;
    }

    setIsGenerating(true);

    try {
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
        const newUpdate = {
          id: Date.now(),
          content: result.insights,
          timestamp: new Date().toLocaleString(),
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          type: 'comprehensive'
        };

        setUpdates([newUpdate, ...updates].slice(0, 10));
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

  // Format bold text from markdown
  const formatBoldText = (text) => {
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  };

  // Get mood emoji
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

  // Get priority emoji
  const getPriorityEmoji = (priority) => {
    const emojis = {
      high: '🔥',
      medium: '⚡',
      low: '📌'
    };
    return emojis[priority] || '📌';
  };

  // Get update type icon
  const getUpdateIcon = (update) => {
    if (update.type === 'reflection') return '📔';
    if (update.type === 'deadline') return '⏰';
    if (update.type === 'deadline-reminder') {
      if (update.urgencyLevel === 'overdue') return '🚨';
      if (update.urgencyLevel === 'urgent') return '⚠️';
      return '📅';
    }
    return '💡';
  };

  return (
    <div className="ai-insights-hub">
      <div className="hub-header">
        <div className="hub-title-section">
          <h2>🤖 AI Insights Hub</h2>
          <p className="hub-subtitle">Your productivity update log with deadline tracking</p>
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
            <p>Complete a reflection, add a deadline, or click "New Update" to get AI insights</p>
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
          <div 
            key={update.id} 
            className={`update-card ${index === 0 ? 'latest' : ''} ${update.type}-update ${update.urgencyLevel ? `urgency-${update.urgencyLevel}` : ''}`}
          >
            <div className="update-header">
              <span className="update-icon">{getUpdateIcon(update)}</span>
              <div className="update-meta">
                <span className="update-date">{update.date}</span>
                <span className="update-time">{update.time}</span>
              </div>
              {index === 0 && <span className="latest-badge">Latest</span>}
              {update.type === 'reflection' && (
                <span className="reflection-badge">{getMoodEmoji(update.mood)}</span>
              )}
              {update.type === 'deadline' && (
                <span className="priority-badge">{getPriorityEmoji(update.priority)}</span>
              )}
              {update.type === 'deadline-reminder' && update.urgencyLevel === 'overdue' && (
                <span className="urgency-badge overdue-badge">Overdue</span>
              )}
              {update.type === 'deadline-reminder' && update.urgencyLevel === 'urgent' && (
                <span className="urgency-badge urgent-badge">Urgent</span>
              )}
            </div>
            {update.deadlineTitle && (
              <div className="update-subtitle">
                📝 {update.deadlineTitle}
              </div>
            )}
            <div className="update-body">
              <p className="update-content" dangerouslySetInnerHTML={{ __html: formatBoldText(update.content) }}></p>
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