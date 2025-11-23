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
      alert('Ollama is not connected. Please start Ollama to use AI features.');
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

        alert(`✅ Task Breakdown Generated!\n\n${result.steps.length} steps created.`);
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

  return (
    <div className="tasklist-container">
      <div className="tasklist-header">
        <h2>📝 Your Tasks</h2>
        <p className="task-count">
          {tasks.filter(t => !t.completed).length} active • {tasks.filter(t => t.completed).length} completed
        </p>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-content">
            <div className="celebration-emoji">🎉</div>
            <div className="celebration-text">Great job!</div>
          </div>
        </div>
      )}

      {/* Current Task Display */}
      {currentTask && (
        <div className="current-task-banner">
          <div className="current-task-label">🎯 Currently Working On:</div>
          <div className="current-task-text">{currentTask.text}</div>
        </div>
      )}

      {/* Add Task Input */}
      <div className="add-task-section">
        <div className="input-with-colors">
          <input
            type="text"
            placeholder="What do you need to focus on? 🚀"
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
          ➕ Add Task
        </button>
      </div>

      {/* Task List */}
      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">📋</p>
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
                  <div className="task-meta">{task.createdAt}</div>
                  
                  {/* AI Breakdown Display */}
                  {task.aiBreakdown && task.aiBreakdown.length > 0 && (
                    <div className="ai-breakdown-section">
                      <div className="breakdown-header">
                        <span className="breakdown-icon">🤖</span>
                        <span className="breakdown-title">AI Breakdown:</span>
                      </div>
                      <ol className="breakdown-steps">
                        {task.aiBreakdown.map((step, index) => (
                          <li key={index} className="breakdown-step">{step}</li>
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
                    🎯 Work
                  </button>
                )}
                <button
                  onClick={() => getAIBreakdown(task.id)}
                  className="action-btn ai-btn"
                  title="Get AI breakdown"
                  disabled={isGeneratingBreakdown || !ollamaStatus?.connected}
                >
                  {isGeneratingBreakdown ? '⏳' : '🤖'} AI
                </button>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="action-btn delete-btn"
                  title="Delete task"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Visual Progress Summary */}
      {tasks.length > 0 && (
        <div className="visual-progress-section">
          <h3>📈 Your Progress</h3>
          
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
              <div className="stat-mini-icon">📋</div>
              <div className="stat-mini-value">{tasks.length}</div>
              <div className="stat-mini-label">Total</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-icon">✅</div>
              <div className="stat-mini-value">{tasks.filter(t => t.completed).length}</div>
              <div className="stat-mini-label">Done</div>
            </div>
            <div className="stat-mini">
              <div className="stat-mini-icon">⏳</div>
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