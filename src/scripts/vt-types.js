// Page transitions for cross-document View Transitions (see src/styles/page-transitions.css).
// Must run as an inline, render-blocking <head> script so `pagereveal` is registered before the first frame.
//
// A "curtain" (dark panel, then a gray panel) sweeps across and covers the screen, the page swaps
// underneath, then the curtain leaves. Direction depends on where you're going:
//   /projects → up · /notes → left · /about → down · / → right · back navigation → opposite
(() => {
	const section = (path) =>
		path.startsWith('/notes') ? 'notes' : path.startsWith('/projects') ? 'projects' : path.startsWith('/about') ? 'about' : 'home';
	const enter = { projects: 'up', notes: 'left', about: 'down', home: 'right' };
	const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };

	addEventListener('pagereveal', (event) => {
		const vt = event.viewTransition;
		if (!vt) return;
		const nav = window.navigation && navigation.activation;
		const fromUrl = nav && nav.from ? nav.from.url : document.referrer;
		if (!fromUrl || new URL(fromUrl).origin !== location.origin) return vt.skipTransition();

		const from = section(new URL(fromUrl).pathname);
		const to = section(location.pathname);
		// docs should feel instant
		if (from === 'notes' && to === 'notes') return vt.skipTransition();

		const back = !!nav && nav.navigationType === 'traverse' && nav.entry.index < nav.from.index;
		const dir = back ? opposite[enter[from]] : enter[to];

		const root = document.documentElement;
		root.dataset.vt = dir;
		const curtain = document.createElement('div');
		curtain.className = 'vt-curtain';
		curtain.dataset.dir = dir;
		curtain.setAttribute('aria-hidden', 'true');
		curtain.innerHTML = '<i class="vt-a"></i><i class="vt-b"></i>';
		root.append(curtain);
		vt.finished.finally(() => {
			curtain.remove();
			delete root.dataset.vt;
		});
	});
})();
