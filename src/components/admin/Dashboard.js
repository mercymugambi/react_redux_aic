import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, selectCurrentUser } from '../../redux/authSlice';
import { canAccessPage, humanize } from '../../auth/permissions';
import Icon from './Icon';
import './admin.css';

const NAV_SECTIONS = [
  {
    title: 'Dashboard',
    showTitle: false,
    items: [{ to: '/admin', label: 'Overview', icon: 'home', end: true }],
  },
  {
    title: 'Congregation',
    items: [
      { to: '/admin/members', label: 'Members', icon: 'users' },
      { to: '/admin/fellowship-groups', label: 'Fellowship Groups', icon: 'group' },
      { to: '/admin/leadership-positions', label: 'Leadership Positions', icon: 'briefcase' },
    ],
  },
  {
    title: 'Content',
    items: [
      { to: '/admin/events', label: 'Events', icon: 'calendar' },
      { to: '/admin/devotions', label: 'Devotions', icon: 'book' },
      { to: '/admin/blog', label: 'Blog', icon: 'newspaper' },
      { to: '/admin/gallery', label: 'Gallery', icon: 'photo' },
    ],
  },
  {
    title: 'Website',
    items: [{ to: '/admin/settings', label: 'Site settings', icon: 'adjustments' }],
  },
  {
    title: 'Access',
    items: [
      { to: '/admin/users', label: 'Users', icon: 'shield' },
      { to: '/admin/roles', label: 'Roles', icon: 'key' },
    ],
  },
];

const flattenNav = (sections) => sections.flatMap((section) => section.items.map((item) => ({ ...item, section: section.title })));

const NAV_ITEMS = flattenNav(NAV_SECTIONS);

// Only the pages this user may open (see PAGE_PERMISSIONS); empty sections are dropped
function visibleSections(user) {
  return NAV_SECTIONS
    .map((section) => ({ ...section, items: section.items.filter((item) => canAccessPage(user, item.to)) }))
    .filter((section) => section.items.length > 0);
}

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(15,23,42,0.05)]';
const MENU_SHADOW = 'shadow-[0_16px_40px_-12px_rgba(15,23,42,0.25)]';

function currentNavItem(pathname) {
  return NAV_ITEMS.find((item) => (item.end ? pathname.replace(/\/$/, '') === item.to : pathname.startsWith(item.to)));
}

