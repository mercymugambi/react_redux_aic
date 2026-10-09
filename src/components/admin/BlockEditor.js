import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { COVER_IMAGE_TYPES } from '../../data/blog';
import {
  applyShortcut,
  blocksToText,
  convertBlock,
  createBlock,
  fieldKey,
  fieldsOf,
  imageIdsFromBlocks,
  insertBlocks,
  insertImageLine,
  insertParagraphAfter,
  joinListItem,
  joinWithNext,
  joinWithPrevious,
  moveBlock,
  pasteIntoListItem,
  pasteIntoParagraph,
  readMinutes,
  removeBlock,
  shortcutIn,
  splitBlock,
  splitListItem,
  textToBlocks,
  toEditorBlocks,
  toSavedBlocks,
  updateBlock,
  wordCount,
} from './blogBody';
import Icon from './Icon';
import { BUTTON } from './ui';

/* ── Undo history for the body ──
   The browser's own undo only knows about typing inside one field, so block changes
   (splitting, joining, moving, deleting) keep their own history. `typing` names the
   field being typed in: changes to it less than a second apart undo together. */
const HISTORY_LIMIT = 100;
const TYPING_PAUSE = 1000;

export function useBodyHistory(createInitial) {
  const [history, setHistory] = useState(() => ({ past: [], present: createInitial(), future: [], typing: null, typedAt: 0 }));

  const change = useCallback((blocks, typing = null) => {
    setHistory((current) => {
      if (blocks === current.present) return current;
      const now = Date.now();
      const sameRun = typing !== null && typing === current.typing && now - current.typedAt < TYPING_PAUSE;
      return {
        past: sameRun ? current.past : [...current.past, current.present].slice(-HISTORY_LIMIT),
        present: blocks,
        future: [],
        typing,
        typedAt: now,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) =>
      current.past.length
        ? { past: current.past.slice(0, -1), present: current.past[current.past.length - 1], future: [current.present, ...current.future], typing: null, typedAt: 0 }
        : current
    );
  }, []);

  const redo = useCallback(() => {
    setHistory((current) =>
      current.future.length
        ? { past: [...current.past, current.present], present: current.future[0], future: current.future.slice(1), typing: null, typedAt: 0 }
        : current
    );
  }, []);

  return { blocks: history.present, change, undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}

/* ── Pieces ── */
const TYPE_OPTIONS = [
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'heading', label: 'Heading' },
  { value: 'quote', label: 'Quote' },
  { value: 'list', label: 'Bulleted list' },
];

// The same spacing as the article on the website
const BLOCK_SPACING = { paragraph: 'mt-6', heading: 'mt-11', quote: 'my-9', list: 'mt-6', image: 'my-10' };

// A textarea that grows with its text (see .admin-grow); the wrapper carries the typography
export const GrowingField = forwardRef(function GrowingField({ value, placeholder = '', wrapperClassName = '', className = '', ...props }, ref) {
  return (
    <div className={`admin-grow ${wrapperClassName}`} data-value={value || placeholder}>
      <textarea ref={ref} rows={1} value={value} placeholder={placeholder} className={className} {...props} />
    </div>
  );
});

// Clicking keeps the caret where it was in the post, even on a button that's unavailable
// (a truly disabled button can't stop the click from taking focus, so this uses aria-disabled)
function ToolButton({ icon, label, onClick, disabled = false, pressed, children }) {
  let colors = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  if (disabled) colors = 'cursor-default text-slate-600 opacity-35';
  else if (pressed) colors = 'bg-red-50 text-red-700';
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1.5 rounded-md px-1.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 ${colors}`}
    >
      <Icon name={icon} className="h-4 w-4" />
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-slate-200" />;

function withValue(blocks, block, field, item, value) {
  if (field === 'item') {
    const items = [...block.items];
    items[item] = value;
    return updateBlock(blocks, block.id, { items });
  }
  return updateBlock(blocks, block.id, { [field]: value });
}

// Prefixes the Text editor uses at the start of a line
const LINE_PREFIX = { heading: '## ', quote: '> ', list: '- ' };

/**
 * The post body: a Visual editor that looks like the article on the website, and a Text
 * editor with the plain-text conventions. Both edit the same blocks.
 * - `history`: from useBodyHistory; `blocks` is its current value
 * - `uploadImage(file)`: uploads a photo and resolves to { id, url }, or throws with a message
 * - `focusRef`: set to a function that puts the caret in the body (for validation)
 */
function BlockEditor({ history, uploadImage, error, outline, stickyTop = 0, focusRef }) {
  const { blocks, change, undo, redo, canUndo, canRedo } = history;
  const [mode, setMode] = useState('visual');
  const [text, setText] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const elements = useRef(new Map());
  const refCallbacks = useRef(new Map());
  const pendingFocus = useRef(null);
  const blocksRef = useRef(blocks);
  const textBlocks = useRef(null);
  const textArea = useRef(null);
  const photoInput = useRef(null);
  const photoTarget = useRef(null);
  // url → image_id for every photo seen, so the Text editor can find a photo's id
  const imageIds = useRef(imageIdsFromBlocks(toSavedBlocks(blocks)));

  blocksRef.current = blocks;
  const saved = toSavedBlocks(blocks);
  const isEmpty = saved.length === 0;
  const active = blocks.find((block) => block.id === activeId) || null;
  const activeIndex = active ? blocks.indexOf(active) : -1;
  const canFormat = Boolean(active) && active.type !== 'image';

  /* Fields and the caret */
  const fieldRef = (key) => {
    if (!refCallbacks.current.has(key)) {
      refCallbacks.current.set(key, (element) => {
        if (element) elements.current.set(key, element);
        else elements.current.delete(key);
      });
    }
    return refCallbacks.current.get(key);
  };

  const focusField = (target) => {
    const element = elements.current.get(fieldKey(target));
    if (!element) return false;
    element.focus();
    const at = target.at === 'end' || target.at == null ? element.value.length : Math.min(target.at, element.value.length);
    element.setSelectionRange(at, at);
    return true;
  };

  // The field that has the caret, and where in it
  const focusedField = () => {
    const entry = [...elements.current.entries()].find(([, element]) => element === document.activeElement);
    if (!entry) return null;
    const [id, field, item] = entry[0].split(':');
    return { id, field, item: Number(item) || 0, at: entry[1].selectionStart };
  };

  useLayoutEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    if (target.restore) {
      // After undo or redo, stay in the block that was being edited if it still exists
      if (document.activeElement && document.activeElement !== document.body) return;
      const block = blocks.find((candidate) => candidate.id === activeId) || blocks[blocks.length - 1];
      const fields = fieldsOf([block]);
      focusField({ ...fields[fields.length - 1], at: 'end' });
      return;
    }
    focusField(target);
  });

  useEffect(() => {
    if (!focusRef) return undefined;
    focusRef.current = () => {
      if (mode === 'text') textArea.current?.focus();
      else focusField({ ...fieldsOf(blocksRef.current)[0], at: 'end' });
    };
    return () => {
      focusRef.current = null;
    };
  });

  // Applies the result of a block operation: { blocks, focus }
  const apply = (result, typing = null) => {
    if (!result) return false;
    change(result.blocks, typing);
    if (result.focus) {
      pendingFocus.current = result.focus;
      setActiveId(result.focus.id);
    }
    return true;
  };

  const undoChange = () => {
    undo();
    pendingFocus.current = { restore: true };
  };
  const redoChange = () => {
    redo();
    pendingFocus.current = { restore: true };
  };

  const moveCaret = (block, field, item, direction) => {
    const all = fieldsOf(blocks);
    const index = all.findIndex((entry) => entry.id === block.id && entry.field === field && (field !== 'item' || entry.item === item));
    const target = all[index + direction];
    return target ? focusField({ ...target, at: direction < 0 ? 'end' : 0 }) : false;
  };

  /* Typing */
  const handleChange = (event, block, field, item) => {
    // The API keeps no line breaks inside a block, so any that arrive become spaces
    const value = event.target.value.replace(/[ \t]*\r?\n\s*/g, ' ');
    if (field === 'text' && block.type === 'paragraph' && !shortcutIn(block.text) && shortcutIn(value)) {
      if (apply(applyShortcut(blocks, block.id, value, event.target.selectionStart))) return;
    }
    change(withValue(blocks, block, field, item, value), fieldKey({ id: block.id, field, item }));
  };

  const handleKeyDown = (event, block, field, item) => {
    const { selectionStart: start, selectionEnd: end, value } = event.currentTarget;
    const collapsed = start === end;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const command = event.ctrlKey || event.metaKey;

    if (command && !event.altKey && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) redoChange();
      else undoChange();
      return;
    }
    if (command && !event.altKey && key === 'y') {
      event.preventDefault();
      redoChange();
      return;
    }
    if (command || event.altKey || event.nativeEvent.isComposing) return;

    if (key === 'Enter') {
      event.preventDefault();
      const current = collapsed ? blocks : withValue(blocks, block, field, item, value.slice(0, start) + value.slice(end));
      if (field === 'item') apply(splitListItem(current, block.id, item, start));
      else if (field === 'text' && block.type === 'quote') focusField({ id: block.id, field: 'cite', at: 'end' });
      else if (field === 'text') apply(splitBlock(current, block.id, start));
      else apply(insertParagraphAfter(blocks, block.id));
      return;
    }

    if (!collapsed || event.shiftKey) return;

    if (key === 'Backspace' && start === 0) {
      let handled;
      if (field === 'text') handled = apply(joinWithPrevious(blocks, block.id));
      else if (field === 'item') handled = apply(joinListItem(blocks, block.id, item));
      else handled = moveCaret(block, field, item, -1);
      if (handled) event.preventDefault();
    } else if (key === 'Delete' && start === value.length && field === 'text' && block.type !== 'quote') {
      if (apply(joinWithNext(blocks, block.id))) event.preventDefault();
    } else if ((key === 'ArrowUp' || key === 'ArrowLeft') && start === 0) {
      if (moveCaret(block, field, item, -1)) event.preventDefault();
    } else if ((key === 'ArrowDown' || key === 'ArrowRight') && start === value.length) {
      if (moveCaret(block, field, item, 1)) event.preventDefault();
    }
  };

  const handlePaste = (event, block, field, item) => {
    const pasted = event.clipboardData?.getData('text/plain') || '';
    if (!pasted.includes('\n')) return;
    const { selectionStart: start, selectionEnd: end } = event.currentTarget;
    let result = null;
    if (field === 'text' && block.type === 'paragraph') result = pasteIntoParagraph(blocks, block.id, start, end, pasted, imageIds.current);
    else if (field === 'item') result = pasteIntoListItem(blocks, block.id, item, start, end, pasted);
    if (result) {
      event.preventDefault();
      apply(result);
    }
  };

  const fieldProps = (block, field, item = 0) => ({
    ref: fieldRef(fieldKey({ id: block.id, field, item })),
    spellCheck: true,
    onFocus: () => setActiveId(block.id),
    onChange: (event) => handleChange(event, block, field, item),
    onKeyDown: (event) => handleKeyDown(event, block, field, item),
    onPaste: (event) => handlePaste(event, block, field, item),
  });

  /* Toolbar */
  const convertActive = (type) => {
    if (!canFormat || active.type === type) return;
    const caret = focusedField();
    apply(convertBlock(blocks, active.id, type, { at: caret?.id === active.id && caret.field === 'text' ? caret.at : 'end' }));
  };
  const toggleActive = (type) => convertActive(active?.type === type ? 'paragraph' : type);

  const moveActive = (offset) => {
    const next = active && moveBlock(blocks, active.id, offset);
    if (!next) return;
    // Moving can take the focus away from the field being edited, so put it back
    pendingFocus.current = focusedField();
    change(next);
  };

  const removeActive = () => {
    if (active) apply(removeBlock(blocks, active.id));
  };

  const startFromOutline = () => {
    const outlined = toEditorBlocks(textToBlocks(outline));
    apply({ blocks: outlined, focus: { id: outlined[0].id, at: 'end' } });
  };

  const continueAtEnd = (event) => {
    event.preventDefault();
    const last = blocks[blocks.length - 1];
    if (last.type === 'paragraph') focusField({ id: last.id, at: 'end' });
    else apply(insertParagraphAfter(blocks, last.id));
  };

  /* Photos: uploaded straight away, then placed after the block being edited */
  const choosePhoto = (target) => {
    photoTarget.current = target;
    photoInput.current?.click();
  };

  const addPhoto = async (file) => {
    const target = photoTarget.current || {};
    setPhotoError('');
    setUploading(true);
    try {
      const image = await uploadImage(file);
      imageIds.current[image.url] = image.id;
      const latest = blocksRef.current;
      if (target.text !== undefined) {
        const nextText = insertImageLine(textArea.current?.value ?? text, target.text, image.url);
        setTextAndBlocks(nextText);
      } else if (target.replace) {
        apply({ blocks: updateBlock(latest, target.replace, { url: image.url, image_id: image.id }), focus: { id: target.replace, field: 'caption', at: 'end' } });
      } else {
        const photo = createBlock('image', { url: image.url, image_id: image.id });
        apply({ blocks: insertBlocks(latest, target.after, [photo]), focus: { id: photo.id, field: 'caption', at: 0 } });
      }
    } catch (err) {
      setPhotoError(err.message || 'Could not upload the photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /* Text editor */
  const setTextAndBlocks = (value) => {
    const parsed = toEditorBlocks(textToBlocks(value, imageIds.current));
    textBlocks.current = parsed;
    setText(value);
    change(parsed, 'text');
  };

  // Anything that changed the blocks from outside the Text editor (undo, restoring a backup)
  // shows up in its text too
  useEffect(() => {
    if (mode === 'text' && blocks !== textBlocks.current) {
      textBlocks.current = blocks;
      setText(blocksToText(toSavedBlocks(blocks)));
    }
  }, [mode, blocks]);

  const switchMode = (next) => {
    if (next === mode) return;
    if (next === 'text') {
      imageIds.current = { ...imageIds.current, ...imageIdsFromBlocks(saved) };
      textBlocks.current = blocks;
      setText(blocksToText(saved));
    }
    setMode(next);
  };

  // Adds or removes a line prefix (## , > , - ) on every line the selection touches
  const togglePrefix = (kind) => {
    const area = textArea.current;
    if (!area) return;
    const { selectionStart: start, selectionEnd: end, value } = area;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const stop = lineEnd < 0 ? value.length : lineEnd;
    const lines = value.slice(lineStart, stop).split('\n');
    const prefix = LINE_PREFIX[kind];
    const bare = lines.map((line) => line.replace(/^(## |> |- )/, ''));
    const changed = (lines.every((line) => line.startsWith(prefix)) ? bare : bare.map((line) => prefix + line)).join('\n');
    setTextAndBlocks(value.slice(0, lineStart) + changed + value.slice(stop));
    const caret = lineStart + changed.length;
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(caret, caret);
    });
  };

  /* Rendering */
  const renderBlock = (block, index) => {
    const activeBlock = block.id === activeId;
    const spacing = index === 0 ? '' : BLOCK_SPACING[block.type];
    const marker = `before:absolute before:-left-4 before:bottom-1 before:top-1 before:w-[3px] before:rounded-full before:transition-colors sm:before:-left-6 ${
      activeBlock ? 'before:bg-red-400' : 'before:bg-transparent hover:before:bg-slate-200'
    }`;
    let content;

    if (block.type === 'heading') {
      content = (
        <GrowingField
          {...fieldProps(block, 'text')}
          value={block.text}
          aria-label="Heading"
          placeholder="Heading"
          wrapperClassName="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
          className="placeholder:text-slate-300"
        />
      );
    } else if (block.type === 'quote') {
      content = (
        <figure className="border-l-4 border-red-700 bg-red-50/60 py-5 pl-6 pr-5 sm:pl-8">
          <GrowingField
            {...fieldProps(block, 'text')}
            value={block.text}
            aria-label="Quote"
            placeholder="Quote or Bible verse"
            wrapperClassName="font-serif text-lg italic leading-relaxed text-slate-800 sm:text-xl"
            className="placeholder:text-slate-400"
          />
          <div className="mt-3 flex items-start gap-1.5 text-xs font-bold uppercase tracking-wider text-red-700">
            <span aria-hidden="true">—</span>
            <GrowingField
              {...fieldProps(block, 'cite')}
              value={block.cite}
              aria-label="Quote reference"
              placeholder="Reference, e.g. John 3:16"
              wrapperClassName="min-w-0 flex-1"
              className="placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal placeholder:text-red-300"
            />
          </div>
        </figure>
      );
    } else if (block.type === 'list') {
      content = (
        <ul className="space-y-3">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3 text-base leading-8 text-slate-700">
              <span aria-hidden="true" className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-red-700" />
              <GrowingField
                {...fieldProps(block, 'item', itemIndex)}
                value={item}
                aria-label={`List item ${itemIndex + 1}`}
                placeholder="List item"
                wrapperClassName="min-w-0 flex-1"
                className="placeholder:text-slate-300"
              />
            </li>
          ))}
        </ul>
      );
    } else if (block.type === 'image') {
      content = (
        <figure>
          <div className="group/photo relative overflow-hidden rounded-2xl bg-slate-100">
            <img src={block.url} alt={block.caption || 'Photo in the post'} className="w-full object-cover" />
            <div
              className={`absolute right-3 top-3 flex gap-1.5 transition-opacity group-hover/photo:opacity-100 group-focus-within/photo:opacity-100 ${
                activeBlock ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={() => choosePhoto({ replace: block.id })}
                disabled={uploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/90 px-2.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-900/10 backdrop-blur transition hover:bg-white hover:text-slate-900"
              >
                <Icon name="refresh" className="h-3.5 w-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={() => apply(removeBlock(blocks, block.id))}
                aria-label="Remove photo"
                title="Remove photo"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-900/10 backdrop-blur transition hover:bg-white hover:text-red-700"
              >
                <Icon name="trash" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <GrowingField
            {...fieldProps(block, 'caption')}
            value={block.caption}
            aria-label="Photo caption"
            placeholder="Add a caption"
            wrapperClassName="mt-3 text-center text-sm leading-relaxed text-slate-500"
            className={block.caption ? '' : 'placeholder:text-amber-500'}
          />
        </figure>
      );
    } else {
      const only = blocks.length === 1;
      content = (
        <GrowingField
          {...fieldProps(block, 'text')}
          value={block.text}
          aria-label="Paragraph"
          placeholder={only ? 'Start writing your post…' : 'Write, or type ## for a heading, > quote, - list'}
          wrapperClassName="text-base leading-8 text-slate-700"
          className={only ? 'placeholder:text-slate-400' : 'placeholder:text-transparent focus:placeholder:text-slate-300'}
        />
      );
    }

    return (
      <div key={block.id} className={`relative ${spacing} ${marker}`}>
        {content}
      </div>
    );
  };

  const photoButtonTarget = () => (mode === 'text' ? { text: textArea.current?.selectionStart ?? text.length } : { after: activeId });

  return (
    <section aria-label="Post" className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Tools, kept in view while writing; not on phones, where the screen is too short */}
      <div className="z-10 rounded-t-xl border-b border-slate-200 bg-white/95 backdrop-blur md:sticky" style={{ top: stickyTop }}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2">
          <button type="button" onClick={() => choosePhoto(photoButtonTarget())} disabled={uploading} className={BUTTON}>
            {uploading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" aria-hidden="true" />
            ) : (
              <Icon name="photo" className="h-3.5 w-3.5" />
            )}
            {uploading ? 'Uploading…' : 'Add photo'}
          </button>
          <input
            ref={photoInput}
            type="file"
            accept={COVER_IMAGE_TYPES.join(',')}
            aria-label="Photo to add to the post"
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) addPhoto(file);
            }}
          />
          <div role="tablist" aria-label="Editor" className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {[
              { key: 'visual', label: 'Visual' },
              { key: 'text', label: 'Text' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => switchMode(key)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  mode === key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5 overflow-x-auto px-2 py-1.5">
          {mode === 'visual' ? (
            <>
              <label htmlFor="block-type" className="sr-only">
                Block type
              </label>
              <select
                id="block-type"
                value={canFormat ? active.type : 'paragraph'}
                disabled={!canFormat}
                onChange={(event) => convertActive(event.target.value)}
                className="h-8 shrink-0 rounded-md border border-slate-200 bg-white pl-2.5 pr-8 text-[13px] font-medium text-slate-700 transition hover:border-slate-300 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-50"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Divider />
              <ToolButton icon="heading" label="Heading" pressed={active?.type === 'heading'} disabled={!canFormat} onClick={() => toggleActive('heading')} />
              <ToolButton icon="quote" label="Quote" pressed={active?.type === 'quote'} disabled={!canFormat} onClick={() => toggleActive('quote')} />
              <ToolButton icon="listBullet" label="Bulleted list" pressed={active?.type === 'list'} disabled={!canFormat} onClick={() => toggleActive('list')} />
              <Divider />
              <ToolButton icon="arrowUp" label="Move block up" disabled={activeIndex <= 0} onClick={() => moveActive(-1)} />
              <ToolButton icon="arrowDown" label="Move block down" disabled={activeIndex < 0 || activeIndex >= blocks.length - 1} onClick={() => moveActive(1)} />
              <ToolButton icon="trash" label="Delete block" disabled={!active} onClick={removeActive} />
              <Divider />
              <ToolButton icon="undo" label="Undo" disabled={!canUndo} onClick={undoChange} />
              <ToolButton icon="redo" label="Redo" disabled={!canRedo} onClick={redoChange} />
            </>
          ) : (
            <>
              <ToolButton icon="heading" label="Heading" onClick={() => togglePrefix('heading')} />
              <ToolButton icon="quote" label="Quote" onClick={() => togglePrefix('quote')} />
              <ToolButton icon="listBullet" label="Bulleted list" onClick={() => togglePrefix('list')} />
              <Divider />
              <p className="shrink-0 whitespace-nowrap px-1.5 text-xs text-slate-400">
                <code className="text-slate-600">## </code>heading · <code className="text-slate-600">&gt; </code>quote, then <code className="text-slate-600">&gt; — Reference</code> ·{' '}
                <code className="text-slate-600">- </code>list · blank line between paragraphs
              </p>
            </>
          )}
        </div>
      </div>

      {(photoError || error) && (
        <p role="alert" className="flex items-center gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          <Icon name="warning" className="h-4 w-4 shrink-0" />
          {photoError || error}
        </p>
      )}

      {mode === 'visual' ? (
        <div className="px-5 pb-4 pt-8 sm:px-12 sm:pt-10">
          <div role="group" aria-label="Post content" className="mx-auto max-w-[42rem]">
            {blocks.map(renderBlock)}

            {isEmpty && (
              <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3.5 text-[13px] text-slate-500">
                <p>
                  Press <kbd className="rounded border border-slate-200 bg-white px-1 font-sans text-[11px]">Enter</kbd> for a new paragraph. Start a line with{' '}
                  <code className="text-slate-700">## </code> for a heading, <code className="text-slate-700">&gt; </code> for a Bible verse or quote, or{' '}
                  <code className="text-slate-700">- </code> for a list.
                </p>
                <button type="button" onClick={startFromOutline} className="mt-2 inline-flex items-center gap-1.5 font-medium text-red-700 hover:underline">
                  <Icon name="sparkles" className="h-3.5 w-3.5" />
                  Start from an outline
                </button>
              </div>
            )}

            <div aria-hidden="true" onMouseDown={continueAtEnd} className="h-20 cursor-text" />
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <label htmlFor="post-body-text" className="sr-only">
            Post text
          </label>
          <textarea
            ref={textArea}
            id="post-body-text"
            value={text}
            onChange={(event) => setTextAndBlocks(event.target.value)}
            rows={22}
            spellCheck
            placeholder={'Start writing…\n\nLeave a blank line between paragraphs.'}
            className="block w-full resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-[13px] leading-6 text-slate-800 placeholder:text-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-b-xl border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500">
        <span className="tabular-nums">
          {wordCount(saved).toLocaleString()} {wordCount(saved) === 1 ? 'word' : 'words'} · {readMinutes(saved)} min read
        </span>
        <span className="hidden text-slate-400 md:inline">
          {mode === 'visual' ? 'Enter: new paragraph · Backspace at the start: join with the one above' : 'Switch back to Visual to see the post as readers will'}
        </span>
      </div>
    </section>
  );
}

export default BlockEditor;
