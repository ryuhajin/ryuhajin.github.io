// Menu hover compositions (Till Solenthaler–style objects, Dennis Snellenberg–style easing):
// hovering a menu item with [data-hover-set] shows its whole set of images at once around the cursor.
// The set fades/unblurs in with a small stagger, drifts after the cursor (each image with its own lag),
// and fades out slowly when the pointer leaves.

import type { HoverItem } from '../../portfolio/hover-sets';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

export function initCursorTrail() {
	const layer = document.getElementById('trail-layer');
	const triggers = [...document.querySelectorAll<HTMLElement>('[data-hover-set]')];
	if (!layer || !triggers.length || reduced() || !finePointer()) return;

	const scale = () => Math.min(1, innerWidth / 1440);

	const clusters = triggers.map((trigger) => {
		let items: HoverItem[] = [];
		try {
			items = JSON.parse(trigger.dataset.hoverSet || '[]');
		} catch {}
		const el = document.createElement('div');
		el.className = 'hover-cluster';
		const parts = items.map((it, i) => {
			const img = document.createElement('img');
			img.src = it.src;
			img.alt = '';
			img.decoding = 'async';
			img.style.setProperty('--w', `${it.w}px`);
			img.style.setProperty('--r', `${it.r ?? 0}deg`);
			img.style.setProperty('--i', String(i));
			el.append(img);
			// each image trails the cursor at its own pace -> a little depth while moving
			return { img, it, lag: 0.1 + (i % 3) * 0.035, x: 0, y: 0 };
		});
		layer.append(el);
		return { trigger, el, parts };
	});

	let target = { x: innerWidth / 2, y: innerHeight / 2 };
	let active: (typeof clusters)[number] | null = null;
	let raf = 0;
	let idleTimer = 0;

	const tick = () => {
		const k = scale();
		for (const c of clusters) {
			if (!c.el.classList.contains('show') && c !== active) continue;
			for (const p of c.parts) {
				const tx = target.x + p.it.x * k;
				const ty = target.y + p.it.y * k;
				p.x += (tx - p.x) * p.lag;
				p.y += (ty - p.y) * p.lag;
				p.img.style.translate = `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`;
			}
		}
		raf = requestAnimationFrame(tick);
	};
	const run = () => {
		clearTimeout(idleTimer);
		if (!raf) raf = requestAnimationFrame(tick);
	};
	const park = () => {
		idleTimer = window.setTimeout(() => {
			cancelAnimationFrame(raf);
			raf = 0;
		}, 900);
	};

	for (const c of clusters) {
		c.trigger.addEventListener('pointerenter', (e) => {
			target = { x: e.clientX, y: e.clientY };
			if (!c.el.classList.contains('show')) {
				// start from the final layout (no fly-in from the previous position)
				const k = scale();
				for (const p of c.parts) {
					p.x = target.x + p.it.x * k;
					p.y = target.y + p.it.y * k;
					p.img.style.translate = `${p.x}px ${p.y}px`;
					p.img.style.setProperty('--w', `${Math.round(p.it.w * k)}px`);
				}
			}
			active = c;
			c.el.classList.add('show');
			run();
		});
		c.trigger.addEventListener('pointermove', (e) => {
			target = { x: e.clientX, y: e.clientY };
		});
		c.trigger.addEventListener('pointerleave', () => {
			c.el.classList.remove('show');
			if (active === c) active = null;
			park();
		});
	}
}
