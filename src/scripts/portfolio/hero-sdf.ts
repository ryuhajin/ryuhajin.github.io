// Landing-page decoration: one fragment shader that draws signed-distance-field line figures in three layers.
//   1. field grid    — tiny tick segments in columns whose visibility drifts with smooth value noise, so patches of
//                      the grid fade in and out like a slow scan                                (after Stefan Vitasović)
//   2. the figure    — an SDF silhouette that morphs between shapes; its outline is repeated as a stack of offset,
//                      fading echoes that unfold during the morph and fold back when it settles   (after Tobias Ahlin)
//                      and its inside is drawn with line patterns (twisted contours, halftone, circular grids, hatching)
//   3. velocity      — the figure stretches along its velocity and R/G/B split apart; velocity comes from the morph
//                      impulse and a spring toward the pointer                                   (after Roman Jean-Elie)
// Colours come from the Thema tokens; the 8-bit theme renders on a coarse pixel grid. No libraries.

import { themas, type ShapeSet } from '../../portfolio/themes';

const BASE = { circle: 0, rbox: 1, triangle: 2, star: 3, ring: 4, cross: 5, hexagon: 6, heart: 7, blob: 8 } as const;
const PATTERN = { contours: 0, halftone: 1, polarGrid: 2, polarDots: 3, hatch: 4, moire: 5 } as const;

interface Figure {
	base: keyof typeof BASE;
	pattern: keyof typeof PATTERN;
	/** rotation added toward the centre (rad) — turns contour rings into a spiral of nested shapes */
	twist: number;
}

const PLAYLISTS: Record<ShapeSet, Figure[]> = {
	geo: [
		{ base: 'rbox', pattern: 'contours', twist: 2.4 }, // nested square spiral
		{ base: 'circle', pattern: 'halftone', twist: 0 }, // halftone sphere
		{ base: 'star', pattern: 'contours', twist: -1.2 },
		{ base: 'circle', pattern: 'polarGrid', twist: 0 }, // radar / globe
		{ base: 'hexagon', pattern: 'moire', twist: 1.6 },
		{ base: 'blob', pattern: 'polarDots', twist: 0 },
		{ base: 'triangle', pattern: 'contours', twist: 2.0 },
		{ base: 'cross', pattern: 'hatch', twist: 0.6 },
	],
	space: [
		{ base: 'circle', pattern: 'polarGrid', twist: 0 },
		{ base: 'ring', pattern: 'polarDots', twist: 0 },
		{ base: 'star', pattern: 'contours', twist: -1.4 },
		{ base: 'circle', pattern: 'halftone', twist: 0 },
		{ base: 'hexagon', pattern: 'contours', twist: 1.8 },
	],
	candy: [
		{ base: 'heart', pattern: 'contours', twist: 0.8 },
		{ base: 'circle', pattern: 'polarDots', twist: 0 },
		{ base: 'star', pattern: 'hatch', twist: 0 },
		{ base: 'rbox', pattern: 'halftone', twist: 0.4 },
		{ base: 'blob', pattern: 'moire', twist: 0 },
	],
	pixel: [
		{ base: 'rbox', pattern: 'contours', twist: 2.0 },
		{ base: 'cross', pattern: 'hatch', twist: 0 },
		{ base: 'star', pattern: 'contours', twist: -1.0 },
		{ base: 'circle', pattern: 'polarDots', twist: 0 },
		{ base: 'heart', pattern: 'halftone', twist: 0 },
	],
};

const HOLD = 3.2; // s a figure rests
const MORPH = 1.7; // s the unfold → morph → fold takes
const ECHOES = 12;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uCenter;     // px, GL coords (y up)
uniform float uR;         // figure radius, px
uniform float uRot;
uniform float uA;         // base shapes
uniform float uB;
uniform float uMix;       // 0 → A, 1 → B
uniform float uTwist;     // rad, eased between figures
uniform float uPatA;      // inner patterns (cross-faded with uMix)
uniform float uPatB;
uniform float uGap;       // px between pattern lines
uniform float uSpacing;   // px between echo copies
uniform vec2 uDir;        // echo direction
uniform vec2 uVel;        // px, stretch + channel split
uniform float uPx;        // device px per CSS px
uniform float uPixel;     // >1: pixelated (8-bit)
uniform float uGridFrom;  // x where the field grid starts, keeps the menu side quiet
uniform vec3 uLine;       // echoes + inner pattern
uniform vec3 uFront;      // front outline
uniform vec3 uGrid;       // field grid

