/* ── A blog post's body ──
   Posts store their body as blocks, the shapes the API accepts (BlogPostBody on the backend):

     { type: 'paragraph', text }        { type: 'heading', text }
     { type: 'quote', text, cite }      { type: 'list', items: [...] }
     { type: 'image', image_id, url, caption }

   The Visual editor edits these blocks directly. The Text editor uses a few plain-text
   conventions instead and converts on the way in and out:

     ## Heading     > Quote (end with "> — Reference")     - List item     ![caption](url)

   A photo's block also carries the image_id its upload returned, which the Text editor
   looks up by url in `imageIds`. */

const IMAGE_LINE = /^!\[([^\]\n]*)\]\((\S+?)\)$/;

export function textToBlocks(text, imageIds = {}) {
  return text
    .replace(/^[ \t]*(!\[[^\]\n]*\]\(\S+?\))[ \t]*$/gm, '\n\n$1\n\n')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const image = IMAGE_LINE.exec(chunk);
      if (image) {
        const [, caption, url] = image;
        return { type: 'image', url, caption: caption.trim(), ...(imageIds[url] && { image_id: imageIds[url] }) };
      }
      const lines = chunk.split('\n').map((line) => line.trim());
      if (chunk.startsWith('## ')) return { type: 'heading', text: chunk.slice(3).replace(/\s*\n\s*/g, ' ') };
      if (lines.every((line) => /^[-*] /.test(line))) return { type: 'list', items: lines.map((line) => line.slice(2).trim()) };
      if (chunk.startsWith('>')) {
        const quoteLines = lines.map((line) => line.replace(/^>\s?/, ''));
        const last = quoteLines[quoteLines.length - 1];
        const hasCite = quoteLines.length > 1 && /^(—|--)\s*/.test(last);
        return {
          type: 'quote',
          text: (hasCite ? quoteLines.slice(0, -1) : quoteLines).join(' '),
          ...(hasCite && { cite: last.replace(/^(—|--)\s*/, '') }),
        };
      }
      return { type: 'paragraph', text: lines.join(' ') };
    });
}

export function blocksToText(blocks = []) {
  return blocks
    .map((block) => {
      if (block.type === 'heading') return `## ${block.text}`;
      if (block.type === 'list') return (block.items || []).map((item) => `- ${item}`).join('\n');
      if (block.type === 'quote') return `> ${block.text}${block.cite ? `\n> — ${block.cite}` : ''}`;
      if (block.type === 'image') return `![${block.caption || ''}](${block.url})`;
      return block.text || '';
    })
    .join('\n\n');
}

// url → image_id for the photos already in a post's body
export const imageIdsFromBlocks = (blocks = []) =>
  Object.fromEntries(blocks.filter((block) => block.type === 'image' && block.image_id).map((block) => [block.url, block.image_id]));

export const imageLine = (url) => `![](${url})`;

// Puts a new, uncaptioned photo line at `position`, as a block of its own
export function insertImageLine(text, position, url) {
  const before = text.slice(0, position).replace(/\s+$/, '');
  const after = text.slice(position).replace(/^\s+/, '');
  return [before, imageLine(url), after].filter(Boolean).join('\n\n');
}

const blockWords = (block) => [block.text, block.cite, ...(block.items || [])].join(' ');
export const wordCount = (blocks = []) => blocks.map(blockWords).join(' ').split(/\s+/).filter(Boolean).length;
export const readMinutes = (blocks) => Math.max(1, Math.round(wordCount(blocks) / 200));

/* ── Blocks while they're edited ──
   Each block gets a client-side id so React can keep track of it, and a focus target says
   where the caret goes after a change: { id, field, item, at }, where field is 'text',
   'cite', 'item' or 'caption', and at is a position or 'end'. */
let lastId = 0;
const nextId = () => {
  lastId += 1;
  return `block-${lastId}`;
};

const EMPTY = {
  paragraph: () => ({ text: '' }),
  heading: () => ({ text: '' }),
  quote: () => ({ text: '', cite: '' }),
  list: () => ({ items: [''] }),
  image: () => ({ url: '', caption: '' }),
};

export const BLOCK_TYPES = Object.keys(EMPTY);

export const createBlock = (type, fields = {}) => ({ ...EMPTY[type](), ...fields, type, id: nextId() });

// Blocks from the API or the Text editor, ready to edit. There is always at least one.
export function toEditorBlocks(blocks = []) {
  const editable = blocks
    .filter((block) => EMPTY[block?.type])
    .map(({ id, ...block }) => (block.type === 'list' ? createBlock('list', { items: (block.items || []).map(String) }) : createBlock(block.type, block)));
  return editable.length ? editable : [createBlock('paragraph')];
}

// The blocks as the API takes them: trimmed, without client ids, and with nothing empty
// (the API rejects an empty paragraph, quote or list)
export function toSavedBlocks(blocks = []) {
  return blocks.flatMap((block) => {
    if (block.type === 'image') {
      if (!block.url && !block.image_id) return [];
      return [{ type: 'image', url: block.url, caption: (block.caption || '').trim(), ...(block.image_id && { image_id: block.image_id }) }];
    }
    if (block.type === 'list') {
      const items = block.items.map((item) => item.trim()).filter(Boolean);
      return items.length ? [{ type: 'list', items }] : [];
    }
    const text = (block.text || '').trim();
    if (!text) return [];
    if (block.type === 'quote') {
      const cite = (block.cite || '').trim();
      return [{ type: 'quote', text, ...(cite && { cite }) }];
    }
    return [{ type: block.type, text }];
  });
}

/* Every field the caret can be in, in reading order */
export function fieldsOf(blocks) {
  return blocks.flatMap((block) => {
    if (block.type === 'quote') return [{ id: block.id, field: 'text' }, { id: block.id, field: 'cite' }];
    if (block.type === 'list') return block.items.map((_, item) => ({ id: block.id, field: 'item', item }));
    if (block.type === 'image') return [{ id: block.id, field: 'caption' }];
    return [{ id: block.id, field: 'text' }];
  });
}

export const fieldKey = ({ id, field = 'text', item = 0 }) => (field === 'item' ? `${id}:item:${item}` : `${id}:${field}`);

// The first or last field of a block, for moving into it from outside
export function edgeField(block, edge) {
  const fields = fieldsOf([block]);
  return fields[edge === 'start' ? 0 : fields.length - 1];
}

const indexOf = (blocks, id) => blocks.findIndex((block) => block.id === id);
const TEXT_BLOCKS = ['paragraph', 'heading', 'quote'];

export const updateBlock = (blocks, id, fields) => blocks.map((block) => (block.id === id ? { ...block, ...fields } : block));

function replaceBlock(blocks, id, replacement) {
  const next = [...blocks];
  next.splice(indexOf(blocks, id), 1, ...replacement);
  return next;
}

// Enter in a paragraph or heading: the text after the caret moves to a new paragraph
export function splitBlock(blocks, id, at) {
  const block = blocks[indexOf(blocks, id)];
  // At the very start of a block with text, open an empty paragraph above it instead
  if (at === 0 && block.text.trim()) {
    const above = createBlock('paragraph');
    return { blocks: replaceBlock(blocks, id, [above, block]), focus: { id, at: 0 } };
  }
  const after = createBlock('paragraph', { text: block.text.slice(at).replace(/^\s+/, '') });
  return { blocks: replaceBlock(blocks, id, [{ ...block, text: block.text.slice(0, at) }, after]), focus: { id: after.id, at: 0 } };
}

// Backspace at the start of a paragraph, heading or quote
export function joinWithPrevious(blocks, id) {
  const index = indexOf(blocks, id);
  const block = blocks[index];
  // A heading or quote first turns back into a paragraph
  if (block.type !== 'paragraph') return convertBlock(blocks, id, 'paragraph', { at: 0 });
  const previous = blocks[index - 1];
  if (!previous) return null;
  const rest = blocks.filter((other) => other.id !== id);
  if (previous.type === 'image') {
    // A photo is only removed with its own button; an empty paragraph after it goes, though
    return { blocks: block.text ? blocks : rest, focus: { id: previous.id, field: 'caption', at: 'end' } };
  }
  if (previous.type === 'list') {
    const items = [...previous.items];
    const last = items.length - 1;
    const at = items[last].length;
    items[last] += block.text;
    return { blocks: updateBlock(rest, previous.id, { items }), focus: { id: previous.id, field: 'item', item: last, at } };
  }
  const at = previous.text.length;
  return { blocks: updateBlock(rest, previous.id, { text: previous.text + block.text }), focus: { id: previous.id, at } };
}

// Delete at the end of a paragraph, heading or quote pulls the next block's text up
export function joinWithNext(blocks, id) {
  const index = indexOf(blocks, id);
  const block = blocks[index];
  const next = blocks[index + 1];
  if (!next || !TEXT_BLOCKS.includes(next.type)) return null;
  const at = block.text.length;
  return { blocks: updateBlock(blocks.filter((other) => other.id !== next.id), id, { text: block.text + next.text }), focus: { id, at } };
}

// Enter in a list item
export function splitListItem(blocks, id, item, at) {
  const list = blocks[indexOf(blocks, id)];
  const text = list.items[item];
  if (!text.trim()) {
    // Enter on an empty item ends the list; any items after it carry on as a new list
    const before = list.items.slice(0, item);
    const after = list.items.slice(item + 1);
    const paragraph = createBlock('paragraph');
    const replacement = [...(before.length ? [{ ...list, items: before }] : []), paragraph, ...(after.length ? [createBlock('list', { items: after })] : [])];
    return { blocks: replaceBlock(blocks, id, replacement), focus: { id: paragraph.id, at: 0 } };
  }
  const items = [...list.items];
  items.splice(item, 1, text.slice(0, at), text.slice(at).replace(/^\s+/, ''));
  return { blocks: updateBlock(blocks, id, { items }), focus: { id, field: 'item', item: item + 1, at: 0 } };
}

// Backspace at the start of a list item
export function joinListItem(blocks, id, item) {
  const list = blocks[indexOf(blocks, id)];
  if (item > 0) {
    const items = [...list.items];
    const at = items[item - 1].length;
    items.splice(item - 1, 2, items[item - 1] + items[item]);
    return { blocks: updateBlock(blocks, id, { items }), focus: { id, field: 'item', item: item - 1, at } };
  }
  // The first item leaves the list as a paragraph above it
  const paragraph = createBlock('paragraph', { text: list.items[0] });
  const rest = list.items.slice(1);
  return { blocks: replaceBlock(blocks, id, [paragraph, ...(rest.length ? [{ ...list, items: rest }] : [])]), focus: { id: paragraph.id, at: 0 } };
}

// A quote's reference reads as part of its text once it's no longer a quote
const plainText = (block) => (block.type === 'quote' && block.cite?.trim() ? `${block.text} — ${block.cite.trim()}` : block.text);

// Paragraph, heading, quote and list turn into each other; a list's items become one block each
export function convertBlock(blocks, id, type, { at = 'end' } = {}) {
  const block = blocks[indexOf(blocks, id)];
  if (!block || block.type === type || block.type === 'image' || type === 'image') return null;
  if (type === 'list') {
    return { blocks: replaceBlock(blocks, id, [{ id, type: 'list', items: [plainText(block)] }]), focus: { id, field: 'item', item: 0, at } };
  }
  const texts = block.type === 'list' ? block.items : [type === 'quote' ? block.text : plainText(block)];
  const replacement = texts.map((text, index) => ({ ...EMPTY[type](), text, type, id: index === 0 ? id : nextId() }));
  return { blocks: replaceBlock(blocks, id, replacement), focus: { id, at } };
}

// Typing "## ", "> " or "- " at the start of a paragraph turns it into that kind of block
const SHORTCUTS = [
  { pattern: /^#{1,3} /, type: 'heading' },
  { pattern: /^> /, type: 'quote' },
  { pattern: /^[-*•] /, type: 'list' },
];

export const shortcutIn = (text) => SHORTCUTS.find(({ pattern }) => pattern.test(text)) || null;

export function applyShortcut(blocks, id, text, caret) {
  const shortcut = shortcutIn(text);
  if (!shortcut) return null;
  const marker = shortcut.pattern.exec(text)[0].length;
  const rest = text.slice(marker);
  const at = Math.max(0, caret - marker);
  if (shortcut.type === 'list') {
    return { blocks: replaceBlock(blocks, id, [{ id, type: 'list', items: [rest] }]), focus: { id, field: 'item', item: 0, at } };
  }
  return { blocks: replaceBlock(blocks, id, [{ ...EMPTY[shortcut.type](), text: rest, type: shortcut.type, id }]), focus: { id, at } };
}

// Several paragraphs pasted into a paragraph become blocks, read with the Text conventions
export function pasteIntoParagraph(blocks, id, start, end, pasted, imageIds = {}) {
  const block = blocks[indexOf(blocks, id)];
  const tail = block.text.slice(end);
  const parsed = textToBlocks(`${block.text.slice(0, start)}${pasted}${tail}`, imageIds);
  if (!parsed.length) return null;
  const [first, ...others] = toEditorBlocks(parsed);
  const replacement = [{ ...first, id }, ...others];
  const last = replacement[replacement.length - 1];
  const keep = tail.trim().length;
  let focus;
  if (last.type === 'list') focus = { id: last.id, field: 'item', item: last.items.length - 1, at: 'end' };
  else if (last.type === 'image') focus = { id: last.id, field: 'caption', at: 'end' };
  else focus = { id: last.id, at: Math.max(0, last.text.length - keep) };
  return { blocks: replaceBlock(blocks, id, replacement), focus };
}

// Several lines pasted into a list item become items of their own
export function pasteIntoListItem(blocks, id, item, start, end, pasted) {
  const list = blocks[indexOf(blocks, id)];
  const lines = pasted.split(/\r?\n/).map((line) => line.replace(/^\s*[-*•]\s+/, '').trim());
  if (lines.length < 2) return null;
  // The first line continues the item at the caret; the last one runs into the text after it
  const text = list.items[item];
  const tail = text.slice(end);
  const pastedItems = [text.slice(0, start) + lines[0], ...lines.slice(1, -1).filter(Boolean), lines[lines.length - 1] + tail];
  const items = [...list.items.slice(0, item), ...pastedItems, ...list.items.slice(item + 1)];
  const lastItem = item + pastedItems.length - 1;
  return { blocks: updateBlock(blocks, id, { items }), focus: { id, field: 'item', item: lastItem, at: items[lastItem].length - tail.length } };
}

// Enter in a quote's reference or a photo's caption carries on in a paragraph below
export function insertParagraphAfter(blocks, id) {
  const index = indexOf(blocks, id);
  const following = blocks[index + 1];
  if (following?.type === 'paragraph' && !following.text) return { blocks, focus: { id: following.id, at: 0 } };
  const paragraph = createBlock('paragraph');
  const next = [...blocks];
  next.splice(index + 1, 0, paragraph);
  return { blocks: next, focus: { id: paragraph.id, at: 0 } };
}

// Where a new block goes: after `afterId` (an empty paragraph there is replaced instead),
// or at the end. A photo at the very end gets an empty paragraph after it to keep writing in.
export function insertBlocks(blocks, afterId, inserted) {
  const found = afterId ? indexOf(blocks, afterId) : -1;
  const index = found >= 0 ? found : blocks.length - 1;
  const target = blocks[index];
  const next = [...blocks];
  if (target && target.type === 'paragraph' && !target.text.trim()) next.splice(index, 1, ...inserted);
  else next.splice(index + 1, 0, ...inserted);
  if (next[next.length - 1].type === 'image') next.push(createBlock('paragraph'));
  return next;
}

export function moveBlock(blocks, id, offset) {
  const index = indexOf(blocks, id);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= blocks.length) return null;
  const next = [...blocks];
  const [block] = next.splice(index, 1);
  next.splice(target, 0, block);
  return next;
}

export function removeBlock(blocks, id) {
  const index = indexOf(blocks, id);
  const rest = blocks.filter((block) => block.id !== id);
  if (!rest.length) {
    const paragraph = createBlock('paragraph');
    return { blocks: [paragraph], focus: { id: paragraph.id, at: 0 } };
  }
  const neighbour = rest[Math.max(0, index - 1)];
  return { blocks: rest, focus: { ...edgeField(neighbour, 'end'), at: 'end' } };
}
