// Page transitions for cross-document View Transitions (see src/styles/page-transitions.css).
// Must run as an inline, render-blocking <head> script so `pagereveal` is registered before the first frame.
//
// A "curtain" (dark panel, then a gray panel) sweeps across and covers the screen, the page swaps
// underneath, then the curtain leaves. Direction depends on where you're going:
//   /devlog → right · /projects → up · /notes → left · /about → down · / → right · back navigation → opposite
// Only moves between sections get it (landing menu, top bar, back to /). Within a section (list → detail, detail →
// detail, back to the list) and into a detail page from anywhere, the page just changes.
(() => {
	const section = (path) =>
		path.startsWith('/devlog') ? 'devlog' : path.startsWith('/notes') ? 'notes' : path.startsWith('/projects') ? 'projects' : path.startsWith('/about') ? 'about' : 'home';
	const enter = { devlog: 'right', projects: 'up', notes: 'left', about: 'down', home: 'right' };
	const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
	// the landing page or a section's first page; anything deeper is a detail page
	const topPage = /^\/((devlog|projects|notes|about)\/?)?$/;

	addEventListener('pagereveal', (event) => {
		const vt = event.viewTransition;
		if (!vt) return;
		// phones / narrow: no transitions (page-transitions.css only opts in above 820px; this covers browsers that ignore that)
		if (matchMedia('(max-width: 820px), (max-width: 1024px) and (max-height: 500px)').matches || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return vt.skipTransition();
		const nav = window.navigation && navigation.activation;
		const fromUrl = nav && nav.from ? nav.from.url : document.referrer;
		if (!fromUrl || new URL(fromUrl).origin !== location.origin) return vt.skipTransition();

		const from = section(new URL(fromUrl).pathname);
		const to = section(location.pathname);
		if (from === to || !topPage.test(location.pathname)) return vt.skipTransition();

		const back = !!nav && nav.navigationType === 'traverse' && nav.entry.index < nav.from.index;
		const dir = back ? opposite[enter[from]] : enter[to];

		const root = document.documentElement;
		root.dataset.vt = dir;
		const curtain = document.createElement('div');
		curtain.className = 'vt-curtain';
		curtain.dataset.dir = dir;
		curtain.dataset.section = to;
		let theme = root.dataset.ptheme;
		// Notes has its own palette; a curtain coming in from the Portfolio keeps the Portfolio theme's tones.
		if (!theme && from !== 'notes') {
			try { theme = localStorage.getItem('portfolio-theme'); } catch {}
		}
		if (theme && theme !== 'mono') curtain.dataset.theme = theme;
		curtain.setAttribute('aria-hidden', 'true');
		curtain.innerHTML = '<i class="vt-a"></i><i class="vt-b"></i>';
		root.append(curtain);
		vt.finished.finally(() => {
			curtain.remove();
			delete root.dataset.vt;
		});
	});
})();
