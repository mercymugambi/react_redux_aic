import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { apiErrorMessage, apiErrorMessages } from '../../redux/api';
import { humanize } from '../../auth/permissions';
import Icon from './Icon';

const BUTTON =
  'inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-not-allowed disabled:opacity-50';
const PRIMARY_BUTTON =
  'inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-700 px-3 text-[13px] font-medium text-white shadow-sm transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const CARD = 'rounded-xl border border-slate-200 bg-white p-4 sm:p-5';

const EMPTY_FORM = { firstname: '', lastname: '', email: '', password: '', member_id: '' };

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let result = 'Aic@';
  for (let i = 0; i < 6; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function TextField({ name, label, error, hint, trailing, className = '', ...inputProps }) {
  const id = `add-user-${name}`;
  const note = error || hint;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={note ? `${id}-note` : undefined}
          className={`h-9 w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100 ${
            error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'
          } ${trailing ? 'pr-10' : ''}`}
          {...inputProps}
        />
        {trailing}
      </div>
      {note && (
        <p id={`${id}-note`} className={`mt-1.5 text-xs ${error ? 'font-medium text-red-600' : 'text-slate-500'}`}>
          {note}
        </p>
      )}
    </div>
  );
}

function RoleOption({ role, checked, onToggle }) {
  const permissions = role.permissions || [];

  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
        checked ? 'border-red-200 bg-red-50/40' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-red-700"
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-slate-900">{humanize(role.name)}</span>
        {role.description && <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{role.description}</span>}
        <span className="mt-2 flex flex-wrap gap-1">
          {permissions.length ? (
            permissions.map((permission) => (
              <span
                key={permission.id}
                title={permission.description || undefined}
                className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-600"
              >
                {humanize(permission.name)}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">No permissions</span>
          )}
        </span>
      </span>
    </label>
  );
}

function AddUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [roleIds, setRoleIds] = useState([]);
  const [showPassword, setShowPassword] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [roles, setRoles] = useState([]);
  const [members, setMembers] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState(null);

  const loadData = useCallback(() => {
    setRolesLoading(true);
    setRolesError(null);
    Promise.all([
      api.get('/api/v1/roles'),
      api.get('/api/v1/members').catch(() => ({ data: [] })),
    ])
      .then(([rolesRes, membersRes]) => {
        setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
        setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
        setRolesLoading(false);
      })
      .catch((err) => {
        setRolesError(apiErrorMessage(err, 'Failed to load roles.'));
        setRolesLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleMemberSelect = (event) => {
    const memberId = event.target.value;
    const picked = members.find((m) => String(m.id) === String(memberId));
    setForm((prev) => ({
      ...prev,
      member_id: memberId,
      firstname: picked && !prev.firstname ? picked.first_name || '' : prev.firstname,
      lastname: picked && !prev.lastname ? picked.last_name || '' : prev.lastname,
      email: picked && !prev.email && picked.email ? picked.email : prev.email,
    }));
  };

  const toggleRole = (id) => {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((roleId) => roleId !== id) : [...prev, id]));
  };

  const validateFields = () => {
    const errors = {};
    if (!form.firstname.trim()) errors.firstname = 'First name is required';
    if (!form.lastname.trim()) errors.lastname = 'Last name is required';
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!form.password) {
      errors.password = 'Temporary password is required';
    } else if (form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFieldErrors(errors);
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerErrors([]);
    if (Object.keys(validateFields()).length > 0) return;

    setSubmitting(true);
    try {
      const response = await api.post('/api/v1/users', {
        email: form.email.trim(),
        password: form.password,
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        member_id: form.member_id || null,
        role_ids: roleIds,
      });
      navigate('/admin/users', { state: { createdEmail: response.data.user?.email || form.email.trim() } });
    } catch (err) {
      setServerErrors(apiErrorMessages(err, 'Could not create the user. Please try again.'));
      setSubmitting(false);
    }
  };

  const unlinkedMembers = members.filter((m) => !m.user);

  let rolesBody;
  if (rolesLoading) {
    rolesBody = <p className="loading-message">Loading roles…</p>;
  } else if (rolesError) {
    rolesBody = (
      <div className="error-message flex flex-wrap items-center justify-between gap-3">
        <span>{rolesError}</span>
        <button type="button" onClick={loadData} className={BUTTON}>
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  } else if (roles.length === 0) {
    rolesBody = (
      <p className="text-[13px] text-slate-500">
        No roles have been set up yet.{' '}
        <Link to="/admin/roles" className="font-medium text-red-700 hover:underline">
          Create a role first
        </Link>
        .
      </p>
    );
  } else {
    rolesBody = (
      <div className="grid gap-2 md:grid-cols-2">
        {roles.map((role) => (
          <RoleOption key={role.id} role={role} checked={roleIds.includes(role.id)} onToggle={() => toggleRole(role.id)} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl font-sans pb-8">
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-[13px] text-slate-500 transition hover:text-slate-900">
        <Icon name="chevronLeft" className="h-3.5 w-3.5" strokeWidth={2} />
        Users
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-slate-900">Add user</h1>
      <p className="mt-1 text-[13px] text-slate-500">
        Create a login account, assign roles, and issue a temporary password. Upon their first sign-in, they will be prompted to set their own password.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <section className={CARD}>
          <h2 className="text-[15px] font-semibold text-slate-900">Account details</h2>

          {unlinkedMembers.length > 0 && (
            <div className="mt-4">
              <label htmlFor="add-user-member" className="block text-[13px] font-medium text-slate-700">
                Link to Existing Church Member (optional)
              </label>
              <select
                id="add-user-member"
                value={form.member_id}
                onChange={handleMemberSelect}
                className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              >
                <option value="">— Do not link / enter manually —</option>
                {unlinkedMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {[m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ')} ({m.phone_number || m.email || 'Member'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField name="firstname" label="First name" value={form.firstname} onChange={updateField} error={fieldErrors.firstname} autoComplete="off" />
            <TextField name="lastname" label="Last name" value={form.lastname} onChange={updateField} error={fieldErrors.lastname} autoComplete="off" />
            <TextField
              name="email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={updateField}
              error={fieldErrors.email}
              autoComplete="off"
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="add-user-password" className="block text-[13px] font-medium text-slate-700">
                  Temporary Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, password: generateTempPassword() }));
                    setShowPassword(true);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  className="text-xs font-medium text-red-700 hover:underline"
                >
                  Generate password
                </button>
              </div>
              <div className="relative mt-1.5">
                <input
                  id="add-user-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={updateField}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className={`h-9 w-full rounded-lg border bg-white pl-3 pr-10 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100 ${
                    fieldErrors.password ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition hover:text-slate-700"
                >
                  <Icon name={showPassword ? 'eyeSlash' : 'eye'} className="h-4 w-4" />
                </button>
              </div>
              <p className={`mt-1.5 text-xs ${fieldErrors.password ? 'font-medium text-red-600' : 'text-slate-500'}`}>
                {fieldErrors.password || 'Share this temporary password with the user. They will be asked to change it on their first login.'}
              </p>
            </div>
          </div>
        </section>

        <section className={CARD}>
          <fieldset>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <legend className="text-[15px] font-semibold text-slate-900">Assign Roles</legend>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  Each role grants its listed permissions. The user will only see dashboard menus allowed by their assigned roles.
                </p>
              </div>
              <Link to="/admin/roles" className="text-xs font-medium text-red-700 hover:underline">
                Manage roles & permissions →
              </Link>
            </div>
            <div className="mt-4">{rolesBody}</div>
          </fieldset>
        </section>

        {serverErrors.length > 0 && (
          <div role="alert" className="error-message">
            {serverErrors.length === 1 ? (
              serverErrors[0]
            ) : (
              <ul className="list-disc space-y-1 pl-5">
                {serverErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Link to="/admin/users" className={BUTTON}>
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className={PRIMARY_BUTTON}>
            {submitting ? 'Creating user…' : 'Create user'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddUser;
