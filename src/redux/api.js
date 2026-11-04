import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// A 401 means the token is missing, expired or revoked. store.js registers a
// handler that signs the user out, and ProtectedRoute then sends them to the
// login page. Login and logout get 401s for their own reasons (wrong password,
// token already revoked), so they're left to handle those themselves.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = (error.config?.url || '').startsWith('/api/v1/auth/');
    if (error.response?.status === 401 && !isAuthRequest && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(error);
  }
);

// What to show for a failed request. The API sends { error: "..." } or
// { errors: ["...", ...] }. Crashes and connection failures say so, so nobody
// goes hunting for a mistake in what they typed.
export function apiErrorMessages(error, fallback) {
  const data = error?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors;
  if (typeof data?.error === 'string' && data.error) return [data.error];
  if (error && !error.response) return [`${fallback} (The server couldn’t be reached. Check that the API is running.)`];
  if (error?.response?.status >= 500) {
    return [`${fallback} (Server error ${error.response.status}: the problem is on the server, not in what you entered.)`];
  }
  return [fallback];
}

export const apiErrorMessage = (error, fallback) => apiErrorMessages(error, fallback).join(' ');

export default api;
