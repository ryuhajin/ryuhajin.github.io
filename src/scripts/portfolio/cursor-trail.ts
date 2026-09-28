// Menu hover compositions (Till Solenthaler–style objects, Dennis Snellenberg–style easing):
// hovering a menu item with [data-hover-set] shows its three images together, grouped just to the right of the
// label so they never cover the text. The group leans a little toward the cursor (each image with its own lag),
// fades/unblurs in with a small stagger and fades out slowly when the pointer leaves.

import type { HoverItem } from '../../portfolio/hover-sets';

const DRIFT = 0.06; // how much the group leans toward the cursor
const MAX_DRIFT = 22; // px

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));

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
		const label = trigger.querySelector<HTMLElement>('.label') ?? trigger;
		const el = document.createElement('div');
		el.className = 'hover-cluster';
		const parts = items.map((it, i) => {
			const img = document.createElement('img');
			img.src = it.src;
			img.alt = '';
			img.decoding = 'async';
			img.style.setProperty('--r', `${it.r ?? 0}deg`);
			img.style.setProperty('--i', String(i));
			el.append(img);
			return { img, it, lag: 0.09 + i * 0.035, x: 0, y: 0 };
		});
		layer.append(el);
		return { trigger, label, el, parts, anchor: { x: 0, y: 0 } };
	});

	let pointer = { x: 0, y: 0 };
	let active: (typeof clusters)[number] | null = null;
	let raf = 0;
	let idleTimer = 0;

	const goal = (c: (typeof clusters)[number], p: (typeof clusters)[number]['parts'][number]) => {
		const k = scale();
		const dx = clamp((pointer.x - c.anchor.x) * DRIFT, MAX_DRIFT);
		const dy = clamp((pointer.y - c.anchor.y) * DRIFT, MAX_DRIFT);
		return { x: c.anchor.x + p.it.x * k + dx, y: c.anchor.y + p.it.y * k + dy };
	};

	const tick = () => {
		for (const c of clusters) {
			if (!c.el.classList.contains('show')) continue;
			for (const p of c.parts) {
				const g = goal(c, p);
				p.x += (g.x - p.x) * p.lag;
				p.y += (g.y - p.y) * p.lag;
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
			pointer = { x: e.clientX, y: e.clientY };
			const r = c.label.getBoundingClientRect();
			c.anchor = { x: r.right + 24 * scale(), y: r.top + r.height / 2 };
			if (!c.el.classList.contains('show')) {
				// start in place (no fly-in)
				const k = scale();
				for (const p of c.parts) {
					const g = goal(c, p);
					p.x = g.x;
					p.y = g.y;
					p.img.style.translate = `${p.x}px ${p.y}px`;
					p.img.style.setProperty('--w', `${Math.round(p.it.w * k)}px`);
				}
			}
			active = c;
			c.el.classList.add('show');
			run();
		});
		c.trigger.addEventListener('pointermove', (e) => {
			pointer = { x: e.clientX, y: e.clientY };
		});
		c.trigger.addEventListener('pointerleave', () => {
			c.el.classList.remove('show');
			if (active === c) active = null;
			park();
		});
	}
}
