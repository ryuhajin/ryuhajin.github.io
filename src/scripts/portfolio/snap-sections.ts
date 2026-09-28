// Screen-by-screen project detail: scroll-snap container + side indicator + keyboard paging.
//   <main data-snap> <section data-snap-section data-label="..."> ... </main>
//   <nav data-snap-nav> <button data-go="i"> ... </nav>
//   [data-snap-counter] shows "02 / 06"

export function initSnapSections() {
	const root = document.querySelector<HTMLElement>('[data-snap]');
	if (!root) return;
	const sections = [...root.querySelectorAll<HTMLElement>('[data-snap-section]')];
	const dots = [...document.querySelectorAll<HTMLButtonElement>('[data-snap-nav] [data-go]')];
	const counter = document.querySelector<HTMLElement>('[data-snap-counter]');
	let current = 0;

	const pad = (n: number) => String(n).padStart(2, '0');
	const setActive = (i: number) => {
		current = i;
		dots.forEach((d, j) => d.toggleAttribute('aria-current', j === i));
		sections.forEach((s, j) => s.classList.toggle('is-active', j === i));
		if (counter) counter.textContent = `${pad(i + 1)} / ${pad(sections.length)}`;
		document.documentElement.dataset.snapIndex = String(i);
	};

	const go = (i: number) => {
		const idx = Math.max(0, Math.min(sections.length - 1, i));
		sections[idx].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
	};

	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) if (e.isIntersecting) setActive(sections.indexOf(e.target as HTMLElement));
		},
		// a section is "current" when it crosses the viewport's middle band (works for sections taller than the screen too)
		{ root, rootMargin: '-45% 0px -45% 0px', threshold: 0 }
	);
	sections.forEach((s) => io.observe(s));
	setActive(0);

	dots.forEach((d) => d.addEventListener('click', () => go(Number(d.dataset.go))));

	const onKey = (e: KeyboardEvent) => {
		if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
		if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
		const next = ['ArrowDown', 'PageDown', ' '].includes(e.key);
		const prev = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
		if (e.key === 'Home') go(0);
		else if (e.key === 'End') go(sections.length - 1);
		else if (prev) go(current - 1);
		else if (next) go(current + 1);
		else return;
		e.preventDefault();
	};
	document.addEventListener('keydown', onKey);
	document.addEventListener(
		'astro:before-swap',
		() => {
			io.disconnect();
			document.removeEventListener('keydown', onKey);
			delete document.documentElement.dataset.snapIndex;
		},
		{ once: true }
	);
}
