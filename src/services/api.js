import { apiClient } from './client';

// Automatically attach the JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- Authentication APIs ---
export const requestOtp = async (email) => {
  const response = await apiClient.post('/auth/request-otp', { email });
  return response.data;
};

export const verifyOtp = async (email, code) => {
  const response = await apiClient.post('/auth/verify-otp', { email, code });
  return response.data;
};

export const verifyGoogleAuth = async (credential) => {
  const response = await apiClient.post('/auth/google', { credential });
  return response.data;
};

// --- Core APIs ---
export const onboardCompany = async (payload) => {
  // Payload now only needs { name, url }. Email is extracted from the JWT token on the backend!
  const response = await apiClient.post('/onboard/', payload);
  return response.data;
};

export const chatWithBot = async (question, history = []) => {
  const tenantId = localStorage.getItem('tenant_id');
  if (!tenantId) throw new Error("No Tenant ID found.");

  const response = await apiClient.post('/chat/', {
    tenant_id: tenantId,
    question: question,
    history: history
  });
  return response.data;
};

export const getPendingQuestions = async (tenantId) => {
  const response = await apiClient.get(`/training/pending/${tenantId}`);
  return response.data;
};

export const teachBot = async (questionId, answerText) => {
  const response = await apiClient.post('/training/teach', {
    question_id: questionId, answer_text: answerText
  });
  return response.data;
};

export const uploadDocument = async (tenantId, file) => {
  const formData = new FormData();
  formData.append('tenant_id', tenantId);
  formData.append('file', file);
  const response = await apiClient.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getDocuments = async (tenantId) => {
  const response = await apiClient.get(`/documents/list/${tenantId}`);
  return response.data;
};

export const deleteDocument = async (tenantId, filename) => {
  const response = await apiClient.delete(`/documents/${tenantId}/${filename}`);
  return response.data;
};