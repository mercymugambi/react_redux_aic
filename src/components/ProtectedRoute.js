import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../redux/api';
import {
  fetchCurrentUser,
  logoutUser,
  selectCurrentUser,
  selectIsAuthenticated,
  selectSessionStatus,
  updateCurrentUser,
} from '../redux/authSlice';
import Icon from './admin/Icon';

function ForcePasswordChange({ user }) {
  const dispatch = useDispatch();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Your new password must be at least 6 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.patch('/api/v1/users/change_password', {
        password,
        password_confirmation: confirmation,
      });
      if (res.data?.user) {
        dispatch(updateCurrentUser(res.data.user));
      } else {
        dispatch(fetchCurrentUser());
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update your password. Please try again.'));
      setSubmitting(false);
    }
  };

  const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.email;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6f7] px-4 py-10 font-sans text-slate-900 antialiased">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-sm ring-4 ring-red-50">
            <Icon name="key" className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Set Your New Password</h1>
            <p className="text-xs text-slate-500">AIC Kabuku Admin Console</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3 text-[13px] leading-relaxed text-amber-900">
          Welcome, <strong>{fullName}</strong>! Because you signed in with a temporary password set by the administrator, please choose a new personal password you will use to sign in going forward.
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="new-password" className="block text-[13px] font-medium text-slate-700">
              New Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-10 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <Icon name={showPassword ? 'eyeSlash' : 'eye'} className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-[13px] font-medium text-slate-700">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              required
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={submitting}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-60"
            >
              {submitting ? 'Saving your password…' : 'Save New Password & Continue'}
            </button>
            <button
              type="button"
              onClick={() => dispatch(logoutUser())}
              className="flex h-9 w-full items-center justify-center text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Sign out instead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const sessionStatus = useSelector(selectSessionStatus);
  const currentUser = useSelector(selectCurrentUser);

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

  if (currentUser?.must_change_password) {
    return <ForcePasswordChange user={currentUser} />;
  }

  return children;
}

export default ProtectedRoute;
