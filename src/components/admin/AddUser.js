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

const EMPTY_FORM = { firstname: '', lastname: '', email: '', password: '' };

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

// Super admin only: App.js wraps this route in PermissionRoute, and the API
// rejects anyone else with a 403.
function AddUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [roleIds, setRoleIds] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState(null);

  const loadRoles = useCallback(() => {
    setRolesLoading(true);
    setRolesError(null);
    api.get('/api/v1/roles')
      .then((response) => {
        setRoles(response.data);
        setRolesLoading(false);
      })
      .catch((err) => {
        setRolesError(apiErrorMessage(err, 'Failed to load roles.'));
        setRolesLoading(false);
        console.error(err);
      });
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
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
      errors.password = 'Password is required';
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
        role_ids: roleIds,
      });
      // The users page loads the list fresh when it mounts
      navigate('/admin/users', { state: { createdEmail: response.data.user?.email || form.email.trim() } });
    } catch (err) {
      setServerErrors(apiErrorMessages(err, 'Could not create the user. Please try again.'));
      setSubmitting(false);
    }
  };

  let rolesBody;
  if (rolesLoading) {
    rolesBody = <p className="loading-message">Loading roles…</p>;
  } else if (rolesError) {
    rolesBody = (
      <div className="error-message flex flex-wrap items-center justify-between gap-3">
        <span>{rolesError}</span>
        <button type="button" onClick={loadRoles} className={BUTTON}>
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  } else if (roles.length === 0) {
    rolesBody = <p className="text-[13px] text-slate-500">No roles have been set up yet.</p>;
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
    <div className="mx-auto w-full max-w-3xl font-sans">
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-[13px] text-slate-500 transition hover:text-slate-900">
        <Icon name="chevronLeft" className="h-3.5 w-3.5" strokeWidth={2} />
        Users
      </Link>
      <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-slate-900">Add user</h1>
      <p className="mt-1 text-[13px] text-slate-500">They’ll sign in to the admin console with this email and password.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <section className={CARD}>
          <h2 className="text-[15px] font-semibold text-slate-900">Account details</h2>
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
            <TextField
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={updateField}
              error={fieldErrors.password}
              hint="At least 6 characters. Share it with them privately."
              autoComplete="new-password"
              className="sm:col-span-2"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition hover:text-slate-700"
                >
                  <Icon name={showPassword ? 'eyeSlash' : 'eye'} className="h-4 w-4" />
                </button>
              }
            />
          </div>
        </section>

        <section className={CARD}>
          <fieldset>
            <legend className="text-[15px] font-semibold text-slate-900">Roles</legend>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Each role gives the permissions listed under it. A user with no roles can sign in but only sees the overview.
            </p>
            <div className="mt-4">{rolesBody}</div>
          </fieldset>
        </section>

        {serverErrors.length > 0 && (
          <div role="alert" className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
            <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            {serverErrors.length === 1 ? (
              <p>{serverErrors[0]}</p>
            ) : (
              <ul className="list-disc space-y-0.5 pl-4">
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
