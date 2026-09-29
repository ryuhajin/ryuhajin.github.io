// The line above the landing menu ("Technical Artist — …") turns into the hovered item's hint
// (data-hint) with a quick text-scramble, and scrambles back when the pointer leaves.

import { scrambleText } from '../scramble';

export function initKickerHint() {
	const kicker = document.querySelector<HTMLElement>('[data-kicker]');
	const items = [...document.querySelectorAll<HTMLElement>('[data-hint]')];
	if (!kicker || !items.length) return;

	const base = kicker.textContent ?? '';
	for (const el of items) {
		const show = () => scrambleText(kicker, el.dataset.hint!);
		const hide = () => scrambleText(kicker, base);
		el.addEventListener('pointerenter', show);
		el.addEventListener('focus', show);
		el.addEventListener('pointerleave', hide);
		el.addEventListener('blur', hide);
	}
}
