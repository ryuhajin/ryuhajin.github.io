// The line above the landing menu ("Technical Artist — …") turns into the hovered item's hint
// (data-hint) with a quick text-scramble, and scrambles back when the pointer leaves.

import { scrambleText } from '../scramble';
import { onMotionChange } from '../phone';

export function initKickerHint() {
	const kicker = document.querySelector<HTMLElement>('[data-kicker]');
	const items = [...document.querySelectorAll<HTMLElement>('[data-hint]')];
	if (!kicker || !items.length) return;

	const base = kicker.textContent ?? '';
	let controller: AbortController | undefined;
	return onMotionChange((enabled) => {
		controller?.abort();
		if (!enabled) {
			scrambleText(kicker, base, 0);
			return;
		}
		controller = new AbortController();
		const options = { signal: controller.signal };
		for (const el of items) {
			const show = () => scrambleText(kicker, el.dataset.hint!);
			const hide = () => scrambleText(kicker, base);
			el.addEventListener('pointerenter', show, options);
			el.addEventListener('focus', show, options);
			el.addEventListener('pointerleave', hide, options);
			el.addEventListener('blur', hide, options);
		}
	});
}
