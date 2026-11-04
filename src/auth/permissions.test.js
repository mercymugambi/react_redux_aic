import { can, canAccessPage, humanize, PAGE_PERMISSIONS, permissionFor, SUPER_ADMIN } from './permissions';

// The permission names the API defines
const BACKEND_PERMISSIONS = [
  'manage_members',
  'manage_users',
  'manage_roles',
  'manage_events',
  'manage_devotions',
  'manage_fellowship_groups',
  'manage_leadership_positions',
  'manage_finance',
  'view_reports',
  'manage_sermons',
  'manage_visitors',
  'manage_appointments',
  'manage_gallery',
  'manage_settings',
  'manage_blog',
];

const user = (overrides = {}) => ({ super_admin: false, roles: [], permissions: [], ...overrides });

test('every page maps to a permission the API knows, or to null / SUPER_ADMIN', () => {
  Object.values(PAGE_PERMISSIONS).forEach((permission) => {
    if (permission !== null && permission !== SUPER_ADMIN) {
      expect(BACKEND_PERMISSIONS).toContain(permission);
    }
  });
});

test('can() checks the permission list, and the super admin can do anything', () => {
  const treasurer = user({ roles: ['treasurer'], permissions: ['manage_finance'] });
  expect(can(treasurer, 'manage_finance')).toBe(true);
  expect(can(treasurer, 'manage_members')).toBe(false);
  expect(can(user({ super_admin: true }), 'manage_members')).toBe(true);
  expect(can(null, 'manage_members')).toBe(false);
  expect(can(user({ permissions: undefined }), 'manage_members')).toBe(false);
});

test('pages open by permission, ignoring a trailing slash', () => {
  const secretary = user({ permissions: ['manage_members'] });
  expect(canAccessPage(secretary, '/admin/members')).toBe(true);
  expect(canAccessPage(secretary, '/admin/members/')).toBe(true);
  expect(canAccessPage(secretary, '/admin/events')).toBe(false);
  expect(canAccessPage(secretary, '/admin')).toBe(true);
  expect(canAccessPage(null, '/admin')).toBe(false);
});

test('the add-user page is for the super admin only, whatever permissions a role grants', () => {
  const everything = user({ permissions: [...BACKEND_PERMISSIONS, 'super_admin'] });
  expect(canAccessPage(everything, '/admin/users')).toBe(true);
  expect(canAccessPage(everything, '/admin/users/new')).toBe(false);
  expect(canAccessPage(user({ super_admin: true }), '/admin/users/new')).toBe(true);
});

test('unlisted admin paths are closed to everyone but the super admin', () => {
  expect(permissionFor('/admin/finance')).toBeUndefined();
  expect(canAccessPage(user({ permissions: BACKEND_PERMISSIONS }), '/admin/finance')).toBe(false);
  expect(canAccessPage(user({ super_admin: true }), '/admin/finance')).toBe(true);
});

test('humanize() formats role and permission names', () => {
  expect(humanize('church_admin')).toBe('Church admin');
  expect(humanize('manage_leadership_positions')).toBe('Manage leadership positions');
  expect(humanize()).toBe('');
});
