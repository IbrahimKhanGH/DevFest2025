import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FoodLogPage from './pages/FoodLogPage';
import CallInProgress from './pages/CallInProgress';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/call-in-progress" element={<CallInProgress />} />
        <Route path="/food-log" element={<FoodLogPage />} />
      </Routes>
    </Router>
  );
}

export default App;
