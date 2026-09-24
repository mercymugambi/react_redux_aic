import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, selectCurrentUser } from '../../redux/authSlice';
import './admin.css';

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate('/login');
    });
  };

  const navLinks = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/members', label: 'Members' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/roles', label: 'Roles' },
    { to: '/admin/devotions', label: 'Devotions' },
    { to: '/admin/events', label: 'Events' },
    { to: '/admin/fellowship-groups', label: 'Fellowship Groups' },
    { to: '/admin/leadership-positions', label: 'Leadership Positions' },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h3>AIC Kabuku Admin</h3>
        <nav>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end || false}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="user-info">
          <p><strong>{user?.firstname} {user?.lastname}</strong></p>
          <p>{user?.email}</p>
          <p>
            {user?.super_admin ? 'Super Admin' : (user?.roles || []).join(', ')}
          </p>
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
