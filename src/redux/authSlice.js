import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { apiErrorMessage } from './api';

function clearStoredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Login thunk
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/v1/auth/login', {
        user: { email, password },
      });

      // JWT token comes in the Authorization header
      // Try both cases - axios normalizes to lowercase, but be safe
      const token = response.headers['authorization'] || response.headers['Authorization'];
      const user = response.data.user;

      if (!token) {
        return rejectWithValue('Login succeeded but no token received. Check CORS expose headers.');
      }

      // Persist to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, token };
    } catch (error) {
      const message =
        error.response?.data?.error || 'Login failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// Logout thunk
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/api/v1/auth/logout');
    } catch (error) {
      // Even if the server call fails, we still clear local state
      console.error('Logout request failed:', error);
    } finally {
      clearStoredSession();
    }
  }
);

// Current user thunk. A token restored from localStorage comes with a cached
// user whose roles and permissions may be out of date, so ProtectedRoute calls
// this once per page load before showing the admin area.
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/users/me');
      const user = response.data.user || response.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error, 'Could not load your account.'));
    }
  },
  {
    // StrictMode runs effects twice in development; skip the duplicate request
    condition: (_, { getState }) => getState().auth.sessionStatus !== 'loading',
  }
);

// Called for any 401 from the API (see store.js)
export const expireSession = () => (dispatch) => {
  clearStoredSession();
  dispatch(authSlice.actions.sessionExpired());
};

// Load initial state from localStorage
const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  // 'idle' → 'loading' (checking /users/me) → 'ready'. A fresh login is 'ready' straight away.
  sessionStatus: 'idle',
  // Set when a 401 signed the user out, so the login page can say why
  sessionExpired: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSessionExpired(state) {
      state.sessionExpired = false;
    },
    sessionExpired(state) {
      state.user = null;
      state.token = null;
      state.sessionStatus = 'idle';
      state.sessionExpired = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.sessionExpired = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.sessionStatus = 'ready';
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.sessionStatus = 'loading';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.sessionStatus = 'ready';
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        // A 401 has already signed the user out via expireSession. Any other
        // failure (server down, network) falls back to the cached user rather
        // than locking them out; the API still enforces permissions.
        state.sessionStatus = 'ready';
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.sessionStatus = 'idle';
        state.loading = false;
        state.error = null;
      });
  },
});

export const { clearError, clearSessionExpired } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectToken = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => !!state.auth.token;
export const selectSessionStatus = (state) => state.auth.sessionStatus;
export const selectSessionExpired = (state) => state.auth.sessionExpired;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
