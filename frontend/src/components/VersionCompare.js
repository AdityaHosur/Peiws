import React, { useState, useEffect } from 'react';
import { getDocumentVersions, getFileStreamUrl } from '../services/api';
import './VersionCompare.css';

const VersionCompare = ({ fileGroupId, documentTitle }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVersions, setSelectedVersions] = useState({
    left: null,
    right: null
  });
  const [activeFullScreen, setActiveFullScreen] = useState(null); // 'left' or 'right'
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side', 'full-screen', or 'diff-view'
  const [showDiffHighlights, setShowDiffHighlights] = useState(true);
  // Add new state for diff view
  const [diffUrl, setDiffUrl] = useState(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState('');

  const getDiffViewUrl = () => {
  if (!selectedVersions.left || !selectedVersions.right) return null;
  
  const leftId = selectedVersions.left.fileId;
  const rightId = selectedVersions.right.fileId;
  // Get the API URL for diff endpoint
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found in localStorage');
    return null;
  }

  return `${baseUrl}/file/diff?leftId=${leftId}&rightId=${rightId}&highlight=${showDiffHighlights}`;
};

  useEffect(() => {
    const fetchVersions = async () => {
      if (!fileGroupId) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const versionData = await getDocumentVersions(token, fileGroupId);
        
        // Sort versions by version number (descending)
        const sortedVersions = versionData.sort((a, b) => b.version - a.version);
        setVersions(sortedVersions);
        
        // Set default versions to compare (latest and previous if available)
        if (sortedVersions.length >= 2) {
          setSelectedVersions({
            right: sortedVersions[0],
            left: sortedVersions[1]
          });
        } else if (sortedVersions.length === 1) {
          setSelectedVersions({
            right: sortedVersions[0],
            left: null
          });
        }
      } catch (err) {
        console.error('Error fetching document versions:', err);
        setError('Failed to load document versions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVersions();
  }, [fileGroupId]);

  // Add this component inside your VersionCompare component
const ConnectionStatus = ({ onRetry }) => {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simple API endpoint to check if server is available
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'no-cors'
        });
        setIsConnected(true);
      } catch (error) {
        setIsConnected(false);
      }
    };
    
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  if (isConnected) return null;
  
  return (
    <div className="server-connection-warning">
      <p>⚠️ Connection to server lost. Some features may be unavailable.</p>
      <button onClick={onRetry} className="retry-button">Retry Connection</button>
    </div>
  );
};

  // Updated fetchDiffView function with better error handling and cancelation
const fetchDiffView = async () => {
  try {
    // Clear previous diff URL if it exists
    if (diffUrl) {
      URL.revokeObjectURL(diffUrl);
      setDiffUrl(null);
    }
    
    setDiffLoading(true);
    setDiffError('');
    
    const url = getDiffViewUrl();
    if (!url) {
      setDiffError('Unable to generate comparison URL');
      return null;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setDiffError('Authentication token not found');
      return null;
    }
    
    // Use AbortController to implement a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with status ${response.status}: ${errorText}`);
    }
    
    // Create a blob from the PDF response
    const pdfBlob = await response.blob();
    
    // Create a URL for the blob
    const blobUrl = URL.createObjectURL(pdfBlob);
    setDiffUrl(blobUrl);
    return blobUrl;
  } catch (error) {
    if (error.name === 'AbortError') {
      setDiffError('Request timed out. The server took too long to respond.');
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      setDiffError('Unable to connect to the server. Please check your connection or try again later.');
    } else {
      setDiffError(`Failed to load comparison: ${error.message}`);
    }
    console.error('Error fetching diff view:', error);
    return null;
  } finally {
    setDiffLoading(false);
  }
};

 useEffect(() => {
    return () => {
      if (diffUrl) {
        URL.revokeObjectURL(diffUrl);
      }
    };
  }, [diffUrl]);

  // Replace the existing useEffect with this corrected version
