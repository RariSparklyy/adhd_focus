import './App.css';
import Timer from './components/Timer/Timer';
import TaskList from './components/TaskList/TaskList';

function App() {
  return (
    <div className="App">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">🧠 ADHD Study Timer</h1>
          <p className="app-subtitle">Your friendly focus companion</p>
        </header>
        
        <main className="main-content">
          <div className="timer-column">
            <Timer />
          </div>
          
          <div className="tasklist-column">
            <TaskList />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;