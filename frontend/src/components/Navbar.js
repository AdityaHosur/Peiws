import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ toggleTheme, isDarkMode }) => {
  return (
    <nav className="navbar">
      <div className="navbar-title">Peiws</div>
      <div className="navbar-links">
        <Link to="/auth">Auth</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/upload">Upload</Link>
        <Link to="/review">Review</Link>
        <Link to="/view">View</Link>
        <Link to="/organisation">Organisation</Link>
        <Link to="/profile">Profile</Link>
      </div>
      <button className="theme-toggle" onClick={toggleTheme}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </nav>
  );
};

export default Navbar;