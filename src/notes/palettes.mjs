// Notes color palettes ("Thema" in the Notes header). Shared by ec.config.mjs (code block themes) and the picker.
// UI colors for each palette live in src/styles/notes/palettes.css under [data-palette='<id>'].
//
// To add a palette: add an entry here + a matching block in palettes.css.
//   id        -> value of <html data-palette>
//   mode      -> 'dark' | 'light' (drives Starlight's own data-theme)
//   codeTheme -> any bundled Shiki theme name (https://shiki.style/themes)
//   bg / fg / swatches -> picker card preview only

/** @type {{ id: string; label: string; mode: 'dark' | 'light'; codeTheme: string; bg: string; fg: string; swatches: string[] }[]} */
export const palettes = [
	{ id: 'obsidian', label: 'Obsidian', mode: 'dark', codeTheme: 'one-dark-pro', bg: '#1e1e1e', fg: '#dadada', swatches: ['#1e1e1e', '#363636', '#bcbcbc', '#a882ff'] },
	{ id: 'md3', label: 'Material 3', mode: 'dark', codeTheme: 'material-theme-darker', bg: '#141218', fg: '#e6e0e9', swatches: ['#141218', '#49454f', '#d0bcff', '#efb8c8'] },
	{ id: 'coal', label: 'mdBook Coal', mode: 'dark', codeTheme: 'vitesse-dark', bg: '#141617', fg: '#c6cfd6', swatches: ['#141617', '#33383d', '#a1adb8', '#4fa0cf'] },
	{ id: 'navy', label: 'mdBook Navy', mode: 'dark', codeTheme: 'tokyo-night', bg: '#161923', fg: '#d3d4e6', swatches: ['#161923', '#363b52', '#bcbdd0', '#7c9cf0'] },
	{ id: 'ayu', label: 'Ayu', mode: 'dark', codeTheme: 'ayu-dark', bg: '#0f1419', fg: '#dcdcdc', swatches: ['#0f1419', '#2d3640', '#c5c5c5', '#ffb454'] },
	{ id: 'six', label: 'Six', mode: 'light', codeTheme: 'github-light-default', bg: '#ffffff', fg: '#1e293b', swatches: ['#ffffff', '#e2e8f0', '#334155', '#2563eb'] },
	{ id: 'rust', label: 'mdBook Rust', mode: 'light', codeTheme: 'one-light', bg: '#e1e1db', fg: '#262625', swatches: ['#e1e1db', '#c4c2b8', '#3b3a38', '#b7410e'] },
];

export const defaultPalette = 'obsidian';
export const storageKey = 'notes-palette';
