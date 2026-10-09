import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { apiErrorMessage } from '../../redux/api';
import { DEFAULT_SITE_SETTINGS, formatSlot, NOTICE_STYLES, noticeIsLive, readSettings, SEO_PAGES, SOCIAL_NETWORKS } from '../../data/siteSettings';
import NoticeBar from '../NoticeBar';
import Icon from './Icon';
import { BUTTON, PreviewBanner, PRIMARY_BUTTON, Skeleton, Toast, useToast } from './ui';
import { saveErrorMessages } from './useAdminList';
import { formatDate, parseDate } from './utils';

/* What admins can change about the public website. Everything is saved together. */

const SECTIONS = [
  { key: 'notice', label: 'Notice bar', icon: 'megaphone', hint: 'The announcement across the top' },
  { key: 'seo', label: 'Search & sharing', icon: 'search', hint: 'Titles and descriptions' },
  { key: 'contact', label: 'Contact & social', icon: 'phone', hint: 'Address, phone, links' },
  { key: 'services', label: 'Service times', icon: 'clock', hint: 'The weekly schedule' },
];

// Lengths search engines show in full; longer text is cut off
const TITLE_IDEAL = 60;
const DESCRIPTION_IDEAL = [70, 160];
const SITE_CACHE_KEY = 'aic:site-settings';

const INPUT =
  'w-full rounded-lg border bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-100';
