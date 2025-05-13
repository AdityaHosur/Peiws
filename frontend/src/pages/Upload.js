import React, { useState } from 'react';
import './upload.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('private'); // Changed default to private
  const [organizationName, setOrganizationName] = useState('');
  const [reviewerAssignment, setReviewerAssignment] = useState('manual');
  const [reviewerId, setReviewerId] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('File uploaded:', file);
    console.log('Tags:', tags);
    console.log('Visibility:', visibility);
    if (visibility === 'organization') {
      console.log('Organization Name:', organizationName);
    } else {
      // Only log reviewer info if not organization visibility
      console.log('Reviewer Assignment:', reviewerAssignment);
      if (reviewerAssignment === 'manual') {
        console.log('Reviewer ID:', reviewerId);
      }
    }
  };

  return (
    <div className="upload-container">
      {/* First Card: Upload and Tags */}
      <div className="upload-card">
        <h2 className="upload-title">Document Upload</h2>
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="file">Upload or Drag New Document (PDF, DOCX)</label>
            <div className="upload-drag-box">
              <input
                type="file"
                id="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                required
              />
              <p>Drag and drop your file here or click to upload</p>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="tags">Add Tags or Expertise Areas</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
          </div>
        </form>
      </div>

      {/* Second Card: Visibility and Reviewer Assignment */}
      <div className="upload-card">
        <h2 className="upload-title">Additional Details</h2>
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="visibility">Choose Visibility</label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              {/* Removed the public option */}
              <option value="private">Private</option>
              <option value="organization">Organization</option>
            </select>
          </div>
          {visibility === 'organization' && (
            <div className="form-group">
              <label htmlFor="organizationName">Organization Name</label>
              <input
                type="text"
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>
          )}
          
          {/* Only show reviewer assignment if visibility is not organization */}
          {visibility !== 'organization' && (
            <>
              <div className="form-group">
                <label htmlFor="reviewerAssignment">Assign Reviewers</label>
                <select
                  id="reviewerAssignment"
                  value={reviewerAssignment}
                  onChange={(e) => setReviewerAssignment(e.target.value)}
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
              {reviewerAssignment === 'manual' && (
                <div className="form-group">
                  <label htmlFor="reviewerId">Reviewer ID</label>
                  <input
                    type="text"
                    id="reviewerId"
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    placeholder="Enter reviewer ID"
                    required
                  />
                </div>
              )}
            </>
          )}
          
          <button type="submit" className="upload-button">
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default Upload;