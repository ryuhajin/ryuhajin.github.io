// Menu hover compositions: every image of a set appears together around the cursor.
// x / y = offset of the image centre from the cursor (px at a 1440px-wide screen, scaled down on smaller ones)
// w = width in px, r = rotation in degrees. Images live in public/trail/<menu>/ (credits: public/trail/CREDITS.md).
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
		{ src: '/trail/projects/sun.webp', w: 150, x: -175, y: -105 },
		{ src: '/trail/projects/moon.webp', w: 118, x: 120, y: -95 },
		{ src: '/trail/projects/star.webp', w: 190, x: 15, y: 105, r: -8 },
		{ src: '/trail/projects/candle.webp', w: 46, x: -235, y: 95, r: 6 },
	],
	notes: [
		{ src: '/trail/notes/notebook.webp', w: 165, x: -70, y: -40, r: -8 },
		{ src: '/trail/notes/pencil.webp', w: 220, x: 140, y: 30, r: -32 },
		{ src: '/trail/notes/eraser.webp', w: 118, x: -215, y: 120, r: 14 },
	],
	about: [
		{ src: '/trail/about/laptop.webp', w: 215, x: -40, y: -70, r: -4 },
		{ src: '/trail/about/keyboard.webp', w: 250, x: 40, y: 105, r: 5 },
		{ src: '/trail/about/mouse.webp', w: 78, x: 225, y: -30, r: 18 },
	],
};
