// Menu hover compositions: three images per menu, grouped just to the right of the hovered label
// (never over the text). x / y = offset of the image centre from the label's right edge / vertical centre,
// in px at a 1440px-wide screen (scaled on other sizes). w = width in px, r = rotation in degrees.
// Images live in public/trail/<menu>/ (credits: public/trail/CREDITS.md).
import type { NavId } from '../site';

export interface HoverItem {
	src: string;
	w: number;
	x: number;
	y: number;
	r?: number;
}

export const hoverSets: Partial<Record<NavId, HoverItem[]>> = {
	projects: [
		{ src: '/trail/projects/earth.webp', w: 128, x: 100, y: -30 },
		{ src: '/trail/projects/moon.webp', w: 54, x: 200, y: -2 },
		{ src: '/trail/projects/candle.webp', w: 28, x: 52, y: 72, r: 8 },
	],
	notes: [
		{ src: '/trail/notes/notebook.webp', w: 112, x: 92, y: -20, r: -7 },
		{ src: '/trail/notes/pencil.webp', w: 150, x: 150, y: 52, r: -28 },
		{ src: '/trail/notes/eraser.webp', w: 70, x: 206, y: -42, r: 14 },
	],
	about: [
		{ src: '/trail/about/laptop.webp', w: 160, x: 196, y: -34, r: -5 },
		{ src: '/trail/about/mouse.webp', w: 50, x: 72, y: -6, r: 16 },
		{ src: '/trail/about/keyboard.webp', w: 190, x: 110, y: 78, r: 3 },
	],
};
