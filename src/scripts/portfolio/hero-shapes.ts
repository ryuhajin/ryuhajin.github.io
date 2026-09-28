// Drives HeroShapes with a calm "rotate and settle" rhythm instead of random jumps:
//   hold  (~2.6s)  the shape breathes and its details keep drifting
//   turn  (~1.4s)  it rotates one step with easeInOutCubic and settles
//   every 2 turns  it cross-fades into the next shape (CSS transitions on .layer, see HeroShapes.astro),
//                  with one short static tear as the hand-off
// 8-bit theme: the turn snaps in quarter steps.

const HOLD = 2600;
const TURN = 1400;
const STEP = 60; // degrees per turn
const TURNS_PER_SHAPE = 2;

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function initHeroShapes() {
	const host = document.querySelector<HTMLElement>('[data-hero-shapes]');
	if (!host || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const activeSet = () => [...host.querySelectorAll<SVGGElement>('.set')].find((s) => getComputedStyle(s).display !== 'none');
	const isPixel = () => document.documentElement.dataset.ptheme === 'gameboy';

	let angle = 0; // settled angle
	let from = 0;
	let phase: 'hold' | 'turn' = 'hold';
	let phaseStart = performance.now();
	let turns = 0;
	let t = 0;
	let last = performance.now();

	function staticTear() {
		host!.classList.remove('shape-static');
		void host!.offsetWidth; // restart the animation
		host!.classList.add('shape-static');
		setTimeout(() => host!.classList.remove('shape-static'), 400);
	}

	function nextShape(set: SVGGElement) {
		const layers = [...set.querySelectorAll<SVGGElement>('.layer')];
		if (layers.length > 1) {
			const i = layers.findIndex((l) => l.classList.contains('on'));
			layers[i]?.classList.remove('on');
			layers[(i + 1) % layers.length].classList.add('on');
		} else {
			// single-shape sets (candy): flip a handful of checker cells instead
			const cells = [...set.querySelectorAll<SVGRectElement>('.checker rect:not(.frame)')];
			for (let k = 0; k < 8 && cells.length; k++) cells[(Math.random() * cells.length) | 0].classList.toggle('on');
		}
		staticTear();
	}

	function draw(set: SVGGElement, rot: number) {
		const spin = set.querySelector<SVGGElement>('.spin');
		if (spin) {
			const breathe = isPixel() ? 1 : 1 + Math.sin(t * 0.8) * 0.012;
			spin.setAttribute('transform', `rotate(${rot.toFixed(2)} 500 500) translate(500 500) scale(${breathe.toFixed(4)}) translate(-500 -500)`);
		}

		// lissajous (geo set): the phase drifts slowly, so the curve keeps re-weaving itself
		const liss = set.querySelector<SVGPathElement>('.layer.on .liss');
		if (liss) {
			const ph = t * 0.22;
			let d = '';
			for (let i = 0; i <= 720; i++) {
				const u = (i / 720) * Math.PI * 2;
				d += `${i ? 'L' : 'M'}${(500 + 380 * Math.sin(3 * u + ph)).toFixed(1)} ${(500 + 380 * Math.sin(4 * u)).toFixed(1)}`;
			}
			liss.setAttribute('d', d);
		}

		// satellites (space set) keep orbiting
		set.querySelectorAll<SVGCircleElement>('.sat').forEach((s) => {
			const [rx, ry, tilt, w] = s.dataset.orbit!.split(',').map(Number);
			const x = Math.cos(t * w) * rx;
			const y = Math.sin(t * w) * ry;
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

	function frame(now: number) {
		t += Math.min(0.05, (now - last) / 1000);
		last = now;
		const set = activeSet();
		if (set) {
			let rot = angle;
			const elapsed = now - phaseStart;
			if (phase === 'hold' && elapsed >= HOLD) {
				phase = 'turn';
				phaseStart = now;
				from = angle;
				angle += STEP;
				rot = from;
			} else if (phase === 'turn') {
				const p = Math.min(1, elapsed / TURN);
				const e = isPixel() ? Math.floor(p * 4) / 4 : easeInOutCubic(p);
				rot = from + (angle - from) * e;
				if (p >= 1) {
					phase = 'hold';
					phaseStart = now;
					if (++turns % TURNS_PER_SHAPE === 0) nextShape(set);
				}
			}
			draw(set, rot);
		}
		requestAnimationFrame(frame);
	}
	requestAnimationFrame(frame);
}
