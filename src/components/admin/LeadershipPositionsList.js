import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { apiErrorMessage, apiErrorMessages } from '../../redux/api';
import Icon from './Icon';
import {
  Avatar,
  BUTTON,
  ConfirmDialog,
  Modal,
  muted,
  PRIMARY_BUTTON,
  Skeleton,
  StatCard,
  Toast,
  useToast,
} from './ui';

const PILL = 'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium';
const SELECT =
  'h-8 rounded-lg border border-slate-200 bg-white pl-2.5 pr-8 text-[13px] text-slate-700 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100';
const ICON_ACTION =
  'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50/60 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200';

const memberFullName = (m) =>
  m ? [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ') || 'Unnamed member' : '';

const EMPTY_POSITION = {
  position_name: '',
  position_code: '',
  description: '',
  member_id: '',
};

function LeadershipPositionsList() {
  const [positions, setPositions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, flash] = useToast();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'filled' | 'vacant'

  // Create / Edit Position Modal
  const [editingPosition, setEditingPosition] = useState(null); // null | 'new' | position object
  const [form, setForm] = useState(EMPTY_POSITION);
  const [formErrors, setFormErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  // Quick Assign / Reassign Member Modal
  const [assigningPosition, setAssigningPosition] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Delete Confirmation
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [posRes, membersRes] = await Promise.all([
        api.get('/api/v1/leadership_positions'),
        api.get('/api/v1/members').catch(() => ({ data: [] })),
      ]);
      setPositions(Array.isArray(posRes.data) ? posRes.data : []);
      setMembers(Array.isArray(membersRes.data) ? membersRes.data : []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load leadership positions.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = positions.length;
    const filled = positions.filter((p) => Boolean(p.holder)).length;
    const vacant = total - filled;
    return { total, filled, vacant };
  }, [positions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return positions.filter((pos) => {
      if (statusFilter === 'filled' && !pos.holder) return false;
      if (statusFilter === 'vacant' && pos.holder) return false;
      if (!q) return true;
      return (
        pos.position_name?.toLowerCase().includes(q) ||
        pos.position_code?.toLowerCase().includes(q) ||
        pos.description?.toLowerCase().includes(q) ||
        (pos.holder && memberFullName(pos.holder).toLowerCase().includes(q))
      );
    });
  }, [positions, query, statusFilter]);

  const openCreateModal = () => {
    setEditingPosition('new');
    setForm(EMPTY_POSITION);
    setFormErrors([]);
  };

  const openEditModal = (pos) => {
    setEditingPosition(pos);
    setForm({
      position_name: pos.position_name || '',
      position_code: pos.position_code || '',
      description: pos.description || '',
      member_id: pos.member_id || pos.holder?.id || '',
    });
    setFormErrors([]);
  };

  const closeFormModal = () => {
    setEditingPosition(null);
    setForm(EMPTY_POSITION);
    setFormErrors([]);
  };

  const handleSavePosition = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    if (!form.position_name.trim()) {
      setFormErrors(['Position title is required.']);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        leadership_position: {
          position_name: form.position_name.trim(),
          position_code: form.position_code.trim().toUpperCase() || null,
          description: form.description.trim() || null,
          member_id: form.member_id || null,
        },
      };
      if (editingPosition === 'new') {
        const res = await api.post('/api/v1/leadership_positions', payload);
        const created = res.data.leadership_position || res.data;
        setPositions((prev) => [...prev, created]);
        flash(`Position “${created.position_name}” created`);
      } else {
        const res = await api.patch(`/api/v1/leadership_positions/${editingPosition.id}`, payload);
        const updated = res.data.leadership_position || res.data;
        setPositions((prev) => prev.map((p) => (p.id === editingPosition.id ? updated : p)));
        flash(`Position “${updated.position_name}” updated`);
      }
      closeFormModal();
    } catch (err) {
      setFormErrors(apiErrorMessages(err, 'Could not save leadership position.'));
    } finally {
      setSaving(false);
    }
  };

  const openAssignModal = (pos) => {
    setAssigningPosition(pos);
    setSelectedMemberId(pos.member_id || pos.holder?.id || '');
    setMemberSearch('');
  };

  const handleAssignMember = async (e) => {
    e.preventDefault();
    if (!assigningPosition) return;
    setAssigning(true);
    try {
      const res = await api.patch(`/api/v1/leadership_positions/${assigningPosition.id}`, {
        leadership_position: {
          member_id: selectedMemberId || null,
        },
      });
      const updated = res.data.leadership_position || res.data;
      setPositions((prev) => prev.map((p) => (p.id === assigningPosition.id ? updated : p)));
      if (updated.holder) {
        flash(`Assigned “${updated.position_name}” to ${memberFullName(updated.holder)}`);
      } else {
        flash(`Unassigned “${updated.position_name}” (now vacant)`);
      }
      setAssigningPosition(null);
    } catch (err) {
      flash(apiErrorMessage(err, 'Could not update position holder.'));
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignMember = async (pos) => {
    const previousHolder = pos.holder ? memberFullName(pos.holder) : 'member';
    try {
      const res = await api.patch(`/api/v1/leadership_positions/${pos.id}`, {
        leadership_position: { member_id: null },
      });
      const updated = res.data.leadership_position || res.data;
      setPositions((prev) => prev.map((p) => (p.id === pos.id ? updated : p)));
      flash(`Removed ${previousHolder} from “${pos.position_name}”`);
    } catch (err) {
      flash(apiErrorMessage(err, 'Could not unassign member.'));
    }
  };

  const handleDeletePosition = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/api/v1/leadership_positions/${confirmDelete.id}`);
      setPositions((prev) => prev.filter((p) => p.id !== confirmDelete.id));
      flash(`Deleted position “${confirmDelete.position_name}”`);
      setConfirmDelete(null);
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'Could not delete leadership position.'));
    } finally {
      setDeleting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        memberFullName(m).toLowerCase().includes(q) ||
        m.phone_number?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400">Congregation</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            Leadership Positions
          </h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Create church leadership positions and assign each position to a member. A position holds one member at a time and can be reassigned or vacated anytime.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={loadData} disabled={loading} className={BUTTON}>
            <Icon name="refresh" className="h-3.5 w-3.5 text-slate-500" />
            Refresh
          </button>
          <button type="button" onClick={openCreateModal} className={PRIMARY_BUTTON}>
            <Icon name="plus" className="h-3.5 w-3.5" strokeWidth={2} />
            Create Position
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <section aria-label="Leadership summary" className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <StatCard
          label="Total Positions"
          icon="briefcase"
          tone="red"
          value={stats.total}
          caption="Defined leadership offices"
          loading={loading}
        />
        <StatCard
          label="Filled Positions"
          icon="checkBadge"
          tone="emerald"
          value={stats.filled}
          caption="Currently assigned to a member"
          loading={loading}
        />
        <StatCard
          label="Vacant Positions"
          icon="userPlus"
          tone="amber"
          value={stats.vacant}
          caption="Available to be assigned"
          loading={loading}
        />
      </section>

      {/* Main Card */}
      <section aria-label="Positions table" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 px-4 py-3">
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Icon
              name="search"
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search position, code, or member…"
              aria-label="Search leadership positions"
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

          <select
            aria-label="Filter by assignment status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={SELECT}
          >
            <option value="all">All positions</option>
            <option value="filled">Filled (Assigned)</option>
            <option value="vacant">Vacant (Unassigned)</option>
          </select>

          <span className="ml-auto text-xs text-slate-500">
            Showing <strong className="font-medium text-slate-700">{filtered.length}</strong> of{' '}
            <strong className="font-medium text-slate-700">{positions.length}</strong> position
            {positions.length === 1 ? '' : 's'}
          </span>
        </div>

        {error ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-slate-800">Couldn’t load leadership positions</p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button type="button" onClick={loadData} className={`mt-3 ${BUTTON}`}>
              <Icon name="refresh" className="h-3.5 w-3.5" />
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-60" />
                </div>
                <Skeleton className="h-7 w-36" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] font-medium text-slate-700">
              {query || statusFilter !== 'all'
                ? 'No leadership positions match your filter'
                : 'No leadership positions created yet'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {query || statusFilter !== 'all'
                ? 'Try clearing your search or status filter.'
                : 'Click "Create Position" to add a leadership position and link it to a church member.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60">
                  <th scope="col" className="pl-4 pr-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Position
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Description
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Current Holder (Member)
                  </th>
                  <th scope="col" className="pr-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((pos) => {
                  const holder = pos.holder;
                  return (
                    <tr
                      key={pos.id}
                      onClick={() => openEditModal(pos)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/70"
                    >
                      <td className="pl-4 pr-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-100">
                            <Icon name="briefcase" className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{pos.position_name}</span>
                              {pos.position_code && (
                                <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-slate-500">
                                  {pos.position_code}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 max-w-xs">
                        {pos.description || muted('No description')}
                      </td>
                      <td className="px-3 py-3">
                        {holder ? (
                          <div className="flex items-center gap-2.5">
                            <Avatar name={memberFullName(holder)} className="h-7 w-7 text-[11px]" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {memberFullName(holder)}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {holder.phone_number || holder.email || 'Member'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className={`${PILL} border-amber-200 bg-amber-50 text-amber-800`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Vacant
                          </span>
                        )}
                      </td>
                      <td
                        className="pr-4 py-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openAssignModal(pos)}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            <Icon name="userPlus" className="h-3.5 w-3.5 text-red-700" />
                            {holder ? 'Reassign' : 'Assign Member'}
                          </button>
                          {holder && (
                            <button
                              type="button"
                              onClick={() => handleUnassignMember(pos)}
                              title="Take away position from current member"
                              className="inline-flex h-7 items-center rounded-lg border border-amber-200 bg-amber-50/70 px-2 text-xs font-medium text-amber-900 transition hover:bg-amber-100"
                            >
                              Unassign
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(pos)}
                            title="Edit position details"
                            aria-label={`Edit ${pos.position_name}`}
                            className={ICON_ACTION}
                          >
                            <Icon name="pencil" className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(pos)}
                            title="Delete position"
                            aria-label={`Delete ${pos.position_name}`}
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

      {/* Create / Edit Position Modal */}
      {editingPosition && (
        <Modal
          titleId="position-modal-title"
          title={
            editingPosition === 'new'
              ? 'Create Leadership Position'
              : `Edit Position: ${editingPosition.position_name}`
          }
          description="One position can be held by at most one member at a time."
          icon="briefcase"
          size="md"
          onClose={closeFormModal}
          footer={
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={closeFormModal} disabled={saving} className={BUTTON}>
                Cancel
              </button>
              <button
                type="submit"
                form="position-form"
                disabled={saving}
                className={PRIMARY_BUTTON}
              >
                {saving ? 'Saving…' : editingPosition === 'new' ? 'Create Position' : 'Save Changes'}
              </button>
            </div>
          }
        >
          <form id="position-form" onSubmit={handleSavePosition} className="p-5 space-y-4" noValidate>
            {formErrors.length > 0 && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
                <ul className="list-disc pl-5 space-y-0.5">
                  {formErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="pos-name" className="block text-[13px] font-medium text-slate-700">
                  Position Title <span className="text-red-600">*</span>
                </label>
                <input
                  id="pos-name"
                  type="text"
                  value={form.position_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, position_name: e.target.value }))}
                  placeholder="e.g. Senior Pastor, Church Treasurer, Choir Director"
                  required
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label htmlFor="pos-code" className="block text-[13px] font-medium text-slate-700">
                  Code (optional)
                </label>
                <input
                  id="pos-code"
                  type="text"
                  value={form.position_code}
                  onChange={(e) => setForm((prev) => ({ ...prev, position_code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. TREAS"
                  maxLength={15}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-[13px] uppercase text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pos-desc" className="block text-[13px] font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="pos-desc"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Responsibilities and scope of this leadership position…"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div>
              <label htmlFor="pos-member" className="block text-[13px] font-medium text-slate-700">
                Assigned Member (optional)
              </label>
              <select
                id="pos-member"
                value={form.member_id}
                onChange={(e) => setForm((prev) => ({ ...prev, member_id: e.target.value }))}
                className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
              >
                <option value="">— Leave vacant (unassigned) —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {memberFullName(m)} ({m.phone_number || m.email || 'Member'})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Selecting a member assigns this position exclusively to them. You can reassign or unassign it at any time.
              </p>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign / Reassign Member Modal */}
      {assigningPosition && (
        <Modal
          titleId="assign-position-title"
          title={`Assign Holder: ${assigningPosition.position_name}`}
          description="Select an existing church member to hold this position, or leave it vacant."
          icon="userPlus"
          size="md"
          onClose={() => setAssigningPosition(null)}
          footer={
            <div className="flex items-center justify-between gap-2">
              {assigningPosition.holder ? (
                <button
                  type="button"
                  onClick={() => setSelectedMemberId('')}
                  className="text-xs font-medium text-amber-800 hover:underline"
                >
                  Clear holder (make vacant)
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningPosition(null)}
                  disabled={assigning}
                  className={BUTTON}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="assign-member-form"
                  disabled={assigning}
                  className={PRIMARY_BUTTON}
                >
                  {assigning ? 'Saving…' : 'Save Assignment'}
                </button>
              </div>
            </div>
          }
        >
          <form id="assign-member-form" onSubmit={handleAssignMember} className="p-5 space-y-4">
            <div className="relative">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search members by name, phone, or email…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200">
              <label
                className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-[13px] transition ${
                  selectedMemberId === '' ? 'bg-amber-50/60 font-medium text-amber-900' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="position_holder"
                  checked={selectedMemberId === ''}
                  onChange={() => setSelectedMemberId('')}
                  className="h-4 w-4 accent-red-700"
                />
                <span>Vacant — No member assigned</span>
              </label>

              {filteredMembers.map((m) => {
                const checked = String(selectedMemberId) === String(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition ${
                      checked ? 'bg-red-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="position_holder"
                      checked={checked}
                      onChange={() => setSelectedMemberId(m.id)}
                      className="h-4 w-4 accent-red-700"
                    />
                    <Avatar name={memberFullName(m)} className="h-7 w-7 text-[11px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-slate-900">
                        {memberFullName(m)}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {[m.phone_number, m.email].filter(Boolean).join(' · ') || 'Member'}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete “${confirmDelete.position_name}”?`}
          message="This removes the leadership position. The member record in the directory will not be deleted."
          confirmLabel="Delete position"
          busy={deleting}
          error={deleteError}
          onConfirm={handleDeletePosition}
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

export default LeadershipPositionsList;
