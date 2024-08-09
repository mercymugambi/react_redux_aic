import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers'; // You'll create this later

export const store = configureStore({
  reducer: rootReducer,
  // Add middleware, devtools configuration, etc. as needed
});

