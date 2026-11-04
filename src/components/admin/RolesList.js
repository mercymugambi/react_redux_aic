import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { apiErrorMessage, apiErrorMessages } from '../../redux/api';
import { humanize } from '../../auth/permissions';
import Icon from './Icon';
import {
  BUTTON,
  ConfirmDialog,
  Modal,
  PRIMARY_BUTTON,
  Skeleton,
  StatCard,
  Toast,
  useToast,
} from './ui';

const PILL = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium';
const ICON_ACTION =
  'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50/60 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';

const EMPTY_ROLE = {
  name: '',
  description: '',
  permission_ids: [],
};

function RolesList() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, flash] = useToast();

  const [query, setQuery] = useState('');
  const [editingRole, setEditingRole] = useState(null); // null | 'new' | role object
  const [form, setForm] = useState(EMPTY_ROLE);
  const [formErrors, setFormErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/api/v1/roles'),
        api.get('/api/v1/permissions'),
      ]);
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setPermissions(Array.isArray(permsRes.data) ? permsRes.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load roles and permissions.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRoles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (role) =>
        role.name?.toLowerCase().includes(q) ||
        role.description?.toLowerCase().includes(q) ||
        (role.permissions || []).some((p) => p.name?.toLowerCase().includes(q))
    );
  }, [roles, query]);

  const totalAssignedUsers = useMemo(
    () => roles.reduce((sum, r) => sum + (Number(r.users_count) || 0), 0),
    [roles]
  );

  const openCreateModal = () => {
    setEditingRole('new');
    setForm(EMPTY_ROLE);
    setFormErrors([]);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name || '',
      description: role.description || '',
      permission_ids: (role.permissions || []).map((p) => p.id),
    });
    setFormErrors([]);
  };

  const closeModal = () => {
    setEditingRole(null);
    setForm(EMPTY_ROLE);
    setFormErrors([]);
  };

  const togglePermission = (id) => {
    setForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(id)
        ? prev.permission_ids.filter((pid) => pid !== id)
        : [...prev.permission_ids, id],
    }));
  };

  const selectAllPermissions = () => {
    setForm((prev) => ({
      ...prev,
      permission_ids: permissions.map((p) => p.id),
    }));
  };

  const clearAllPermissions = () => {
    setForm((prev) => ({
      ...prev,
      permission_ids: [],
    }));
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    const trimmedName = form.name.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmedName) {
      setFormErrors(['Role name is required.']);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        role: {
          name: trimmedName,
          description: form.description.trim(),
          permission_ids: form.permission_ids,
        },
      };
      if (editingRole === 'new') {
        const res = await api.post('/api/v1/roles', payload);
        setRoles((prev) => [...prev, res.data]);
        flash(`Role “${humanize(res.data.name)}” created`);
      } else {
        const res = await api.patch(`/api/v1/roles/${editingRole.id}`, payload);
        setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? res.data : r)));
        flash(`Role “${humanize(res.data.name)}” updated`);
      }
      closeModal();
    } catch (err) {
      setFormErrors(apiErrorMessages(err, 'Could not save the role.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/roles/${confirmDelete.id}`);
      setRoles((prev) => prev.filter((r) => r.id !== confirmDelete.id));
      flash(`Role “${humanize(confirmDelete.name)}” deleted`);
      setConfirmDelete(null);
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'Could not delete role.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Access Control</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Roles & Permissions
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Create custom roles and assign permissions to control which dashboard sections each user can access.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={loadData} disabled={loading} className={BUTTON}>
            <Icon name="refresh" className="h-3.5 w-3.5 text-slate-500" />
            Refresh
          </button>
          <button type="button" onClick={openCreateModal} className={PRIMARY_BUTTON}>
            <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
            Create Role
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <section aria-label="Roles summary" className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <StatCard
          label="Defined Roles"
          icon="key"
          tone="red"
          value={roles.length}
          caption="Custom access roles in database"
          loading={loading}
        />
        <StatCard
          label="Available Permissions"
          icon="shield"
          tone="emerald"
          value={permissions.length}
          caption="Granular module capabilities"
          loading={loading}
        />
        <StatCard
          label="Role Assignments"
          icon="users"
          tone="sky"
          value={totalAssignedUsers}
          caption="Total user-role links active"
          loading={loading}
        />
      </section>

      {/* Main Card */}
      <section aria-label="Roles table" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 px-4 py-3">
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Icon
              name="search"
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles or permissions…"
              aria-label="Search roles"
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
          <span className="text-xs text-slate-500">
            Showing <strong className="font-medium text-slate-700">{filteredRoles.length}</strong> role
            {filteredRoles.length === 1 ? '' : 's'}
          </span>
        </div>

        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-slate-800">Couldn’t load roles</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button type="button" onClick={loadData} className={`mt-3 ${BUTTON}`}>
              <Icon name="refresh" className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-slate-700">
              {query ? 'No roles match your search' : 'No roles created yet'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {query
                ? 'Try clearing your search filter.'
                : 'Click "Create Role" to add your first role and assign permissions.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60">
                  <th scope="col" className="pl-4 pr-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Role Name
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Description
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Permissions
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Users
                  </th>
                  <th scope="col" className="pr-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRoles.map((role) => {
                  const rolePerms = role.permissions || [];
                  return (
                    <tr
                      key={role.id}
                      onClick={() => openEditModal(role)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/70"
                    >
                      <td className="pl-4 pr-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-100">
                            <Icon name="key" className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-slate-900">{humanize(role.name)}</p>
                            <p className="font-mono text-[11px] text-slate-400">{role.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 max-w-xs">
                        {role.description || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-3 py-3">
                        {rolePerms.length === 0 ? (
                          <span className="text-xs text-slate-400">No permissions assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {rolePerms.map((perm) => (
                              <span
                                key={perm.id}
                                title={perm.description || perm.name}
                                className={`${PILL} border-slate-200 bg-slate-50 text-slate-700`}
                              >
                                {humanize(perm.name)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`${PILL} border-slate-200 bg-white text-slate-700`}>
                          {role.users_count || 0} user{role.users_count === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td
                        className="pr-4 py-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(role)}
                            title="Edit role & permissions"
                            aria-label={`Edit ${role.name}`}
                            className={ICON_ACTION}
                          >
                            <Icon name="pencil" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(role)}
                            title="Delete role"
                            aria-label={`Delete ${role.name}`}
                            className={ICON_ACTION}
                          >
                            <Icon name="trash" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create / Edit Role Modal */}
      {editingRole && (
        <Modal
          titleId="role-modal-title"
          title={editingRole === 'new' ? 'Create New Role' : `Edit Role: ${humanize(editingRole.name)}`}
          description="Define the role name and select which permissions users with this role will have."
          icon="key"
          size="lg"
          onClose={closeModal}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={closeModal} disabled={saving} className={BUTTON}>
                Cancel
              </button>
              <button
                type="submit"
                form="role-form"
                disabled={saving}
                className={PRIMARY_BUTTON}
              >
                {saving ? 'Saving…' : editingRole === 'new' ? 'Create Role' : 'Save Changes'}
              </button>
            </div>
          }
        >
          <form id="role-form" onSubmit={handleSaveRole} className="p-5 space-y-5" noValidate>
            {formErrors.length > 0 && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                <p className="font-semibold">Please fix the following:</p>
                <ul className="mt-1 list-disc pl-5 space-y-0.5">
                  {formErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="role-name" className="block text-[13px] font-medium text-slate-700">
                  Role Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="role-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Pastor, Treasurer, Secretary"
                  required
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Stored as <code className="font-mono text-slate-600">{form.name.trim().toLowerCase().replace(/\s+/g, '_') || 'role_name'}</code>
                </p>
              </div>

              <div>
                <label htmlFor="role-description" className="block text-[13px] font-medium text-slate-700">
                  Description
                </label>
                <input
                  id="role-description"
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short summary of what this role manages"
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[13px] font-semibold text-slate-900">
                    Permissions ({form.permission_ids.length} of {permissions.length} selected)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Users assigned this role will only see dashboard sections matching these permissions.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllPermissions}
                    className="font-medium text-red-700 hover:underline"
                  >
                    Select all
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={clearAllPermissions}
                    className="font-medium text-slate-500 hover:text-slate-800"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {permissions.length === 0 ? (
                <p className="mt-3 text-xs text-slate-400">No permissions found in database.</p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {permissions.map((perm) => {
                    const checked = form.permission_ids.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                          checked
                            ? 'border-red-200 bg-red-50/40'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(perm.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-red-700"
                        />
                        <span className="min-w-0">
                          <span className="block text-[13px] font-medium text-slate-900">
                            {humanize(perm.name)}
                          </span>
                          {perm.description && (
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {perm.description}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Role Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete role “${humanize(confirmDelete.name)}”?`}
          message="Users with this role will lose the permissions granted by it unless they hold another role."
          confirmLabel="Delete role"
          busy={deleting}
          error={deleteError}
          onConfirm={handleDeleteRole}
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

export default RolesList;
