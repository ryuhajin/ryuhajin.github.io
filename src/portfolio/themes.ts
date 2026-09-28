// Portfolio "Thema" list. Colors/fonts for each id live in src/styles/portfolio-themes.css ([data-ptheme='<id>']).
// `shapes` selects the landing-page decoration set (see HeroShapes.astro).
// To add a theme: add an entry here + a matching block in portfolio-themes.css.

export type ShapeSet = 'geo' | 'space' | 'candy' | 'pixel';

export interface Thema {
	id: string;
	label: string;
	/** card preview: background, text color, font-family */
	bg: string;
	fg: string;
	font: string;
	/** 4–5 swatch dots shown in the picker */
	swatches: string[];
	shapes: ShapeSet;
}

export const themas: Thema[] = [
	{
		id: 'mono',
		label: 'Mono',
		bg: '#09090b',
		fg: '#ededef',
		font: "'Pretendard Variable', sans-serif",
		swatches: ['#09090b', '#2a2a31', '#a3a3ad', '#ededef', '#d4ff5a'],
		shapes: 'geo',
	},
	{
		id: 'paper',
		label: 'Paper',
		bg: '#f3efe6',
		fg: '#161412',
		font: "'Instrument Serif', serif",
		swatches: ['#f3efe6', '#ddd6c7', '#161412', '#6b655c', '#e8341c'],
		shapes: 'geo',
	},
	{
		id: 'space',
		label: 'Space',
		bg: '#070b1f',
		fg: '#eef2ff',
		font: "'Space Grotesk', sans-serif",
		swatches: ['#070b1f', '#0b3d91', '#8fa3d9', '#eef2ff', '#fc3d21'],
		shapes: 'space',
	},
	{
		id: 'gameboy',
		label: '8-bit',
		bg: '#9bbc0f',
		fg: '#0f380f',
		font: "'Press Start 2P', monospace",
		swatches: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
		shapes: 'pixel',
	},
	{
		id: 'violet',
		label: 'Violet',
		bg: '#16132e',
		fg: '#ecebff',
		font: "'Syne', sans-serif",
		swatches: ['#16132e', '#2c2660', '#7b6cff', '#a99cff', '#ecebff'],
		shapes: 'geo',
	},
	{
		id: 'candy',
		label: 'Candy',
		bg: '#fdeef4',
		fg: '#1b1f4a',
		font: "'Unbounded', sans-serif",
		swatches: ['#fdeef4', '#f7b8cf', '#ff5fa2', '#1b1f4a', '#ffffff'],
		shapes: 'candy',
	},
];

export const defaultThema = 'mono';
export const themaStorageKey = 'portfolio-theme';
