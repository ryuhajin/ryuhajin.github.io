// Landing-page decoration: line figures drawn as distance fields, in two passes.
//   1. glyph grid    — a fine lattice of tiny marks ( | ▌ ▯ [ : ) in blocks, seen only through soft noise blots
//                      that drift across the right side; the marks flicker in and out    (after Stefan Vitasović)
//   2. the scene     — alternates between three kinds of composition:
//                        · one large line figure (square spiral, wireframe globe, halftone sphere, roses, orbits,
//                          ray burst, hexagon spiral, ripples), cut off by the lower-right edges
//                        · "overlap": translucent planes, a circle, long lines and an arc passing through each other
//                        · "scatter": a dozen small figures placed at random, drifting
//                      one scene morphs into the next by blending their distance fields; the lines are repeated as
//                      a stack of offset, fading echoes that unfold during the morph and fold back when it settles
//                                                                                              (after Tobias Ahlin)
//   3. velocity      — the figure stretches along its velocity and R/G/B split apart; velocity comes from the morph
//                      impulse and a spring toward the pointer                                (after Roman Jean-Elie)
// Colours come from the Thema tokens; the 8-bit theme renders on a coarse pixel grid. No libraries.
//
// Performance: the distance field is evaluated once per pixel (pass 1 → texture). Echoes are translated copies and the
// channel split is an offset, so pass 2 builds both from texture reads instead of re-evaluating the field — this keeps
// the shaders small (Windows compiles WebGL through Direct3D, which unrolls every loop and inlines every call) and the
// per-pixel cost flat. Shaders compile in the background where KHR_parallel_shader_compile exists, and the buffer
// scale drops if frames run slow.

import { themas, type ShapeSet } from '../../portfolio/themes';

const FIGURES = { squares: 0, globe: 1, halftone: 2, rose: 3, orbits: 4, burst: 5, hexes: 6, ripple: 7, overlap: 8, scatter: 9 } as const;
type FigureName = keyof typeof FIGURES;

const PLAYLISTS: Record<ShapeSet, FigureName[]> = {
	geo: ['squares', 'overlap', 'globe', 'scatter', 'halftone', 'overlap', 'rose', 'scatter', 'hexes', 'burst', 'overlap', 'ripple', 'scatter'],
	space: ['orbits', 'scatter', 'globe', 'overlap', 'burst', 'scatter', 'halftone', 'overlap', 'ripple'],
	candy: ['rose', 'scatter', 'ripple', 'overlap', 'halftone', 'scatter', 'hexes', 'overlap', 'orbits'],
	pixel: ['squares', 'scatter', 'burst', 'overlap', 'globe', 'scatter', 'halftone', 'overlap', 'hexes'],
};

const HOLD = 3.2; // s a figure rests
const MORPH = 1.7; // s the unfold → morph → fold takes
const ECHOES = 12;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const COMMON = `precision highp float;
#define TAU 6.28318530718
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
	vec2 i = floor(p), f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float lineAt(float dist, float hw, float aa) { return 1.0 - smoothstep(hw, hw + aa, dist); }
`;