#define ECHOES ${ECHOES}
#define TAU 6.28318530718

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float dot2(vec2 v) { return dot(v, v); }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// ---- base silhouettes (about radius 1, y up) ----
float sdCircle(vec2 p) { return length(p) - 0.95; }
float sdRBox(vec2 p) { vec2 q = abs(p) - vec2(0.8) + 0.12; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.12; }
float sdTriangle(vec2 p) {
	const float k = 1.7320508;
	float r = 0.95;
	p.y += 0.24;
	p.x = abs(p.x) - r;
	p.y = p.y + r / k;
	if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
	p.x -= clamp(p.x, -2.0 * r, 0.0);
	return -length(p) * sign(p.y);
}
float sdStar(vec2 p) {
	const vec2 k1 = vec2(0.809016994, -0.587785252);
	const vec2 k2 = vec2(-0.809016994, -0.587785252);
	float r = 1.05; float rf = 0.5;
	p.x = abs(p.x);
	p -= 2.0 * max(dot(k1, p), 0.0) * k1;
	p -= 2.0 * max(dot(k2, p), 0.0) * k2;
	p.x = abs(p.x);
	p.y -= r;
	vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
	float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
	return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
float sdRing(vec2 p) { return abs(length(p) - 0.7) - 0.25; }
float sdCross(vec2 p) {
	vec2 b = vec2(0.95, 0.34);
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
	float t = uTime * 0.6;
	float d = length(p - 0.4 * vec2(cos(t), sin(t))) - 0.52;
	d = smin(d, length(p - 0.4 * vec2(cos(t + 2.094), sin(t + 2.094))) - 0.48, 0.4);
	d = smin(d, length(p - 0.4 * vec2(cos(t + 4.189), sin(t + 4.189))) - 0.44, 0.4);
	return d;
}
float base(vec2 p, float id) {
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

// figure frame (rotation only) — the silhouette, its echoes and the inside test use this
vec2 frame(vec2 p) { return rot(uRot) * p; }
float sdf(vec2 q) { return mix(base(q / uR, uA), base(q / uR, uB), uMix) * uR; }
float scene(vec2 p) { return sdf(frame(p)); }
// the same field with a twist that grows toward the centre: its iso-lines become a spiral of nested shapes
float sceneTwist(vec2 q) {
	float r = clamp(length(q) / uR, 0.0, 1.0);
	return sdf(rot(uTwist * (1.0 - r) * (1.0 - r)) * q);
}

vec2 stretch(vec2 p) {
	float v = length(uVel);
	if (v < 0.001) return p;
	vec2 n = uVel / v;
	float s = clamp(v * 0.012, 0.0, 0.55);
	return p - n * dot(p, n) * (s / (1.0 + s));
}

float lineAt(float dist, float hw, float aa) { return 1.0 - smoothstep(hw, hw + aa, dist); }

// ---- inner line patterns: p in figure frame (px), d = SDF (px, < 0 inside) ----
float pattern(float id, vec2 p, float d, float hw, float aa) {
	float g = uGap;
	float t = uTime;
	if (id < 0.5) { // contours: iso-lines of the twisted SDF, drifting inward
		float v = abs(fract(sceneTwist(p) / g + t * 0.12) - 0.5) * g;
		return lineAt(v, hw, aa);
	}
	if (id < 1.5) { // halftone: dots on a square grid, size from depth + a light from the upper left
		float cs = g * 1.15;
		vec2 c = (floor(p / cs) + 0.5) * cs;
		float depth = clamp(-sdf(c) / (uR * 0.75), 0.0, 1.0);
		vec2 n = c / uR;
		float light = clamp(0.55 + 0.6 * dot(normalize(n + 1e-4), vec2(-0.6, 0.55)) * length(n), 0.0, 1.0);
		float r = cs * 0.48 * sqrt(depth) * mix(0.25, 1.0, light) * (0.9 + 0.1 * sin(t * 1.4 + c.x * 0.02));
		return lineAt(length(p - c) - r, 0.0, aa);
	}
	float r = length(p);
	float a = atan(p.y, p.x);
	if (id < 2.5) { // polar grid: rings + 24 spokes, rings drift outward
		float ring = abs(fract(r / g - t * 0.1) - 0.5) * g;
		float spoke = abs(fract((a + t * 0.05) / TAU * 24.0) - 0.5) * (TAU / 24.0) * r;
		return max(lineAt(ring, hw, aa), lineAt(spoke, hw * 0.8, aa) * step(g, r));
	}
	if (id < 3.5) { // circular dot grid: dots on rings, alternate rings turn opposite ways
		float k = floor(r / g);
		float rc = (k + 0.5) * g;
		float n = max(6.0, floor(TAU * rc / g));
		float dirK = mod(k, 2.0) * 2.0 - 1.0;
		float ang = a + dirK * t * 0.12;
		float cell = floor(ang / TAU * n);
		float ca = (cell + 0.5) / n * TAU - dirK * t * 0.12;
		vec2 c = rc * vec2(cos(ca), sin(ca));
		return lineAt(length(p - c) - g * 0.2, 0.0, aa);
	}
	if (id < 4.5) { // cross hatching, slowly sliding
		float h1 = abs(fract(dot(p, vec2(0.7071, 0.7071)) / g + t * 0.08) - 0.5) * g;
		float h2 = abs(fract(dot(p, vec2(0.7071, -0.7071)) / (g * 1.6) - t * 0.05) - 0.5) * g * 1.6;
		return max(lineAt(h1, hw, aa), lineAt(h2, hw * 0.7, aa) * 0.6);
	}
	// moire: contours of the figure against rings from a wandering centre
	vec2 o = uR * 0.18 * vec2(cos(t * 0.3), sin(t * 0.37));
	float v1 = abs(fract(sceneTwist(p) / g) - 0.5) * g;
	float v2 = abs(fract(length(p - o) / (g * 0.92)) - 0.5) * g * 0.92;
	return max(lineAt(v1, hw, aa), lineAt(v2, hw, aa) * 0.8);
}

// one colour channel of the figure: (front outline, echoes + inner pattern)
vec2 figure(vec2 p, float hw, float aa) {
	float reach = float(ECHOES) * uSpacing + hw + aa + 2.0;
	float d0 = scene(p);
	float front = lineAt(abs(d0), hw * 1.4, aa);
	float rest = 0.0;
	if (abs(d0) < reach) { // Lipschitz bound: no echo can be near otherwise
		for (int i = 1; i < ECHOES; i++) {
			float fi = float(i);
			float d = scene(p - uDir * fi * uSpacing);
			rest = max(rest, lineAt(abs(d), hw, aa) * pow(1.0 - fi / float(ECHOES), 1.6));
		}
	}
	if (d0 < 0.0) {
		vec2 q = frame(p);
		float inner = 1.0 - smoothstep(-uGap * 1.2, -uGap * 0.3, d0); // keep a clear margin inside the outline
		float pa = pattern(uPatA, q, d0, hw, aa);
		float pb = pattern(uPatB, q, d0, hw, aa);
		rest = max(rest, mix(pa, pb, uMix) * inner * 0.85);
	}
	return vec2(front, rest);
}

void main() {
	vec2 fc = gl_FragCoord.xy;
	bool pixel = uPixel > 1.5;
	if (pixel) fc = (floor(fc / uPixel) + 0.5) * uPixel;
	float hw = 0.55 * uPx;
	float aa = pixel ? 0.2 : 1.0;
	vec2 p = stretch(fc - uCenter);

	// ---- figure, channel-split by velocity ----
	vec2 split = clamp(uVel * 0.35, vec2(-14.0 * uPx), vec2(14.0 * uPx));
	vec2 eR = figure(p + split, hw, aa);
	vec2 eG = figure(p, hw, aa);
	vec2 eB = figure(p - split, hw, aa);
	vec3 front = vec3(eR.x, eG.x, eB.x);
	vec3 rest = vec3(eR.y, eG.y, eB.y);
	vec3 lineA = front + rest * (1.0 - front);
	vec3 lineC = uFront * front + uLine * rest * (1.0 - front);

	// ---- field grid (outside the figure): ticks whose visibility drifts with value noise ----
	vec2 cs = (pixel ? vec2(uPixel * 3.0) : vec2(9.0, 13.0) * uPx);
	vec2 cell = floor(fc / cs);
	vec2 f = fract(fc / cs) - 0.5;
	float n = vnoise(cell * vec2(0.11, 0.07) + vec2(uTime * 0.05, -uTime * 0.18));
	float jitter = hash(cell + floor(uTime * 0.7 + hash(cell) * 5.0)) * 0.12;
	float on = smoothstep(0.62, 0.78, n + jitter);
	float major = (mod(cell.x, 8.0) < 0.5 || mod(cell.y, 6.0) < 0.5) ? 1.0 : 0.0;
	// 8-bit: one pixel per cell (the centre one), otherwise a short vertical tick
	float tick = pixel ? step(max(abs(f.x), abs(f.y)), 0.2) : step(abs(f.x + 0.3), 0.06) * step(abs(f.y), 0.3);
	float dot0 = pixel ? 0.0 : step(length(f * cs), 0.75 * uPx);
	float fieldFade = smoothstep(uGridFrom, uGridFrom + uRes.x * 0.25, fc.x);
	float outside = smoothstep(0.0, 24.0 * uPx, scene(p));
	float gridA = max(tick * on * 0.5, dot0 * major * 0.28) * fieldFade * outside;

	float alpha = max(max(lineA.r, lineA.g), lineA.b);
	vec3 col = lineC + uGrid * gridA * (1.0 - alpha);
	alpha = alpha + gridA * (1.0 - alpha);
	gl_FragColor = vec4(col, alpha);
}
`;

interface Palette {
	line: number[];
	front: number[];
	grid: number[];
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
		grid: v('--fg-2'),
		set: themas.find((t) => t.id === id)?.shapes ?? 'geo',
	};
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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
	const names = ['uRes', 'uTime', 'uCenter', 'uR', 'uRot', 'uA', 'uB', 'uMix', 'uTwist', 'uPatA', 'uPatB', 'uGap', 'uSpacing', 'uDir', 'uVel', 'uPx', 'uPixel', 'uGridFrom', 'uLine', 'uFront', 'uGrid'] as const;
	const u = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<(typeof names)[number], WebGLUniformLocation | null>;

	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
	let palette = readPalette(probe);
	let playlist = PLAYLISTS[palette.set];

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

	// pointer spring: the figure leans toward the pointer; its velocity feeds stretch + channel split
	const pointer = { x: 0, y: 0, active: false };
	window.addEventListener('pointermove', (e) => {
		const rect = canvas.getBoundingClientRect();
		pointer.x = (e.clientX - rect.left) * dpr;
		pointer.y = (rect.bottom - e.clientY) * dpr; // GL y up
		pointer.active = true;
	});
	const lean = { x: 0, y: 0, vx: 0, vy: 0 };

	const start = performance.now() / 1000;
	// echo direction per morph: toward the upper left (the figure sits in the lower-right corner), turning only
	// while the stack is unfolded
	const angleFor = (k: number) => Math.PI * 0.8 + Math.sin(k * 1.7) * 0.55;

	// t: seconds since start, dt: seconds since the previous frame
	const draw = (t: number, dt: number) => {
		const cycle = HOLD + MORPH;
		const k = still ? 0 : Math.floor(t / cycle);
		const m = still ? 0 : clamp01((t - k * cycle - HOLD) / MORPH); // 0..1 during the morph
		const A = playlist[k % playlist.length];
		const B = playlist[(k + 1) % playlist.length];
		const bump = Math.sin(Math.PI * m);
		const mixT = ease(clamp01((m - 0.18) / 0.64));
		const angle = angleFor(k) + (angleFor(k + 1) - angleFor(k)) * ease(m);
		const dir = [Math.cos(angle), Math.sin(angle)];

		// the same footprint as the old SVG decoration: clamp(320px, min(70vh, 44vw), 640px),
		// pushed 30% past the right and bottom edges of the stage
		const vh = window.innerHeight;
		const vw = window.innerWidth;
		const hs = Math.min(640, Math.max(320, Math.min(vh * 0.7, vw * 0.44))) * dpr;
		const R = hs * 0.5;
		const cx = W - hs * 0.2 + Math.sin(t * 0.23) * 10 * dpr;
		const cy = hs * 0.2 + Math.cos(t * 0.31) * 8 * dpr;
		if (!still) {
			const tx = pointer.active ? Math.max(-1, Math.min(1, (pointer.x - cx) / (W * 0.5))) * 40 * dpr : 0;
			const ty = pointer.active ? Math.max(-1, Math.min(1, (pointer.y - cy) / (H * 0.5))) * 28 * dpr : 0;
			lean.vx += ((tx - lean.x) * 90 - lean.vx * 11) * dt;
			lean.vy += ((ty - lean.y) * 90 - lean.vy * 11) * dt;
			lean.x += lean.vx * dt;
			lean.y += lean.vy * dt;
		}
		const morphV = m > 0 && m < 1 ? Math.cos(Math.PI * m) * 24 * dpr : 0;
		const vel = [lean.vx * 0.05 + dir[0] * morphV, lean.vy * 0.05 + dir[1] * morphV];

		gl.uniform2f(u.uRes, W, H);
		gl.uniform1f(u.uTime, still ? 0 : t);
		gl.uniform2f(u.uCenter, cx + lean.x, cy + lean.y);
		gl.uniform1f(u.uR, R);
		gl.uniform1f(u.uRot, still ? 0 : t * 0.05 + ease(m) * 0.6 + k * 0.6);
		gl.uniform1f(u.uA, BASE[A.base]);
		gl.uniform1f(u.uB, BASE[B.base]);
		gl.uniform1f(u.uMix, mixT);
		gl.uniform1f(u.uTwist, A.twist + (B.twist - A.twist) * mixT);
		gl.uniform1f(u.uPatA, PATTERN[A.pattern]);
		gl.uniform1f(u.uPatB, PATTERN[B.pattern]);
		gl.uniform1f(u.uGap, (palette.set === 'pixel' ? 16 : 13) * dpr);
		gl.uniform1f(u.uSpacing, (3 + bump * 10) * dpr);
		gl.uniform2f(u.uDir, dir[0], dir[1]);
		gl.uniform2f(u.uVel, vel[0], vel[1]);
		gl.uniform1f(u.uPx, dpr);
		gl.uniform1f(u.uPixel, palette.set === 'pixel' ? Math.round(4 * dpr) : 1);
		gl.uniform1f(u.uGridFrom, W * 0.34);
		gl.uniform3fv(u.uLine, palette.line);
		gl.uniform3fv(u.uFront, palette.front);
		gl.uniform3fv(u.uGrid, palette.grid);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};

	document.addEventListener('thema-change', () => {
		palette = readPalette(probe);
		playlist = PLAYLISTS[palette.set];
		if (still) draw(0, 0);
	});

	// test hook: render a given moment without the animation loop (hidden tabs pause rAF)
	(canvas as HTMLCanvasElement & { renderAt?: (t: number) => string }).renderAt = (t: number) => {
		draw(t, 1 / 60);
		return canvas.toDataURL();
	};

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
