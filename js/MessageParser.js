import { GRID_ROWS } from './constants.js';

/**
 * Loads and parses messages from a Markdown file.
 *
 * Format: blocks of up to 5 lines separated by `---`.
 * Each line maps to one row on the display.
 * Blocks with fewer than GRID_ROWS lines are padded with empty
 * lines so the content is vertically centred.
 *
 * Falls back to the provided defaultMessages if the file
 * cannot be fetched or parsed.
 */
export async function loadMessages(url = 'messages.md', defaultMessages = []) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parsed = parseMessages(text);
    return parsed.length ? parsed : defaultMessages;
  } catch (err) {
    console.warn(`FlipOff: could not load ${url}, using defaults.`, err);
    return defaultMessages;
  }
}

function parseMessages(text) {
  return text
    .split(/^---$/m)
    .map(block => {
      const lines = block
        .split('\n')
        .map(l => l.trimEnd());

      // Strip leading/trailing blank lines from each block
      let start = 0;
      let end = lines.length - 1;
      while (start <= end && lines[start].trim() === '') start++;
      while (end >= start && lines[end].trim() === '') end--;

      const content = lines.slice(start, end + 1).slice(0, GRID_ROWS);
      if (!content.length) return null;

      // Pad with empty lines to centre vertically
      const padTotal = GRID_ROWS - content.length;
      const padTop = Math.floor(padTotal / 2);
      const padBottom = padTotal - padTop;
      return [
        ...Array(padTop).fill(''),
        ...content,
        ...Array(padBottom).fill(''),
      ];
    })
    .filter(Boolean);
}
