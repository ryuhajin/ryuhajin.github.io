// Drives HeroShapes: a smooth, continuous drift that gets interrupted by short glitch hits every few seconds
// (angle jumps, horizontal slice offsets, invert flashes, layer swaps, scale pops).

const SVGNS = 'http://www.w3.org/2000/svg';
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export function initHeroShapes() {
	const host = document.querySelector<HTMLElement>('[data-hero-shapes]');
	if (!host || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	const slices = host.querySelector<SVGGElement>('.slices')!;

	const activeSet = () => [...host.querySelectorAll<SVGGElement>('.set')].find((s) => getComputedStyle(s).display !== 'none');
	const isPixel = () => document.documentElement.dataset.ptheme === 'gameboy';

	let angle = 0;
	let speed = 4; // deg/s
	let nextGlitch = performance.now() + rnd(1800, 3200);
	let last = performance.now();
	let t = 0;
	let lissKick = 0; // glitch hits jolt the lissajous phase

	function applyTransform(set: SVGGElement) {
		const spin = set.querySelector<SVGGElement>('.spin');
		if (!spin) return;
		const a = isPixel() ? Math.round(angle / 90) * 90 : angle; // 8-bit: quarter-turn steps
		const breathe = isPixel() ? 1 : 1 + Math.sin(t * 0.6) * 0.015;
		spin.setAttribute('transform', `rotate(${a.toFixed(2)} 500 500) translate(500 500) scale(${breathe.toFixed(4)}) translate(-500 -500)`);

		// lissajous (geo set): the phase drifts, so the curve keeps re-weaving itself
		const liss = set.querySelector<SVGPathElement>('.layer.on .liss');
		if (liss) {
			const ph = t * 0.35 + lissKick;
			let d = '';
			for (let i = 0; i <= 720; i++) {
				const u = (i / 720) * Math.PI * 2;
				const x = 500 + 380 * Math.sin(3 * u + ph);
				const y = 500 + 380 * Math.sin(4 * u);
				d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
			}
			liss.setAttribute('d', d);
		}

		// satellites (space set)
		set.querySelectorAll<SVGCircleElement>('.sat').forEach((s) => {
			const [rx, ry, tilt, w] = s.dataset.orbit!.split(',').map(Number);
			const th = t * w;
			const x = Math.cos(th) * rx;
			const y = Math.sin(th) * ry;
			const tr = (tilt * Math.PI) / 180;
			s.setAttribute('cx', (500 + x * Math.cos(tr) - y * Math.sin(tr)).toFixed(1));
			s.setAttribute('cy', (500 + x * Math.sin(tr) + y * Math.cos(tr)).toFixed(1));
		});

		// bows sway (candy set)
		set.querySelectorAll<SVGGElement>('.bow').forEach((b, i) => {
			const base = b.dataset.base ?? b.getAttribute('transform')!;
			b.dataset.base = base;
			b.setAttribute('transform', `${base} rotate(${(Math.sin(t * 0.9 + i * 2) * 6).toFixed(2)})`);
		});
	}

	function sliceGlitch(set: SVGGElement) {
		const spin = set.querySelector<SVGGElement>('.spin');
		if (!spin) return;
		slices.replaceChildren();
		['hs-band-a', 'hs-band-b', 'hs-band-c'].forEach((id) => {
			const band = host.querySelector<SVGRectElement>(`#${id} rect`)!;
			band.setAttribute('y', String(Math.round(rnd(80, 900))));
			band.setAttribute('height', String(Math.round(rnd(14, 80))));
			const use = document.createElementNS(SVGNS, 'use');
			use.setAttribute('href', `#${spin.id}`);
			use.setAttribute('clip-path', `url(#${id})`);
			use.setAttribute('transform', `translate(${Math.round(rnd(-24, 24))} 0)`);
			use.setAttribute('opacity', '0.5');
			slices.append(use);
		});
		spin.style.opacity = '0.35';
		setTimeout(() => {
			slices.replaceChildren();
			spin.style.opacity = '';
		}, rnd(120, 220));
	}

	function swapLayer(set: SVGGElement) {
		const layers = [...set.querySelectorAll<SVGGElement>('.layer')];
		if (layers.length > 1) {
			const i = layers.findIndex((l) => l.classList.contains('on'));
			layers[i]?.classList.remove('on');
			layers[(i + 1) % layers.length].classList.add('on');
			return;
		}
		// single-layer sets: flip a few checker cells / pixels instead
		const cells = [...set.querySelectorAll<SVGRectElement>('.checker rect:not(.frame)')];
		for (let k = 0; k < 10 && cells.length; k++) pick(cells).classList.toggle('on');
	}

	/** TV-static tear on the shapes (see .shape-static in glitch.css) */
	function staticTear() {
		[host].forEach((el) => {
			el.classList.remove('shape-static');
			void (el as HTMLElement).offsetWidth; // restart the animation
			el.classList.add('shape-static');
			setTimeout(() => el.classList.remove('shape-static'), 400);
		});
	}

	function glitch(set: SVGGElement) {
		const kind = pick(['jump', 'slice', 'static', 'static', 'swap', 'swap']);
		if (kind === 'jump') {
			angle += pick([-1, 1]) * rnd(15, 40);
			lissKick += rnd(0.4, 1.2);
		}
		if (kind === 'slice') sliceGlitch(set);
		if (kind === 'swap') swapLayer(set);
		if (kind === 'static') staticTear();
		// a burst of speed right after a hit, then it settles back
		speed = pick([-1, 1]) * rnd(18, 40);
	}

	function frame(now: number) {
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		t += dt;
		speed += (Math.sign(speed || 1) * 4 - speed) * Math.min(1, dt * 2.5);
		angle += speed * dt;
		const set = activeSet();
		if (set) {
			if (now >= nextGlitch) {
				glitch(set);
				nextGlitch = now + rnd(2000, 4000);
			}
			applyTransform(set);
		}
		requestAnimationFrame(frame);
	}
	requestAnimationFrame(frame);
}
