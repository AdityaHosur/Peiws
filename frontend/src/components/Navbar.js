import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import './Navbar.css';

const Navbar = ({ toggleTheme, isDarkMode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLinkText, setAuthLinkText] = useState('Login');
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Check authentication status when component mounts or location changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    // Update the auth link text based on current route
    if (location.pathname === '/register') {
      setAuthLinkText('Login');
    } else if (location.pathname === '/auth') {
      setAuthLinkText('Register');
    } else if (isAuthenticated) {
      setAuthLinkText('Logout');
    }
  }, [location.pathname, isAuthenticated]);

  const handleAuthClick = (e) => {
    e.preventDefault();
    
    if (isAuthenticated) {
      // Handle logout
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      navigate('/auth');
      showToast('You have been logged out successfully', 'success');
    } else if (location.pathname === '/register') {
      // If on register page, go to login
      navigate('/auth');
    } else {
      // If on login page or elsewhere, go to register
      navigate('/register');
    }
  };

  // Handle protected route clicks
  const handleProtectedLink = (e, path) => {
    if (!isAuthenticated) {
      e.preventDefault();
      showToast('Please log in to access this feature', 'error');
      navigate('/auth');
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-title">Peiws</div>
      <div className="navbar-links">
        <a href="#" onClick={handleAuthClick}>{authLinkText}</a>
        
        {/* Protected routes with authentication check */}
        <a href="#" onClick={(e) => handleProtectedLink(e, '/dashboard')}>Dashboard</a>
        <a href="#" onClick={(e) => handleProtectedLink(e, '/upload')}>Upload</a>
        <a href="#" onClick={(e) => handleProtectedLink(e, '/review')}>Review</a>
        <a href="#" onClick={(e) => handleProtectedLink(e, '/view')}>View</a>
        <a href="#" onClick={(e) => handleProtectedLink(e, '/organisation')}>Organisation</a>
        <a href="#" onClick={(e) => handleProtectedLink(e, '/profile')}>Profile</a>
      </div>
      <button className="theme-toggle" onClick={toggleTheme}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </nav>
  );
};

export default Navbar;