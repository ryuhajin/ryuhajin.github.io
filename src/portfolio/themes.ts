// Portfolio "Thema" list. Colors/fonts for each id live in src/styles/portfolio-themes.css ([data-ptheme='<id>']).
// `shapes` picks the landing-page shape playlist (and pixel rendering for 'pixel') — see scripts/portfolio/hero-sdf.ts.
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
		id: 'euclid',
		label: 'Euclid',
		bg: '#fcf3d9',
		fg: '#141210',
		font: "'Libre Caslon Text', serif",
		swatches: ['#fcf3d9', '#d42a20', '#fac22b', '#0e638e', '#000000'],
		shapes: 'geo',
	},
	{
		id: 'sky',
		label: 'Sky',
		bg: '#d4ebff',
		fg: '#14204a',
		font: "'Manrope Variable', sans-serif",
		swatches: ['#d4ebff', '#84b8e6', '#1d2d7a', '#2ee8b6', '#ffffff'],
		shapes: 'geo',
	},
	{
		id: 'candy',
		label: 'Candy',
		bg: '#fdeef4',
		fg: '#1b1f4a',
		font: "'Outfit Variable', sans-serif",
		swatches: ['#fdeef4', '#f7b8cf', '#ff5fa2', '#1b1f4a', '#ffffff'],
		shapes: 'candy',
	},
];

export const defaultThema = 'mono';
export const themaStorageKey = 'portfolio-theme';
