import './App.css';
import Timer from './components/Timer/Timer';
import TaskList from './components/TaskList/TaskList';
import DeadlineTracker from './components/Deadline/DeadlineTracker';
import Reflection from './components/Reflection/Reflection';
import AIInsightsHub from './components/AIInsightsHub/AIInsightsHub';

function App() {
  return (
    <div className="App">
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">🧠 ADHD Focus Bunny</h1>
          <p className="app-subtitle">Your friendly neighborhood ADHD companion</p>
        </header>
        
        {/* AI Insights Hub - Top of the page */}
        <AIInsightsHub />
        
        <main className="main-content">
          <div className="timer-column">
            <Timer />
            <DeadlineTracker />
          </div>
          
          <div className="tasklist-column">
            <TaskList />
            <Reflection />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;