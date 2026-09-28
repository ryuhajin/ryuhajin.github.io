// Notes color palettes. Shared by ec.config.mjs (code block themes) and the ThemeSelect override.
// UI colors for each palette live in src/styles/notes/palettes.css under [data-palette='<id>'].
//
// To add a palette: add an entry here + a matching block in palettes.css.
//   id        -> value of <html data-palette>
//   mode      -> 'dark' | 'light' (drives Starlight's own data-theme)
//   codeTheme -> any bundled Shiki theme name (https://shiki.style/themes)

/** @type {{ id: string; label: string; mode: 'dark' | 'light'; codeTheme: string; swatch: string }[]} */
export const palettes = [
	{ id: 'obsidian', label: 'Obsidian', mode: 'dark', codeTheme: 'one-dark-pro', swatch: '#a882ff' },
	{ id: 'md3', label: 'Material 3', mode: 'dark', codeTheme: 'material-theme-darker', swatch: '#d0bcff' },
	{ id: 'coal', label: 'mdBook Coal', mode: 'dark', codeTheme: 'vitesse-dark', swatch: '#4fa0cf' },
	{ id: 'navy', label: 'mdBook Navy', mode: 'dark', codeTheme: 'tokyo-night', swatch: '#6d8ee8' },
	{ id: 'ayu', label: 'Ayu', mode: 'dark', codeTheme: 'ayu-dark', swatch: '#ffb454' },
	{ id: 'six', label: 'Six', mode: 'light', codeTheme: 'github-light-default', swatch: '#2563eb' },
	{ id: 'rust', label: 'mdBook Rust', mode: 'light', codeTheme: 'one-light', swatch: '#b7410e' },
];

export const defaultPalette = 'obsidian';
export const storageKey = 'notes-palette';
