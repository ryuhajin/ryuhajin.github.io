// Till Solenthaler–style trail: moving over an element with [data-trail] drops its objects around the cursor.
// data-trail = JSON array of { img?: string; text?: string }

type TrailItem = { img?: string; text?: string };

const SPACING = 70; // px of cursor travel between spawns
const LIFETIME = 650; // ms before an object starts fading
const MAX_LIVE = 9;

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

let cleanup: (() => void) | undefined;

export function initCursorTrail() {
	cleanup?.();
	const layer = document.getElementById('trail-layer');
	const triggers = [...document.querySelectorAll<HTMLElement>('[data-trail]')];
	if (!layer || !triggers.length || reduced() || !finePointer()) return;

	let last: { x: number; y: number } | null = null;
	let cursor = 0;
	const live: HTMLElement[] = [];

	function spawn(items: TrailItem[], x: number, y: number) {
		const item = items[cursor++ % items.length];
		const el = document.createElement('div');
		el.className = 'trail-obj' + (item.img ? ' is-img' : ' is-text');
		if (item.img) {
			const img = document.createElement('img');
			img.src = item.img;
			img.alt = '';
			img.decoding = 'async';
			el.append(img);
		} else el.textContent = item.text ?? '';
		const rot = (Math.random() - 0.5) * 14;
		el.style.setProperty('--x', `${x}px`);
		el.style.setProperty('--y', `${y}px`);
		el.style.setProperty('--r', `${rot}deg`);
		layer!.append(el);
		live.push(el);
		requestAnimationFrame(() => el.classList.add('in'));
		setTimeout(() => {
			el.classList.add('out');
			el.addEventListener('transitionend', () => el.remove(), { once: true });
			setTimeout(() => el.remove(), 600);
		}, LIFETIME);
		while (live.length > MAX_LIVE) live.shift()?.remove();
	}

	const handlers = triggers.map((trigger) => {
		let items: TrailItem[] = [];
		try {
			items = JSON.parse(trigger.dataset.trail || '[]');
		} catch {}
		const onMove = (e: PointerEvent) => {
			if (!items.length) return;
			if (!last) {
				last = { x: e.clientX, y: e.clientY };
				spawn(items, e.clientX, e.clientY);
				return;
			}
			if (Math.hypot(e.clientX - last.x, e.clientY - last.y) >= SPACING) {
				last = { x: e.clientX, y: e.clientY };
				spawn(items, e.clientX, e.clientY);
			}
		};
		const onLeave = () => {
			last = null;
		};
		trigger.addEventListener('pointermove', onMove);
		trigger.addEventListener('pointerleave', onLeave);
		return () => {
			trigger.removeEventListener('pointermove', onMove);
			trigger.removeEventListener('pointerleave', onLeave);
		};
	});

	cleanup = () => {
		handlers.forEach((off) => off());
		live.forEach((el) => el.remove());
	};
	document.addEventListener('astro:before-swap', () => cleanup?.(), { once: true });
}
