import { apiErrorMessage, apiErrorMessages } from './api';

const response = (status, data) => ({ response: { status, data } });

test('uses the API’s own messages when it sends them', () => {
  expect(apiErrorMessages(response(422, { errors: ["Phone number can't be blank", 'Email is not a valid email address'] }), 'x')).toEqual([
    "Phone number can't be blank",
    'Email is not a valid email address',
  ]);
  expect(apiErrorMessage(response(409, { error: 'This login account is already linked to another member' }), 'x')).toBe(
    'This login account is already linked to another member'
  );
});

test('a server crash says it is a server problem', () => {
  const html = '<!DOCTYPE html><html>…Action Controller: Exception caught…</html>';
  expect(apiErrorMessage(response(500, html), 'Could not save the member.')).toBe(
    'Could not save the member. (Server error 500: the problem is on the server, not in what you entered.)'
  );
});

test('an unreachable server says so', () => {
  expect(apiErrorMessage(new Error('Network Error'), 'Could not save the member.')).toBe(
    'Could not save the member. (The server couldn’t be reached. Check that the API is running.)'
  );
});

test('other failures without a message fall back', () => {
  expect(apiErrorMessage(response(404, '<h1>Not Found</h1>'), 'Could not save the member.')).toBe('Could not save the member.');
});
