import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectCurrentUser } from '../redux/authSlice';
import { canAccessPage, NOT_AUTHORIZED_PATH } from '../auth/permissions';

// Layout route for admin pages: renders the page only if the user has the
// permission PAGE_PERMISSIONS lists for the current path.
function PermissionRoute() {
  const user = useSelector(selectCurrentUser);
  const { pathname } = useLocation();

  if (!canAccessPage(user, pathname)) {
    return <Navigate to={NOT_AUTHORIZED_PATH} replace state={{ from: pathname }} />;
  }

  return <Outlet />;
}

export default PermissionRoute;
