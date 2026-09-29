// One <dialog data-lightbox-dialog> per page shows any [data-lightbox] tile large.
// ←/→ step through every tile on the page, Esc (native) or a backdrop click closes, focus returns to the tile.

export function initLightbox() {
	const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
	if (!dialog) return;
	const img = dialog.querySelector('img')!;
	const caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]')!;
	const count = dialog.querySelector<HTMLElement>('[data-lightbox-count]')!;
	const tiles = [...document.querySelectorAll<HTMLElement>('[data-lightbox]')];
	let index = 0;
	let opener: HTMLElement | null = null;

	const show = (i: number) => {
		index = (i + tiles.length) % tiles.length;
		const t = tiles[index];
		img.src = t.dataset.lightbox!;
		img.alt = t.querySelector('img')?.alt ?? '';
		caption.textContent = t.dataset.caption ?? '';
		count.textContent = `${index + 1} / ${tiles.length}`;
	};

	tiles.forEach((t, i) =>
		t.addEventListener('click', () => {
			opener = t;
			show(i);
			dialog.showModal();
		})
	);
	dialog.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowRight') show(index + 1);
		else if (e.key === 'ArrowLeft') show(index - 1);
		else return;
		e.preventDefault();
		e.stopPropagation();
	});
	dialog.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => show(index - 1));
	dialog.querySelector('[data-lightbox-next]')?.addEventListener('click', () => show(index + 1));
	dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
	// clicks on the backdrop land on the dialog element itself
	dialog.addEventListener('click', (e) => {
		if (e.target === dialog) dialog.close();
	});
	dialog.addEventListener('close', () => opener?.focus());
}
