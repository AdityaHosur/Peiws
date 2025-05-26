import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import {jwtDecode} from 'jwt-decode';
import './Navbar.css';

const Navbar = ({ toggleTheme, isDarkMode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLinkText, setAuthLinkText] = useState('Login');
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true; // If token can't be decoded, consider it expired
    }
  };

  const performLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    if (!['/auth', '/register'].includes(location.pathname)) {
      navigate('/auth');
      showToast('Session expired. Please login again.', 'info');
    }
  };

  // Check authentication status when component mounts or location changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (isTokenExpired(token)) {
        performLogout();
      } else {
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(false);
    }
    
    // Update the auth link text based on current route
    if (location.pathname === '/register') {
      setAuthLinkText('Login');
    } else if (location.pathname === '/auth') {
      setAuthLinkText('Register');
    } else if (isAuthenticated) {
      setAuthLinkText('Logout');
    }
  }, [location.pathname, isAuthenticated]);

  useEffect(() => {
    const checkTokenInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        performLogout();
      }
    }, 60000); // Check every minute
    return () => clearInterval(checkTokenInterval);
  }, []);

  const handleAuthClick = (e) => {
    e.preventDefault();
    
    if (isAuthenticated) {
      performLogout();
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
    const token = localStorage.getItem('token');
    
    if (!token || isTokenExpired(token)) {
      e.preventDefault();
      performLogout();
      showToast('Please log in to access this feature', 'error');
    } else {
      navigate(path);
    }
  };

  // Check if the current path matches the link path
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-title">Peiws</div>
      

<div className="navbar-links">
  {/* Protected routes with authentication check */}
  <a 
    href="#" 
    onClick={(e) => handleProtectedLink(e, '/dashboard')}
    className={isActive('/dashboard') ? 'active' : ''}
  >
    Dashboard
  </a>
  <a 
    href="#" 
    onClick={(e) => handleProtectedLink(e, '/upload')}
    className={isActive('/upload') ? 'active' : ''}
  >
    Upload
  </a>
  <a 
    href="#" 
    onClick={(e) => handleProtectedLink(e, '/review')}
    className={isActive('/review') ? 'active' : ''}
  >
    Review
  </a>
  <a 
    href="#" 
    onClick={(e) => handleProtectedLink(e, '/view')}
    className={isActive('/view') ? 'active' : ''}
  >
    View
  </a>
  <a 
    href="#" 
    onClick={(e) => handleProtectedLink(e, '/organisation')}
    className={isActive('/organisation') ? 'active' : ''}
  >
    Org
  </a>
  <a 
    href="#" 
    onClick={(e) => handleProtectedLink(e, '/profile')}
    className={isActive('/profile') ? 'active' : ''}
  >
    Profile
  </a>
  
  {/* Auth link moved to the end */}
  <a 
    href="#" 
    onClick={handleAuthClick}
    className={`auth-link ${isActive('/auth') || isActive('/register') ? 'active' : ''}`}
  >
    {authLinkText}
  </a>
</div>
      <button className="theme-toggle" onClick={toggleTheme}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </nav>
  );
};

export default Navbar;