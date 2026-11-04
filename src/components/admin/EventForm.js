import React, { useMemo, useRef, useState } from 'react';
import api from '../../redux/api';
import { clockTime, EVENT_CATEGORIES, eventImage, REGISTRATION_MODES } from '../../data/events';
import { coverFileError, CoverPicker, useObjectUrl } from './CoverPicker';
import Icon from './Icon';
import { BUTTON, Modal, PRIMARY_BUTTON } from './ui';
import { saveErrorMessages } from './useAdminList';
import { parseDate, toIsoDay } from './utils';

// Limits shared with the backend (Event model)
const TITLE_LIMIT = 150;
const DESCRIPTION_LIMIT = 3000;
const CAPACITY_LIMIT = 10000;
// In the order they appear, so a failed check focuses the first one
const FIELD_ORDER = ['title', 'category', 'date', 'end_date', 'start_time', 'end_time', 'description', 'cover', 'registration_url', 'capacity'];
const FIELD_IDS = {
  title: 'event-title',
  category: 'event-category',
  date: 'event-date',
  end_date: 'event-end-date',
  start_time: 'event-start',
  end_time: 'event-end',
  description: 'event-description',
  registration_url: 'event-registration-url',
  capacity: 'event-capacity',
};

const isHttpLink = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch (error) {
    return false;
  }
};

function formFrom(event) {
  return {
    title: event?.title || '',
    category: event?.category || '',
    audience: event?.audience || '',
    date: event?.date || '',
    end_date: event?.end_date && event.end_date !== event.date ? event.end_date : '',
    start_time: clockTime(event?.start_time),
    end_time: clockTime(event?.end_time),
    location: event?.location || '',
    speaker: event?.speaker || '',
    speaker_role: event?.speaker_role || '',
    description: event?.description || '',
    registration: event?.registration || 'none',
    registration_url: event?.registration_url || '',
    capacity: event?.capacity ? String(event.capacity) : '',
    featured: Boolean(event?.featured),
  };
}

/* Sent as multipart form data so the cover photo can travel with the rest. Form data has
   no null, so a blank value means "none"; booleans are "true" / "false". */
export function buildEventFormData(fields, { coverFile = null, removeCover = false } = {}) {
  const data = new FormData();
  Object.entries(fields).forEach(([name, value]) => {
    data.append(`event[${name}]`, typeof value === 'boolean' ? String(value) : value ?? '');
  });
  if (coverFile) data.append('event[cover_image]', coverFile);
  else if (removeCover) data.append('event[remove_cover_image]', 'true');
  return data;
}

const INPUT =
  'w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100';
const inputClass = (error) => `${INPUT} ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'}`;
const SECTION = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400';

