import { palettes, storageKey } from './palettes.mjs';

/** Props for the shared ThemaPicker, built from the Notes palettes. */
export const notesThema = {
	items: palettes.map(({ id, label, bg, fg, swatches }) => ({ id, label, bg, fg, swatches })),
	storageKey,
	attr: 'palette',
	modes: Object.fromEntries(palettes.map((p) => [p.id, p.mode])) as Record<string, 'dark' | 'light'>,
};
