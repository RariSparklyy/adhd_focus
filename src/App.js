import './App.css';
import Timer from './components/Timer/Timer';
import TaskList from './components/TaskList/TaskList';
import Progress from './components/Progress/Progress';
import DeadlineTracker from './components/Deadline/DeadlineTracker';
import Reflection from './components/Reflection/Reflection';

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
            <DeadlineTracker />
          </div>
          
          <div className="tasklist-column">
            <TaskList />
            <Reflection />
            <Progress />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;