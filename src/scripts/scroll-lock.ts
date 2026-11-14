// Shared by mobile navigation, theme sheets and lightboxes. Nested overlays restore only once.
let locks = 0;
let restore: (() => void) | undefined;

export function lockPageScroll() {
	if (locks++ === 0) {
		const body = document.body;
		const x = window.scrollX;
		const y = window.scrollY;
		const properties = ['position', 'top', 'left', 'right', 'width', 'overflow'] as const;
		const saved = properties.map((key) => [key, body.style.getPropertyValue(key), body.style.getPropertyPriority(key)]);
		body.style.position = 'fixed';
		body.style.top = `${-y}px`;
		body.style.left = `${-x}px`;
		body.style.right = '0';
		body.style.width = '100%';
		body.style.overflow = 'hidden';
		restore = () => {
			for (const [key, value, priority] of saved) {
				if (value) body.style.setProperty(key, value, priority);
				else body.style.removeProperty(key);
			}
			window.scrollTo({ left: x, top: y, behavior: 'instant' });
		};
	}
	let released = false;
	return () => {
		if (released) return;
		released = true;
		if (--locks === 0) { restore?.(); restore = undefined; }
	};
}
