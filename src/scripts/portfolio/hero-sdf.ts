// Landing-page decoration: one fragment shader that draws signed-distance-field shapes in three layers.
//   1. segment grid  — a field of tiny glyphs (dash / colon / box / tick) that flicker on pseudo-noise and light up
//                      inside the shape, so the grid "renders" it like a dot-matrix display   (after Stefan Vitasović)
//   2. echo outlines — the outline repeated N times, offset and fading; the stack unfolds while the shape morphs and
//                      folds back onto itself when it settles                                   (after Tobias Ahlin)
//   3. velocity      — the shape is stretched along its velocity and the R/G/B channels are pulled apart by it;
//                      velocity comes from the morph impulse and from a spring that leans toward the pointer
//                                                                                                (after Roman Jean-Elie)
// Shapes morph by mixing two SDFs. Colours come from the theme tokens (--shape, --accent, --fg-3); the 8-bit theme
// renders on a coarse pixel grid. No libraries — a single full-screen triangle.

import { themas, type ShapeSet } from '../../portfolio/themes';

const SHAPES = { circle: 0, rbox: 1, triangle: 2, star: 3, ring: 4, cross: 5, hexagon: 6, heart: 7, blob: 8 } as const;
type ShapeName = keyof typeof SHAPES;

const PLAYLISTS: Record<ShapeSet, ShapeName[]> = {
	geo: ['circle', 'triangle', 'blob', 'rbox', 'star', 'ring', 'hexagon', 'cross'],
	space: ['circle', 'ring', 'star', 'blob', 'hexagon'],
	candy: ['heart', 'star', 'circle', 'rbox', 'blob'],
	pixel: ['cross', 'star', 'rbox', 'triangle', 'heart'],
};

const HOLD = 3.0; // s a shape rests
const MORPH = 1.6; // s the unfold → morph → fold takes
const ECHOES = 16;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;      // seconds (grid flicker, blob orbit)
uniform vec2 uCenter;     // px, GL coords (y up)
uniform float uR;         // shape radius, px
uniform float uRot;       // radians
uniform float uA;         // shape ids
uniform float uB;
uniform float uMix;       // 0 → A, 1 → B
uniform float uSpacing;   // px between echo copies
uniform vec2 uDir;        // echo direction (unit)
uniform vec2 uVel;        // px, drives stretch + channel split
uniform float uPx;        // device px per logical px
uniform float uPixel;     // >1: pixelated rendering (8-bit theme)
uniform float uGridFrom;  // x (px) where the grid starts fading in, keeps the menu side clean
uniform vec3 uLine;       // echo colour
uniform vec3 uFront;      // front outline colour
uniform vec3 uGrid;       // grid glyph colour (outside)
uniform vec3 uGridIn;     // grid glyph colour (inside the shape)

