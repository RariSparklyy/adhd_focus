import { useState, useEffect } from 'react';
import './TaskList.css';
import { generateTaskBreakdown, testOllamaConnection } from '../../services/aiService';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [currentTask, setCurrentTask] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedColor, setSelectedColor] = useState('purple');
  const [isGeneratingBreakdown, setIsGeneratingBreakdown] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('adhd-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage and trigger event
  useEffect(() => {
    localStorage.setItem('adhd-tasks', JSON.stringify(tasks));
    // Trigger event for AI Insights Hub
    window.dispatchEvent(new Event('taskUpdated'));
  }, [tasks]);

  // Check Ollama connection
  useEffect(() => {
    const checkOllama = async () => {
      const status = await testOllamaConnection();
      setOllamaStatus(status);
    };
    checkOllama();
  }, []);

  // Add a new task
  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      createdAt: new Date().toLocaleString(),
      aiBreakdown: null,
      color: selectedColor
    };
    
    setTasks([...tasks, task]);
    setNewTask('');
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // Toggle task completion
  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    
    // If completing a task, show celebration
    if (!task.completed) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    if (currentTask?.id === id) {
      setCurrentTask(null);
    }
  };

  // Set as current working task
  const setAsCurrentTask = (task) => {
    setCurrentTask(task);
  };

  // Get AI breakdown
  const getAIBreakdown = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;

    if (!ollamaStatus?.connected) {
      alert('Milky is not connected. Please start Ollama to use AI features.');
      return;
    }

    setIsGeneratingBreakdown(true);

    try {
      const result = await generateTaskBreakdown(task.text);

      if (result.success && result.steps.length > 0) {
        // Update task with AI breakdown
        const updatedTasks = tasks.map(t =>
          t.id === taskId ? { ...t, aiBreakdown: result.steps } : t
        );
        setTasks(updatedTasks);

        alert(`✓ Task Breakdown Generated!\n\n${result.steps.length} steps created by Milky.`);
      } else {
        alert('Failed to generate task breakdown. Please try again.');
      }
    } catch (error) {
      console.error('Task breakdown error:', error);
      alert('An error occurred while generating the breakdown.');
    } finally {
      setIsGeneratingBreakdown(false);
    }
  };

  // Format bold text from markdown
  const formatBoldText = (text) => {
    // Convert **text** to <strong>text</strong>
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  };

  return (
    <div className="tasklist-container">
      <div className="tasklist-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12V19C21 19.5304 20.7893 21.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Your Tasks
        </h2>
        <p className="task-count">
          {tasks.filter(t => !t.completed).length} active • {tasks.filter(t => t.completed).length} completed
        </p>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <svg className="celebration-emoji" width="128" height="128" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="celebration-text">Great job!</div>
          </div>
        </div>
      )}

      {/* Current Task Display */}
      {currentTask && (
        <div className="current-task-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
          <div className="current-task-content">
            <div className="current-task-label">Currently Working On:</div>
            <div className="current-task-text">{currentTask.text}</div>
          </div>
        </div>
      )}

      {/* Add Task Input */}
      <div className="add-task-section">
        <div className="input-with-colors">
          <input
            type="text"
            placeholder="What do you need to focus on?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={handleKeyPress}
            className="task-input"
          />
          <div className="color-picker">
            {['purple', 'blue', 'green', 'orange', 'pink'].map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`color-btn color-${color} ${selectedColor === color ? 'selected' : ''}`}
                title={color}
              />
            ))}
          </div>
        </div>
        <button onClick={addTask} className="add-task-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Task
        </button>
      </div>

      {/* Task List */}
      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="empty-text">No tasks yet! Add one above to get started.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`task-item task-color-${task.color} ${task.completed ? 'completed' : ''} ${currentTask?.id === task.id ? 'current' : ''}`}
            >
              <div className="task-main">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="task-checkbox"
                />
                <div className="task-content">
                  <div className="task-text">{task.text}</div>
                  <div className="task-meta">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    {task.createdAt}
                  </div>
                  
                  {/* AI Breakdown Display */}
                  {task.aiBreakdown && task.aiBreakdown.length > 0 && (
                    <div className="ai-breakdown-section">
                      <div className="breakdown-header">
                        <svg className="breakdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
                          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <span className="breakdown-title">Milky's Breakdown:</span>
                      </div>
                      <ol className="breakdown-steps">
                        {task.aiBreakdown.map((step, index) => (
                          <li 
                            key={index} 
                            className="breakdown-step"
                            dangerouslySetInnerHTML={{ __html: formatBoldText(step) }}
                          ></li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              <div className="task-actions">
                {!task.completed && currentTask?.id !== task.id && (
                  <button
                    onClick={() => setAsCurrentTask(task)}
                    className="action-btn work-btn"
                    title="Set as current task"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                    Work
                  </button>
                )}
                <button
                  onClick={() => getAIBreakdown(task.id)}
                  className="action-btn ai-btn"
                  title="Get AI breakdown from Milky"
                  disabled={isGeneratingBreakdown || !ollamaStatus?.connected}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {isGeneratingBreakdown ? '...' : 'AI'}
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="action-btn delete-btn"
                  title="Delete task"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Visual Progress Summary */}
      {tasks.length > 0 && (
        <div className="visual-progress-section">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V16C3 16.5304 3.21071 17.0391 3.58579 17.4142C3.96086 17.7893 4.46957 18 5 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 9L12 15L9 12L3 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Your Progress
          </h3>
          
          {/* Overall Progress Bar */}
          <div className="progress-bar-container">
            <div className="progress-bar-label">
              <span>Overall Completion</span>
              <span className="progress-percentage">
                {Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%
              </span>
            </div>
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill"
                style={{ 
                  width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Stats with Icons */}
          <div className="stats-mini-grid">
            <div className="stat-mini">
              <svg className="stat-mini-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className="stat-mini-value">{tasks.length}</div>
              <div className="stat-mini-label">Total</div>
            </div>
            <div className="stat-mini">
              <svg className="stat-mini-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="stat-mini-value">{tasks.filter(t => t.completed).length}</div>
              <div className="stat-mini-label">Done</div>
            </div>
            <div className="stat-mini">
              <svg className="stat-mini-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className="stat-mini-value">{tasks.filter(t => !t.completed).length}</div>
              <div className="stat-mini-label">Active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskList;