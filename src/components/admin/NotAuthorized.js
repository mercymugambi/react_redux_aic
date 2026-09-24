import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { humanize, permissionFor, SUPER_ADMIN } from '../../auth/permissions';
import Icon from './Icon';

// PermissionRoute sends users here, with the page they tried to open in state.from
function NotAuthorized() {
  const { state } = useLocation();
  const permission = state?.from ? permissionFor(state.from) : undefined;

  let reason = 'Your account doesn’t have permission to open this page.';
  let hint = ' If you need it, ask the super admin to give your account a role that includes it.';
  if (permission === SUPER_ADMIN) {
    reason = 'Only the super admin can open this page.';
    hint = '';
  } else if (permission) {
    reason = `This page needs the “${humanize(permission)}” permission.`;
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center font-sans">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <Icon name="lock" className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-[17px] font-semibold text-slate-900">You don’t have access to this page</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
        {reason}
        {hint}
      </p>
      <Link
        to="/admin"
        className="mt-6 inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
      >
        <Icon name="chevronLeft" className="h-3.5 w-3.5" strokeWidth={2} />
        Back to overview
      </Link>
    </div>
  );
}

export default NotAuthorized;
