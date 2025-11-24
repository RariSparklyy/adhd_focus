import { useState, useEffect } from 'react';
import './DeadlineTracker.css';

function DeadlineTracker() {
  const [deadlines, setDeadlines] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeadline, setNewDeadline] = useState({
    title: '',
    dueDate: '',
    priority: 'medium'
  });

  // Load deadlines from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('adhd-deadlines');
    if (saved) {
      setDeadlines(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage and trigger event whenever deadlines change
  useEffect(() => {
    localStorage.setItem('adhd-deadlines', JSON.stringify(deadlines));
    // Trigger event for AI Insights Hub
    window.dispatchEvent(new Event('deadlineUpdated'));
  }, [deadlines]);

  const addDeadline = () => {
    if (!newDeadline.title || !newDeadline.dueDate) return;

    const deadline = {
      id: Date.now(),
      ...newDeadline,
      createdAt: new Date().toISOString()
    };

    const updatedDeadlines = [...deadlines, deadline];
    setDeadlines(updatedDeadlines);
    
    // Trigger event with deadline data for AI Insights Hub
    window.dispatchEvent(new CustomEvent('deadlineAddedWithData', {
      detail: {
        deadline: deadline,
        allDeadlines: updatedDeadlines
      }
    }));
    
    setNewDeadline({ title: '', dueDate: '', priority: 'medium' });
    setShowAddForm(false);
  };

  const deleteDeadline = (id) => {
    setDeadlines(deadlines.filter(d => d.id !== id));
  };

  const calculateTimeLeft = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: diffDays,
      isOverdue: diffDays < 0,
      isToday: diffDays === 0,
      isTomorrow: diffDays === 1,
      isThisWeek: diffDays <= 7 && diffDays > 0
    };
  };

  const getUrgencyLevel = (timeLeft) => {
    if (timeLeft.isOverdue) return 'overdue';
    if (timeLeft.isToday) return 'critical';
    if (timeLeft.isTomorrow) return 'urgent';
    if (timeLeft.isThisWeek) return 'soon';
    return 'normal';
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      overdue: '#ef4444',
      critical: '#f59e0b',
      urgent: '#f97316',
      soon: '#3b82f6',
      normal: '#10b981'
    };
    return colors[urgency] || colors.normal;
  };

  const getStartSuggestion = (days) => {
    if (days < 0) return "⚠️ Overdue! Take action now";
    if (days === 0) return "🚨 Due TODAY! Start immediately";
    if (days === 1) return "⏰ Due tomorrow! Work on this today";
    if (days <= 3) return `🎯 Start with 25 minutes today`;
    if (days <= 7) return `📅 ${days} days left - Break into small chunks`;
    return `✅ ${days} days left - Plan your approach`;
  };

  // Sort by urgency
  const sortedDeadlines = [...deadlines].sort((a, b) => {
    const timeA = calculateTimeLeft(a.dueDate);
    const timeB = calculateTimeLeft(b.dueDate);
    return timeA.days - timeB.days;
  });

  return (
    <div className="deadline-tracker">
      <div className="deadline-header">
        <h2>⏰ Deadline Radar</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-deadline-btn"
        >
          {showAddForm ? '✕ Cancel' : '➕ Add Deadline'}
        </button>
      </div>

      {/* Add Deadline Form */}
      {showAddForm && (
        <div className="add-form">
          <input
            type="text"
            placeholder="What's the task?"
            value={newDeadline.title}
            onChange={(e) => setNewDeadline({...newDeadline, title: e.target.value})}
            className="deadline-input"
          />
          <input
            type="date"
            value={newDeadline.dueDate}
            onChange={(e) => setNewDeadline({...newDeadline, dueDate: e.target.value})}
            className="deadline-input"
          />
          <select
            value={newDeadline.priority}
            onChange={(e) => setNewDeadline({...newDeadline, priority: e.target.value})}
            className="priority-select"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <button onClick={addDeadline} className="save-deadline-btn">
            💾 Save Deadline
          </button>
        </div>
      )}

      {/* Deadlines List */}
      <div className="deadlines-list">
        {sortedDeadlines.length === 0 ? (
          <div className="empty-deadlines">
            <div className="empty-icon">📅</div>
            <p>No deadlines yet!</p>
            <p className="empty-subtext">Add one to stay on track</p>
          </div>
        ) : (
          sortedDeadlines.map(deadline => {
            const timeLeft = calculateTimeLeft(deadline.dueDate);
            const urgency = getUrgencyLevel(timeLeft);
            const urgencyColor = getUrgencyColor(urgency);

            return (
              <div 
                key={deadline.id} 
                className={`deadline-card ${urgency}`}
                style={{ borderLeftColor: urgencyColor }}
              >
                <div className="deadline-main">
                  {/* Visual Time Ring */}
                  <div className="time-ring-small">
                    <svg width="60" height="60">
                      <circle
                        cx="30"
                        cy="30"
                        r="26"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r="26"
                        fill="none"
                        stroke={urgencyColor}
                        strokeWidth="4"
                        strokeDasharray={`${2 * Math.PI * 26}`}
                        strokeDashoffset={`${2 * Math.PI * 26 * (Math.max(0, timeLeft.days) / 30)}`}
                        transform="rotate(-90 30 30)"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="days-number" style={{ color: urgencyColor }}>
                      {timeLeft.isOverdue ? '!' : Math.abs(timeLeft.days)}
                    </div>
                  </div>

                  {/* Deadline Info */}
                  <div className="deadline-info">
                    <div className="deadline-title">{deadline.title}</div>
                    <div className="deadline-date">
                      Due: {new Date(deadline.dueDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="deadline-suggestion">
                      {getStartSuggestion(timeLeft.days)}
                    </div>
                  </div>

                  {/* Priority Badge */}
                  <div className={`priority-badge priority-${deadline.priority}`}>
                    {deadline.priority === 'high' && '🔥'}
                    {deadline.priority === 'medium' && '⚡'}
                    {deadline.priority === 'low' && '📌'}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="deadline-progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${Math.max(0, Math.min(100, ((30 - timeLeft.days) / 30) * 100))}%`,
                      backgroundColor: urgencyColor
                    }}
                  />
                </div>

                {/* Actions */}
                <button 
                  onClick={() => deleteDeadline(deadline.id)}
                  className="delete-deadline-btn"
                >
                  ✓ Done
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DeadlineTracker;