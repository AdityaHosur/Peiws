import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CardLayout from '../components/CardLayout';
import Dashboard from './Dashboard';
import Login from './Login';
import Register from './Register';
import Upload from './Upload';
import Review from './Review';
import View from './View';
import Organization from './Organization';
import Profile from './Profile';

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  return (
    <div>
      <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      <CardLayout>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/auth" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/review" element={<Review />} />
          <Route path="/view" element={<View />} />
          <Route path="/organisation" element={<Organization />} />
          <Route path="/profile" element={<Profile />} />
          {/* Default route redirects to the Auth page */}
          <Route path="/" element={<Navigate to="/auth" />} />
        </Routes>
      </CardLayout>
    </div>
  );
};

export default Home;