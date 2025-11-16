import { useState } from 'react';
import './TaskList.css';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [currentTask, setCurrentTask] = useState(null);

  // Add a new task
  const addTask = () => {
    if (newTask.trim() === '') return;
    
    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      createdAt: new Date().toLocaleString(),
      aiBreakdown: null // Placeholder for AI feature later
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

  // Get AI breakdown (placeholder for later)
  const getAIBreakdown = (taskId) => {
    alert('AI Task Breakdown feature will be added later! 🤖');
  };

  return (
    <div className="tasklist-container">
      <div className="tasklist-header">
        <h2>📝 Your Tasks</h2>
        <p className="task-count">
          {tasks.filter(t => !t.completed).length} active • {tasks.filter(t => t.completed).length} completed
        </p>
      </div>

      {/* Current Task Display */}
      {currentTask && (
        <div className="current-task-banner">
          <div className="current-task-label">🎯 Currently Working On:</div>
          <div className="current-task-text">{currentTask.text}</div>
        </div>
      )}

      {/* Add Task Input */}
      <div className="add-task-section">
        <input
          type="text"
          placeholder="What do you need to focus on? 🚀"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyPress={handleKeyPress}
          className="task-input"
        />
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
              className={`task-item ${task.completed ? 'completed' : ''} ${currentTask?.id === task.id ? 'current' : ''}`}
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
                  title="Get AI breakdown (coming soon)"
                >
                  🤖 AI
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

      {/* Task Summary */}
      {tasks.length > 0 && (
        <div className="task-summary">
          <div className="summary-item">
            <span className="summary-label">Total Tasks:</span>
            <span className="summary-value">{tasks.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Progress:</span>
            <span className="summary-value">
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskList;