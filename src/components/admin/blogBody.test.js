import {
  applyShortcut,
  convertBlock,
  createBlock,
  insertBlocks,
  joinListItem,
  joinWithNext,
  joinWithPrevious,
  moveBlock,
  pasteIntoListItem,
  pasteIntoParagraph,
  removeBlock,
  splitBlock,
  splitListItem,
  toEditorBlocks,
  toSavedBlocks,
} from './blogBody';

const paragraph = (text) => createBlock('paragraph', { text });
const heading = (text) => createBlock('heading', { text });
const list = (...items) => createBlock('list', { items });
const photo = () => createBlock('image', { url: 'https://res.cloudinary.com/demo/choir.jpg', image_id: 'tok-1', caption: 'The choir' });
const shape = (blocks) => toSavedBlocks(blocks);

test('blocks from the API are edited and saved in the shape the API takes', () => {
  const fromApi = [
    { type: 'heading', text: 'Grace' },
    { type: 'quote', text: 'His mercies are new every morning.', cite: 'Lamentations 3:23' },
    { type: 'quote', text: 'No reference' },
    { type: 'list', items: ['One', 'Two'] },
    { type: 'image', image_id: 'tok-1', url: 'https://res.cloudinary.com/demo/choir.jpg' },
  ];
  const editable = toEditorBlocks(fromApi);
  expect(editable.every((block) => block.id)).toBe(true);
  expect(editable[2].cite).toBe('');
  expect(toSavedBlocks(editable)).toEqual([
    { type: 'heading', text: 'Grace' },
    { type: 'quote', text: 'His mercies are new every morning.', cite: 'Lamentations 3:23' },
    { type: 'quote', text: 'No reference' },
    { type: 'list', items: ['One', 'Two'] },
    { type: 'image', url: 'https://res.cloudinary.com/demo/choir.jpg', caption: '', image_id: 'tok-1' },
  ]);
});

test('empty blocks are left out when saving, since the API rejects them', () => {
  expect(shape([paragraph('  '), heading(''), list(' ', ''), createBlock('quote', { cite: 'John 3:16' }), paragraph(' Kept ')])).toEqual([
    { type: 'paragraph', text: 'Kept' },
  ]);
  expect(toEditorBlocks([])).toHaveLength(1);
});

describe('Enter', () => {
  test('splits a paragraph at the caret, moving the rest to a new paragraph', () => {
    const first = paragraph('Hello world');
    const { blocks, focus } = splitBlock([first], first.id, 5);
    expect(shape(blocks)).toEqual([
      { type: 'paragraph', text: 'Hello' },
      { type: 'paragraph', text: 'world' },
    ]);
    expect(focus).toEqual({ id: blocks[1].id, at: 0 });
  });

  test('at the start of a heading opens a paragraph above it', () => {
    const title = heading('Grace');
    const { blocks, focus } = splitBlock([title], title.id, 0);
    expect(blocks.map((block) => block.type)).toEqual(['paragraph', 'heading']);
    expect(blocks[1]).toBe(title);
    expect(focus).toEqual({ id: title.id, at: 0 });
  });

  test('in a list adds an item, and on an empty item ends the list', () => {
    const steps = list('Pray', 'Read');
    const split = splitListItem([steps], steps.id, 0, 2);
    expect(split.blocks[0].items).toEqual(['Pr', 'ay', 'Read']);
    expect(split.focus).toMatchObject({ field: 'item', item: 1, at: 0 });

    const withEmptyEnd = list('Pray', '');
    const ended = splitListItem([withEmptyEnd], withEmptyEnd.id, 1, 0);
    expect(ended.blocks.map((block) => block.type)).toEqual(['list', 'paragraph']);
    expect(ended.blocks[0].items).toEqual(['Pray']);

    const withEmptyMiddle = list('Pray', '', 'Serve');
    const halved = splitListItem([withEmptyMiddle], withEmptyMiddle.id, 1, 0);
    expect(shape(halved.blocks)).toEqual([
      { type: 'list', items: ['Pray'] },
      { type: 'list', items: ['Serve'] },
    ]);
    expect(halved.blocks[1].type).toBe('paragraph');
  });
});

