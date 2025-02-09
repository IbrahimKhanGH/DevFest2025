import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FoodLogPage from './pages/FoodLogPage';
import { UserProvider } from './context/UserContext';
import Recipes from './pages/Recipes';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/food-log" element={<FoodLogPage />} />
          <Route path="/recipes" element={<Recipes />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