const FIGURE_FRAG = `
${COMMON}
uniform float uTime;
uniform vec2 uCenter;     // px, GL coords (y up)
uniform float uR;         // figure radius, px
uniform float uRot;
uniform float uA;         // figures
uniform float uB;
uniform float uMix;       // 0 → A, 1 → B
uniform float uSeedA;     // per-appearance seed (scatter layout, overlap mirroring)
uniform float uSeedB;
uniform vec2 uCompC;      // px, centre of the overlap / scatter compositions
uniform float uU;         // px per composition unit
uniform vec2 uVel;        // px, stretch
uniform float uPx;        // buffer px per CSS px
uniform float uPixel;     // >1: pixelated (8-bit)

// ---- line figures: distance to the ink in figure units (radius ≈ 1), <= 0 on the ink ----
float sdBox(vec2 p, vec2 b) { vec2 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
float sdHex(vec2 p, float r) {
	const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
	p = abs(p);
	p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
	p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
	return length(p) * sign(p.y);
}
// distance to an ellipse outline (first-order: |f| / |grad f|), good enough for hairlines
float ellipse(vec2 p, vec2 ab) {
	ab = max(ab, vec2(0.002));
	float k0 = length(p / ab);
	float k1 = length(p / (ab * ab));
	return abs(k0 * (k0 - 1.0) / max(k1, 0.0001));
}
// rhodonea r = R|cos(k a)|, same first-order distance
float rose(vec2 p, float k, float R, float ph) {
	float r = max(length(p), 0.001);
	float a = atan(p.y, p.x) + ph;
	float c = cos(k * a);
	float g = R * k * sin(k * a) * sign(c) / r;
	return abs(r - R * abs(c)) / sqrt(1.0 + g * g);
}

float figSquares(vec2 p) { // nested squares, each turned 6° and 8.5% smaller
	float d = 1e3;
	float s = 0.8;
	for (int i = 0; i < 18; i++) {
		d = min(d, abs(sdBox(rot(float(i) * 0.105) * p, vec2(s))));
		s *= 0.915;
	}
	return d;
}
float figHexes(vec2 p) { // hexagon spiral
	float d = 1e3;
	float s = 0.9;
	for (int i = 0; i < 14; i++) {
		d = min(d, abs(sdHex(rot(float(i) * -0.13) * p, s)));
		s *= 0.89;
	}
	return d;
}
float figGlobe(vec2 p) { // wireframe globe: outline, 7 latitudes, 6 turning longitudes
	float d = abs(length(p) - 0.95);
	for (int i = 1; i < 8; i++) {
		float phi = float(i) / 8.0 * 3.14159265 - 1.5707963;
		float c = cos(phi);
		d = min(d, ellipse(p - vec2(0.0, sin(phi) * 0.95), vec2(c * 0.95, c * 0.15)));
	}
	for (int i = 0; i < 6; i++) {
		float th = float(i) / 6.0 * 3.14159265 + uTime * 0.25;
		d = min(d, ellipse(p, vec2(abs(cos(th)) * 0.95, 0.95)));
	}
	return d;
}
float figHalftone(vec2 p) { // dots whose size follows lambert shading, light from the upper left
	float g = 0.072;
	vec2 c = (floor(p / g) + 0.5) * g;
	float r2 = dot(c, c) / 0.9025;
	if (r2 > 1.0) return 1.0;
	vec3 n = vec3(c / 0.95, sqrt(1.0 - r2));
	float lam = clamp(dot(n, normalize(vec3(-0.5, 0.55, 0.65))), 0.0, 1.0);
	return length(p - c) - g * 0.5 * (0.1 + 0.9 * pow(lam, 1.2));
}
float figRose(vec2 p) {
	return min(rose(p, 3.0, 0.95, uTime * 0.08), min(rose(p, 5.0, 0.6, -uTime * 0.12), abs(length(p) - 0.95)));
}
float figOrbits(vec2 p) { // planet + three tilted orbits with satellites
	float d = abs(length(p) - 0.3);
	for (int i = 0; i < 3; i++) {
		vec2 q = rot(float(i) * 1.0472 + 0.35) * p;
		d = min(d, ellipse(q, vec2(0.95, 0.27)));
		float s = uTime * (0.45 + 0.15 * float(i)) + float(i) * 2.1;
		d = min(d, length(q - vec2(cos(s) * 0.95, sin(s) * 0.27)) - 0.035);
	}
	return d;
}
float figBurst(vec2 p) { // 48 rays of varying length around a small ring
	float a = atan(p.y, p.x);
	float cell = floor(a / TAU * 48.0 + 0.5);
	float ca = cell / 48.0 * TAU;
	vec2 dir = vec2(cos(ca), sin(ca));
	float len = 0.45 + 0.5 * hash(vec2(cell, 3.0));
	float d = length(p - dir * clamp(dot(p, dir), 0.2, len));
	return min(d, abs(length(p) - 0.14));
}
float figRipple(vec2 p) { // two interfering sets of rings inside a disc
	float r = length(p);
	vec2 o = vec2(0.2 * cos(uTime * 0.3), 0.14 * sin(uTime * 0.37));
	float g = 0.085;
	float d = min(abs(fract(r / g - uTime * 0.05) - 0.5) * g, abs(fract(length(p - o) / (g * 0.93)) - 0.5) * g * 0.93);
	return min(max(d, r - 0.95), abs(r - 0.95));
}
float figure(vec2 p, float id) {
	if (id < 0.5) return figSquares(p);
	if (id < 1.5) return figGlobe(p);
	if (id < 2.5) return figHalftone(p);
	if (id < 3.5) return figRose(p);
	if (id < 4.5) return figOrbits(p);
	if (id < 5.5) return figBurst(p);
	if (id < 6.5) return figHexes(p);
	return figRipple(p);
}

vec2 stretch(vec2 p) {
	float v = length(uVel);
	if (v < 0.001) return p;
	vec2 n = uVel / v;
	float s = clamp(v * 0.012, 0.0, 0.55);
	return p - n * dot(p, n) * (s / (1.0 + s));
}

float sdSeg(vec2 p, vec2 a, vec2 b) {
	vec2 pa = p - a, ba = b - a;
	return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}
float inside(float d, float soft) { return 1.0 - smoothstep(-soft, soft, d); }

// translucent planes, a circle with a line running out of it, long lines and an arc, all passing through each other
float compOverlap(vec2 p, float seed, float soft, out float fill) {
	float t = uTime;
	float h = hash(vec2(seed, 7.0));
	p.x *= h > 0.5 ? -1.0 : 1.0;                     // mirrored on every other appearance
	p = rot((h - 0.5) * 0.5) * p;
	vec2 c1 = vec2(-0.38 + 0.07 * sin(t * 0.37), 0.18);
	float r1 = sdBox(rot(0.1 + 0.05 * sin(t * 0.29)) * (p - c1), vec2(0.64, 0.38));
	vec2 c2 = vec2(0.3, -0.06 + 0.07 * cos(t * 0.33));
	float r2 = sdBox(rot(-0.24) * (p - c2), vec2(0.4, 0.62));
	fill = 0.5 * inside(r1, soft) + 0.5 * inside(r2, soft); // overlap = two layers
	float d = min(abs(r1), abs(r2));
	vec2 cc = vec2(0.04 + 0.09 * sin(t * 0.5), 0.3);
	d = min(d, abs(length(p - cc) - 0.2));
	d = min(d, sdSeg(p, cc + vec2(0.2, 0.0), vec2(1.05, 0.3)));
	d = min(d, sdSeg(p, vec2(1.05, 0.3), vec2(1.55, -0.28)));
	d = min(d, sdSeg(p, vec2(-1.35, -0.52), vec2(1.55, -0.74 + 0.06 * sin(t * 0.6))));
	d = min(d, sdSeg(p, vec2(-0.25, -0.95), vec2(0.45, 1.05)));
	float arc = abs(length(p - vec2(0.25, -0.35)) - 1.12);
	d = min(d, p.y > 0.5 ? arc : 1e3);                // only the upper stretch of the arc
	return d;
}

// a dozen small figures at random places, drifting and turning
float compScatter(vec2 p, float seed, float soft, out float fill) {
	float t = uTime;
	float d = 1e3;
	fill = 0.0;
	for (int i = 0; i < 12; i++) {
		float fi = float(i);
		vec2 h = vec2(hash(vec2(fi, seed)), hash(vec2(fi * 1.7 + 3.0, seed)));
		float h2 = hash(vec2(fi * 2.3 + 9.0, seed));
		vec2 pos = vec2(mix(-1.15, 1.25, h.x), mix(-0.85, 0.85, h.y)) + 0.035 * vec2(sin(t * 0.7 + fi), cos(t * 0.6 + fi * 1.3));
		float sz = 0.07 + 0.09 * h2;
		vec2 q = rot(t * (h.x - 0.5) * 0.6 + fi) * (p - pos) / sz;
		float kind = floor(hash(vec2(fi * 3.1 + 1.0, seed)) * 6.0);
		float k;
		if (kind < 0.5) k = abs(length(q) - 1.0);                                           // circle
		else if (kind < 1.5) k = abs(sdBox(q, vec2(0.85)));                                 // square
		else if (kind < 2.5) k = abs(max(abs(q.x) * 0.866 + q.y * 0.5, -q.y) - 0.5);        // triangle
		else if (kind < 3.5) k = min(sdBox(q, vec2(1.0, 0.08)), sdBox(q, vec2(0.08, 1.0))); // plus
		else if (kind < 4.5) k = min(abs(length(q) - 1.0), abs(length(q) - 0.55));          // double ring
		else { float b = sdBox(q, vec2(0.8)); k = abs(b); fill = max(fill, inside(b * sz, soft)); } // translucent square
		d = min(d, k * sz);
	}
	return d;
}

// one scene: distance to the ink in px, plus a translucent fill (0..1)
float scene(float id, float seed, vec2 fc, out float fill) {
	fill = 0.0;
	float soft = 1.0 / uU;
	if (id < 7.5) {
		vec2 q = rot(uRot) * stretch(fc - uCenter) / uR;
		return figure(q, id) * uR;
	}
	vec2 pc = stretch(fc - uCompC) / uU;
	if (id < 8.5) return compOverlap(pc, seed, soft, fill) * uU;
	return compScatter(pc, seed, soft, fill) * uU;
}

// pass 1: r = ink, g = translucent fill
void main() {
	vec2 fc = gl_FragCoord.xy;
	bool pixel = uPixel > 1.5;
	if (pixel) fc = (floor(fc / uPixel) + 0.5) * uPixel;
	float hw = 0.6 * uPx;
	float aa = pixel ? 0.2 : 1.0;
	float fill;
	float d = scene(uA, uSeedA, fc, fill);
	if (uMix > 0.001) { // blending the two fields is the morph
		float fillB;
		float dB = scene(uB, uSeedB, fc, fillB);
		d = mix(d, dB, uMix);
		fill = mix(fill, fillB, uMix);
	}
	gl_FragColor = vec4(lineAt(max(d, 0.0), hw, aa), fill, 0.0, 1.0);
}
`;

