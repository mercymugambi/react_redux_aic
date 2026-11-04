import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessages } from '../../redux/api';
import Icon from './Icon';
import { Avatar, BUTTON, Modal, PRIMARY_BUTTON } from './ui';
import { toIsoDay } from './utils';

// Same rules as the Member model on the backend, so most mistakes are caught before saving
const PHONE_FORMAT = /^[\d\s+\-()]+$/;
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// In the order they appear, so a failed check focuses the first one on screen
const FIELD_ORDER = ['first_name', 'middle_name', 'last_name', 'phone_number', 'email', 'place_of_residence', 'date_of_birth'];

const INPUT =
  'h-9 w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100';
const inputClass = (error) => `${INPUT} ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'}`;

// One line of the form: the label on the left and its fields on the right
// (stacked on smaller screens)
function Row({ label, htmlFor, labelId, hint, children }) {
  const Label = htmlFor ? 'label' : 'p';
  return (
    <div className="grid gap-x-8 gap-y-2.5 py-5 md:grid-cols-[160px_minmax(0,1fr)]">
      <div className="md:pt-2">
        <Label htmlFor={htmlFor} id={labelId} className="block text-[13px] font-medium text-slate-800">
          {label}
        </Label>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function FieldError({ message }) {
  return message ? <p className="mt-1.5 text-xs font-medium text-red-600">{message}</p> : null;
}

// A text input with an icon inside its left edge
function IconInput({ icon, error, ...props }) {
  return (
    <div className="relative">
      <Icon name={icon} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input {...props} aria-invalid={Boolean(error)} className={`${inputClass(error)} pl-9`} />
    </div>
  );
}

function formFrom(member, prefill) {
  const source = member || prefill || {};
  return {
    first_name: source.first_name || '',
    middle_name: source.middle_name || '',
    last_name: source.last_name || '',
    phone_number: source.phone_number || '',
    email: source.email || '',
    date_of_birth: source.date_of_birth || '',
    place_of_residence: source.place_of_residence || '',
    groupIds: (member?.fellowship_groups || []).map((group) => group.id),
  };
}

/**
 * Add or edit a member.
 * - `member`: the member being edited, or null to add one
 * - `prefill`: when adding someone who already has a login account:
 *   { first_name, last_name, email, user_id, accountEmail }
 * - `groups`: every fellowship group, for the group picker
 * - `onSaved(savedMember, { linkRequested })`
 */
function MemberForm({ member, prefill, groups, onClose, onSaved }) {
  const initial = useMemo(() => formFrom(member, prefill), [member, prefill]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  const editing = Boolean(member);
  const fullName = [member?.first_name, member?.last_name].filter(Boolean).join(' ') || 'Member';
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const today = toIsoDay(new Date());

  const update = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const toggleGroup = (id) =>
    setForm((prev) => ({ ...prev, groupIds: prev.groupIds.includes(id) ? prev.groupIds.filter((groupId) => groupId !== id) : [...prev.groupIds, id] }));

  const requestClose = () => {
    if (saving) return;
    if (!dirty || window.confirm(editing ? 'Discard your changes to this member?' : 'Discard this new member?')) onClose();
  };

  const validate = () => {
    const next = {};
    const value = (name) => form[name].trim();
    if (!value('first_name')) next.first_name = 'First name is required';
    else if (value('first_name').length > 50) next.first_name = 'Keep it under 50 characters';
    if (!value('last_name')) next.last_name = 'Last name is required';
    else if (value('last_name').length > 50) next.last_name = 'Keep it under 50 characters';
    if (value('middle_name').length > 50) next.middle_name = 'Keep it under 50 characters';
    if (!value('phone_number')) next.phone_number = 'Phone number is required';
    else if (!PHONE_FORMAT.test(value('phone_number'))) next.phone_number = 'Use only digits, spaces and + - ( )';
    else if (value('phone_number').length > 20) next.phone_number = 'Keep it under 20 characters';
    if (value('email') && !EMAIL_FORMAT.test(value('email'))) next.email = 'Enter a valid email address';
    if (form.date_of_birth && form.date_of_birth > today) next.date_of_birth = 'Date of birth can’t be in the future';
    if (value('place_of_residence').length > 100) next.place_of_residence = 'Keep it under 100 characters';
    setErrors(next);
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerErrors([]);
    const invalid = Object.keys(validate());
    if (invalid.length) {
      const first = FIELD_ORDER.find((name) => invalid.includes(name));
      document.getElementById(`member-${first}`)?.focus();
      return;
    }

    const fields = Object.fromEntries(FIELD_ORDER.map((name) => [name, form[name].trim()]));
    const linkRequested = !editing && Boolean(prefill?.user_id);
    const body = { member: { ...fields, fellowship_group_ids: form.groupIds, ...(linkRequested && { user_id: prefill.user_id }) } };

    setSaving(true);
    try {
      const response = editing ? await api.patch(`/api/v1/members/${member.id}`, body) : await api.post('/api/v1/members', body);
      onSaved(response.data.member, { linkRequested });
    } catch (err) {
      setServerErrors(apiErrorMessages(err, 'Could not save the member.'));
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
        <button type="submit" form="member-form" disabled={saving} className={PRIMARY_BUTTON}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add member'}
        </button>
      </div>
    </>
  );

  return (
    <Modal
      titleId="member-form-title"
      title={editing ? `Edit ${fullName}` : 'Add a member'}
      description={editing ? 'Changes show up in the directory straight away.' : 'Add someone to the church directory.'}
      icon={editing ? <Avatar name={fullName} className="h-10 w-10 text-sm" /> : 'userPlus'}
      size="lg"
      onClose={requestClose}
      initialFocusRef={firstRef}
      footer={footer}
    >
      <form id="member-form" onSubmit={handleSubmit} noValidate className="px-5">
        {prefill?.accountEmail && !editing && (
          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50/70 px-3 py-2.5 text-[13px] text-sky-900">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <p>
              This member will be linked to the login account <span className="font-medium">{prefill.accountEmail}</span>. Check the details and add their phone number.
            </p>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          <Row label="Full name" labelId="member-name-label" hint="Middle name is optional.">
            <div role="group" aria-labelledby="member-name-label" className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="member-first_name" className="sr-only">
                  First name
                </label>
                <input
                  ref={firstRef}
                  id="member-first_name"
                  name="first_name"
                  value={form.first_name}
                  onChange={update}
                  placeholder="First name"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.first_name)}
                  className={inputClass(errors.first_name)}
                />
                <FieldError message={errors.first_name} />
              </div>
              <div>
                <label htmlFor="member-middle_name" className="sr-only">
                  Middle name (optional)
                </label>
                <input
                  id="member-middle_name"
                  name="middle_name"
                  value={form.middle_name}
                  onChange={update}
                  placeholder="Middle name"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.middle_name)}
                  className={inputClass(errors.middle_name)}
                />
                <FieldError message={errors.middle_name} />
              </div>
              <div>
                <label htmlFor="member-last_name" className="sr-only">
                  Last name
                </label>
                <input
                  id="member-last_name"
                  name="last_name"
                  value={form.last_name}
                  onChange={update}
                  placeholder="Last name"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.last_name)}
                  className={inputClass(errors.last_name)}
                />
                <FieldError message={errors.last_name} />
              </div>
            </div>
          </Row>

          <Row label="Phone number" htmlFor="member-phone_number">
            <IconInput
              icon="phone"
              id="member-phone_number"
              name="phone_number"
              type="tel"
              value={form.phone_number}
              onChange={update}
              placeholder="+254 712 345 678"
              autoComplete="off"
              error={errors.phone_number}
            />
            <FieldError message={errors.phone_number} />
          </Row>

          <Row label="Email" htmlFor="member-email" hint="Optional">
            <IconInput
              icon="mail"
              id="member-email"
              name="email"
              type="email"
              value={form.email}
              onChange={update}
              placeholder="name@example.com"
              autoComplete="off"
              error={errors.email}
            />
            <FieldError message={errors.email} />
          </Row>

          <Row label="Place of residence" htmlFor="member-place_of_residence" hint="Optional">
            <IconInput
              icon="mapPin"
              id="member-place_of_residence"
              name="place_of_residence"
              value={form.place_of_residence}
              onChange={update}
              placeholder="e.g. Kabuku"
              autoComplete="off"
              error={errors.place_of_residence}
            />
            <FieldError message={errors.place_of_residence} />
          </Row>

          <Row label="Date of birth" htmlFor="member-date_of_birth" hint="Optional. Used to flag upcoming birthdays.">
            <input
              id="member-date_of_birth"
              name="date_of_birth"
              type="date"
              max={today}
              value={form.date_of_birth}
              onChange={update}
              aria-invalid={Boolean(errors.date_of_birth)}
              className={`${inputClass(errors.date_of_birth)} sm:w-52`}
            />
            <FieldError message={errors.date_of_birth} />
          </Row>

          <Row label="Fellowship groups" labelId="member-groups-label" hint="Optional. Choose any that apply.">
            {groups.length ? (
              <div className="flex flex-wrap gap-2 md:pt-0.5" role="group" aria-labelledby="member-groups-label">
                {groups.map((group) => {
                  const on = form.groupIds.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleGroup(group.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 ${
                        on ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon name={on ? 'check' : 'plus'} className="h-3.5 w-3.5" strokeWidth={2} />
                      {group.group_name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] leading-relaxed text-slate-500 md:pt-2">
                No fellowship groups exist yet.{' '}
                <Link to="/admin/fellowship-groups" className="font-medium text-red-700 underline-offset-2 hover:underline">
                  Create them on the Fellowship Groups page
                </Link>{' '}
                and they’ll appear here.
              </p>
            )}
          </Row>
        </div>
      </form>
    </Modal>
  );
}

export default MemberForm;
