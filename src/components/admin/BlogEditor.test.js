import {
  blocksToText,
  buildPostFormData,
  coverFileError,
  imageIdsFromBlocks,
  insertImageLine,
  postChecks,
  readMinutes,
  slugify,
  STARTER_OUTLINE,
  textToBlocks,
} from './BlogEditor';

const SAMPLE_BODY = [
  { type: 'paragraph', text: 'There is a particular kind of quiet that settles over a sanctuary after the last song.' },
  { type: 'heading', text: 'Grace is not a feeling you store up' },
  { type: 'quote', text: 'His mercies never come to an end; they are new every morning.', cite: 'Lamentations 3:22–23' },
  { type: 'quote', text: 'A quote with no reference' },
  { type: 'list', items: ['Begin before the noise.', 'Carry one verse, not twenty.'] },
  { type: 'image', url: 'https://res.cloudinary.com/demo/choir.jpg', caption: 'The choir at the Easter service', image_id: 'blob-1' },
];

const paragraph = (words) => ({ type: 'paragraph', text: 'word '.repeat(words).trim() });
const failing = (checks) => checks.filter((check) => !check.ok).map((check) => check.id);

test('a post body survives a round trip through the editor text', () => {
  expect(textToBlocks(blocksToText(SAMPLE_BODY), imageIdsFromBlocks(SAMPLE_BODY))).toEqual(SAMPLE_BODY);
});

describe('photos in the post', () => {
  const url = 'https://res.cloudinary.com/demo/choir.jpg';

  test('a photo line becomes an image block, even without blank lines around it', () => {
    expect(textToBlocks(`Before the photo.\n![  Choir  ](${url})\nAfter the photo.`, { [url]: 'blob-1' })).toEqual([
      { type: 'paragraph', text: 'Before the photo.' },
      { type: 'image', url, caption: 'Choir', image_id: 'blob-1' },
      { type: 'paragraph', text: 'After the photo.' },
    ]);
    expect(textToBlocks(`![](${url})`)).toEqual([{ type: 'image', url, caption: '' }]);
  });

  test('inserting a photo puts it in a block of its own at the cursor', () => {
    const text = 'First paragraph.\n\nSecond paragraph.';
    expect(insertImageLine(text, 'First paragraph.'.length, url)).toBe(`First paragraph.\n\n![](${url})\n\nSecond paragraph.`);
    expect(insertImageLine('', 0, url)).toBe(`![](${url})`);
    expect(insertImageLine('Only text. ', 11, url)).toBe(`Only text.\n\n![](${url})`);
  });

  test('photos without a caption are flagged', () => {
    const checks = postChecks({ blocks: [{ type: 'image', url, caption: '' }] });
    expect(checks.find((check) => check.id === 'captions').ok).toBe(false);
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

test('the starter outline uses every kind of block', () => {
  expect(textToBlocks(STARTER_OUTLINE).map((block) => block.type)).toEqual(['paragraph', 'heading', 'paragraph', 'quote', 'heading', 'list', 'paragraph']);
});

test('slugs and read times', () => {
  expect(slugify('Why We Still Gather — in an Age of Livestreams!')).toBe('why-we-still-gather-in-an-age-of-livestreams');
  expect(slugify('Café & Prayer')).toBe('cafe-prayer');
  expect(readMinutes([])).toBe(1);
  expect(readMinutes([{ type: 'paragraph', text: 'word '.repeat(1000) }])).toBe(5);
});

describe('publishing checklist', () => {
  const good = {
    title: 'The grace that carries you through Monday',
    excerpt: 'Sunday worship lifts the heart, but Monday tests it. Here is how to carry it into the week.',
    blocks: [paragraph(100), { type: 'heading', text: 'Three practices' }, paragraph(100), { type: 'quote', text: 'Be still.', cite: 'Psalm 46:10' }, paragraph(100), paragraph(100)],
    hasCover: true,
  };

  test('a well-formed post passes every check', () => {
    expect(failing(postChecks(good))).toEqual([]);
  });

  test('each check points at its own problem', () => {
    expect(failing(postChecks({ ...good, title: 'Hi' }))).toEqual(['title']);
    expect(failing(postChecks({ ...good, title: 'x'.repeat(71) }))).toEqual(['title']);
    expect(failing(postChecks({ ...good, excerpt: 'Short.' }))).toEqual(['excerpt']);
    expect(failing(postChecks({ ...good, hasCover: false }))).toEqual(['cover']);
    expect(failing(postChecks({ ...good, blocks: [paragraph(60)] }))).toEqual(['length']);
    expect(failing(postChecks({ ...good, blocks: good.blocks.filter((block) => block.type !== 'heading') }))).toEqual(['headings']);
    expect(failing(postChecks({ ...good, blocks: [...good.blocks, paragraph(121)] }))).toEqual(['paragraphs']);
    expect(failing(postChecks({ ...good, blocks: [...good.blocks, { type: 'quote', text: 'Be still.' }] }))).toEqual(['references']);
  });

  test('short posts do not need headings', () => {
    expect(failing(postChecks({ ...good, blocks: [paragraph(100), paragraph(100)] }))).toEqual([]);
  });
});

test('posts are sent as form data the API can read', () => {
  const cover = new File(['jpg'], 'cover.jpg', { type: 'image/jpeg' });
  const data = buildPostFormData(
    {
      title: 'Title',
      slug: 'title',
      excerpt: 'Summary',
      body: SAMPLE_BODY,
      category: null,
      status: 'draft',
      published_on: '2026-08-04',
      featured: true,
      tags: ['Grace', 'Hope'],
      author_name: 'Rev. Joseph Njuguna',
      author_role: null,
    },
    { coverFile: cover }
  );

  expect(data.get('blog_post[title]')).toBe('Title');
  expect(data.get('blog_post[category]')).toBe('');
  expect(data.get('blog_post[author_role]')).toBe('');
  expect(data.get('blog_post[featured]')).toBe('true');
  expect(JSON.parse(data.get('blog_post[body]'))).toEqual(SAMPLE_BODY);
  expect(data.getAll('blog_post[tags][]')).toEqual(['Grace', 'Hope']);
  expect(data.get('blog_post[cover_image]')).toBeInstanceOf(File);
  expect(data.has('blog_post[remove_cover_image]')).toBe(false);
});

test('no tags and a removed cover are sent explicitly', () => {
  const data = buildPostFormData({ title: 'T', body: [], tags: [], featured: false }, { removeCover: true });

  expect(data.getAll('blog_post[tags][]')).toEqual(['']);
  expect(data.get('blog_post[featured]')).toBe('false');
  expect(data.get('blog_post[remove_cover_image]')).toBe('true');
  expect(data.has('blog_post[cover_image]')).toBe(false);
});

test('cover photos must be JPG, PNG or WEBP and at most 10 MB', () => {
  expect(coverFileError(null)).toBe('');
  expect(coverFileError(new File(['x'], 'a.webp', { type: 'image/webp' }))).toBe('');
  expect(coverFileError(new File(['x'], 'IMG_0001.HEIC', { type: 'image/heic' }))).toMatch(/JPG, PNG or WEBP/);
  expect(coverFileError({ type: 'image/png', size: 10 * 1024 * 1024 + 1 })).toMatch(/10 MB/);
});