const inputClass = (error) => `${INPUT} ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-red-300'}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

// The same rules the API checks (app/models/site_settings_document.rb), so a save never fails there
export const LIMITS = { days: 7, services: 12, slots: 4, url: 500 };
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// http(s) with a real host (it has a dot), written in plain characters as the server expects
export function isWebLink(value) {
  if (!/^[\x21-\x7e]+$/.test(value)) return false;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && url.hostname.includes('.');
  } catch (error) {
    return false;
  }
}

// A web link, or a page on this site like /events. "//other.site" opens another website, so it isn't one.
export const isSiteLink = (value) => isWebLink(value) || /^\/(?!\/)\S*$/.test(value);

/* ── Checks before saving: { 'path.to.field': message } ── */
export function settingsProblems(settings) {
  const problems = {};
  const { notice, seo, contact, social } = settings;
  if (notice.enabled && !notice.message.trim()) problems['notice.message'] = 'Write the message, or switch the notice bar off';
  const noticeLink = notice.link_url.trim();
  if ((noticeLink || notice.link_text.trim()) && !isSiteLink(noticeLink)) problems['notice.link_url'] = 'Use a full link (https://…) or a page on this site (/events)';
  if (notice.starts_on && notice.ends_on && notice.ends_on < notice.starts_on) problems['notice.ends_on'] = 'Can’t be before the first day';
  if (!seo.site_name.trim()) problems['seo.site_name'] = 'Give the site a name';
  if (!seo.home_title.trim()) problems['seo.home_title'] = 'The home page needs a title';
  if (!seo.description.trim()) problems['seo.description'] = 'Search results need a description';
  if (contact.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) problems['contact.email'] = 'Enter a valid email address';
  if (contact.phone.trim() && !/^[\d\s+\-()]{7,20}$/.test(contact.phone.trim())) problems['contact.phone'] = 'Use only digits, spaces and + - ( )';
  if (contact.map_url.trim() && !isWebLink(contact.map_url.trim())) problems['contact.map_url'] = 'Use a full link starting with https://';
  SOCIAL_NETWORKS.forEach(({ key }) => {
    if (social[key].trim() && !isWebLink(social[key].trim())) problems[`social.${key}`] = 'Use a full link starting with https://';
  });
  if (settings.service_times.length > LIMITS.days) problems.service_times = `Keep it to ${LIMITS.days} days or fewer`;
  settings.service_times.forEach((day, dayIndex) => {
    if (!day.day.trim()) problems[`service_times.${dayIndex}.day`] = 'Name the day';
    if (day.services.length > LIMITS.services) problems[`service_times.${dayIndex}.services`] = `Keep it to ${LIMITS.services} services or fewer`;
    day.services.forEach((service, serviceIndex) => {
      const at = `service_times.${dayIndex}.services.${serviceIndex}`;
      if (!service.name.trim()) problems[`${at}.name`] = 'Name the service';
      if (!service.slots.length || service.slots.length > LIMITS.slots) problems[`${at}.slots`] = `Give it 1 to ${LIMITS.slots} times`;
      service.slots.forEach((slot, slotIndex) => {
        if (!slot.start || !slot.end) problems[`${at}.slots.${slotIndex}`] = 'Set both times';
        else if (!TIME.test(slot.start) || !TIME.test(slot.end)) problems[`${at}.slots.${slotIndex}`] = 'Write times as HH:MM, like 08:30';
        else if (slot.end <= slot.start) problems[`${at}.slots.${slotIndex}`] = 'Ends before it starts';
      });
    });
  });
  return problems;
}

/* ── Pieces ── */
function Card({ title, description, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
        </div>
        {action}
      </header>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  );
}

function Field({ id, label, optional = false, hint, error, counter, className = '', children }) {
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
          {label} {optional && <span className="font-normal text-slate-400">(optional)</span>}
        </label>
        {counter}
      </div>
      <div className="mt-1.5">{children}</div>
      {(error || hint) && <p className={`mt-1.5 text-xs ${error ? 'font-medium text-red-600' : 'text-slate-500'}`}>{error || hint}</p>}
    </div>
  );
}

// "52 / 60" in green, amber when it'll be cut off
function Counter({ value, ideal }) {
  const [min, max] = Array.isArray(ideal) ? ideal : [1, ideal];
  const length = value.trim().length;
  const tone = length > max ? 'text-amber-600' : length >= min ? 'text-emerald-600' : 'text-slate-400';
  return (
    <span className={`text-[11px] font-medium tabular-nums ${tone}`} title={`Search engines show about ${max} characters`}>
      {length} / {max}
    </span>
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

// How a page might look in Google's results
function SearchPreview({ title, description, path }) {
  const cut = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3" aria-label="Search result preview">
      <p className="text-[11px] text-slate-500">
        {window.location.host}
        <span className="text-slate-400">{path === '/' ? '' : ` › ${path.slice(1)}`}</span>
      </p>
      <p className="mt-0.5 truncate text-[16px] leading-snug text-[#1a0dab]">{cut(title, 65) || 'Page title'}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-slate-600">{cut(description, 165) || 'Description'}</p>
    </div>
  );
}

function noticeState(notice) {
  if (!notice.enabled) return { tone: 'bg-slate-100 text-slate-600', label: 'Off' };
  if (!notice.message.trim()) return { tone: 'bg-amber-50 text-amber-700', label: 'No message yet' };
  if (noticeIsLive(notice)) return { tone: 'bg-emerald-50 text-emerald-700', label: 'Showing on the website' };
  const start = parseDate(notice.starts_on);
  if (start && start > new Date()) return { tone: 'bg-sky-50 text-sky-700', label: `Starts ${formatDate(start)}` };
  return { tone: 'bg-slate-100 text-slate-600', label: 'Ended' };
}

/* ── Sections ── */
function NoticeSection({ notice, set, errors }) {
  const state = noticeState(notice);
  const update = (name) => (event) => set(['notice', name], event.target.value);
  return (
    <Card
      title="Notice bar"
      description="The announcement across the top of every page. Visitors who close it won’t see it again until you change it."
      action={<span className={`rounded-md px-2 py-0.5 text-xs font-medium ${state.tone}`}>{state.label}</span>}
    >
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Preview</p>
        <div className={`overflow-hidden rounded-lg ${notice.enabled ? '' : 'opacity-50 grayscale'}`}>
          <NoticeBar notice={{ ...notice, message: notice.message || 'Your message will appear here.' }} preview onClose={() => {}} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-3">
        <span>
          <span className="block text-[13px] font-medium text-slate-800">Show the notice bar</span>
          <span className="block text-xs text-slate-500">Switch it off to hide it without losing the text.</span>
        </span>
        <Switch checked={notice.enabled} onChange={(value) => set(['notice', 'enabled'], value)} label="Show the notice bar" />
      </div>

      <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <Field id="notice-label" label="Label" optional>
          <input id="notice-label" value={notice.label} onChange={update('label')} maxLength={20} placeholder="Notice" className={`${inputClass()} h-9`} />
        </Field>
        <Field id="notice-message" label="Message" error={errors['notice.message']} counter={<Counter value={notice.message} ideal={90} />}>
          <input
            id="notice-message"
            value={notice.message}
            onChange={update('message')}
            maxLength={140}
            placeholder="e.g. Join us for the Easter Sunday service at 8:30"
            aria-invalid={Boolean(errors['notice.message'])}
            className={`${inputClass(errors['notice.message'])} h-9`}
          />
        </Field>
        <Field id="notice-link-text" label="Button text" optional>
          <input id="notice-link-text" value={notice.link_text} onChange={update('link_text')} maxLength={24} placeholder="Watch sermons" className={`${inputClass()} h-9`} />
        </Field>
        <Field id="notice-link-url" label="Button link" optional={!notice.link_text.trim()} error={errors['notice.link_url']} hint="A full web address, or a page on this site such as /events.">
          <input
            id="notice-link-url"
            maxLength={LIMITS.url}
            value={notice.link_url}
            onChange={update('link_url')}
            placeholder="https://youtube.com/@aickabuku"
            aria-invalid={Boolean(errors['notice.link_url'])}
            className={`${inputClass(errors['notice.link_url'])} h-9`}
          />
        </Field>
      </div>

      <div>
        <p className="text-[13px] font-medium text-slate-700">Colour</p>
        <div role="radiogroup" aria-label="Colour" className="mt-2 flex flex-wrap gap-2">
          {Object.entries(NOTICE_STYLES).map(([key, style]) => {
            const selected = notice.style === key;
            return (
              <label key={key} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition ${selected ? 'border-red-200 ring-1 ring-red-200' : 'border-slate-200 hover:border-slate-300'}`}>
                <input type="radio" name="notice-style" value={key} checked={selected} onChange={() => set(['notice', 'style'], key)} className="sr-only" />
                <span className={`h-4 w-4 rounded-full ${style.swatch} ring-2 ring-white`} />
                <span className={selected ? 'font-medium text-slate-900' : 'text-slate-600'}>{style.label}</span>
                {selected && <Icon name="check" className="h-3.5 w-3.5 text-red-700" strokeWidth={2.5} />}
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="notice-starts" label="Show from" optional hint="Leave both empty to show it until you switch it off.">
          <input id="notice-starts" type="date" value={notice.starts_on || ''} onChange={(event) => set(['notice', 'starts_on'], event.target.value || null)} className={`${inputClass()} h-9`} />
        </Field>
        <Field id="notice-ends" label="Show until" optional error={errors['notice.ends_on']}>
          <input
            id="notice-ends"
            type="date"
            value={notice.ends_on || ''}
            min={notice.starts_on || undefined}
            onChange={(event) => set(['notice', 'ends_on'], event.target.value || null)}
            aria-invalid={Boolean(errors['notice.ends_on'])}
            className={`${inputClass(errors['notice.ends_on'])} h-9`}
          />
        </Field>
      </div>
    </Card>
  );
}

