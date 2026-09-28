// Text scramble: characters settle from left to right (with jitter), flickering through code-ish glyphs first.
// Used by the landing-page kicker hint and the brand ("ryuhajin" ⇄ "cd ~/home").

const GLYPHS = '!<>-_\\/[]{}=+*^?#01';
const running = new WeakMap<HTMLElement, number>();

export function scrambleText(el: HTMLElement, next: string, duration = 320) {
	cancelAnimationFrame(running.get(el) ?? 0);
	const from = el.textContent ?? '';
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
		el.textContent = next;
		return;
	}
	const len = Math.max(from.length, next.length);
	const settle = Array.from({ length: len }, (_, i) => (i / len) * 0.7 + Math.random() * 0.3);
	const t0 = performance.now();
	const step = (now: number) => {
		const t = Math.min(1, (now - t0) / duration);
		let out = '';
		for (let i = 0; i < len; i++) {
			if (t >= settle[i]) out += next[i] ?? '';
			else if (t >= settle[i] - 0.35) out += next[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
			else out += from[i] ?? '';
		}
		el.textContent = out;
		if (t < 1) running.set(el, requestAnimationFrame(step));
	};
	running.set(el, requestAnimationFrame(step));
}
