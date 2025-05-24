import React, { useState } from 'react';
import { uploadNewVersion } from '../services/api';
import pdfThumbnail from '../assets/thumbnail.png'; // Placeholder for PDF thumbnail
import './NewVersionModal.css';

const NewVersionModal = ({ isOpen, onClose, originalDoc, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [deadline, setDeadline] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
        setFilePreview(URL.createObjectURL(selectedFile));
      } else if (selectedFile.type === 'application/pdf') {
        setFilePreview(pdfThumbnail);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await uploadNewVersion(
        token,
        file,
        originalDoc,
        deadline
      );
      
      onSuccess(response.uploadDetails);
      onClose();
    } catch (err) {
      console.error('Error uploading new version:', err);
      setError(err.message || 'Failed to upload new version');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload New Version</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
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
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
              <button 
                type="submit" 
                className="upload-button"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload New Version'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewVersionModal;