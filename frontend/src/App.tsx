import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import AddCandidate from './components/AddCandidateForm';
import PositionDetail from './components/PositionDetail';
import Positions from './components/Positions';
import RecruiterDashboard from './components/RecruiterDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RecruiterDashboard />} />
        <Route path="/add-candidate" element={<AddCandidate />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/position/:positionId" element={<PositionDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
