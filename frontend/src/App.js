import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';  
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/*" element={<Home />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;