const COMPOSITE_FRAG = `
${COMMON}
uniform sampler2D uFig;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpacing;   // px between echo copies
uniform vec2 uDir;        // echo direction
uniform vec2 uSplit;      // px, R/B channel offset
uniform float uPx;
uniform float uPixel;
uniform float uGridFrom;  // x where the glyph grid starts, keeps the menu side quiet
uniform vec3 uLine;       // figure + echoes
uniform vec3 uFill;       // translucent planes
uniform vec3 uGrid;       // glyph grid

#define ECHOES ${ECHOES}

float ink(vec2 fc) {
	vec2 uv = fc / uRes;
	if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
	return texture2D(uFig, uv).r;
}
// the figure plus its echo stack, seen from one sample point
float stack(vec2 fc) {
	float a = ink(fc);
	for (int i = 1; i < ECHOES; i++) {
		float fi = float(i);
		a = max(a, ink(fc - uDir * fi * uSpacing) * 0.8 * pow(1.0 - fi / float(ECHOES), 1.6));
	}
	return a;
}

// one glyph in a cell (f in 0..1): thin bar, thick bar, box, bracket or colon
float glyph(vec2 f, float g) {
	float bar = step(abs(f.y - 0.5), 0.36);
	if (g < 0.3) return step(abs(f.x - 0.5), 0.1) * bar;
	if (g < 0.5) return step(abs(f.x - 0.5), 0.26) * bar;
	if (g < 0.7) {
		vec2 c = abs(f - 0.5);
		return step(max(c.x / 0.34, c.y / 0.4), 1.0) * (1.0 - step(max(c.x / 0.16, c.y / 0.26), 1.0));
	}
	if (g < 0.85) return max(step(abs(f.x - 0.3), 0.09) * bar, step(abs(f.y - 0.5), 0.36) * step(abs(abs(f.y - 0.5) - 0.32), 0.05) * step(f.x, 0.62) * step(0.22, f.x));
	return step(abs(f.x - 0.5), 0.12) * step(abs(abs(f.y - 0.5) - 0.2), 0.1);
}

void main() {
	vec2 fc = gl_FragCoord.xy;
	bool pixel = uPixel > 1.5;
	if (pixel) fc = (floor(fc / uPixel) + 0.5) * uPixel;

	// figure + echoes, channel-split by velocity (only paid for while something moves)
	float g = stack(fc);
	vec3 lineA = vec3(g);
	if (dot(uSplit, uSplit) > 0.25) lineA = vec3(stack(fc + uSplit), g, stack(fc - uSplit));

	// glyph grid: blocks of fine cells, visible only through soft noise blots that drift; marks flicker
	float t = uTime;
	vec2 cs = pixel ? vec2(uPixel * 2.0) : vec2(6.0, 9.0) * uPx;
	vec2 cell = floor(fc / cs);
	vec2 f = fract(fc / cs);
	vec2 inBlock = mod(cell, vec2(22.0, 9.0));
	float open = step(inBlock.x, 19.5) * step(inBlock.y, 7.5);          // gutters between blocks
	vec2 cc = (cell + 0.5) * cs / uPx;                                    // cell centre in CSS px
	float n = vnoise(cc / 190.0 + vec2(t * 0.035, -t * 0.02)) * 0.7 + vnoise(cc / 70.0 - vec2(t * 0.05, 0.0)) * 0.3;
	float blot = smoothstep(0.54, 0.7, n);                                // the mask: soft blobs of grid
	float flick = hash(cell + floor(t * 7.0 + hash(cell) * 9.0));
	float on = step(flick, 0.25 + 0.55 * blot) * open * step(0.02, blot);
	float mark = pixel ? 1.0 : glyph(f, hash(cell * 1.37 + 5.1));
	float fieldFade = smoothstep(uGridFrom, uGridFrom + uRes.x * 0.22, fc.x);
	float gridA = on * mark * blot * 0.5 * fieldFade;

	// translucent planes under the lines
	vec2 uv = fc / uRes;
	float fillA = texture2D(uFig, uv).g * 0.14;

	float alpha = max(max(lineA.r, lineA.g), lineA.b);
	vec3 col = uLine * lineA + uFill * fillA * (1.0 - alpha);
	alpha = alpha + fillA * (1.0 - alpha);
	col += uGrid * gridA * (1.0 - alpha);
	alpha = alpha + gridA * (1.0 - alpha);
	gl_FragColor = vec4(col, alpha);
}
`;

