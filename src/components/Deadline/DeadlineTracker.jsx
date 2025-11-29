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
    // Trigger event for AI Insights Hub (General update)
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

  // --- MODIFIED FUNCTION ---
  const deleteDeadline = (id) => {
    // 1. Find the deadline before we delete it so we can send it to AI
    const completedDeadline = deadlines.find(d => d.id === id);

    // 2. Filter it out of the list
    const updatedDeadlines = deadlines.filter(d => d.id !== id);
    setDeadlines(updatedDeadlines);

    // 3. Dispatch event specifically for COMPLETION
    if (completedDeadline) {
      window.dispatchEvent(new CustomEvent('deadlineCompletedWithData', {
        detail: {
          deadline: completedDeadline,
          remainingDeadlines: updatedDeadlines
        }
      }));
    }
  };
  // -------------------------

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
      soon: '#06b6d4',
      normal: '#10b981'
    };
    return colors[urgency] || colors.normal;
  };

  const getStartSuggestion = (days) => {
    if (days < 0) return "Overdue! Take action now";
    if (days === 0) return "Due TODAY! Start immediately";
    if (days === 1) return "Due tomorrow! Work on this today";
    if (days <= 3) return `Start with 25 minutes today`;
    if (days <= 7) return `${days} days left - Break into small chunks`;
    return `${days} days left - Plan your approach`;
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
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Deadline Tracker
        </h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="add-deadline-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {showAddForm ? 'Cancel' : 'Add Deadline'}
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Save Deadline
          </button>
        </div>
      )}

      {/* Deadlines List */}
      <div className="deadlines-list">
        {sortedDeadlines.length === 0 ? (
          <div className="empty-deadlines">
            <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
            </svg>
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
                        stroke="#334155"
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                      </svg>
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
                    {deadline.priority === 'high' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {deadline.priority === 'medium' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="16" r="1" fill="currentColor"/>
                      </svg>
                    )}
                    {deadline.priority === 'low' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Done
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