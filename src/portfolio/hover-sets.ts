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
		{ src: '/trail/projects/earth.webp', w: 128, x: 70, y: -40 },
		{ src: '/trail/projects/prism.webp', w: 80, x: 176, y: 38, r: 6 },
		{ src: '/trail/projects/teapot.webp', w: 92, x: 64, y: 80 },
	],
	notes: [
		{ src: '/trail/notes/notebook.webp', w: 120, x: 92, y: 0, r: -7 },
		{ src: '/trail/notes/pencil.webp', w: 150, x: 150, y: 72, r: -28 },
		{ src: '/trail/notes/eraser.webp', w: 70, x: 206, y: -22, r: 14 },
	],
	about: [
		{ src: '/trail/about/laptop.webp', w: 160, x: 196, y: -34, r: -5 },
		{ src: '/trail/about/mouse.webp', w: 50, x: 72, y: -6, r: 16 },
		{ src: '/trail/about/keyboard.webp', w: 190, x: 110, y: 78, r: 3 },
	],
};
