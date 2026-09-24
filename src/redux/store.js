import { configureStore } from '@reduxjs/toolkit';
import authReducer, { expireSession } from './authSlice';
import { setUnauthorizedHandler } from './api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Any 401 from the API signs the user out; ProtectedRoute then redirects to /login
setUnauthorizedHandler(() => store.dispatch(expireSession()));
