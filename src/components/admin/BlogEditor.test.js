import blogPosts from '../../data/blogPosts';
import { blocksToText, readMinutes, slugify, textToBlocks } from './BlogEditor';

test('every post on the website survives a round trip through the editor text', () => {
  blogPosts.forEach((post) => {
    expect(textToBlocks(blocksToText(post.body))).toEqual(post.body);
  });
});

test('editor text conventions become blocks', () => {
  const text = [
    'First line of a paragraph',
    'that wraps onto a second.',
    '',
    '## A heading',
    '',
    '> Be still, and know that I am God.',
    '> — Psalm 46:10',
    '',
    '> A quote with no reference',
    '',
    '- One',
    '* Two',
  ].join('\n');

  expect(textToBlocks(text)).toEqual([
    { type: 'paragraph', text: 'First line of a paragraph that wraps onto a second.' },
    { type: 'heading', text: 'A heading' },
    { type: 'quote', text: 'Be still, and know that I am God.', cite: 'Psalm 46:10' },
    { type: 'quote', text: 'A quote with no reference' },
    { type: 'list', items: ['One', 'Two'] },
  ]);
  expect(textToBlocks('  \n\n  ')).toEqual([]);
});

test('slugs and read times', () => {
  expect(slugify('Why We Still Gather — in an Age of Livestreams!')).toBe('why-we-still-gather-in-an-age-of-livestreams');
  expect(slugify('Café & Prayer')).toBe('cafe-prayer');
  expect(readMinutes([])).toBe(1);
  expect(readMinutes([{ type: 'paragraph', text: 'word '.repeat(1000) }])).toBe(5);
});
