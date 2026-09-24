import React, { useMemo, useRef, useState } from 'react';
import api, { apiErrorMessages } from '../../redux/api';
import Icon from './Icon';
import { BUTTON, ImageLinkPreview, isHttpUrl, PRIMARY_BUTTON, SlideOver } from './ui';
import { parseDate, startOfDay } from './utils';

// The same categories the public Events page filters by
export const EVENT_CATEGORIES = ['Conferences', 'Youth', 'Worship & Services', 'Outreach', 'Prayer'];

const EMPTY_FORM = { title: '', category: '', date: '', start_time: '', end_time: '', location: '', image: '', description: '' };
const DESCRIPTION_LIMIT = 1000;
const FIELD_IDS = { title: 'event-title', date: 'event-date', start_time: 'event-start', end_time: 'event-end', image: 'event-image', description: 'event-description' };

const INPUT =
  'w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100';
const inputClass = (error) => `${INPUT} ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'}`;

function Field({ id, label, optional = false, error, hint, className = '', children }) {
  const note = error || hint;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
        {label} {optional && <span className="font-normal text-slate-400">(optional)</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {note && (
        <p id={`${id}-note`} className={`mt-1.5 text-xs ${error ? 'font-medium text-red-600' : 'text-slate-500'}`}>
          {note}
        </p>
      )}
    </div>
  );
}

function EventForm({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef(null);

  const dirty = Object.values(form).some((value) => value.trim() !== '');
  const today = useMemo(() => startOfDay(new Date()), []);
  const chosenDate = parseDate(form.date);
  const inThePast = chosenDate && chosenDate < today;

  const update = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const requestClose = () => {
    if (submitting) return;
    if (!dirty || window.confirm('Discard this event? What you’ve entered will be lost.')) onClose();
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Give the event a title';
    if (!form.date) next.date = 'Pick the date';
    if (!form.description.trim()) next.description = 'Add a short description';
    if (form.image.trim() && !isHttpUrl(form.image.trim())) next.image = 'Use a full link starting with http:// or https://';
    if (form.end_time && !form.start_time) next.start_time = 'Add a start time too';
    if (form.start_time && form.end_time && form.end_time <= form.start_time) next.end_time = 'Must be after the start time';
    setErrors(next);
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerErrors([]);
    const invalid = Object.keys(validate());
    if (invalid.length > 0) {
      const first = Object.keys(FIELD_IDS).find((name) => invalid.includes(name));
      document.getElementById(FIELD_IDS[first])?.focus();
      return;
    }

    setSubmitting(true);
    // Blank optional fields are left out rather than sent as empty strings
    const fields = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim() || undefined]));
    try {
      // The API reads the event under the plural "events" key
      await api.post('/api/v1/events', { events: fields });
      onCreated(fields.title);
    } catch (err) {
      setServerErrors(apiErrorMessages(err, 'Could not create the event. Please try again.'));
      setSubmitting(false);
    }
  };

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
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={requestClose} className={BUTTON}>
          Cancel
        </button>
        <button type="submit" form="event-form" disabled={submitting} className={PRIMARY_BUTTON}>
          {submitting ? 'Creating…' : 'Create event'}
        </button>
      </div>
    </>
  );

  return (
    <SlideOver label="New event" titleId="event-form-title" onClose={requestClose} initialFocusRef={titleRef} footer={footer}>
      <form id="event-form" onSubmit={handleSubmit} noValidate className="space-y-4 px-5 py-5">
        <div>
          <h2 id="event-form-title" className="text-lg font-semibold text-slate-900">
            Add an event
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-500">Services, conferences, youth nights, outreach — anything members should know about.</p>
        </div>

        <Field id="event-title" label="Title" error={errors.title}>
          <input
            ref={titleRef}
            id="event-title"
            name="title"
            value={form.title}
            onChange={update}
            placeholder="e.g. Youth Revival & Worship Night"
            aria-invalid={Boolean(errors.title)}
            className={`${inputClass(errors.title)} h-9`}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="event-category" label="Category" optional>
            <select id="event-category" name="category" value={form.category} onChange={update} className={`${inputClass()} h-9 pr-8`}>
              <option value="">Choose a category</option>
              {EVENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="event-date"
            label="Date"
            error={errors.date}
            hint={inThePast ? 'This date has already passed.' : undefined}
          >
            <input
              id="event-date"
              name="date"
              type="date"
              value={form.date}
              onChange={update}
              aria-invalid={Boolean(errors.date)}
              className={`${inputClass(errors.date)} h-9`}
            />
          </Field>
          <Field id="event-start" label="Starts" optional error={errors.start_time}>
            <input id="event-start" name="start_time" type="time" value={form.start_time} onChange={update} className={`${inputClass(errors.start_time)} h-9`} />
          </Field>
          <Field id="event-end" label="Ends" optional error={errors.end_time}>
            <input id="event-end" name="end_time" type="time" value={form.end_time} onChange={update} className={`${inputClass(errors.end_time)} h-9`} />
          </Field>
        </div>

        <Field id="event-location" label="Location" optional>
          <input
            id="event-location"
            name="location"
            value={form.location}
            onChange={update}
            placeholder="e.g. AIC Kabuku Main Sanctuary"
            className={`${inputClass()} h-9`}
          />
        </Field>

        <Field id="event-image" label="Cover image link" optional error={errors.image}>
          <input
            id="event-image"
            name="image"
            type="url"
            value={form.image}
            onChange={update}
            placeholder="https://…"
            aria-invalid={Boolean(errors.image)}
            className={`${inputClass(errors.image)} h-9`}
          />
          <ImageLinkPreview key={form.image.trim()} url={form.image.trim()} />
        </Field>

        <Field id="event-description" label="Description" error={errors.description}>
          <textarea
            id="event-description"
            name="description"
            rows={5}
            maxLength={DESCRIPTION_LIMIT}
            value={form.description}
            onChange={update}
            placeholder="What’s happening, who it’s for, and anything people should bring."
            aria-invalid={Boolean(errors.description)}
            className={`${inputClass(errors.description)} resize-y py-2 leading-relaxed`}
          />
          <p className="mt-1 text-right text-[11px] tabular-nums text-slate-400">
            {form.description.length} / {DESCRIPTION_LIMIT}
          </p>
        </Field>

      </form>
    </SlideOver>
  );
}

export default EventForm;
