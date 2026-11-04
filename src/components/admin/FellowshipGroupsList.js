import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../redux/api';
import FellowshipGroupForm, { memberFullName } from './FellowshipGroupForm';
import Icon from './Icon';
import { Avatar, BUTTON, Checkbox, ConfirmDialog, Modal, PRIMARY_BUTTON, Skeleton, Toast, TONES, useToast } from './ui';
import useAdminList, { saveErrorMessages } from './useAdminList';

// One-click starting points when a church has no groups yet
const SUGGESTED_GROUPS = ['Church Choir', 'Youth', 'Women’s Fellowship', 'Men’s Fellowship', 'Sunday School', 'Couples'];
const TONE_ORDER = ['red', 'amber', 'sky', 'emerald'];

const toneFor = (name = '') => TONE_ORDER[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TONE_ORDER.length];
const byName = (a, b) => memberFullName(a).localeCompare(memberFullName(b));
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

/* ── Small building blocks ── */
function GroupTile({ name, className = 'h-10 w-10' }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${TONES[toneFor(name)].chip} ${className}`}>
      <Icon name="group" className="h-1/2 w-1/2" strokeWidth={1.75} />
    </span>
  );
}

function CodeChip({ code }) {
  if (!code) return null;
  return <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{code}</span>;
}

function AvatarStack({ members, total }) {
  if (!total) return <span className="text-xs text-slate-400">No members yet</span>;
  const shown = members.slice(0, 4);
  return (
    <span className="flex items-center">
      <span className="flex -space-x-1">
        {shown.map((member) => (
          <Avatar key={member.id} name={memberFullName(member)} className="h-7 w-7 text-[10px] ring-2 ring-white" />
        ))}
      </span>
      {total > shown.length && <span className="ml-2 text-xs font-medium text-slate-500">+{total - shown.length}</span>}
    </span>
  );
}

function GroupCard({ group, members, count, onOpen }) {
  return (
    <article className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-[0_8px_24px_-14px_rgba(15,23,42,0.25)] focus-within:ring-2 focus-within:ring-red-200">
      <div className="flex items-start gap-3">
        <GroupTile name={group.group_name} />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2">
            {/* The button stretches over the whole card */}
            <button
              type="button"
              onClick={onOpen}
              className="truncate text-left text-[15px] font-semibold text-slate-900 after:absolute after:inset-0 after:content-[''] group-hover:text-red-700 focus-visible:outline-none"
            >
              {group.group_name}
            </button>
            <CodeChip code={group.group_code} />
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{plural(count, 'member')}</p>
        </div>
      </div>
      <p className={`mt-3 line-clamp-2 min-h-[2.5rem] text-[13px] leading-relaxed ${group.description ? 'text-slate-600' : 'text-slate-400'}`}>
        {group.description || 'No description yet.'}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <AvatarStack members={members} total={count} />
        <span className="min-w-0 truncate text-xs text-slate-500">
          {group.leader ? (
            <>
              Led by <span className="font-medium text-slate-700">{memberFullName(group.leader)}</span>
            </>
          ) : (
            'No leader'
          )}
        </span>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <span className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/5" />
          <Skeleton className="h-3 w-1/4" />
        </span>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-3/4" />
      <div className="mt-5 flex -space-x-2 border-t border-slate-100 pt-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-7 w-7 rounded-full ring-2 ring-white" />
        ))}
      </div>
    </div>
  );
}

/* ── Group panel: who's in it, add and remove members ── */
function GroupPanel({ group, groupMembers, allMembers, membersAvailable, onClose, onEdit, onDelete, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null); // 'add' or a member id being removed
  const [error, setError] = useState(null);

  const memberIds = useMemo(() => new Set(groupMembers.map((m) => m.id)), [groupMembers]);
  const candidates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allMembers
      .filter((m) => !memberIds.has(m.id))
      .filter((m) => !needle || [memberFullName(m), m.phone_number, m.email].join(' ').toLowerCase().includes(needle))
      .sort(byName);
  }, [allMembers, memberIds, search]);

  const togglePick = (id) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stopAdding = () => {
    setAdding(false);
    setPicked(new Set());
    setSearch('');
  };

  const addMembers = async () => {
    setBusy('add');
    setError(null);
    try {
      await api.post(`/api/v1/fellowship_groups/${group.id}/members`, { member_ids: [...picked] });
      onChanged(`${plural(picked.size, 'member')} added to ${group.group_name}`);
      stopAdding();
    } catch (err) {
      setError(saveErrorMessages(err, 'fellowship groups', 'Could not add the members.').join(' '));
    } finally {
      setBusy(null);
    }
  };

  const removeMember = async (member) => {
    setBusy(member.id);
    setError(null);
    try {
      await api.delete(`/api/v1/fellowship_groups/${group.id}/members/${member.id}`);
      onChanged(`${memberFullName(member)} removed from ${group.group_name}`);
    } catch (err) {
      setError(saveErrorMessages(err, 'fellowship groups', 'Could not remove the member.').join(' '));
    } finally {
      setBusy(null);
    }
  };

  const footer = adding ? (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-slate-500">{picked.size ? `${plural(picked.size, 'member')} selected` : 'Choose who to add'}</p>
      <div className="flex gap-2">
        <button type="button" onClick={stopAdding} disabled={busy === 'add'} className={BUTTON}>
          Cancel
        </button>
        <button type="button" onClick={addMembers} disabled={!picked.size || busy === 'add'} className={PRIMARY_BUTTON}>
          {busy === 'add' ? 'Adding…' : picked.size > 1 ? `Add ${picked.size} members` : 'Add member'}
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-2">
      <button type="button" onClick={onDelete} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-red-700 transition hover:bg-red-50">
        <Icon name="trash" className="h-3.5 w-3.5" />
        Delete group
      </button>
      <button type="button" onClick={onEdit} className={PRIMARY_BUTTON}>
        <Icon name="pencil" className="h-3.5 w-3.5" />
        Edit group
      </button>
    </div>
  );

  return (
    <Modal titleId="group-panel-title" onClose={adding ? stopAdding : onClose} footer={footer} size="sm">
      {/* Identity */}
      <div className="relative overflow-clip border-b border-slate-100 px-5 pb-5 pt-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-72 opacity-80"
          style={{ background: TONES[toneFor(group.group_name)].wash, filter: 'blur(28px)' }}
        />
        <div className="relative">
          <GroupTile name={group.group_name} className="h-12 w-12" />
          <h2 id="group-panel-title" className="mt-3 flex items-center gap-2 text-lg font-semibold leading-snug text-slate-900">
            {group.group_name}
            <CodeChip code={group.group_code} />
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-500">{plural(groupMembers.length || group.member_count || 0, 'member')}</p>
          {group.description && <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-slate-600">{group.description}</p>}
          <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 backdrop-blur">
            {group.leader ? (
              <>
                <Avatar name={memberFullName(group.leader)} className="h-7 w-7 text-[10px]" />
                <span className="text-[13px]">
                  <span className="block text-[11px] text-slate-500">Leader</span>
                  <span className="font-medium text-slate-900">{memberFullName(group.leader)}</span>
                </span>
              </>
            ) : (
              <span className="text-[13px] text-slate-500">
                No leader yet.{' '}
                <button type="button" onClick={onEdit} className="font-medium text-red-700 underline-offset-2 hover:underline">
                  Choose one
                </button>
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{adding ? 'Add members' : `Members · ${groupMembers.length}`}</h3>
          {!adding && membersAvailable && (
            <button type="button" onClick={() => setAdding(true)} className={`${BUTTON} h-7`}>
              <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
              Add members
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
            {error}
          </p>
        )}

        {!membersAvailable ? (
          <p className="mt-3 text-[13px] text-slate-500">You need access to the Members page to see and manage who’s in this group.</p>
        ) : adding ? (
          <div className="mt-3">
            <label className="relative block">
              <span className="sr-only">Search members</span>
              <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or phone…"
                autoFocus
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </label>
            {candidates.length ? (
              <ul className="mt-2 divide-y divide-slate-100">
                {candidates.map((member) => (
                  <li key={member.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2 hover:bg-slate-50">
                      <Checkbox checked={picked.has(member.id)} onChange={() => togglePick(member.id)} label={`Add ${memberFullName(member)}`} />
                      <Avatar name={memberFullName(member)} className="h-8 w-8 text-xs" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-slate-900">{memberFullName(member)}</span>
                        <span className="block truncate text-xs tabular-nums text-slate-500">{member.phone_number || 'No phone number'}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-center text-[13px] text-slate-500">
                {search.trim() ? 'No one matches that search.' : 'Everyone in the directory is already in this group.'}
              </p>
            )}
          </div>
        ) : groupMembers.length ? (
          <ul className="mt-2 divide-y divide-slate-100">
            {groupMembers.map((member) => {
              const isLeader = group.leader?.id === member.id;
              return (
                <li key={member.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={memberFullName(member)} className="h-8 w-8 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium text-slate-900">{memberFullName(member)}</span>
                      {isLeader && <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-100">Leader</span>}
                    </span>
                    <span className="block truncate text-xs tabular-nums text-slate-500">{member.phone_number || 'No phone number'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(member)}
                    disabled={busy !== null}
                    aria-label={`Remove ${memberFullName(member)} from ${group.group_name}`}
                    title="Remove from group"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                  >
                    {busy === member.id ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" /> : <Icon name="close" className="h-3.5 w-3.5" strokeWidth={2} />}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
            <p className="text-[13px] font-medium text-slate-800">No one’s in this group yet</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {allMembers.length ? 'Add members from the directory.' : (
                <>
                  First add people on the{' '}
                  <Link to="/admin/members" className="font-medium text-red-700 underline-offset-2 hover:underline">
                    Members page
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        )}
      </section>
    </Modal>
  );
}

/* ── Page ── */
function FellowshipGroupsList() {
  const { rows: groups, loading, refreshing, error, updatedAt, load } = useAdminList('/api/v1/fellowship_groups', { label: 'fellowship groups' });
  const [members, setMembers] = useState([]);
  const [membersAvailable, setMembersAvailable] = useState(true);

  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null); // null, { group }, or { prefillName }
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [toast, flash] = useToast();

  // Members give each group its faces, the leader list and the add-members picker.
  // Groups still work without them (e.g. no access to the Members page).
  const loadMembers = useCallback(() => {
    api.get('/api/v1/members')
      .then((response) => {
        setMembers(Array.isArray(response.data) ? response.data : []);
        setMembersAvailable(true);
      })
      .catch(() => setMembersAvailable(false));
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const reload = () => {
    load();
    loadMembers();
  };

  const membersByGroup = useMemo(() => {
    const map = new Map();
    members.forEach((member) =>
      (member.fellowship_groups || []).forEach((g) => {
        if (!map.has(g.id)) map.set(g.id, []);
        map.get(g.id).push(member);
      })
    );
    map.forEach((list) => list.sort(byName));
    return map;
  }, [members]);

  const countFor = (group) => (membersAvailable ? (membersByGroup.get(group.id) || []).length : group.member_count ?? 0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...groups]
      .filter((g) => !needle || [g.group_name, g.group_code, g.description, g.leader && memberFullName(g.leader)].join(' ').toLowerCase().includes(needle))
      .sort((a, b) => a.group_name.localeCompare(b.group_name));
  }, [groups, query]);

  const suggestions = SUGGESTED_GROUPS.filter((name) => !groups.some((g) => g.group_name.trim().toLowerCase() === name.toLowerCase()));
  const openGroup = groups.find((g) => g.id === openId) || null;
  const closePanel = useCallback(() => setOpenId(null), []);
  const closeForm = useCallback(() => setForm(null), []);
  const unassigned = members.filter((m) => !(m.fellowship_groups || []).length).length;

  const handleSaved = (saved, sent) => {
    const wasEdit = Boolean(form?.group);
    setForm(null);
    flash(wasEdit ? 'Changes saved' : `${sent.group_name} created`);
    if (!wasEdit && saved?.id) setOpenId(saved.id);
    reload();
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/fellowship_groups/${deleting.id}`);
      setDeleting(null);
      setOpenId(null);
      flash(`${deleting.group_name} was deleted`);
      reload();
    } catch (err) {
      setDeleteError(saveErrorMessages(err, 'fellowship groups', 'Could not delete the group.').join(' '));
    } finally {
      setDeleteBusy(false);
    }
  };

  const newButton = (
    <button type="button" onClick={() => setForm({})} className={PRIMARY_BUTTON}>
      <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
      New group
    </button>
  );

  let content;
  if (loading) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  } else if (error) {
    content = (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <Icon name="warning" className="mx-auto h-6 w-6 text-slate-400" />
        <p className="mt-3 text-sm font-medium text-slate-900">Couldn’t load fellowship groups</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">{error}</p>
        <button type="button" onClick={reload} className={`${BUTTON} mt-4`}>
          <Icon name="refresh" className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  } else if (!groups.length) {
    content = (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-50 via-rose-50 to-amber-50 text-red-400 ring-1 ring-slate-200/70">
          <Icon name="group" className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-900">No fellowship groups yet</p>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-slate-500">Groups help you organise members by ministry. Start with one of these, or create your own.</p>
        <div className="mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-2">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setForm({ prefillName: name })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50/60 hover:text-red-700"
            >
              <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
              {name}
            </button>
          ))}
        </div>
        <div className="mt-5">{newButton}</div>
      </div>
    );
  } else if (!visible.length) {
    content = (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
        <Icon name="search" className="mx-auto h-6 w-6 text-slate-400" />
        <p className="mt-3 text-sm font-medium text-slate-900">No groups match “{query.trim()}”</p>
        <button type="button" onClick={() => setQuery('')} className={`${BUTTON} mt-4`}>
          <Icon name="close" className="h-3.5 w-3.5" />
          Clear search
        </button>
      </div>
    );
  } else {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visible.map((group) => (
          <GroupCard key={group.id} group={group} members={membersByGroup.get(group.id) || []} count={countFor(group)} onOpen={() => setOpenId(group.id)} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-4 font-sans text-slate-900 antialiased">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Fellowship Groups</h1>
            <p className="mt-1 text-[13px] text-slate-500">The ministries members belong to, who leads them, and who’s in each one.</p>
          </div>
          <div className="flex items-center gap-2">
            {updatedAt && (
              <span className="mr-1 hidden text-xs text-slate-400 md:inline">
                Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button type="button" onClick={reload} disabled={loading || refreshing} className={BUTTON}>
              <Icon name="refresh" className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {newButton}
          </div>
        </header>

        {groups.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-slate-500">
              {plural(groups.length, 'group')}
              {membersAvailable && members.length > 0 && (
                <>
                  {' · '}
                  {unassigned ? (
                    <Link to="/admin/members" className="text-red-700 underline-offset-2 hover:underline">
                      {plural(unassigned, 'member')} not in any group
                    </Link>
                  ) : (
                    'every member is in a group'
                  )}
                </>
              )}
            </p>
            <label className="relative sm:w-64">
              <span className="sr-only">Search groups</span>
              <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search groups…"
                className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </label>
          </div>
        )}

        {content}
      </div>

      {openGroup && !form && (
        <GroupPanel
          group={openGroup}
          groupMembers={membersByGroup.get(openGroup.id) || []}
          allMembers={members}
          membersAvailable={membersAvailable}
          onClose={closePanel}
          onEdit={() => setForm({ group: openGroup })}
          onDelete={() => {
            setDeleteError(null);
            setDeleting(openGroup);
          }}
          onChanged={(message) => {
            flash(message);
            reload();
          }}
        />
      )}
      {form && (
        <FellowshipGroupForm group={form.group || null} prefillName={form.prefillName} groups={groups} members={members} onClose={closeForm} onSaved={handleSaved} />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.group_name}?`}
          message={`${
            countFor(deleting) ? `Its ${plural(countFor(deleting), 'member')} stay in the church directory; they’re only removed from this group. ` : ''
          }This can’t be undone.`}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
      <Toast message={toast} />
    </>
  );
}

export default FellowshipGroupsList;
