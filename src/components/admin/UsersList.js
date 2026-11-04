import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api, { apiErrorMessage, apiErrorMessages } from '../../redux/api';
import { selectCurrentUser } from '../../redux/authSlice';
import { humanize } from '../../auth/permissions';
import Icon from './Icon';
import {
  Avatar,
  BUTTON,
  ConfirmDialog,
  Modal,
  muted,
  PRIMARY_BUTTON,
  Skeleton,
  StatCard,
  Toast,
  useToast,
} from './ui';

const PILL = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium';
const SELECT =
  'h-8 rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
const ICON_ACTION =
  'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50/60 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';

const fullName = (user) => [user.firstname, user.lastname].filter(Boolean).join(' ') || user.email || '—';

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let result = 'Aic@';
  for (let i = 0; i < 6; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function RoleBadges({ user }) {
  const roles = user.roles || [];
  if (!user.super_admin && roles.length === 0) {
    return <span className="text-xs text-slate-400">No role assigned</span>;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {user.super_admin && (
        <span className={`${PILL} border-red-200 bg-red-50 text-red-700`}>Super admin</span>
      )}
      {roles.map((role) => (
        <span key={role} className={`${PILL} border-slate-200 bg-slate-50 text-slate-700`}>
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
  const [createdEmail] = useState(location.state?.createdEmail || null);
  const [toast, flash] = useToast();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Edit User & Roles Modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    member_id: '',
    role_ids: [],
  });
  const [editErrors, setEditErrors] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset Password Modal state
  const [resettingUser, setResettingUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(true);
  const [resetError, setResetError] = useState(null);
  const [savingReset, setSavingReset] = useState(false);

  // Delete User Confirmation state
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (createdEmail) navigate('.', { replace: true });
  }, [createdEmail, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes, membersRes] = await Promise.all([
        api.get('/api/v1/users'),
        api.get('/api/v1/roles').catch(() => ({ data: [] })),
        api.get('/api/v1/members').catch(() => ({ data: [] })),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load users.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = users.length;
    const mustChange = users.filter((u) => u.must_change_password).length;
    const active = total - mustChange;
    return { total, active, mustChange, rolesCount: roles.length };
  }, [users, roles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === 'super_admin' && !u.super_admin) return false;
      if (roleFilter === 'none' && (u.super_admin || (u.roles || []).length > 0)) return false;
      if (roleFilter !== 'all' && roleFilter !== 'super_admin' && roleFilter !== 'none') {
        if (!(u.roles || []).includes(roleFilter)) return false;
      }
      if (!q) return true;
      return (
        fullName(u).toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.roles || []).some((r) => r.toLowerCase().includes(q)) ||
        (u.member && `${u.member.first_name} ${u.member.last_name}`.toLowerCase().includes(q))
      );
    });
  }, [users, query, roleFilter]);

  const openEditModal = (user) => {
    const currentRoleIds =
      user.role_ids ||
      roles.filter((r) => (user.roles || []).includes(r.name)).map((r) => r.id);
    setEditingUser(user);
    setEditForm({
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      member_id: user.member_id || user.member?.id || '',
      role_ids: currentRoleIds,
    });
    setEditErrors([]);
  };

  const toggleEditRole = (roleId) => {
    setEditForm((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(roleId)
        ? prev.role_ids.filter((id) => id !== roleId)
        : [...prev.role_ids, roleId],
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditErrors([]);
    setSavingEdit(true);
    try {
      const res = await api.patch(`/api/v1/users/${editingUser.id}`, {
        firstname: editForm.firstname.trim(),
        lastname: editForm.lastname.trim(),
        email: editForm.email.trim(),
        member_id: editForm.member_id || null,
        role_ids: editForm.role_ids,
      });
      const updated = res.data.user || res.data;
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
      setEditingUser(null);
      flash(`Updated ${fullName(updated)}`);
    } catch (err) {
      setEditErrors(apiErrorMessages(err, 'Could not update user.'));
    } finally {
      setSavingEdit(false);
    }
  };

  const openResetModal = (user) => {
    setResettingUser(user);
    setTempPassword(generateTempPassword());
    setShowTempPassword(true);
    setResetError(null);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (tempPassword.length < 6) {
      setResetError('Temporary password must be at least 6 characters.');
      return;
    }
    setSavingReset(true);
    setResetError(null);
    try {
      const res = await api.post(`/api/v1/users/${resettingUser.id}/reset_password`, {
        password: tempPassword,
      });
      const updated = res.data.user;
      if (updated) {
        setUsers((prev) => prev.map((u) => (u.id === resettingUser.id ? updated : u)));
      }
      flash(`Password reset for ${resettingUser.email}. They will be prompted to change it on login.`);
      setResettingUser(null);
    } catch (err) {
      setResetError(apiErrorMessage(err, 'Could not reset password.'));
    } finally {
      setSavingReset(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/users/${confirmDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id));
      flash(`Deleted account ${confirmDelete.email}`);
      setConfirmDelete(null);
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'Could not delete user.'));
    } finally {
      setDeleting(false);
    }
  };

  const availableMembersForEdit = useMemo(() => {
    if (!editingUser) return [];
    const linkedMemberIds = new Set(
      users
        .filter((u) => u.id !== editingUser.id && (u.member_id || u.member?.id))
        .map((u) => u.member_id || u.member?.id)
    );
    return members.filter((m) => !linkedMemberIds.has(m.id));
  }, [members, users, editingUser]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Access Control</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Users & Accounts
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Manage dashboard login accounts, assign user roles, and reset forgotten passwords.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={loadData} disabled={loading} className={BUTTON}>
            <Icon name="refresh" className="h-3.5 w-3.5 text-slate-500" />
            Refresh
          </button>
          {currentUser?.super_admin && (
            <>
              <Link to="/admin/roles" className={BUTTON}>
                <Icon name="key" className="h-3.5 w-3.5 text-slate-500" />
                Roles & Permissions
              </Link>
              <Link to="/admin/users/new" className={PRIMARY_BUTTON}>
                <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
                Add User
              </Link>
            </>
          )}
        </div>
      </div>

      {createdEmail && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800"
        >
          <Icon name="check" className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
          <span>
            <span className="font-semibold">{createdEmail}</span> was created. On their first sign-in with the temporary password, they will be asked to choose their own password.
          </span>
        </p>
      )}

      {/* Stat Cards */}
      <section aria-label="Users summary" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Accounts"
          icon="users"
          tone="red"
          value={stats.total}
          caption="Admin & staff login accounts"
          loading={loading}
        />
        <StatCard
          label="Active Passwords"
          icon="checkBadge"
          tone="emerald"
          value={stats.active}
          caption="Personal password configured"
          loading={loading}
        />
        <StatCard
          label="First-Login Pending"
          icon="clock"
          tone="amber"
          value={stats.mustChange}
          caption="Must change password on sign-in"
          loading={loading}
        />
        <StatCard
          label="Configured Roles"
          icon="key"
          tone="sky"
          value={stats.rolesCount}
          caption="Available roles to assign"
          to="/admin/roles"
          loading={loading}
        />
      </section>

      {/* Main Table Card */}
      <section aria-label="Users list" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 px-4 py-3">
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Icon
              name="search"
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, role, member…"
              aria-label="Search users"
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-7 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <Icon name="close" className="h-3 w-3" strokeWidth={2} />
              </button>
            )}
          </div>

          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={SELECT}
          >
            <option value="all">All roles</option>
            <option value="super_admin">Super Admin</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {humanize(r.name)}
              </option>
            ))}
            <option value="none">No roles assigned</option>
          </select>

          <span className="ml-auto text-xs text-slate-500">
            Showing <strong className="font-medium text-slate-700">{filtered.length}</strong> of{' '}
            <strong className="font-medium text-slate-700">{users.length}</strong> account
            {users.length === 1 ? '' : 's'}
          </span>
        </div>

        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-slate-800">Couldn’t load users</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button type="button" onClick={loadData} className={`mt-3 ${BUTTON}`}>
              <Icon name="refresh" className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-slate-700">No matching users found</p>
            <p className="mt-1 text-xs text-slate-400">Try clearing your search or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60">
                  <th scope="col" className="pl-4 pr-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    User
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Roles & Access
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Linked Member
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Password Status
                  </th>
                  {currentUser?.super_admin && (
                    <th scope="col" className="pr-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((user) => {
                  const permCount = (user.permissions || []).length;
                  return (
                    <tr
                      key={user.id}
                      onClick={() => currentUser?.super_admin && openEditModal(user)}
                      className={`transition-colors ${
                        currentUser?.super_admin ? 'cursor-pointer hover:bg-slate-50/70' : ''
                      }`}
                    >
                      <td className="pl-4 pr-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={fullName(user)} className="h-8 w-8 text-xs" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{fullName(user)}</p>
                            <p className="truncate text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <RoleBadges user={user} />
                        <p className="mt-1 text-xs text-slate-400">
                          {user.super_admin
                            ? 'Full access to all dashboard sections'
                            : `${permCount} permission${permCount === 1 ? '' : 's'} granted`}
                        </p>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {user.member ? (
                          <span className="font-medium text-slate-800">
                            {user.member.first_name} {user.member.last_name}
                          </span>
                        ) : (
                          muted('Not linked')
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {user.must_change_password ? (
                          <span className={`${PILL} border-amber-200 bg-amber-50 text-amber-800`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Change on next login
                          </span>
                        ) : (
                          <span className={`${PILL} border-emerald-200 bg-emerald-50 text-emerald-700`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>
                      {currentUser?.super_admin && (
                        <td
                          className="pr-4 py-3 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              title="Edit roles & account details"
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              <Icon name="pencil" className="h-3.5 w-3.5 text-slate-500" />
                              Roles / Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openResetModal(user)}
                              title="Reset user password"
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/70 px-2 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
                            >
                              <Icon name="key" className="h-3.5 w-3.5 text-amber-700" />
                              Reset Password
                            </button>
                            {!user.super_admin && user.id !== currentUser?.id && (
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(user)}
                                title="Delete user account"
                                aria-label={`Delete ${user.email}`}
                                className={ICON_ACTION}
                              >
                                <Icon name="trash" className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit User & Roles Modal */}
      {editingUser && (
        <Modal
          titleId="edit-user-title"
          title={`Edit User: ${fullName(editingUser)}`}
          description="Update user details, linked member, and assigned roles."
          icon={<Avatar name={fullName(editingUser)} className="h-10 w-10 text-sm" />}
          size="lg"
          onClose={() => setEditingUser(null)}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                disabled={savingEdit}
                className={BUTTON}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-user-form"
                disabled={savingEdit}
                className={PRIMARY_BUTTON}
              >
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          }
        >
          <form id="edit-user-form" onSubmit={handleSaveEdit} className="p-5 space-y-5" noValidate>
            {editErrors.length > 0 && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                <ul className="list-disc pl-5 space-y-0.5">
                  {editErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-firstname" className="block text-[13px] font-medium text-slate-700">
                  First name
                </label>
                <input
                  id="edit-firstname"
                  type="text"
                  value={editForm.firstname}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, firstname: e.target.value }))}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label htmlFor="edit-lastname" className="block text-[13px] font-medium text-slate-700">
                  Last name
                </label>
                <input
                  id="edit-lastname"
                  type="text"
                  value={editForm.lastname}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, lastname: e.target.value }))}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="edit-email" className="block text-[13px] font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="edit-member" className="block text-[13px] font-medium text-slate-700">
                  Linked Church Member
                </label>
                <select
                  id="edit-member"
                  value={editForm.member_id}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, member_id: e.target.value }))}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  <option value="">— Not linked to a member —</option>
                  {availableMembersForEdit.map((m) => (
                    <option key={m.id} value={m.id}>
                      {[m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ')} ({m.phone_number || m.email || 'Member'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!editingUser.super_admin && (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-slate-900">Assigned Roles</h3>
                    <p className="text-xs text-slate-500">
                      This user will only see dashboard menus matching the permissions of their checked roles.
                    </p>
                  </div>
                  <Link
                    to="/admin/roles"
                    onClick={() => setEditingUser(null)}
                    className="text-xs font-medium text-red-700 hover:underline"
                  >
                    Create / edit roles →
                  </Link>
                </div>

                {roles.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-400">No roles defined yet.</p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {roles.map((role) => {
                      const checked = editForm.role_ids.includes(role.id);
                      const perms = role.permissions || [];
                      return (
                        <label
                          key={role.id}
                          className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                            checked
                              ? 'border-red-200 bg-red-50/40'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEditRole(role.id)}
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-red-700"
                          />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-slate-900">
                              {humanize(role.name)}
                            </span>
                            {role.description && (
                              <span className="mt-0.5 block text-xs text-slate-500">
                                {role.description}
                              </span>
                            )}
                            <span className="mt-1.5 flex flex-wrap gap-1">
                              {perms.length > 0 ? (
                                perms.map((p) => (
                                  <span
                                    key={p.id}
                                    className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600"
                                  >
                                    {humanize(p.name)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[11px] text-slate-400">No permissions</span>
                              )}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Super Admin Reset Password Modal */}
      {resettingUser && (
        <Modal
          titleId="reset-password-title"
          title={`Reset Password: ${fullName(resettingUser)}`}
          description={`Issue a new temporary password for ${resettingUser.email}.`}
          icon="key"
          size="sm"
          onClose={() => setResettingUser(null)}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                disabled={savingReset}
                className={BUTTON}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="reset-password-form"
                disabled={savingReset}
                className={PRIMARY_BUTTON}
              >
                {savingReset ? 'Resetting…' : 'Set Temporary Password'}
              </button>
            </div>
          }
        >
          <form id="reset-password-form" onSubmit={handleResetPassword} className="p-5 space-y-4" noValidate>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-relaxed text-amber-900">
              Once you set this temporary password, <strong>{fullName(resettingUser)}</strong> will sign in with it and immediately be asked to set their own personal password.
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="reset-temp-password" className="block text-[13px] font-medium text-slate-700">
                  New Temporary Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTempPassword(generateTempPassword());
                    setShowTempPassword(true);
                  }}
                  className="text-xs font-medium text-red-700 hover:underline"
                >
                  Generate another
                </button>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="reset-temp-password"
                  type={showTempPassword ? 'text' : 'password'}
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-10 font-mono text-[13px] text-slate-800 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
                <button
                  type="button"
                  onClick={() => setShowTempPassword((v) => !v)}
                  aria-label={showTempPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <Icon name={showTempPassword ? 'eyeSlash' : 'eye'} className="h-4 w-4" />
                </button>
              </div>
            </div>

            {resetError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {resetError}
              </p>
            )}
          </form>
        </Modal>
      )}

      {/* Delete User Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete user ${confirmDelete.email}?`}
          message={`This will permanently remove ${fullName(confirmDelete)}’s login account. Any linked church member record stays in the directory.`}
          confirmLabel="Delete user"
          busy={deleting}
          error={deleteError}
          onConfirm={handleDeleteUser}
          onCancel={() => {
            setConfirmDelete(null);
            setDeleteError(null);
          }}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}

export default UsersList;
