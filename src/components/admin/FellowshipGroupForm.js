import React, { useMemo, useRef, useState } from 'react';
import api from '../../redux/api';
import Icon from './Icon';
import { BUTTON, Modal, PRIMARY_BUTTON } from './ui';
import { saveErrorMessages } from './useAdminList';

const DESCRIPTION_LIMIT = 500;
const CODE_FORMAT = /^[A-Z0-9-]+$/;

const INPUT =
  'w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100';
const inputClass = (error) => `${INPUT} ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'}`;

export const memberFullName = (m) => [m.first_name, m.last_name].filter(Boolean).join(' ') || 'Unnamed member';

function Field({ id, label, optional = false, error, hint, children }) {
  const note = error || hint;
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
        {label} {optional && <span className="font-normal text-slate-400">(optional)</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {note && <p className={`mt-1.5 text-xs ${error ? 'font-medium text-red-600' : 'text-slate-500'}`}>{note}</p>}
    </div>
  );
}

/**
 * Create or edit a fellowship group.
 * - `group`: the group being edited, or null for a new one
 * - `prefillName`: a suggested name when starting from a quick-start chip
 * - `groups`: all groups, to catch duplicate names before saving
 * - `members`: everyone in the directory, for choosing a leader (may be empty)
 */
function FellowshipGroupForm({ group, prefillName = '', groups, members, onClose, onSaved }) {
  const initial = useMemo(
    () => ({
      group_name: group?.group_name || prefillName,
      group_code: group?.group_code || '',
      description: group?.description || '',
      leader_member_id: group?.leader?.id ? String(group.leader.id) : '',
    }),
    [group, prefillName]
  );
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);

  const editing = Boolean(group);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const leaderOptions = useMemo(() => [...members].sort((a, b) => memberFullName(a).localeCompare(memberFullName(b))), [members]);

  const update = (event) => {
    const { name } = event.target;
    const value = name === 'group_code' ? event.target.value.toUpperCase().replace(/\s+/g, '') : event.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const requestClose = () => {
    if (saving) return;
    if (!dirty || window.confirm(editing ? 'Discard your changes to this group?' : 'Discard this new group?')) onClose();
  };

  // The same rules as the backend, so most mistakes are caught before saving
  const validate = () => {
    const next = {};
    const name = form.group_name.trim();
    const code = form.group_code.trim();
    if (!name) next.group_name = 'Give the group a name';
    else if (name.length > 60) next.group_name = 'Keep it under 60 characters';
    else if (groups.some((g) => g.id !== group?.id && g.group_name.trim().toLowerCase() === name.toLowerCase())) next.group_name = 'There’s already a group with this name';
    if (code && !CODE_FORMAT.test(code)) next.group_code = 'Use letters, numbers and hyphens only';
    else if (code.length > 10) next.group_code = 'Keep it to 10 characters or fewer';
    else if (code && groups.some((g) => g.id !== group?.id && (g.group_code || '').toUpperCase() === code)) next.group_code = 'Another group already uses this code';
    if (form.description.length > DESCRIPTION_LIMIT) next.description = `Keep it under ${DESCRIPTION_LIMIT} characters`;
    setErrors(next);
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerErrors([]);
    const invalid = Object.keys(validate());
    if (invalid.length) {
      document.getElementById(`group-${invalid[0]}`)?.focus();
      return;
    }

    const body = {
      fellowship_group: {
        group_name: form.group_name.trim(),
        group_code: form.group_code.trim() || null,
        description: form.description.trim() || null,
        leader_member_id: form.leader_member_id ? Number(form.leader_member_id) : null,
      },
    };

    setSaving(true);
    try {
      const response = editing
        ? await api.patch(`/api/v1/fellowship_groups/${group.id}`, body)
        : await api.post('/api/v1/fellowship_groups', body);
      onSaved(response.data?.fellowship_group || null, body.fellowship_group);
    } catch (err) {
      setServerErrors(saveErrorMessages(err, 'fellowship groups', 'Could not save the group.'));
      setSaving(false);
    }
  };

  const footer = (
    <>
      {serverErrors.length > 0 && (
        <div role="alert" className="mb-3 flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-800">
          <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            {serverErrors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={requestClose} disabled={saving} className={BUTTON}>
          Cancel
        </button>
        <button type="submit" form="group-form" disabled={saving} className={PRIMARY_BUTTON}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Create group'}
        </button>
      </div>
    </>
  );

  return (
    <Modal
      titleId="group-form-title"
      title={editing ? `Edit ${group.group_name}` : 'Create a fellowship group'}
      description="Choir, youth, women’s and men’s fellowships, Sunday school: any group members belong to."
      icon="group"
      onClose={requestClose}
      initialFocusRef={nameRef}
      footer={footer}
    >
      <form id="group-form" onSubmit={handleSubmit} noValidate className="space-y-5 px-5 py-5">
        <Field id="group-group_name" label="Group name" error={errors.group_name}>
          <input
            ref={nameRef}
            id="group-group_name"
            name="group_name"
            value={form.group_name}
            onChange={update}
            placeholder="e.g. Church Choir"
            autoComplete="off"
            aria-invalid={Boolean(errors.group_name)}
            className={`${inputClass(errors.group_name)} h-9`}
          />
        </Field>

        <Field id="group-group_code" label="Short code" optional error={errors.group_code} hint="A short label for lists and reports, like CHR or YTH.">
          <input
            id="group-group_code"
            name="group_code"
            value={form.group_code}
            onChange={update}
            placeholder="CHR"
            maxLength={10}
            autoComplete="off"
            aria-invalid={Boolean(errors.group_code)}
            className={`${inputClass(errors.group_code)} h-9 w-32 font-medium uppercase tracking-wide`}
          />
        </Field>

        <Field id="group-description" label="About the group" optional error={errors.description}>
          <textarea
            id="group-description"
            name="description"
            rows={3}
            maxLength={DESCRIPTION_LIMIT}
            value={form.description}
            onChange={update}
            placeholder="Who it’s for, when and where it meets."
            className={`${inputClass(errors.description)} resize-y py-2 leading-relaxed`}
          />
          <p className="mt-1 text-right text-[11px] tabular-nums text-slate-400">
            {form.description.length} / {DESCRIPTION_LIMIT}
          </p>
        </Field>

        <Field
          id="group-leader_member_id"
          label="Leader"
          optional
          hint={members.length ? 'If they aren’t in the group yet, they’ll be added.' : 'Add people on the Members page to choose a leader.'}
        >
          <select
            id="group-leader_member_id"
            name="leader_member_id"
            value={form.leader_member_id}
            onChange={update}
            disabled={!members.length}
            className={`${inputClass()} h-9 pr-8 disabled:bg-slate-50 disabled:text-slate-400`}
          >
            <option value="">No leader</option>
            {leaderOptions.map((member) => (
              <option key={member.id} value={member.id}>
                {memberFullName(member)}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </Modal>
  );
}

export default FellowshipGroupForm;
