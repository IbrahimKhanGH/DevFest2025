import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FoodLogPage from './pages/FoodLogPage';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/food-log" element={<FoodLogPage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
