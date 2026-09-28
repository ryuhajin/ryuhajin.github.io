// Terminal-style typing: erase back to the common prefix, then type the new text one character at a time.
// While it runs, `busy` gets the class "typing" (so a caret can stay solid instead of blinking).

const running = new WeakMap<HTMLElement, number>();

interface Options {
	/** element that receives the "typing" class while characters are changing */
	busy?: HTMLElement;
	typeMs?: number;
	eraseMs?: number;
}

export function typeTo(el: HTMLElement, next: string, { busy, typeMs = 70, eraseMs = 34 }: Options = {}) {
	clearTimeout(running.get(el));
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
		el.textContent = next;
		return;
	}
	busy?.classList.add('typing');
	const tick = () => {
		const cur = el.textContent ?? '';
		if (cur === next) {
			busy?.classList.remove('typing');
			return;
		}
		if (!next.startsWith(cur)) {
			el.textContent = cur.slice(0, -1); // backspace
			running.set(el, window.setTimeout(tick, eraseMs));
		} else {
			el.textContent = next.slice(0, cur.length + 1);
			// a little human unevenness
			running.set(el, window.setTimeout(tick, typeMs * (0.6 + Math.random() * 0.8)));
		}
	};
	tick();
}
