import React, { useState } from 'react';
import { uploadFile } from '../services/api';
import { useToast } from '../components/ToastContext';
import pdfThumbnail from '../assets/thumbnail.png'; // Placeholder for PDF thumbnail
import './upload.css';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null); // For file thumbnail
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('private'); // Default to private
  const [organizationName, setOrganizationName] = useState('');
  const [reviewerAssignment, setReviewerAssignment] = useState('manual');
  const [reviewers, setReviewers] = useState([]); // Store multiple reviewer IDs
  const [currentReviewer, setCurrentReviewer] = useState(''); // Temporary input for a single reviewer
  const [deadline, setDeadline] = useState(''); // New state for deadline
  const [error, setError] = useState('');
  const token = localStorage.getItem('token'); // Retrieve token from localStorage
  const { showToast } = useToast(); // Use the toast hook

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);  

    // Generate a preview for image or PDF files
    if (selectedFile) {
      if (selectedFile.type.startsWith('image/')) {
        // For image files, use a URL object
        setFilePreview(URL.createObjectURL(selectedFile));
      } else if (selectedFile.type === 'application/pdf') {
        // For PDF files, use a placeholder thumbnail or a PDF icon
        setFilePreview(pdfThumbnail); // Replace with your PDF thumbnail image
      } else {
        setFilePreview(null); // No preview for unsupported file types
      }
    }
  };

  const addReviewer = () => {
    if (currentReviewer.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(currentReviewer.trim())) {
        setError('Please enter a valid email address');
        showToast('Please enter a valid email address', 'error');
        return;
      }
      setReviewers([...reviewers, currentReviewer.trim()]);
      setCurrentReviewer(''); // Clear the input field
      showToast('Reviewer added successfully', 'success');
    }
  };

  const removeReviewer = (index) => {
    const updatedReviewers = reviewers.filter((_, i) => i !== index);
    setReviewers(updatedReviewers);
    showToast('Reviewer removed', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      showToast('Please select a file to upload', 'error');
      return;
    }
    
    // Validate deadline if visibility is not organization
    if (visibility !== 'organization' && reviewerAssignment === 'manual' && reviewers.length === 0) {
      showToast('Please add at least one reviewer', 'error');
      return;
    }
    
    try {
      const response = await uploadFile(
        token,
        file,
        tags,
        visibility,
        organizationName,
        reviewers, // Send the reviewers array
        deadline
      );
      
      // Replace alert with toast
      showToast('File uploaded successfully!', 'success');
      
      console.log('Response:', response);
      
      // Reset form fields
      setFile(null);
      setFilePreview(null); // Clear the preview after upload
      setTags('');
      setVisibility('private');
      setOrganizationName('');
      setReviewers([]); // Clear the reviewers list
      setDeadline(''); // Clear the deadline
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to upload file');
      showToast(err.message || 'Failed to upload file', 'error');
    }
  };

  return (
    <div className="upload-container">
      {/* First Card: Upload and Tags */}
      <div className="upload-card">
        <h2 className="upload-title">Document Upload</h2>
        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="file" className="upload-drag-box">
              <input
                type="file"
                id="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                required
              />
              {filePreview ? (
                <div className="file-preview">
                  <img src={filePreview} alt="File Preview" className="thumbnail" />
                  <p className="file-name">{file?.name}</p>
                </div>
              ) : (
                <p>Drag and drop your file here or click to upload</p>
              )}
            </label>
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
          <div className="form-group">
            <label htmlFor="deadline">Review Deadline</label>
              <input
                type="date"
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={getTodayDate()}
                className="deadline-input"
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
                  <label htmlFor="reviewerId">Reviewer Email Ids</label>
                  <div className="reviewer-input">
                    <input
                      type="text"
                      id="reviewerId"
                      value={currentReviewer}
                      onChange={(e) => setCurrentReviewer(e.target.value)}
                      placeholder="Enter reviewer ID"
                    />
                    <button type="button" onClick={addReviewer} className="add-reviewer-button">
                      Add
                    </button>
                  </div>
                  {error && <div className="error-message">{error}</div>}
                  <ul className="reviewer-list">
                    {reviewers.map((reviewer, index) => (
                      <li key={index} className="reviewer-item">
                        {reviewer}
                        <button
                          type="button"
                          onClick={() => removeReviewer(index)}
                          className="remove-reviewer-button"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
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