interface Palette {
	line: number[];
	fill: number[];
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
		fill: v('--shape'),
		grid: v('--fg-2'),
		set: themas.find((t) => t.id === id)?.shapes ?? 'geo',
	};
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));


type Uniforms<T extends string> = Record<T, WebGLUniformLocation | null>;

export function initHeroSdf() {
	const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-sdf]');
	if (!canvas) return;
	const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true, powerPreference: 'low-power' });
	if (!gl) return; // decoration only — without WebGL the stage simply stays empty

	// compile both programs; with KHR_parallel_shader_compile the driver works in the background and we poll
	const parallel = gl.getExtension('KHR_parallel_shader_compile');
	const build = (fs: string) => {
		const prog = gl.createProgram()!;
		for (const [type, text] of [
			[gl.VERTEX_SHADER, VERT],
			[gl.FRAGMENT_SHADER, fs],
		] as const) {
			const s = gl.createShader(type)!;
			gl.shaderSource(s, text);
			gl.compileShader(s);
			gl.attachShader(prog, s);
		}
		gl.linkProgram(prog);
		return prog;
	};
	const figureProg = build(FIGURE_FRAG);
	const compositeProg = build(COMPOSITE_FRAG);
	const ready = () => !parallel || [figureProg, compositeProg].every((pr) => gl.getProgramParameter(pr, parallel.COMPLETION_STATUS_KHR));
	const linked = () => {
		for (const pr of [figureProg, compositeProg]) {
			if (gl.getProgramParameter(pr, gl.LINK_STATUS)) continue;
			console.warn('[hero-sdf]', gl.getProgramInfoLog(pr), ...gl.getAttachedShaders(pr)!.map((s) => gl.getShaderInfoLog(s)));
			return false;
		}
		return true;
	};

	const tri = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, tri);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

	const figNames = ['uTime', 'uCenter', 'uR', 'uRot', 'uA', 'uB', 'uMix', 'uSeedA', 'uSeedB', 'uCompC', 'uU', 'uVel', 'uPx', 'uPixel'] as const;
	const compNames = ['uFig', 'uRes', 'uTime', 'uSpacing', 'uDir', 'uSplit', 'uPx', 'uPixel', 'uGridFrom', 'uLine', 'uFill', 'uGrid'] as const;
	let uf: Uniforms<(typeof figNames)[number]>;
	let uc: Uniforms<(typeof compNames)[number]>;
	const locate = <T extends string>(prog: WebGLProgram, names: readonly T[]) =>
		Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)])) as Uniforms<T>;

	// offscreen target for pass 1
	const tex = gl.createTexture();
	const fbo = gl.createFramebuffer();

	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
	let palette = readPalette(probe);
	let playlist = PLAYLISTS[palette.set];

	// size: buffer follows the element; device-pixel ratio capped, and scaled down further if frames run slow
	let dpr = 1;
	let quality = 1;
	let W = 1;
	let H = 1;
	const resize = () => {
		const rect = canvas.getBoundingClientRect();
		dpr = Math.min(window.devicePixelRatio || 1, 1.25) * quality;
		W = Math.max(1, Math.round(rect.width * dpr));
		H = Math.max(1, Math.round(rect.height * dpr));
		canvas.width = W;
		canvas.height = H;
		const filter = palette.set === 'pixel' ? gl.NEAREST : gl.LINEAR;
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	};
	resize();

	// pointer spring: the figure leans toward the pointer; its velocity feeds stretch + channel split
	const pointer = { x: 0, y: 0, active: false };
	window.addEventListener('pointermove', (e) => {
		const rect = canvas.getBoundingClientRect();
		pointer.x = (e.clientX - rect.left) * dpr;
		pointer.y = (rect.bottom - e.clientY) * dpr; // GL y up
		pointer.active = true;
	});
	const lean = { x: 0, y: 0, vx: 0, vy: 0 };

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
		const hs = Math.min(640, Math.max(320, Math.min(window.innerHeight * 0.7, window.innerWidth * 0.44))) * dpr;
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
		const lim = 14 * dpr;
		const split = vel.map((v) => Math.max(-lim, Math.min(lim, v * 0.35)));
		const pixelSize = palette.set === 'pixel' ? Math.max(2, Math.round(4 * dpr)) : 1;

		gl.bindBuffer(gl.ARRAY_BUFFER, tri);

		// pass 1: the figure → texture
		gl.useProgram(figureProg);
		const a1 = gl.getAttribLocation(figureProg, 'aPos');
		gl.enableVertexAttribArray(a1);
		gl.vertexAttribPointer(a1, 2, gl.FLOAT, false, 0, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		gl.viewport(0, 0, W, H);
		gl.uniform1f(uf.uTime, still ? 0 : t);
		gl.uniform2f(uf.uCenter, cx + lean.x, cy + lean.y);
		gl.uniform1f(uf.uR, R);
		gl.uniform1f(uf.uRot, still ? 0 : t * 0.05 + ease(m) * 0.6 + k * 0.6);
		gl.uniform1f(uf.uA, FIGURES[A]);
		gl.uniform1f(uf.uB, FIGURES[B]);
		gl.uniform1f(uf.uMix, mixT);
		gl.uniform1f(uf.uSeedA, k % 97);
		gl.uniform1f(uf.uSeedB, (k + 1) % 97);
		// compositions sit further in than the big figure: right of the menu, clear of the bottom bar
		gl.uniform2f(uf.uCompC, W * 0.68, H * 0.5);
		gl.uniform1f(uf.uU, Math.min(W * 0.24, H * 0.42));
		gl.uniform2f(uf.uVel, vel[0], vel[1]);
		gl.uniform1f(uf.uPx, dpr);
		gl.uniform1f(uf.uPixel, pixelSize);
		gl.drawArrays(gl.TRIANGLES, 0, 3);

		// pass 2: echoes, channel split, field grid → screen
		gl.useProgram(compositeProg);
		const a2 = gl.getAttribLocation(compositeProg, 'aPos');
		gl.enableVertexAttribArray(a2);
		gl.vertexAttribPointer(a2, 2, gl.FLOAT, false, 0, 0);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, W, H);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.uniform1i(uc.uFig, 0);
		gl.uniform2f(uc.uRes, W, H);
		gl.uniform1f(uc.uTime, still ? 0 : t);
		gl.uniform1f(uc.uSpacing, (3 + bump * 10) * dpr);
		gl.uniform2f(uc.uDir, dir[0], dir[1]);
		gl.uniform2f(uc.uSplit, split[0], split[1]);
		gl.uniform1f(uc.uPx, dpr);
		gl.uniform1f(uc.uPixel, pixelSize);
		gl.uniform1f(uc.uGridFrom, W * 0.34);
		gl.uniform3fv(uc.uLine, palette.line);
		gl.uniform3fv(uc.uFill, palette.fill);
		gl.uniform3fv(uc.uGrid, palette.grid);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};

	let started = false;
	const begin = () => {
		if (!linked()) return;
		uf = locate(figureProg, figNames);
		uc = locate(compositeProg, compNames);
		started = true;
		new ResizeObserver(() => {
			resize();
			if (still) draw(0, 0);
		}).observe(canvas);
		document.addEventListener('thema-change', () => {
			palette = readPalette(probe);
			playlist = PLAYLISTS[palette.set];
			resize(); // texture filtering differs for the 8-bit theme
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
		const start = performance.now() / 1000;
		let last = start;
		let raf = 0;
		// frame-time watchdog: if the average frame is slow, render fewer pixels (down to 60% per axis)
		let acc = 0;
		let frames = 0;
		const loop = () => {
			const now = performance.now() / 1000;
			const dt = Math.min(0.05, Math.max(0.001, now - last));
			last = now;
			draw(now - start, dt);
			acc += dt;
			if (++frames === 90) {
				if (acc / frames > 0.024 && quality > 0.6) {
					quality = Math.max(0.6, quality * 0.8);
					resize();
				}
				acc = 0;
				frames = 0;
			}
			raf = requestAnimationFrame(loop);
		};
		document.addEventListener('visibilitychange', () => {
			cancelAnimationFrame(raf);
			if (!document.hidden) {
				last = performance.now() / 1000;
				acc = 0;
				frames = 0;
				raf = requestAnimationFrame(loop);
			}
		});
		raf = requestAnimationFrame(loop);
	};

	// wait for the background compile before touching the programs (touching them earlier would block)
	const poll = () => {
		if (started) return;
		if (ready()) begin();
		else setTimeout(poll, 30);
	};
	if (parallel) setTimeout(poll, 0);
	else begin();
}