function SeoSection({ seo, set, errors }) {
  return (
    <>
      <Card title="The whole site" description="How the church appears in Google and when a link is shared on WhatsApp or Facebook.">
        <Field id="seo-site-name" label="Site name" error={errors['seo.site_name']} hint="Added after each page’s title, e.g. “Blog | AIC Kabuku Church”.">
          <input id="seo-site-name" value={seo.site_name} onChange={(event) => set(['seo', 'site_name'], event.target.value)} maxLength={60} className={`${inputClass(errors['seo.site_name'])} h-9`} />
        </Field>
        <Field id="seo-home-title" label="Home page title" error={errors['seo.home_title']} counter={<Counter value={seo.home_title} ideal={TITLE_IDEAL} />}>
          <input id="seo-home-title" value={seo.home_title} onChange={(event) => set(['seo', 'home_title'], event.target.value)} maxLength={120} className={`${inputClass(errors['seo.home_title'])} h-9`} />
        </Field>
        <Field
          id="seo-description"
          label="Description"
          error={errors['seo.description']}
          hint="Shown under the title in search results, for the home page and any page without its own."
          counter={<Counter value={seo.description} ideal={DESCRIPTION_IDEAL} />}
        >
          <textarea id="seo-description" rows={3} value={seo.description} onChange={(event) => set(['seo', 'description'], event.target.value)} maxLength={300} className={`${inputClass(errors['seo.description'])} resize-y py-2 leading-relaxed`} />
        </Field>
        <SearchPreview title={seo.home_title} description={seo.description} path="/" />
      </Card>

      <Card title="Each page" description="Leave a page’s fields empty to use the site’s description.">
        <div className="divide-y divide-slate-100">
          {SEO_PAGES.map((page) => {
            const values = seo.pages[page.key];
            return (
              <div key={page.key} className="grid grid-cols-[minmax(0,1fr)] gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-3">
                  <p className="text-[13px] font-semibold text-slate-900">{page.label}</p>
                  <Field id={`seo-${page.key}-title`} label="Title" counter={<Counter value={values.title} ideal={TITLE_IDEAL - seo.site_name.length - 3} />}>
                    <input id={`seo-${page.key}-title`} value={values.title} onChange={(event) => set(['seo', 'pages', page.key, 'title'], event.target.value)} maxLength={80} className={`${inputClass()} h-9`} />
                  </Field>
                  <Field id={`seo-${page.key}-description`} label="Description" optional counter={<Counter value={values.description} ideal={DESCRIPTION_IDEAL} />}>
                    <textarea id={`seo-${page.key}-description`} rows={3} value={values.description} onChange={(event) => set(['seo', 'pages', page.key, 'description'], event.target.value)} maxLength={300} className={`${inputClass()} resize-y py-2 leading-relaxed`} />
                  </Field>
                </div>
                <div className="lg:pt-8">
                  <SearchPreview title={values.title ? `${values.title} | ${seo.site_name}` : seo.home_title} description={values.description || seo.description} path={page.path} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

function ContactSection({ contact, social, set, errors }) {
  const update = (name) => (event) => set(['contact', name], event.target.value);
  return (
    <>
      <Card title="Contact details" description="Shown in the footer and on the Contact page. Empty fields are left out.">
        <Field id="contact-address" label="Where to find us">
          <div className="relative">
            <Icon name="mapPin" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="contact-address" value={contact.address} onChange={update('address')} maxLength={150} className={`${inputClass()} h-9 pl-9`} />
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="contact-phone" label="Phone" optional error={errors['contact.phone']}>
            <input id="contact-phone" type="tel" maxLength={20} value={contact.phone} onChange={update('phone')} placeholder="+254 712 345 678" aria-invalid={Boolean(errors['contact.phone'])} className={`${inputClass(errors['contact.phone'])} h-9`} />
          </Field>
          <Field id="contact-email" label="Email" optional error={errors['contact.email']}>
            <input id="contact-email" type="email" maxLength={254} value={contact.email} onChange={update('email')} placeholder="office@aickabuku.org" aria-invalid={Boolean(errors['contact.email'])} className={`${inputClass(errors['contact.email'])} h-9`} />
          </Field>
          <Field id="contact-hours" label="Office hours" optional>
            <input id="contact-hours" value={contact.office_hours} onChange={update('office_hours')} maxLength={120} placeholder="Mon–Fri, 9:00–17:00" className={`${inputClass()} h-9`} />
          </Field>
          <Field id="contact-map" label="Map link" optional error={errors['contact.map_url']} hint="From Google Maps: Share → Copy link.">
            <input id="contact-map" type="url" maxLength={LIMITS.url} value={contact.map_url} onChange={update('map_url')} placeholder="https://maps.app.goo.gl/…" aria-invalid={Boolean(errors['contact.map_url'])} className={`${inputClass(errors['contact.map_url'])} h-9`} />
          </Field>
        </div>
      </Card>

      <Card title="Social media" description="Links appear in the footer. Leave one empty to hide it.">
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_NETWORKS.map((network) => (
            <Field key={network.key} id={`social-${network.key}`} label={network.label} optional error={errors[`social.${network.key}`]}>
              <input
                id={`social-${network.key}`}
                type="url"
                maxLength={LIMITS.url}
                value={social[network.key]}
                onChange={(event) => set(['social', network.key], event.target.value)}
                placeholder={network.placeholder}
                aria-invalid={Boolean(errors[`social.${network.key}`])}
                className={`${inputClass(errors[`social.${network.key}`])} h-9`}
              />
            </Field>
          ))}
        </div>
      </Card>
    </>
  );
}

const ICON_ACTION = 'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent';

function ServicesSection({ days, setDays, errors }) {
  const change = (recipe) => {
    const next = clone(days);
    recipe(next);
    setDays(next);
  };
  const move = (index, offset) =>
    change((next) => {
      const [day] = next.splice(index, 1);
      next.splice(index + offset, 0, day);
    });

  return (
    <Card
      title="Service times"
      description="Every day and service is listed on the home page. Main services are also shown in the footer and on the Contact page."
      action={
        <button
          type="button"
          onClick={() => change((next) => next.push({ day: '', tagline: '', note: '', services: [{ name: '', slots: [{ start: '', end: '' }], main: false, description: '' }] }))}
          disabled={days.length >= LIMITS.days}
          title={days.length >= LIMITS.days ? `Up to ${LIMITS.days} days` : undefined}
          className={`${BUTTON} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
          Add a day
        </button>
      }
    >
      {!days.length && <p className="text-[13px] text-slate-500">No service times yet. Add a day to start.</p>}
      {errors.service_times && <p className="text-xs font-medium text-red-600">{errors.service_times}</p>}
      {days.map((day, dayIndex) => (
        <div key={dayIndex} className="rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-start gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
              <Field id={`day-${dayIndex}`} label="Day" error={errors[`service_times.${dayIndex}.day`]}>
                <input
                  id={`day-${dayIndex}`}
                  value={day.day}
                  onChange={(event) => change((next) => (next[dayIndex].day = event.target.value))}
                  maxLength={40}
                  placeholder="Sundays"
                  aria-invalid={Boolean(errors[`service_times.${dayIndex}.day`])}
                  className={`${inputClass(errors[`service_times.${dayIndex}.day`])} h-9 font-semibold`}
                />
              </Field>
              <Field id={`tagline-${dayIndex}`} label="Short line" optional>
                <input id={`tagline-${dayIndex}`} value={day.tagline} onChange={(event) => change((next) => (next[dayIndex].tagline = event.target.value))} maxLength={60} placeholder="Our main day of worship" className={`${inputClass()} h-9`} />
              </Field>
            </div>
            <div className="flex gap-0.5 pt-6">
              <button type="button" onClick={() => move(dayIndex, -1)} disabled={dayIndex === 0} aria-label={`Move ${day.day || 'this day'} up`} title="Move up" className={ICON_ACTION}>
                <Icon name="arrowUp" className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => move(dayIndex, 1)} disabled={dayIndex === days.length - 1} aria-label={`Move ${day.day || 'this day'} down`} title="Move down" className={ICON_ACTION}>
                <Icon name="arrowDown" className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => window.confirm(`Remove ${day.day || 'this day'} and its services?`) && change((next) => next.splice(dayIndex, 1))}
                aria-label={`Remove ${day.day || 'this day'}`}
                title="Remove day"
                className={`${ICON_ACTION} hover:bg-red-50 hover:text-red-700`}
              >
                <Icon name="trash" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            {day.services.map((service, serviceIndex) => {
              const at = `service_times.${dayIndex}.services.${serviceIndex}`;
              const update = (recipe) => change((next) => recipe(next[dayIndex].services[serviceIndex]));
              return (
                <li key={serviceIndex} className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto]">
                  <div className="space-y-2">
                    <label htmlFor={`service-${dayIndex}-${serviceIndex}`} className="sr-only">
                      Service name
                    </label>
                    <input
                      id={`service-${dayIndex}-${serviceIndex}`}
                      value={service.name}
                      onChange={(event) => update((item) => (item.name = event.target.value))}
                      maxLength={60}
                      placeholder="Service name"
                      aria-invalid={Boolean(errors[`${at}.name`])}
                      className={`${inputClass(errors[`${at}.name`])} h-9 font-medium`}
                    />
                    {errors[`${at}.name`] && <p className="text-xs font-medium text-red-600">{errors[`${at}.name`]}</p>}
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={service.main} onChange={(event) => update((item) => (item.main = event.target.checked))} className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-red-700" />
                      Main service (footer and Contact page)
                    </label>
                    {service.main && (
                      <input
                        aria-label={`What ${service.name || 'this service'} is like`}
                        value={service.description}
                        onChange={(event) => update((item) => (item.description = event.target.value))}
                        maxLength={100}
                        placeholder="One line for the Contact page, e.g. A calm start in worship"
                        className={`${inputClass()} h-8 text-xs`}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    {service.slots.map((slot, slotIndex) => {
                      const error = errors[`${at}.slots.${slotIndex}`];
                      return (
                        <div key={slotIndex}>
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              aria-label={`${service.name || 'Service'} starts`}
                              value={slot.start}
                              onChange={(event) => update((item) => (item.slots[slotIndex].start = event.target.value))}
                              className={`${inputClass(error)} h-9 min-w-0 flex-1`}
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input
                              type="time"
                              aria-label={`${service.name || 'Service'} ends`}
                              value={slot.end}
                              onChange={(event) => update((item) => (item.slots[slotIndex].end = event.target.value))}
                              className={`${inputClass(error)} h-9 min-w-0 flex-1`}
                            />
                            <button
                              type="button"
                              onClick={() => update((item) => item.slots.splice(slotIndex, 1))}
                              disabled={service.slots.length === 1}
                              aria-label="Remove this time"
                              title="Remove this time"
                              className={ICON_ACTION}
                            >
                              <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                          </div>
                          {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
                        </div>
                      );
                    })}
                    {errors[`${at}.slots`] && <p className="text-xs font-medium text-red-600">{errors[`${at}.slots`]}</p>}
                    {service.slots.length < LIMITS.slots && (
                      <button type="button" onClick={() => update((item) => item.slots.push({ start: '', end: '' }))} className="text-xs font-medium text-red-700 hover:underline">
                        + Add another time
                      </button>
                    )}
                  </div>
                  <div className="md:pt-1">
                    <button
                      type="button"
                      onClick={() => change((next) => next[dayIndex].services.splice(serviceIndex, 1))}
                      aria-label={`Remove ${service.name || 'this service'}`}
                      title="Remove service"
                      className={`${ICON_ACTION} hover:bg-red-50 hover:text-red-700`}
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="space-y-3 border-t border-slate-100 px-4 py-3">
            {errors[`service_times.${dayIndex}.services`] && <p className="text-xs font-medium text-red-600">{errors[`service_times.${dayIndex}.services`]}</p>}
            {day.services.length < LIMITS.services ? (
              <button
                type="button"
                onClick={() => change((next) => next[dayIndex].services.push({ name: '', slots: [{ start: '', end: '' }], main: false, description: '' }))}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-red-700 hover:underline"
              >
                <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
                Add a service on {day.day || 'this day'}
              </button>
            ) : (
              <p className="text-xs text-slate-500">That’s the most services one day can have ({LIMITS.services}).</p>
            )}
            <Field id={`note-${dayIndex}`} label="Note under the day" optional>
              <textarea id={`note-${dayIndex}`} rows={2} value={day.note} onChange={(event) => change((next) => (next[dayIndex].note = event.target.value))} maxLength={300} className={`${inputClass()} resize-y py-2`} />
            </Field>
          </div>
        </div>
      ))}
      {days.length > 0 && (
        <p className="text-xs text-slate-500">
          Shown like this: {days[0].services[0] ? `${days[0].services[0].name || 'Service'} ${days[0].services[0].slots.map(formatSlot).filter(Boolean).join(', ') || '—'}` : '—'}
        </p>
      )}
    </Card>
  );
}

/* ── Page ── */
function SiteSettingsPage() {
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState('loading');
  const [notConnected, setNotConnected] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [params, setParams] = useSearchParams();
  const [toast, flash] = useToast();
  const section = SECTIONS.some(({ key }) => key === params.get('section')) ? params.get('section') : 'notice';

  // Only the latest load counts, so a slow earlier answer can't overwrite the form while it's being edited
  const latestLoad = useRef(0);
  const load = () => {
    const thisLoad = ++latestLoad.current;
    setStatus('loading');
    api.get('/api/v1/site_settings')
      .then((response) => {
        if (thisLoad !== latestLoad.current) return;
        const settings = readSettings(response.data);
        setSaved(settings);
        setDraft(clone(settings));
        setNotConnected(false);
        setStatus('ready');
      })
      .catch((err) => {
        if (thisLoad !== latestLoad.current) return;
        // Until the API exists, the page works on the website's built-in settings
        if (err?.response?.status === 404) {
          setSaved(DEFAULT_SITE_SETTINGS);
          setDraft(clone(DEFAULT_SITE_SETTINGS));
          setNotConnected(true);
          setStatus('ready');
        } else {
          setLoadError(apiErrorMessage(err, 'Could not load the site settings.'));
          setStatus('error');
        }
      });
  };

  useEffect(() => {
    load();
    return () => {
      latestLoad.current += 1;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = useMemo(() => Boolean(saved && draft) && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // set(['seo', 'pages', 'blog', 'title'], value)
  const set = (path, value) => {
    setDraft((current) => {
      const next = clone(current);
      const last = path[path.length - 1];
      path.slice(0, -1).reduce((node, key) => node[key], next)[last] = value;
      return next;
    });
    const key = path.join('.');
    if (errors[key]) setErrors((current) => ({ ...current, [key]: '' }));
  };

  const save = async () => {
    setServerErrors([]);
    const problems = settingsProblems(draft);
    setErrors(problems);
    const first = Object.keys(problems)[0];
    if (first) {
      const sectionFor = { notice: 'notice', seo: 'seo', contact: 'contact', social: 'contact', service_times: 'services' }[first.split('.')[0]];
      setParams({ section: sectionFor });
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch('/api/v1/site_settings', { site_settings: draft });
      // The API answers with the settings as saved
      const settings = readSettings(response.data && typeof response.data === 'object' ? response.data : draft);
      setSaved(settings);
      setDraft(clone(settings));
      // This browser's copy of the website picks the change up straight away
      try {
        window.localStorage.setItem(SITE_CACHE_KEY, JSON.stringify(settings));
      } catch (error) {
        // Storage blocked; the website refreshes them on its own
      }
      flash('Saved: the website shows the changes now');
    } catch (err) {
      setServerErrors(saveErrorMessages(err, 'site settings', 'Could not save the settings. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const problemCount = Object.values(errors).filter(Boolean).length;

  return (
    <>
      <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-24 font-sans text-slate-900 antialiased">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Site settings</h1>
            <p className="mt-1 text-[13px] text-slate-500">What visitors see across the website: the notice bar, search results, contact details and service times.</p>
          </div>
          <a href="/" target="_blank" rel="noreferrer" className={BUTTON}>
            <Icon name="globe" className="h-3.5 w-3.5" />
            Open website
            <Icon name="arrowUpRight" className="h-3 w-3 text-slate-400" />
          </a>
        </header>

        {notConnected && (
          <PreviewBanner>
            <span className="font-medium">Not connected yet.</span> The server doesn’t have the settings API, so this shows the website’s built-in settings. You can try the page, but saving
            will work once the backend adds it.
          </PreviewBanner>
        )}

        {status === 'loading' && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-[28rem] w-full rounded-xl" />
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-900">Couldn’t load the site settings</p>
            <p className="mt-1 text-[13px] text-slate-500">{loadError}</p>
            <button type="button" onClick={load} className={`${BUTTON} mt-4`}>
              <Icon name="refresh" className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && draft && (
          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <nav aria-label="Settings sections" className="min-w-0 lg:sticky lg:top-0">
              <ul className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 lg:flex-col">
                {SECTIONS.map((item) => {
                  const active = item.key === section;
                  return (
                    <li key={item.key} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setParams({ section: item.key })}
                        aria-current={active ? 'page' : undefined}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${active ? 'bg-red-50 text-red-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <Icon name={item.icon} className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block whitespace-nowrap text-[13px] font-medium">{item.label}</span>
                          <span className="hidden text-[11px] text-slate-400 lg:block">{item.hint}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="min-w-0 space-y-5">
              {problemCount > 0 && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                  <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  {problemCount === 1 ? 'One thing needs fixing before saving.' : `${problemCount} things need fixing before saving.`} They’re marked below.
                </div>
              )}
              {serverErrors.length > 0 && (
                <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                  <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div>
                    {serverErrors.map((message) => (
                      <p key={message}>{message}</p>
                    ))}
                  </div>
                </div>
              )}
              {section === 'notice' && <NoticeSection notice={draft.notice} set={set} errors={errors} />}
              {section === 'seo' && <SeoSection seo={draft.seo} set={set} errors={errors} />}
              {section === 'contact' && <ContactSection contact={draft.contact} social={draft.social} set={set} errors={errors} />}
              {section === 'services' && <ServicesSection days={draft.service_times} setDays={(days) => set(['service_times'], days)} errors={errors} />}
            </div>
          </div>
        )}
      </div>

      {/* Appears once something changes */}
      {dirty && (
        <div className="admin-pop-in fixed inset-x-0 bottom-5 z-40 mx-auto flex w-[min(36rem,calc(100%-2rem))] items-center gap-3 rounded-xl bg-slate-900 py-2.5 pl-4 pr-2.5 text-[13px] text-white shadow-2xl shadow-slate-900/30">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-white">You have unsaved changes</p>
          <button
            type="button"
            onClick={() => {
              setDraft(clone(saved));
              setErrors({});
              setServerErrors([]);
            }}
            disabled={saving}
            className="rounded-lg px-3 py-1.5 font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Discard
          </button>
          <button type="button" onClick={save} disabled={saving} className={PRIMARY_BUTTON}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}
      <Toast message={toast} />
    </>
  );
}

export default SiteSettingsPage;