#define ECHOES ${ECHOES}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float dot2(vec2 v) { return dot(v, v); }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// shape library — unit size (about radius 1), y up
float sdCircle(vec2 p) { return length(p) - 0.95; }
float sdRBox(vec2 p) { vec2 q = abs(p) - vec2(0.78) + 0.22; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.22; }
float sdTriangle(vec2 p) {
	const float k = 1.7320508;
	float r = 0.9;
	p.y += 0.22;
	p.x = abs(p.x) - r;
	p.y = p.y + r / k;
	if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
	p.x -= clamp(p.x, -2.0 * r, 0.0);
	return -length(p) * sign(p.y);
}
float sdStar(vec2 p) {
	const vec2 k1 = vec2(0.809016994, -0.587785252);
	const vec2 k2 = vec2(-0.809016994, -0.587785252);
	float r = 1.08; float rf = 0.48;
	p.x = abs(p.x);
	p -= 2.0 * max(dot(k1, p), 0.0) * k1;
	p -= 2.0 * max(dot(k2, p), 0.0) * k2;
	p.x = abs(p.x);
	p.y -= r;
	vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
	float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
	return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
float sdRing(vec2 p) { return abs(length(p) - 0.74) - 0.2; }
float sdCross(vec2 p) {
	vec2 b = vec2(0.98, 0.3);
	p = abs(p); p = (p.y > p.x) ? p.yx : p.xy;
	vec2 q = p - b;
	float k = max(q.y, q.x);
	vec2 w = (k > 0.0) ? q : vec2(b.y - p.x, -k);
	return sign(k) * length(max(w, 0.0));
}
float sdHexagon(vec2 p) {
	const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
	float r = 0.86;
	p = abs(p);
	p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
	p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
	return length(p) * sign(p.y);
}
float sdHeart(vec2 p) {
	p = p * 0.62 + vec2(0.0, 0.58);
	p.x = abs(p.x);
	float d;
	if (p.y + p.x > 1.0) d = sqrt(dot2(p - vec2(0.25, 0.75))) - 0.35355339;
	else d = sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
	return d / 0.62;
}
float sdBlob(vec2 p) {
	float t = uTime * 0.7;
	float d = length(p - 0.42 * vec2(cos(t), sin(t))) - 0.5;
	d = smin(d, length(p - 0.42 * vec2(cos(t + 2.094), sin(t + 2.094))) - 0.46, 0.42);
	d = smin(d, length(p - 0.42 * vec2(cos(t + 4.189), sin(t + 4.189))) - 0.42, 0.42);
	return d;
}
float shape(vec2 p, float id) {
	if (id < 0.5) return sdCircle(p);
	if (id < 1.5) return sdRBox(p);
	if (id < 2.5) return sdTriangle(p);
	if (id < 3.5) return sdStar(p);
	if (id < 4.5) return sdRing(p);
	if (id < 5.5) return sdCross(p);
	if (id < 6.5) return sdHexagon(p);
	if (id < 7.5) return sdHeart(p);
	return sdBlob(p);
}

// p: px from the shape centre, already in the stretched frame
float scene(vec2 p) {
	vec2 q = rot(uRot) * p / uR;
	return mix(shape(q, uA), shape(q, uB), uMix) * uR;
}

// velocity stretch: squash coordinates along the motion so the shape elongates that way
vec2 stretch(vec2 p) {
	float v = length(uVel);
	if (v < 0.001) return p;
	vec2 n = uVel / v;
	float s = clamp(v * 0.012, 0.0, 0.55);
	return p - n * dot(p, n) * (s / (1.0 + s));
}

// echo stack at one sample point → (front outline, echoes)
vec2 echoes(vec2 p) {
	float hw = 0.65 * uPx;
	float aa = uPixel > 1.5 ? 0.25 : 1.0;
	float reach = float(ECHOES) * uSpacing + hw + aa + 2.0;
	float d0 = scene(p);
	if (abs(d0) > reach) return vec2(0.0); // Lipschitz bound: no copy can be close
	float front = 1.0 - smoothstep(hw, hw + aa, abs(d0));
	float rest = 0.0;
	for (int i = 1; i < ECHOES; i++) {
		float fi = float(i);
		float d = scene(p - uDir * fi * uSpacing);
		float l = 1.0 - smoothstep(hw, hw + aa, abs(d));
		rest = max(rest, l * pow(1.0 - fi / float(ECHOES), 1.7));
	}
	return vec2(front, rest);
}

void main() {
	vec2 fc = gl_FragCoord.xy;
	if (uPixel > 1.5) fc = (floor(fc / uPixel) + 0.5) * uPixel;
	vec2 p = stretch(fc - uCenter);

	// ---- 1. segment grid ----
	float cellSize = (uPixel > 1.5 ? uPixel * 2.0 : 11.0 * uPx);
	vec2 cell = floor(fc / cellSize);
	vec2 f = fract(fc / cellSize);
	float dc = scene(stretch((cell + 0.5) * cellSize - uCenter));
	float inside = 1.0 - smoothstep(-cellSize, cellSize * 1.5, dc);
	float gridFade = smoothstep(uGridFrom, uGridFrom + uRes.x * 0.25, fc.x);
	float h = hash(cell);
	float tick = floor(uTime * (1.5 + h * 5.0) + h * 13.0);
	float r = hash(cell + tick * 0.1373);
	float major = (mod(cell.x, 8.0) < 0.5 || mod(cell.y, 8.0) < 0.5) ? 0.22 : 0.0;
	float prob = (mix(0.05, 0.55, inside) + major * (1.0 - inside)) * gridFade;
	float glyph = 0.0;
	if (r < prob) {
		float g = floor(hash(cell * 1.71 + 3.1) * 4.0);
		vec2 c = f - 0.5;
		if (g < 0.5) glyph = step(abs(c.x), 0.07) * step(abs(c.y), 0.34);                       // |
		else if (g < 1.5) glyph = step(length(vec2(c.x, abs(c.y) - 0.2)), 0.1);                // :
		else if (g < 2.5) glyph = step(max(abs(c.x), abs(c.y)), 0.26) * (1.0 - step(max(abs(c.x), abs(c.y)), 0.14)); // ▯
		else glyph = step(abs(c.y), 0.07) * step(abs(c.x), 0.28);                               // –
		if (uPixel > 1.5) glyph = 1.0;
	}
	float gridA = glyph * mix(0.3, 0.75, inside);
	vec3 gridC = mix(uGrid, uGridIn, inside);

	// ---- 2 + 3. echo outlines, channel-split by velocity ----
	vec2 split = clamp(uVel * 0.35, vec2(-14.0 * uPx), vec2(14.0 * uPx));
	vec2 eR = echoes(p + split);
	vec2 eG = echoes(p);
	vec2 eB = echoes(p - split);
	vec3 front = vec3(eR.x, eG.x, eB.x);
	vec3 rest = vec3(eR.y, eG.y, eB.y);
	vec3 lineA = front + rest * (1.0 - front);
	vec3 lineC = uFront * front + uLine * rest * (1.0 - front);  // premultiplied, per channel

	float a = max(max(lineA.r, lineA.g), lineA.b);
	vec3 col = lineC + gridC * gridA * (1.0 - lineA);
	a = a + gridA * (1.0 - a);
	gl_FragColor = vec4(col, a);
}
`;

interface Palette {
	line: number[];
	front: number[];
	grid: number[];
	gridIn: number[];
	set: ShapeSet;
}

function cssColor(value: string, probe: CanvasRenderingContext2D): number[] {
	probe.clearRect(0, 0, 1, 1);
	probe.fillStyle = '#000';
	probe.fillStyle = value.trim() || '#fff';
	probe.fillRect(0, 0, 1, 1);
	const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
	return [r / 255, g / 255, b / 255];
}

function readPalette(probe: CanvasRenderingContext2D): Palette {
	const cs = getComputedStyle(document.documentElement);
	const v = (n: string) => cssColor(cs.getPropertyValue(n), probe);
	const id = document.documentElement.dataset.ptheme;
	return {
		line: v('--shape'),
		front: v('--accent'),
		grid: v('--fg-3'),
		gridIn: v('--shape'),
		set: themas.find((t) => t.id === id)?.shapes ?? 'geo',
	};
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function initHeroSdf() {
	const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-sdf]');
	if (!canvas) return;
	const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
	if (!gl) return; // decoration only — without WebGL the stage simply stays empty

	const compile = (type: number, src: string) => {
		const s = gl.createShader(type)!;
		gl.shaderSource(s, src);
		gl.compileShader(s);
		if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('[hero-sdf]', gl.getShaderInfoLog(s));
		return s;
	};
	const prog = gl.createProgram()!;
	gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
	gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
		console.warn('[hero-sdf]', gl.getProgramInfoLog(prog));
		return;
	}
	gl.useProgram(prog);
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const aPos = gl.getAttribLocation(prog, 'aPos');
	gl.enableVertexAttribArray(aPos);
	gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
	const U = (n: string) => gl.getUniformLocation(prog, n);
	const u = {
		res: U('uRes'), time: U('uTime'), center: U('uCenter'), r: U('uR'), rot: U('uRot'), a: U('uA'), b: U('uB'),
		mix: U('uMix'), spacing: U('uSpacing'), dir: U('uDir'), vel: U('uVel'), px: U('uPx'), pixel: U('uPixel'),
		gridFrom: U('uGridFrom'), line: U('uLine'), front: U('uFront'), grid: U('uGrid'), gridIn: U('uGridIn'),
	};

	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
	let palette = readPalette(probe);
	let playlist = PLAYLISTS[palette.set].map((n) => SHAPES[n]);
	let index = 0;

	// size: buffer follows the element, capped so large/hi-dpi screens stay cheap
	let dpr = 1;
	let W = 1;
	let H = 1;
	const resize = () => {
		const rect = canvas.getBoundingClientRect();
		dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		W = Math.max(1, Math.round(rect.width * dpr));
		H = Math.max(1, Math.round(rect.height * dpr));
		canvas.width = W;
		canvas.height = H;
		gl.viewport(0, 0, W, H);
	};
	resize();
	new ResizeObserver(() => {
		resize();
		if (still) draw(0, 0);
	}).observe(canvas);

	// pointer spring: the shape leans toward the pointer; its velocity feeds stretch + channel split
	const pointer = { x: 0, y: 0, active: false };
	window.addEventListener('pointermove', (e) => {
		const rect = canvas.getBoundingClientRect();
		pointer.x = (e.clientX - rect.left) * dpr;
		pointer.y = (rect.bottom - e.clientY) * dpr; // GL y up
		pointer.active = true;
	});
	const lean = { x: 0, y: 0, vx: 0, vy: 0 };

	const start = performance.now() / 1000;
	// echo direction per morph: around "downward" (Ahlin), turning only while the stack is unfolded
	const angleFor = (k: number) => -Math.PI / 2 + Math.sin(k * 1.7) * 1.1;

	// t: seconds since start, dt: seconds since the previous frame
	const draw = (t: number, dt: number) => {

		// timeline: hold, then unfold → morph → fold
		const cycle = HOLD + MORPH;
		const k = Math.floor(t / cycle);
		const local = t - k * cycle;
		const m = still ? 0 : Math.max(0, (local - HOLD) / MORPH); // 0..1 during the morph
		index = still ? 0 : k;
		const from = playlist[index % playlist.length];
		const to = playlist[(index + 1) % playlist.length];
		const bump = Math.sin(Math.PI * m); // 0 → 1 → 0
		const mixT = ease(Math.min(1, Math.max(0, (m - 0.18) / 0.64)));
		const angle = angleFor(index) + (angleFor(index + 1) - angleFor(index)) * ease(m);
		const dir = [Math.cos(angle), Math.sin(angle)];

		// centre: lower right, part of it off-screen; a slow drift + the pointer lean
		const R = Math.min(H * 0.34, W * 0.28);
		const cx = W * 0.73 + Math.sin(t * 0.23) * 14 * dpr;
		const cy = H * 0.45 + Math.cos(t * 0.31) * 10 * dpr;
		if (!still) {
			const tx = pointer.active ? Math.max(-1, Math.min(1, (pointer.x - cx) / (W * 0.5))) * 46 * dpr : 0;
			const ty = pointer.active ? Math.max(-1, Math.min(1, (pointer.y - cy) / (H * 0.5))) * 30 * dpr : 0;
			const kS = 90;
			const dS = 11;
			lean.vx += ((tx - lean.x) * kS - lean.vx * dS) * dt;
			lean.vy += ((ty - lean.y) * kS - lean.vy * dS) * dt;
			lean.x += lean.vx * dt;
			lean.y += lean.vy * dt;
		}
		// velocity in px/frame-ish units: pointer spring + the morph impulse along the unfold direction
		const morphV = Math.cos(Math.PI * m) * (m > 0 && m < 1 ? 1 : 0) * 26 * dpr;
		const vel = [lean.vx * 0.05 + dir[0] * morphV, lean.vy * 0.05 + dir[1] * morphV];

		gl.uniform2f(u.res, W, H);
		gl.uniform1f(u.time, still ? 0 : t);
		gl.uniform2f(u.center, cx + lean.x, cy + lean.y);
		gl.uniform1f(u.r, R);
		gl.uniform1f(u.rot, still ? 0 : t * 0.06 + ease(m) * 0.5 + index * 0.5);
		gl.uniform1f(u.a, from);
		gl.uniform1f(u.b, to);
		gl.uniform1f(u.mix, mixT);
		gl.uniform1f(u.spacing, (3 + bump * 9) * dpr);
		gl.uniform2f(u.dir, dir[0], dir[1]);
		gl.uniform2f(u.vel, vel[0], vel[1]);
		gl.uniform1f(u.px, dpr);
		gl.uniform1f(u.pixel, palette.set === 'pixel' ? Math.round(4 * dpr) : 1);
		gl.uniform1f(u.gridFrom, W * 0.34);
		gl.uniform3fv(u.line, palette.line);
		gl.uniform3fv(u.front, palette.front);
		gl.uniform3fv(u.grid, palette.grid);
		gl.uniform3fv(u.gridIn, palette.gridIn);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};

	document.addEventListener('thema-change', () => {
		palette = readPalette(probe);
		playlist = PLAYLISTS[palette.set].map((n) => SHAPES[n]);
		if (still) draw(0, 0);
	});

	// test hook: render a given moment without the animation loop (hidden tabs pause rAF)
	(canvas as HTMLCanvasElement & { renderAt?: (t: number) => void }).renderAt = (t: number) => draw(t, 1 / 60);

	if (still) {
		draw(0, 0);
		return;
	}
	let raf = 0;
	let last = start;
	const loop = () => {
		const now = performance.now() / 1000;
		draw(now - start, Math.min(0.05, Math.max(0.001, now - last)));
		last = now;
		raf = requestAnimationFrame(loop);
	};
	document.addEventListener('visibilitychange', () => {
		cancelAnimationFrame(raf);
		if (!document.hidden) {
			last = performance.now() / 1000;
			raf = requestAnimationFrame(loop);
		}
	});
	raf = requestAnimationFrame(loop);
}