describe('Backspace at the start of a block', () => {
  test('joins a paragraph onto the one above, with the caret at the join', () => {
    const above = paragraph('Grace is ');
    const below = paragraph('enough');
    const { blocks, focus } = joinWithPrevious([above, below], below.id);
    expect(shape(blocks)).toEqual([{ type: 'paragraph', text: 'Grace is enough' }]);
    expect(focus).toEqual({ id: above.id, at: 9 });
  });

  test('turns a heading or quote back into a paragraph first', () => {
    const verse = createBlock('quote', { text: 'Be still', cite: 'Psalm 46:10' });
    const { blocks } = joinWithPrevious([paragraph('Intro'), verse], verse.id);
    expect(shape(blocks)[1]).toEqual({ type: 'paragraph', text: 'Be still — Psalm 46:10' });
  });

  test('adds a paragraph to the end of the list above it', () => {
    const steps = list('Pray', 'Read');
    const after = paragraph(' daily');
    const { blocks, focus } = joinWithPrevious([steps, after], after.id);
    expect(shape(blocks)).toEqual([{ type: 'list', items: ['Pray', 'Read daily'] }]);
    expect(focus).toMatchObject({ id: steps.id, field: 'item', item: 1, at: 4 });
  });

  test('never deletes a photo, but removes an empty paragraph after it', () => {
    const picture = photo();
    const empty = paragraph('');
    const { blocks, focus } = joinWithPrevious([picture, empty], empty.id);
    expect(blocks).toEqual([picture]);
    expect(focus).toMatchObject({ id: picture.id, field: 'caption' });

    const written = paragraph('Text');
    expect(joinWithPrevious([picture, written], written.id).blocks).toEqual([picture, written]);
  });

  test('in a list joins items, and the first item leaves the list', () => {
    const steps = list('Pray', 'Read');
    expect(joinListItem([steps], steps.id, 1).blocks[0].items).toEqual(['PrayRead']);
    expect(shape(joinListItem([steps], steps.id, 0).blocks)).toEqual([
      { type: 'paragraph', text: 'Pray' },
      { type: 'list', items: ['Read'] },
    ]);
  });
});

test('Delete at the end of a paragraph pulls up the next one', () => {
  const first = paragraph('One ');
  const second = paragraph('two');
  expect(shape(joinWithNext([first, second], first.id).blocks)).toEqual([{ type: 'paragraph', text: 'One two' }]);
  expect(joinWithNext([first, photo()], first.id)).toBeNull();
});

test('blocks change type, and a list becomes one block per item', () => {
  const steps = list('Pray', 'Read');
  expect(shape(convertBlock([steps], steps.id, 'paragraph').blocks)).toEqual([
    { type: 'paragraph', text: 'Pray' },
    { type: 'paragraph', text: 'Read' },
  ]);
  const text = paragraph('Be still');
  expect(shape(convertBlock([text], text.id, 'quote').blocks)).toEqual([{ type: 'quote', text: 'Be still' }]);
  expect(convertBlock([photo()], 'missing', 'heading')).toBeNull();
});

test('typing ## , > or - at the start of a paragraph changes its type', () => {
  const block = paragraph('');
  expect(shape(applyShortcut([block], block.id, '## Grace', 8).blocks)).toEqual([{ type: 'heading', text: 'Grace' }]);
  expect(applyShortcut([block], block.id, '- ', 2)).toMatchObject({ focus: { field: 'item', item: 0, at: 0 } });
  expect(applyShortcut([block], block.id, '> Be still', 10).blocks[0]).toMatchObject({ type: 'quote', text: 'Be still', cite: '' });
  expect(applyShortcut([block], block.id, 'No shortcut', 3)).toBeNull();
});

test('pasting several paragraphs into one splits them into blocks', () => {
  const target = paragraph('Before. After.');
  const { blocks, focus } = pasteIntoParagraph([target], target.id, 8, 8, 'Pasted one.\n\n## A heading\n\nPasted two. ');
  expect(shape(blocks)).toEqual([
    { type: 'paragraph', text: 'Before. Pasted one.' },
    { type: 'heading', text: 'A heading' },
    { type: 'paragraph', text: 'Pasted two. After.' },
  ]);
  expect(blocks[0].id).toBe(target.id);
  expect(focus).toEqual({ id: blocks[2].id, at: 'Pasted two. '.length });
});

test('pasting lines into a list item makes an item of each', () => {
  const steps = list('Pray');
  const { blocks } = pasteIntoListItem([steps], steps.id, 0, 4, 4, '\n- Read\n- Serve');
  expect(blocks[0].items).toEqual(['Pray', 'Read', 'Serve']);
});

test('a new photo replaces an empty paragraph, and is never left last', () => {
  const empty = paragraph('');
  const picture = photo();
  const blocks = insertBlocks([paragraph('Intro'), empty], empty.id, [picture]);
  expect(blocks.map((block) => block.type)).toEqual(['paragraph', 'image', 'paragraph']);
  expect(blocks[1]).toBe(picture);
});

test('blocks move and are removed, always leaving something to write in', () => {
  const one = paragraph('One');
  const two = paragraph('Two');
  expect(moveBlock([one, two], two.id, -1)).toEqual([two, one]);
  expect(moveBlock([one, two], one.id, -1)).toBeNull();
  const { blocks } = removeBlock([one], one.id);
  expect(blocks).toHaveLength(1);
  expect(blocks[0]).toMatchObject({ type: 'paragraph', text: '' });
});
