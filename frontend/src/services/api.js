import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Replace with your backend URL

// Register a new user
export const registerUser = async (name, email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Login a user
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Fetch user profile details
export const getProfile = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Update user profile details
export const updateProfile = async (token, name) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/auth/profile`,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Fetch organizations the user belongs to
export const getOrganizations = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/organization/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Join an organization
export const joinOrganization = async (token, organizationId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/organization/join`,
      { organizationId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Create an organization
export const createOrganization = async (token, name, description) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/organization/create`,
      { name, description },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Handle invitations
export const handleInvitation = async (token, organizationId, email, action) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/organization/invitation`,
      { organizationId, email, action },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Invite users to an organization
export const inviteUsersToOrganization = async (token, organizationId, emails) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/organization/invite`,
      { organizationId, emails },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Upload a file
export const uploadFile = async (token, file, tags, visibility, organizationName, reviewers, deadline) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tags', tags);
    formData.append('visibility', visibility);
    if (visibility === 'organization') {
      formData.append('organizationName', organizationName);
    } else {
      formData.append('reviewers',JSON.stringify(reviewers || []));
    }
    if (deadline) {
      formData.append('deadline', deadline);
    }

    const response = await axios.post(`${API_BASE_URL}/file/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Fetch members of an organization
export const getOrganizationMembers = async (token, organizationId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/organization/${organizationId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Update a member's role
export const updateMemberRole = async (token, organizationId, memberId, role) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/organization/${organizationId}/members/${memberId}/role`,
      { role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Fetch files related to an organization
export const getFilesByOrganization = async (token, organizationName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/file/organization/${organizationName}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Get organization history
export const getOrganizationHistory = async (token, organizationId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/organization/${organizationId}/history`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Assign reviewers to a file
export const assignReviewersToFile = async (token, fileId, reviewers) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/file/${fileId}/reviewers`,
      { reviewers },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const getUserUploads = async (token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/file/user-uploads`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const getReviewsByFileId = async (token, fileId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/review/file/${fileId}`,
      {
        headers: { Authorization: `Bearer ${token}`,'Content-Type':'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const getAssignedReviews = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/review/assigned`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const getFileStreamUrl = (fileId) => {
  return `${API_BASE_URL}/review/stream/${fileId}`;
};


export const saveReviewDetails = async (token, reviewId, details) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/review/details/${reviewId}`,
      details,
      {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const getReviewDetails = async (token, reviewId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/review/details/${reviewId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

// Add these functions to your api.js file

export const updateReviewStatus = async (token, reviewId, status) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/review/status/${reviewId}`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const getReviewStatus = async (token, reviewId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/review/status/${reviewId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const getDocumentById = async (token, fileId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/file/${fileId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const getDocumentVersions = async (token, fileGroupId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/file/versions/${fileGroupId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'An error occurred' };
  }
};

export const uploadNewVersion = async (token, file, originalDoc, deadline) => {
  try {
    console.log("Original doc data for upload:", originalDoc);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileGroupId', originalDoc.fileGroupId);
    
    if (originalDoc.tags && originalDoc.tags.length > 0) {
      formData.append('tags', JSON.stringify(originalDoc.tags));
    }
    
    if (originalDoc.reviewers && originalDoc.reviewers.length > 0) {
      if (typeof originalDoc.reviewers[0] === 'object' && originalDoc.reviewers[0].email) {
        const reviewerEmails = originalDoc.reviewers.map(r => r.email);
        formData.append('reviewers', JSON.stringify(reviewerEmails));
      } else {
        formData.append('reviewers', JSON.stringify(originalDoc.reviewers));
      }
    }
    
    formData.append('visibility', originalDoc.visibility || 'private');
    
    if (originalDoc.organizationName) {
      formData.append('organizationName', originalDoc.organizationName);
    }
    
    formData.append('status', originalDoc.status || 'draft');
    
    if (deadline) {
      formData.append('deadline', deadline);
    } else if (originalDoc.deadline) {
      const deadlineValue = originalDoc.deadline instanceof Date 
        ? originalDoc.deadline.toISOString().split('T')[0]
        : originalDoc.deadline;
      formData.append('deadline', deadlineValue);
    }
    
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    const response = await fetch(`${API_BASE_URL}/file/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload new version');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};