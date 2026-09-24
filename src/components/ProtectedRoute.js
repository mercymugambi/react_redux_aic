import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { fetchCurrentUser, selectIsAuthenticated, selectSessionStatus } from '../redux/authSlice';

function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const sessionStatus = useSelector(selectSessionStatus);

  // Refresh the user and their permissions before deciding what they can see
  useEffect(() => {
    if (isAuthenticated && sessionStatus === 'idle') {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated, sessionStatus]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (sessionStatus !== 'ready') {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-[#f6f6f7] font-sans text-[13px] text-slate-500">
        <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-700" aria-hidden="true" />
        Loading your account…
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
