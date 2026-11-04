import { matchPath } from 'react-router-dom';

// Marks a page only the super admin may open. It's a Symbol so no role can
// ever grant it by carrying a permission with the same name.
export const SUPER_ADMIN = Symbol('super_admin');

/**
 * The permission each admin page needs. This is the only place pages are
 * mapped to permissions: the route guard, sidebar, page search and overview
 * all read from here.
 *
 *   null         any signed-in user
 *   SUPER_ADMIN  only the super admin (user.super_admin)
 *
 * Paths missing from this list are closed to everyone except the super admin,
 * so a new page stays hidden until it's given a permission here.
 *
 * Hiding a page is not security: the API must enforce the same rules.
 */
export const PAGE_PERMISSIONS = {
  '/admin': null,
  '/admin/members': 'manage_members',
  '/admin/fellowship-groups': 'manage_fellowship_groups',
  '/admin/leadership-positions': 'manage_leadership_positions',
  '/admin/events': 'manage_events',
  '/admin/devotions': 'manage_devotions',
  '/admin/blog': 'manage_blog',
  // The editor: /admin/blog/new, or /admin/blog/12 for an existing post
  '/admin/blog/:postId': 'manage_blog',
  '/admin/gallery': 'manage_gallery',
  '/admin/users': 'manage_users',
  '/admin/users/new': SUPER_ADMIN,
  '/admin/roles': 'manage_roles',
  '/admin/settings': 'manage_settings',
};

export const NOT_AUTHORIZED_PATH = '/admin/not-authorized';

export const can = (user, permission) =>
  Boolean(user) && (user.super_admin === true || (user.permissions || []).includes(permission));

// The permission a path needs: null when it's open to any signed-in user,
// undefined when the path isn't a listed page.
export function permissionFor(pathname) {
  const entry = Object.entries(PAGE_PERMISSIONS).find(([path]) => matchPath(path, pathname));
  return entry ? entry[1] : undefined;
}

export function canAccessPage(user, pathname) {
  const permission = permissionFor(pathname);
  return permission === null ? Boolean(user) : can(user, permission);
}

// "church_admin" → "Church admin"
export function humanize(name = '') {
  const text = name.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
