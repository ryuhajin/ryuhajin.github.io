// Masonry for /projects/: tiles keep their reading order (1, 2, 3 left to right) by going, one by one, into the
// shortest column. Heights come from each tile's ratio (data-ratio "w/h"), so nothing has to load first.
// Without this script the grid falls back to CSS columns (same look, column-wise order).

const COLS = [
	{ query: '(max-width: 640px)', n: 1 },
	{ query: '(max-width: 1024px)', n: 2 },
];

function columnCount() {
	return COLS.find((c) => matchMedia(c.query).matches)?.n ?? 3;
}

export function initMasonry(root: HTMLElement) {
	const tiles = [...root.querySelectorAll<HTMLElement>('[data-tile]')];
	let current = 0;

	const layout = (force = false) => {
		const n = columnCount();
		if (!force && n === current) return;
		current = n;
		const cols = Array.from({ length: n }, () => {
			const col = document.createElement('div');
			col.className = 'mcol';
			return col;
		});
		const heights = new Array(n).fill(0);
		for (const tile of tiles) {
			if (tile.hidden) {
				cols[0].append(tile); // keeps it in the DOM for the filter; hidden adds no height
				continue;
			}
			const [w, h] = (tile.dataset.ratio ?? '1/1').split('/').map(Number);
			const i = heights.indexOf(Math.min(...heights));
			cols[i].append(tile);
			heights[i] += h / w + 0.05; // + gap, in tile widths
		}
		root.replaceChildren(...cols);
		root.classList.add('is-masonry');
	};

	layout(true);
	COLS.forEach((c) => matchMedia(c.query).addEventListener('change', () => layout()));
	return { relayout: () => layout(true) };
}