useEffect(() => {
  if (viewMode === 'diff-view' && selectedVersions.left && selectedVersions.right) {
    fetchDiffView();
  }
  
  // Return a cleanup function
  return () => {
    if (diffUrl) {
      URL.revokeObjectURL(diffUrl);
    }
  };
// ⚠️ Remove fetchDiffView from the dependency array to prevent infinite loops
}, [viewMode, selectedVersions.left, selectedVersions.right, showDiffHighlights]);

  const handleVersionChange = (side, versionId) => {
    const selectedVersion = versions.find(v => v._id === versionId);
    setSelectedVersions(prev => ({
      ...prev,
      [side]: selectedVersion
    }));
  };

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    if (mode === 'full-screen') {
      setActiveFullScreen('left');
    }
  };

  const toggleFullScreenSide = () => {
    setActiveFullScreen(prev => prev === 'left' ? 'right' : 'left');
  };

  if (loading) {
    return <div className="loading-message">Loading versions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (versions.length === 0) {
    return <div className="empty-message">No versions available for comparison</div>;
  }

  return (
    <div className="version-compare">
      <ConnectionStatus onRetry={fetchDiffView} />
      <div className="version-compare-header">
        <h3 className="content-title">Compare Versions for {documentTitle}</h3>
        
        <div className="version-controls">
          <button 
            className={`view-mode-toggle ${viewMode === 'side-by-side' ? 'active' : ''}`}
            onClick={() => toggleViewMode('side-by-side')}
          >
            Side-by-Side View
          </button>
          <button 
            className={`view-mode-toggle ${viewMode === 'diff-view' ? 'active' : ''}`}
            onClick={() => toggleViewMode('diff-view')}
          >
            Difference View
          </button>
          <button 
            className={`view-mode-toggle ${viewMode === 'full-screen' ? 'active' : ''}`}
            onClick={() => toggleViewMode('full-screen')}
          >
            Full Screen View
          </button>
          
          {viewMode === 'full-screen' && (
            <button 
              className="toggle-side-button"
              onClick={toggleFullScreenSide}
            >
              Show {activeFullScreen === 'left' ? 'Right' : 'Left'} Version
            </button>
          )}
        </div>
      </div>
      
      <div className="version-selectors">
        <div className="version-selector">
          <label>Version 1:</label>
          <select 
            value={selectedVersions.left?._id || ''} 
            onChange={(e) => handleVersionChange('left', e.target.value)}
          >
            <option value="">Select version</option>
            {versions.map(version => (
              <option key={`left-${version._id}`} value={version._id}>
                Version {version.version} ({new Date(version.uploadedAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
        
        <div className="version-selector">
          <label>Version 2:</label>
          <select 
            value={selectedVersions.right?._id || ''} 
            onChange={(e) => handleVersionChange('right', e.target.value)}
          >
            <option value="">Select version</option>
            {versions.map(version => (
              <option key={`right-${version._id}`} value={version._id}>
                Version {version.version} ({new Date(version.uploadedAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>
      {viewMode === 'diff-view' && (
        <div className="version-comparison-container diff-view">
          {selectedVersions.left && selectedVersions.right ? (
            <>
              <div className="diff-info">
                <div className="version-summary">
                  <div className="version-badge older">
                    <span className="version-number">V{selectedVersions.left.version}</span>
                    <span className="version-date">{new Date(selectedVersions.left.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="version-comparison-arrow">→</div>
                  <div className="version-badge newer">
                    <span className="version-number">V{selectedVersions.right.version}</span>
                    <span className="version-date">{new Date(selectedVersions.right.uploadedAtedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="diff-legend">
                  <div className="legend-item">
                    <span className="legend-color deleted"></span>
                    <span>Deleted text</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color added"></span>
                    <span>Added text</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color modified"></span>
                    <span>Modified text</span>
                  </div>
                </div>
              </div>
              
              <div className="document-frame diff-frame">
                {diffLoading ? (
                  <div className="diff-loading">
                    <p>Generating comparison view...</p>
                    <div className="loader"></div>
                  </div>
                ) : diffError ? (
                  <div className="diff-error">
                    <p>{diffError}</p>
                    <button onClick={fetchDiffView} className="retry-button">
                      Retry
                    </button>
                  </div>
                ) : diffUrl ? (
                  <iframe 
                    src={diffUrl}
                    title="Document Differences"
                    width="100%"
                    height="750px"
                    className="pdf-preview diff-preview"
                  />
                ) : (
                  <div className="diff-loading">
                    <p>Preparing document comparison...</p>
                  </div>
                )}
              </div>
              
              <div className="diff-notice">
                <p>
                  <i className="info-icon">ℹ️</i> 
                  This view shows text changes between versions with colored highlighting:
                  <span className="text-red">Red highlighting</span> shows deleted content,
                  <span className="text-green">Green highlighting</span> shows added or modified content.
                </p>
                <p>
                  <small>
                    Note: This comparison is based on text extracted from the PDF and works best with text-based documents.
                    Complex formatting, images, and non-text content may not be compared accurately.
                  </small>
                </p>
              </div>
            </>
          ) : (
            <div className="no-comparison-available">
              <p>Please select two versions to compare differences</p>
            </div>
          )}
        </div>
      )}
      
      {viewMode === 'side-by-side' ? (
        <div className="version-comparison-container side-by-side">
          <div className="version-panel left">
            {selectedVersions.left ? (
              <>
                <div className="version-info">
                  <h4>Version {selectedVersions.left.version}</h4>
                  <div className="version-metadata">
                    <p>Uploaded: {new Date(selectedVersions.left.uploadedAt).toLocaleDateString()}</p>
                    {selectedVersions.left.tags?.length > 0 && (
                      <div className="version-tags">
                        <span>Tags: </span>
                        {selectedVersions.left.tags.map((tag, index) => (
                          <span key={index} className="version-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    className="expand-button"
                    onClick={() => {
                      setViewMode('full-screen');
                      setActiveFullScreen('left');
                    }}
                  >
                    Expand
                  </button>
                </div>
                <div className="document-frame">
                  <iframe 
                    src={getFileStreamUrl(selectedVersions.left.fileId)}
                    title={`Version ${selectedVersions.left.version}`}
                    width="100%"
                    height="650px"
                    className="pdf-preview"
                  />
                </div>
              </>
            ) : (
              <div className="no-version-selected">
                <p>Select a version to compare</p>
              </div>
            )}
          </div>
          
          <div className="version-panel right">
            {selectedVersions.right ? (
              <>
                <div className="version-info">
                  <h4>Version {selectedVersions.right.version}</h4>
                  <div className="version-metadata">
                    <p>Uploaded: {new Date(selectedVersions.right.uploadedAt).toLocaleDateString()}</p>
                    {selectedVersions.right.tags?.length > 0 && (
                      <div className="version-tags">
                        <span>Tags: </span>
                        {selectedVersions.right.tags.map((tag, index) => (
                          <span key={index} className="version-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    className="expand-button"
                    onClick={() => {
                      setViewMode('full-screen');
                      setActiveFullScreen('right');
                    }}
                  >
                    Expand
                  </button>
                </div>
                <div className="document-frame">
                  <iframe 
                    src={getFileStreamUrl(selectedVersions.right.fileId)}
                    title={`Version ${selectedVersions.right.version}`}
                    width="100%"
                    height="650px"
                    className="pdf-preview"
                  />
                </div>
              </>
            ) : (
              <div className="no-version-selected">
                <p>Select a version to compare</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="version-comparison-container full-screen">
          {activeFullScreen === 'left' && selectedVersions.left && (
            <div className="version-panel full">
              <div className="version-info with-back-button">
                <div>
                  <h4>Version {selectedVersions.left.version}</h4>
                  <div className="version-metadata">
                    <p>Uploaded: {new Date(selectedVersions.left.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  className="back-to-compare-button"
                  onClick={toggleFullScreenSide}
                >
                  View Version {selectedVersions.right?.version || ''}
                </button>
              </div>
              <div className="document-frame full-height">
                <iframe 
                  src={getFileStreamUrl(selectedVersions.left.fileId)}
                  title={`Version ${selectedVersions.left.version}`}
                  width="100%"
                  height="750px"
                  className="pdf-preview"
                />
              </div>
            </div>
          )}
          
          {activeFullScreen === 'right' && selectedVersions.right && (
            <div className="version-panel full">
              <div className="version-info with-back-button">
                <div>
                  <h4>Version {selectedVersions.right.version}</h4>
                  <div className="version-metadata">
                    <p>Uploaded: {new Date(selectedVersions.right.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  className="back-to-compare-button"
                  onClick={toggleFullScreenSide}
                >
                  View Version {selectedVersions.left?.version || ''}
                </button>
              </div>
              <div className="document-frame full-height">
                <iframe 
                  src={getFileStreamUrl(selectedVersions.right.fileId)}
                  title={`Version ${selectedVersions.right.version}`}
                  width="100%"
                  height="750px"
                  className="pdf-preview"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VersionCompare;