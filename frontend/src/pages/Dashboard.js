import React, { useState } from 'react';
import './dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('author'); // Default to Author Dashboard

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="dashboard-container">
      {/* Segmented Button */}
      <div className="segmented-button">
        <button
          className={`tab-button ${activeTab === 'author' ? 'active' : ''}`}
          onClick={() => handleTabChange('author')}
        >
          Author Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'reviewer' ? 'active' : ''}`}
          onClick={() => handleTabChange('reviewer')}
        >
          Reviewer Dashboard
        </button>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'author' ? (
        <div className="dashboard-card">
          <h2 className="dashboard-title">Author Dashboard</h2>
          <ul className="dashboard-list">
            <li>
              <strong>Document 1</strong> - <span>Under Review</span>
              <button className="toggle-visibility">Toggle Visibility</button>
            </li>
            <li>
              <strong>Document 2</strong> - <span>Finalized</span>
              <button className="toggle-visibility">Toggle Visibility</button>
            </li>
          </ul>
        </div>
      ) : (
        <div className="dashboard-card">
          <h2 className="dashboard-title">Reviewer Dashboard</h2>
          <ul className="dashboard-list">
            <li>
              <strong>Document A</strong> - <span>Deadline: 2025-05-20</span>
            </li>
            <li>
              <strong>Document B</strong> - <span>Status: Under Review</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;