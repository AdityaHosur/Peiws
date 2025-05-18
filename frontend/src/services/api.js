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
export const uploadFile = async (token, file, tags, visibility, organizationName, reviewers) => {
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