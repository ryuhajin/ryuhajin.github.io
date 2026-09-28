// The line above the landing menu ("Software Developer — …") turns into the hovered item's hint
// (data-hint) with a quick text-scramble, and scrambles back when the pointer leaves.

const GLYPHS = '!<>-_\\/[]{}=+*^?#01';
const DURATION = 320; // ms

export function initKickerHint() {
	const kicker = document.querySelector<HTMLElement>('[data-kicker]');
	const items = [...document.querySelectorAll<HTMLElement>('[data-hint]')];
	if (!kicker || !items.length) return;

	const base = kicker.textContent ?? '';
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let raf = 0;

	const scrambleTo = (next: string) => {
		cancelAnimationFrame(raf);
		const from = kicker.textContent ?? '';
		if (reduced) {
			kicker.textContent = next;
			return;
		}
		const len = Math.max(from.length, next.length);
		// each character settles at its own moment, left to right with some jitter
		const settle = Array.from({ length: len }, (_, i) => (i / len) * 0.7 + Math.random() * 0.3);
		const t0 = performance.now();
		const step = (now: number) => {
			const t = Math.min(1, (now - t0) / DURATION);
			let out = '';
			for (let i = 0; i < len; i++) {
				if (t >= settle[i]) out += next[i] ?? '';
				else if (t >= settle[i] - 0.35) out += next[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
				else out += from[i] ?? '';
			}
			kicker.textContent = out;
			if (t < 1) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	};

	for (const el of items) {
		const show = () => scrambleTo(el.dataset.hint!);
		const hide = () => scrambleTo(base);
		el.addEventListener('pointerenter', show);
		el.addEventListener('focus', show);
		el.addEventListener('pointerleave', hide);
		el.addEventListener('blur', hide);
	}
}
