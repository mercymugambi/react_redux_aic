import React, { useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Modal } from './ui';

function AddMember({ startOpen = false }) {
  const [open, setOpen] = useState(startOpen);
  const nameRef = useRef(null);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Add member
      </button>
      {open && (
        <Modal
          titleId="add-member-title"
          title="Add a member"
          description="Add someone to the church directory."
          icon="userPlus"
          onClose={() => setOpen(false)}
          initialFocusRef={nameRef}
          footer={<button type="button">Save</button>}
        >
          <input ref={nameRef} aria-label="First name" />
        </Modal>
      )}
    </>
  );
}

test('the modal takes focus, holds the page still and hands focus back when it closes', () => {
  render(<AddMember />);
  const opener = screen.getByRole('button', { name: 'Add member' });
  opener.focus();
  fireEvent.click(opener);

  const dialog = screen.getByRole('dialog', { name: 'Add a member' });
  expect(dialog).toHaveAccessibleDescription('Add someone to the church directory.');
  expect(screen.getByLabelText('First name')).toHaveFocus();
  expect(document.body.style.overflow).toBe('hidden');

  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  expect(document.body.style.overflow).toBe('');
});

test('a click on the backdrop closes the modal, a click inside it does not', () => {
  render(<AddMember startOpen />);
  const dialog = screen.getByRole('dialog');

  fireEvent.click(screen.getByLabelText('First name'));
  expect(dialog).toBeInTheDocument();

  fireEvent.click(dialog.previousElementSibling);
  expect(dialog).not.toBeInTheDocument();
});

test('Tab and Shift+Tab wrap around inside the modal', () => {
  render(<AddMember startOpen />);
  const close = screen.getByRole('button', { name: 'Close' });
  const save = screen.getByRole('button', { name: 'Save' });

  save.focus();
  fireEvent.keyDown(save, { key: 'Tab' });
  expect(close).toHaveFocus();

  fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
  expect(save).toHaveFocus();
});

test('the page stays locked until the last open modal closes', () => {
  const first = render(<AddMember startOpen />);
  const second = render(<AddMember startOpen />);

  first.unmount();
  expect(document.body.style.overflow).toBe('hidden');

  second.unmount();
  expect(document.body.style.overflow).toBe('');
});
