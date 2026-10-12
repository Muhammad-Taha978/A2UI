import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Interview from './pages/Interview';
import Evaluation from './pages/Evaluation';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm p-4">
          <div className="max-w-5xl mx-auto font-bold text-xl text-blue-600">
            BerryBot MVP
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-5xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/evaluation" element={<Evaluation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
