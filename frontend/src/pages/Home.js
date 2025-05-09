import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CardLayout from '../components/CardLayout';

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
        <main>
          <h1>Welcome to the Peer Review System</h1>
          <p>Navigate through the options in the navbar to explore the features.</p>
        </main>
      </CardLayout>
    </div>
  );
};

export default Home;