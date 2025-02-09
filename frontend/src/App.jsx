import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FoodLogPage from './pages/FoodLogPage';
import CallInProgress from './pages/CallInProgress';
import Recipes from './pages/Recipes';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/call-in-progress" element={<CallInProgress />} />
        <Route path="/food-log" element={<FoodLogPage />} />
        <Route path="/recipes" element={<Recipes />} />
      </Routes>
    </Router>
  );
}

export default App;
