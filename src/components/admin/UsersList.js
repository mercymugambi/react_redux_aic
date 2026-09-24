import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api, { apiErrorMessage } from '../../redux/api';
import { selectCurrentUser } from '../../redux/authSlice';
import { humanize } from '../../auth/permissions';
import Icon from './Icon';

const PRIMARY_BUTTON =
  'inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-700 px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2';
const BADGE = 'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium';

const fullName = (user) => [user.firstname, user.lastname].filter(Boolean).join(' ') || '-';

function RoleBadges({ user }) {
  const roles = user.roles || [];
  if (!user.super_admin && roles.length === 0) return '-';

  return (
    <span className="flex flex-wrap gap-1">
      {user.super_admin && <span className={`${BADGE} border-red-100 bg-red-50 text-red-700`}>Super admin</span>}
      {roles.map((role) => (
        <span key={role} className={`${BADGE} border-slate-200 bg-slate-50 text-slate-600`}>
          {humanize(role)}
        </span>
      ))}
    </span>
  );
}

function UsersList() {
  const currentUser = useSelector(selectCurrentUser);
  const location = useLocation();
  const navigate = useNavigate();
  // AddUser comes back here with the new user's email. Keep it for the notice,
  // then drop it from history so the notice doesn't return on refresh.
  const [createdEmail] = useState(location.state?.createdEmail || null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (createdEmail) navigate('.', { replace: true });
  }, [createdEmail, navigate]);

  useEffect(() => {
    api.get('/api/v1/users')
      .then((response) => {
        setUsers(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(apiErrorMessage(err, 'Failed to load users.'));
        setLoading(false);
        console.error(err);
      });
  }, []);

  if (loading) return <p className="loading-message">Loading users...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">Users</h2>
          <p className="mt-1 text-[13px] text-slate-500">{users.length} user(s) found.</p>
        </div>
        {currentUser?.super_admin && (
          <Link to="/admin/users/new" className={PRIMARY_BUTTON}>
            <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
            Add user
          </Link>
        )}
      </div>

      {createdEmail && (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">
          <Icon name="check" className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
          <span>
            <span className="font-medium">{createdEmail}</span> was added and can now sign in.
          </span>
        </p>
      )}

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Linked Member</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{fullName(user)}</td>
                <td>{user.email}</td>
                <td>
                  <RoleBadges user={user} />
                </td>
                <td>
                  {user.member
                    ? `${user.member.first_name} ${user.member.last_name}`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UsersList;