function displayName(user) {
  return [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.email || 'Admin';
}

function roleName(user) {
  return user?.super_admin ? 'Super Admin' : (user?.roles || []).map(humanize).join(', ') || 'Admin';
}

function initialsOf(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'A';
}

/* ── Sidebar ── */
function WebsitePreview() {
  return (
    <div aria-hidden="true" className="relative h-[76px] overflow-hidden rounded-lg border border-slate-200/80 bg-gradient-to-br from-red-50 via-rose-50 to-amber-50">
      <div className="absolute inset-x-3 -bottom-2 top-3 rounded-t-md border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-1 border-b border-slate-100 px-2 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          <span className="ml-1.5 h-1.5 flex-1 rounded-full bg-slate-100" />
        </div>
        <div className="flex gap-2 p-2">
          <span className="h-9 w-14 shrink-0 rounded bg-gradient-to-br from-red-600 to-red-900" />
          <span className="flex-1 space-y-1.5 pt-0.5">
            <span className="block h-1.5 w-4/5 rounded-full bg-slate-200" />
            <span className="block h-1.5 w-3/5 rounded-full bg-slate-100" />
            <span className="block h-1.5 w-2/5 rounded-full bg-slate-100" />
          </span>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ sections }) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-3 pt-3">
        <Link
          to="/admin"
          className={`flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-2.5 py-2 transition hover:border-slate-300 ${CARD_SHADOW}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 ring-1 ring-red-100">
            <img src="/favicon.ico" alt="" className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[11px] text-slate-500">Admin console</span>
            <span className="block truncate text-[13px] font-semibold text-slate-900">AIC Kabuku</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Admin" className="mt-5 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title}>
            {section.showTitle !== false && (
              <p className="mb-1.5 px-2.5 text-[11px] font-medium text-slate-400">{section.title}</p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end || false}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition ${
                        isActive
                          ? `bg-white text-slate-900 ring-1 ring-slate-200/80 ${CARD_SHADOW}`
                          : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          name={item.icon}
                          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                            isActive ? 'text-red-700' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Website card — hidden on short screens so the nav keeps its room */}
      <div className="p-3 [@media(max-height:760px)]:hidden">
        <div className={`rounded-xl border border-slate-200/80 bg-white p-3 ${CARD_SHADOW}`}>
          <WebsitePreview />
          <p className="mt-3 text-[13px] font-semibold text-slate-900">Your church website</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">See how your updates look to the congregation.</p>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            Open website
            <Icon name="arrowUpRight" className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Top bar: page search ── */
function QuickSearch({ items }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => `${item.label} ${item.section}`.toLowerCase().includes(needle));
  }, [items, query]);

  // ⌘K / Ctrl+K focuses the search from anywhere in the admin area
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const go = (item) => {
    navigate(item.to);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && open && results[highlight]) {
      event.preventDefault();
      go(results[highlight]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const optionId = (item) => `admin-search-${item.to.replace(/\W+/g, '-')}`;

  return (
    <div className="relative w-full max-w-[18rem]">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label="Search admin pages"
        aria-expanded={open}
        aria-controls="admin-search-results"
        aria-autocomplete="list"
        aria-activedescendant={open && results[highlight] ? optionId(results[highlight]) : undefined}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder="Search pages…"
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-14 text-[13px] text-slate-800 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-red-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-400">
        {IS_MAC ? '⌘ K' : 'Ctrl K'}
      </kbd>

      {open && (
        <div className={`absolute left-0 right-0 top-full z-50 mt-2 min-w-[16rem] rounded-xl border border-slate-200 bg-white p-1.5 ${MENU_SHADOW}`}>
          <p className="px-2 pb-1 pt-1 text-[11px] font-medium text-slate-400">Jump to</p>
          {results.length ? (
            <ul id="admin-search-results" role="listbox" aria-label="Pages">
              {results.map((item, index) => (
                <li
                  key={item.to}
                  id={optionId(item)}
                  role="option"
                  aria-selected={index === highlight}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    go(item);
                  }}
                  onMouseEnter={() => setHighlight(index)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] ${
                    index === highlight ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="flex-1 truncate">{item.label}</span>
                  <span className="text-[11px] text-slate-400">{item.section}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p id="admin-search-results" className="px-2 py-3 text-[13px] text-slate-500">
              No pages match “{query.trim()}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Top bar: profile menu ── */
function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const name = displayName(user);
  const role = roleName(user);
  const initials = initialsOf(name);

  const handleLogout = () => {
    setSigningOut(true);
    onLogout();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-lg p-1 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 md:pr-2"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[10rem] text-left leading-tight md:block">
          <span className="block truncate text-[13px] font-medium text-slate-900">{name}</span>
          <span className="block truncate text-[11px] text-slate-500">{role}</span>
        </span>
        <Icon name="chevronDown" className={`hidden h-3.5 w-3.5 text-slate-400 transition-transform md:block ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      {open && (
        <div role="menu" aria-label="Account" className={`absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 ${MENU_SHADOW}`}>
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px] font-semibold text-slate-900">{name}</span>
              <span className="block truncate text-xs text-slate-500">{user?.email}</span>
            </span>
          </div>
          <div className="px-2.5 pb-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-100 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
              <Icon name="shield" className="h-3 w-3" strokeWidth={2} />
              {role}
            </span>
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <a
            role="menuitem"
            href="/"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Icon name="globe" className="h-4 w-4 text-slate-400" />
            View website
            <Icon name="arrowUpRight" className="ml-auto h-3.5 w-3.5 text-slate-300" />
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-red-700 transition hover:bg-red-50 disabled:opacity-60"
          >
            <Icon name="logout" className="h-4 w-4" />
            {signingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Layout ── */
function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const [navOpen, setNavOpen] = useState(false);

  const sections = useMemo(() => visibleSections(user), [user]);
  const navItems = useMemo(() => flattenNav(sections), [sections]);
  const current = currentNavItem(location.pathname);

  // Close the mobile drawer after navigating, and on Escape
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate('/login');
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f7] font-sans text-slate-900 antialiased lg:flex lg:h-screen lg:overflow-hidden">
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setNavOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/30 transition-opacity duration-300 lg:hidden ${
          navOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar — static on desktop, a slide-in drawer below lg */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[248px] shrink-0 bg-[#f6f6f7] transition-[transform,visibility] duration-300 lg:visible lg:static lg:translate-x-0 lg:transition-none ${
          navOpen ? 'visible translate-x-0 shadow-2xl' : 'invisible -translate-x-full'
        }`}
      >
        <Sidebar sections={sections} />
      </aside>

      {/* Main panel */}
      <div className="flex min-w-0 flex-1 flex-col lg:py-2 lg:pr-2">
        <div className="flex min-h-screen flex-1 flex-col bg-white lg:min-h-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-slate-200/80 lg:shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6 lg:static">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              aria-expanded={navOpen}
              className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>

            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex">
              <span className="text-slate-400">{current?.section || 'Admin'}</span>
              <Icon name="chevronRight" className="h-3 w-3 shrink-0 text-slate-300" strokeWidth={2} />
              <span className="truncate font-medium text-slate-900" aria-current="page">
                {current?.label || 'Admin'}
              </span>
            </nav>

            <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3">
              <QuickSearch items={navItems} />
              <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />
              <ProfileMenu user={user} onLogout={handleLogout} />
            </div>
          </header>

          <main className="admin-main flex-1 px-4 py-6 sm:px-6 lg:overflow-y-auto lg:px-8 lg:py-7">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
