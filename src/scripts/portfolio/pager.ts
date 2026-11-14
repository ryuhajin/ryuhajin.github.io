// Numbered pages for a list: inside each [data-paged data-per="N"], the [data-page-item] children are shown N at a
// time and a [data-pager] nav gets 1 2 3 … buttons. With one page (or no JS) everything stays visible.
// The first and last visible items get [data-page-first] / [data-page-last], so the rules around the list can react.
// Lists can nest (Devlog: a paged list of series, each with its own paged entries); a box only takes the items and
// the pager whose nearest [data-paged] is itself.
import { isPhone } from '../phone';

export function initPagers() {
	for (const box of document.querySelectorAll<HTMLElement>('[data-paged]')) {
		const own = (sel: string) => [...box.querySelectorAll<HTMLElement>(sel)].filter((el) => el.parentElement?.closest('[data-paged]') === box);
		const items = own('[data-page-item]');
		const per = Number(box.dataset.per) || 4;
		const pages = Math.ceil(items.length / per);
		const pager = own('[data-pager]')[0];
		const markLast = () => {
			const shown = items.filter((el) => !el.hidden);
			items.forEach((el) => {
				el.toggleAttribute('data-page-first', el === shown[0]);
				el.toggleAttribute('data-page-last', el === shown.at(-1));
			});
		};
		if (!pager || pages < 2) {
			markLast();
			continue;
		}
		let current = -1;
		const buttons = Array.from({ length: pages }, (_, i) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.className = 'pg-num';
			b.textContent = String(i + 1);
			b.setAttribute('aria-label', `${i + 1} 페이지`);
			b.addEventListener('click', () => show(i, true));
			return b;
		});
		// a pager marked [data-steps] also gets ← → and a "01 / 04" count (the Devlog Complete list)
		const steps = pager.hasAttribute('data-steps');
		const step = (cls: string, label: string, glyph: string, d: number) => {
			const b = document.createElement('button');
			b.type = 'button';
			b.className = cls;
			b.textContent = glyph;
			b.setAttribute('aria-label', label);
			b.addEventListener('click', () => show(Math.min(pages - 1, Math.max(0, current + d)), true));
			return b;
		};
		const prev = step('pg-prev', '이전 페이지', '←', -1);
		const next = step('pg-next', '다음 페이지', '→', 1);
		const count = document.createElement('span');
		count.className = 'pg-count';
		const pad = (n: number) => String(n).padStart(2, '0');
		const show = (page: number, userInitiated = false) => {
			if (page === current) return;
			current = page;
			items.forEach((el, i) => (el.hidden = Math.floor(i / per) !== page));
			buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === page)));
			prev.disabled = page === 0;
			next.disabled = page === pages - 1;
			count.textContent = `${pad(page + 1)} / ${pad(pages)}`;
			markLast();
			// The first page can contain a tall feature. After it collapses, keep the new
			// page's beginning in view, without stealing keyboard focus from its pager.
			if (userInitiated && isPhone()) {
				requestAnimationFrame(() => {
					if (page !== current) return;
					items.find((el) => !el.hidden)?.scrollIntoView({ block: 'start', behavior: 'instant' });
				});
			}
		};
		pager.replaceChildren(...(steps ? [count, prev, ...buttons, next] : buttons));
		pager.hidden = false;
		show(0);
	}
}