function Field({ id, label, optional = false, error, hint, className = '', children }) {
  const note = error || hint;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
        {label} {optional && <span className="font-normal text-slate-400">(optional)</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {note && <div className={`mt-1.5 text-xs ${error ? 'font-medium text-red-600' : 'text-slate-500'}`}>{note}</div>}
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 ${
        checked ? 'bg-red-700' : 'bg-slate-200'
      }`}
    >
      <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

/**
 * Add or edit an event.
 * - `event`: the event being edited, or null to add one
 * - `onSaved(savedEvent, { status, created })`
 */
function EventForm({ event = null, onClose, onSaved }) {
  const initial = useMemo(() => formFrom(event), [event]);
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const titleRef = useRef(null);
  const coverRef = useRef(null);

  const editing = Boolean(event);
  // Events from before statuses existed were all public
  const status = editing ? event.status || 'published' : 'new';
  const savedCover = eventImage(event || {});
  const coverPreview = useObjectUrl(coverFile);
  const coverUrl = coverPreview || (removeCover ? null : savedCover);
  const seatsTaken = event?.seats_taken || 0;
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || Boolean(coverFile) || removeCover;
  const nextDay = (() => {
    const start = parseDate(form.date);
    if (!start) return '';
    start.setDate(start.getDate() + 1);
    return toIsoDay(start);
  })();
  const endsBeforeStart = Boolean(form.start_time && form.end_time && form.end_time <= form.start_time && (!form.end_date || form.end_date <= form.date));

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };
  const update = (changeEvent) => set(changeEvent.target.name, changeEvent.target.value);

  const requestClose = () => {
    if (saving) return;
    if (!dirty || window.confirm(editing ? 'Discard your changes to this event?' : 'Discard this event? What you’ve entered will be lost.')) onClose();
  };

  const pickCover = (file) => {
    setCoverFile(file);
    setRemoveCover(false);
    setErrors((prev) => ({ ...prev, cover: coverFileError(file) }));
  };
  const clearCover = () => {
    setCoverFile(null);
    setRemoveCover(Boolean(savedCover));
    setErrors((prev) => ({ ...prev, cover: '' }));
  };

  // A draft needs a title and a date; anything people will see needs the details too
  const validate = (complete) => {
    const next = {};
    if (!form.title.trim()) next.title = 'Give the event a title';
    if (!form.date) next.date = 'Pick the date';
    if (form.end_date && form.date && form.end_date < form.date) next.end_date = 'Can’t be before the start date';
    if (form.end_time && !form.start_time) next.start_time = 'Add a start time too';
    if (endsBeforeStart) next.end_time = 'Ends before it starts';
    if (complete) {
      if (!form.category) next.category = 'Pick a category so people can find it';
      if (!form.description.trim()) next.description = 'Say what’s happening and who it’s for';
    }
    if (form.registration === 'external' && !isHttpLink(form.registration_url.trim())) next.registration_url = 'Use a full link starting with http:// or https://';
    if (form.registration === 'rsvp' && form.capacity) {
      const capacity = Number(form.capacity);
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > CAPACITY_LIMIT) next.capacity = `Use a whole number from 1 to ${CAPACITY_LIMIT.toLocaleString()}`;
      else if (capacity < seatsTaken) next.capacity = `${seatsTaken} seats are already taken`;
    }
    const coverError = coverFileError(coverFile);
    if (coverError) next.cover = coverError;
    setErrors(next);
    return next;
  };

  const save = async (nextStatus) => {
    if (saving) return;
    setServerErrors([]);
    const invalid = validate(nextStatus !== 'draft');
    const first = FIELD_ORDER.find((name) => invalid[name]);
    if (first) {
      if (first === 'cover') coverRef.current?.focus();
      else document.getElementById(FIELD_IDS[first])?.focus();
      return;
    }

    const fields = {
      title: form.title.trim(),
      category: form.category,
      status: nextStatus,
      featured: form.featured,
      date: form.date,
      end_date: form.end_date && form.end_date !== form.date ? form.end_date : '',
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location.trim(),
      speaker: form.speaker.trim(),
      speaker_role: form.speaker_role.trim(),
      audience: form.audience.trim(),
      description: form.description.trim(),
      registration: form.registration,
      registration_url: form.registration === 'external' ? form.registration_url.trim() : '',
      capacity: form.registration === 'rsvp' ? form.capacity : '',
    };

    setSaving(nextStatus);
    try {
      const data = buildEventFormData(fields, { coverFile, removeCover });
      const response = editing ? await api.patch(`/api/v1/events/${event.id}`, data) : await api.post('/api/v1/events', data);
      onSaved(response.data?.event || null, { status: nextStatus, created: !editing });
    } catch (err) {
      setServerErrors(saveErrorMessages(err, 'events', 'Could not save the event. Please try again.'));
      setSaving(null);
    }
  };

  const draftable = status === 'new' || status === 'draft';
  const footer = (
    <>
      {serverErrors.length > 0 && (
        <div role="alert" className="mb-3 flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-800">
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === 'cancelled' && <p className="mr-auto text-xs text-slate-500">This event is marked as cancelled.</p>}
        <button type="button" onClick={requestClose} disabled={Boolean(saving)} className={BUTTON}>
          Cancel
        </button>
        {draftable ? (
          <>
            <button type="button" onClick={() => save('draft')} disabled={Boolean(saving)} className={BUTTON}>
              {saving === 'draft' ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" onClick={() => save('published')} disabled={Boolean(saving)} className={PRIMARY_BUTTON}>
              {saving === 'published' ? 'Publishing…' : 'Publish'}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => save(status)} disabled={Boolean(saving)} className={PRIMARY_BUTTON}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        )}
      </div>
    </>
  );

  return (
    <Modal
      titleId="event-form-title"
      title={editing ? `Edit “${event.title || 'event'}”` : 'Add an event'}
      description="Services, conferences, youth nights, outreach — anything members should know about."
      icon="calendar"
      size="xl"
      onClose={requestClose}
      initialFocusRef={titleRef}
      footer={footer}
    >
      <form
        id="event-form"
        noValidate
        onSubmit={(submitEvent) => {
          submitEvent.preventDefault();
          save(draftable ? 'published' : status);
        }}
        className="grid lg:grid-cols-[minmax(0,1fr)_19rem]"
      >
        {/* The event */}
        <div className="min-w-0 space-y-6 px-5 py-5">
          <div className="space-y-4">
            <Field id="event-title" label="Title" error={errors.title}>
              <input
                ref={titleRef}
                id="event-title"
                name="title"
                value={form.title}
                onChange={update}
                maxLength={TITLE_LIMIT}
                placeholder="e.g. Youth Revival & Worship Night"
                aria-invalid={Boolean(errors.title)}
                className={`${inputClass(errors.title)} h-10 text-[15px] font-medium`}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="event-category" label="Category" error={errors.category}>
                <select id="event-category" name="category" value={form.category} onChange={update} aria-invalid={Boolean(errors.category)} className={`${inputClass(errors.category)} h-9 pr-8`}>
                  <option value="">Choose a category</option>
                  {EVENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="event-audience" label="Who it’s for" optional>
                <input id="event-audience" name="audience" value={form.audience} onChange={update} maxLength={80} placeholder="e.g. Everyone, Youth, Couples" className={`${inputClass()} h-9`} />
              </Field>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className={SECTION}>When</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="event-date" label="Date" error={errors.date}>
                <input id="event-date" name="date" type="date" value={form.date} onChange={update} aria-invalid={Boolean(errors.date)} className={`${inputClass(errors.date)} h-9`} />
              </Field>
              <Field id="event-end-date" label="Last day" optional error={errors.end_date} hint={errors.end_date ? undefined : 'Only for events over several days.'}>
                <input
                  id="event-end-date"
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  min={form.date || undefined}
                  onChange={update}
                  aria-invalid={Boolean(errors.end_date)}
                  className={`${inputClass(errors.end_date)} h-9`}
                />
              </Field>
              <Field id="event-start" label="Starts" optional error={errors.start_time}>
                <input id="event-start" name="start_time" type="time" value={form.start_time} onChange={update} aria-invalid={Boolean(errors.start_time)} className={`${inputClass(errors.start_time)} h-9`} />
              </Field>
              <Field
                id="event-end"
                label="Ends"
                optional
                error={
                  errors.end_time && (
                    <>
                      {errors.end_time}.{' '}
                      {nextDay && (
                        <button
                          type="button"
                          onClick={() => {
                            set('end_date', nextDay);
                            setErrors((prev) => ({ ...prev, end_time: '' }));
                          }}
                          className="font-semibold underline underline-offset-2 hover:no-underline"
                        >
                          It ends the next day
                        </button>
                      )}
                    </>
                  )
                }
                hint={!errors.end_time && endsBeforeStart ? 'Ends before it starts. If it runs past midnight, set the last day.' : undefined}
              >
                <input id="event-end" name="end_time" type="time" value={form.end_time} onChange={update} aria-invalid={Boolean(errors.end_time)} className={`${inputClass(errors.end_time)} h-9`} />
              </Field>
            </div>
            <p className="text-xs text-slate-400">Times are in Kenya time (EAT).</p>
          </section>

          <section className="space-y-4">
            <h3 className={SECTION}>Where and who</h3>
            <Field id="event-location" label="Location" optional>
              <div className="relative">
                <Icon name="mapPin" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="event-location" name="location" value={form.location} onChange={update} maxLength={150} placeholder="e.g. AIC Kabuku Main Sanctuary" className={`${inputClass()} h-9 pl-9`} />
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="event-speaker" label="Speaker or host" optional>
                <input id="event-speaker" name="speaker" value={form.speaker} onChange={update} maxLength={120} placeholder="e.g. Rev. Joseph Njuguna" className={`${inputClass()} h-9`} />
              </Field>
              <Field id="event-speaker-role" label="Their role" optional>
                <input id="event-speaker-role" name="speaker_role" value={form.speaker_role} onChange={update} maxLength={120} placeholder="e.g. Senior Pastor" className={`${inputClass()} h-9`} />
              </Field>
            </div>
          </section>

          <Field id="event-description" label="Description" error={errors.description}>
            <textarea
              id="event-description"
              name="description"
              rows={6}
              maxLength={DESCRIPTION_LIMIT}
              value={form.description}
              onChange={update}
              placeholder="What’s happening, who it’s for, and anything people should bring."
              aria-invalid={Boolean(errors.description)}
              className={`${inputClass(errors.description)} resize-y py-2 leading-relaxed`}
            />
            <p className="mt-1 text-right text-[11px] tabular-nums text-slate-400">
              {form.description.length.toLocaleString()} / {DESCRIPTION_LIMIT.toLocaleString()}
            </p>
          </Field>
        </div>

        {/* Photo and settings */}
        <aside className="space-y-6 border-t border-slate-100 bg-slate-50/60 px-5 py-5 lg:border-l lg:border-t-0">
          <section>
            <h3 className={SECTION}>Cover photo</h3>
            <div className="mt-2.5">
              <CoverPicker url={coverUrl} file={coverFile} removed={removeCover} hadCover={Boolean(savedCover)} error={errors.cover} onPick={pickCover} onRemove={clearCover} buttonRef={coverRef} />
            </div>
          </section>

          <section>
            <h3 className={SECTION}>Sign-ups</h3>
            <div role="radiogroup" aria-label="Sign-ups" className="mt-2.5 space-y-2">
              {REGISTRATION_MODES.map((mode) => {
                const selected = form.registration === mode.value;
                return (
                  <label
                    key={mode.value}
                    className={`flex cursor-pointer gap-2.5 rounded-lg border bg-white px-3 py-2.5 transition ${
                      selected ? 'border-red-200 ring-1 ring-red-200' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" name="registration" value={mode.value} checked={selected} onChange={update} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-red-700" />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-slate-800">{mode.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500">{mode.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {form.registration === 'rsvp' && (
              <Field
                id="event-capacity"
                label="Seats available"
                optional
                error={errors.capacity}
                hint={seatsTaken ? `${seatsTaken} taken so far. Leave empty for no limit.` : 'Leave empty for no limit. Sign-ups close when it’s full.'}
                className="mt-3"
              >
                <input
                  id="event-capacity"
                  name="capacity"
                  type="number"
                  inputMode="numeric"
                  min={Math.max(1, seatsTaken)}
                  max={CAPACITY_LIMIT}
                  value={form.capacity}
                  onChange={update}
                  placeholder="No limit"
                  aria-invalid={Boolean(errors.capacity)}
                  className={`${inputClass(errors.capacity)} h-9`}
                />
              </Field>
            )}
            {form.registration === 'external' && (
              <Field id="event-registration-url" label="Sign-up link" error={errors.registration_url} className="mt-3">
                <input
                  id="event-registration-url"
                  name="registration_url"
                  type="url"
                  value={form.registration_url}
                  onChange={update}
                  placeholder="https://forms.gle/…"
                  aria-invalid={Boolean(errors.registration_url)}
                  className={`${inputClass(errors.registration_url)} h-9`}
                />
              </Field>
            )}
          </section>

          <section>
            <h3 className={SECTION}>Home page</h3>
            <div className="mt-2.5 flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
                  <Icon name="star" className="h-3.5 w-3.5 text-amber-500" strokeWidth={2} />
                  Feature this event
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-slate-500">Shown in the “Next event” spot on the home page until it’s over. Replaces the one featured now.</span>
              </span>
              <Switch checked={form.featured} onChange={(value) => set('featured', value)} label="Feature this event on the home page" />
            </div>
          </section>
        </aside>
      </form>
    </Modal>
  );
}

export default EventForm;
