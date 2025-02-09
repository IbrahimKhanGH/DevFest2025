import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FoodLogPage from './pages/FoodLogPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/food-log" element={<FoodLogPage />} />
      </Routes>
    </Router>
  );
}

export default App;
