// Till Solenthaler–style trail with Dennis Snellenberg–style easing:
// moving over a menu item with [data-trail] (JSON array of image URLs) drops that item's images around the cursor.
// Each image picks randomly from its own set (never the same one twice in a row), fades/unblurs in, holds, then drifts out.

const SPACING = 110; // px of cursor travel between spawns
const HOLD = 700; // ms fully visible
const MAX_LIVE = 5;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

function pickRandom(list: string[], last?: string) {
	if (list.length < 2) return list[0];
	let next = last;
	while (next === last) next = list[Math.floor(Math.random() * list.length)];
	return next!;
}

export function initCursorTrail() {
	const layer = document.getElementById('trail-layer');
	const triggers = [...document.querySelectorAll<HTMLElement>('[data-trail]')];
	if (!layer || !triggers.length || reduced() || !finePointer()) return;

	const sets = triggers.map((t) => {
		try {
			return JSON.parse(t.dataset.trail || '[]') as string[];
		} catch {
			return [];
		}
	});

	// warm the cache so the first hover is instant
	const preload = () => sets.flat().forEach((src) => Object.assign(new Image(), { decoding: 'async', src }));
	('requestIdleCallback' in window ? requestIdleCallback : setTimeout)(preload);

	const live: HTMLElement[] = [];
	let last: { x: number; y: number } | null = null;
	let lastSrc: string | undefined;

	function retire(el: HTMLElement) {
		if (el.classList.contains('out')) return;
		el.classList.add('out');
		setTimeout(() => el.remove(), 800);
	}

	function spawn(list: string[], x: number, y: number) {
		const src = pickRandom(list, lastSrc);
		lastSrc = src;
		const el = document.createElement('div');
		el.className = 'trail-obj';
		const img = document.createElement('img');
		img.src = src;
		img.alt = '';
		img.decoding = 'async';
		el.append(img);
		el.style.setProperty('--x', `${x}px`);
		el.style.setProperty('--y', `${y}px`);
		el.style.setProperty('--r', `${(Math.random() - 0.5) * 20}deg`);
		el.style.setProperty('--s', `${0.85 + Math.random() * 0.3}`);
		layer!.append(el);
		live.push(el);
		requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
		setTimeout(() => retire(el), 500 + HOLD);
		while (live.length > MAX_LIVE) retire(live.shift()!);
	}

	triggers.forEach((trigger, i) => {
		const list = sets[i];
		if (!list.length) return;
		trigger.addEventListener('pointerenter', (e) => {
			last = { x: e.clientX, y: e.clientY };
			spawn(list, e.clientX, e.clientY);
		});
		trigger.addEventListener('pointermove', (e) => {
			if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < SPACING) return;
			last = { x: e.clientX, y: e.clientY };
			spawn(list, e.clientX, e.clientY);
		});
		trigger.addEventListener('pointerleave', () => {
			last = null;
			live.forEach(retire);
		});
	});
}
