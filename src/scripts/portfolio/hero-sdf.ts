// Landing-page decoration: line figures drawn as distance fields, in two passes.
//   1. the scene     — alternates between three kinds of composition:
//                        · one large line figure (wireframe globe, rotating 4D hypercube, square spiral, spinning
//                          dot sphere, pentagram web), cut off by the lower-right edges
//                        · "overlap": translucent planes, a circle, long lines and an arc passing through each other,
//                          with smaller pieces around them; placed and sized differently every time
//                        · "scatter": small figures spilled from the top edge like paint — a fan hanging from the
//                          top with a few drips running down, plus a few tiny "+" marks and sparkles
//                      one scene morphs into the next by blending their distance fields; the lines are repeated as
//                      a stack of offset, fading echoes that unfold during the morph and fold back when it settles
//                                                                                              (after Tobias Ahlin)
//   2. velocity      — the figure stretches along its velocity and R/G/B split apart; velocity comes from the morph
//                      impulse and a spring toward the pointer                                (after Roman Jean-Elie)
// Nothing is drawn left of the menu. Colours come from the Thema tokens; the 8-bit theme renders on a coarse pixel
// grid. No libraries.
//
// Performance: the distance field is evaluated once per pixel (pass 1 → texture). Echoes are translated copies and the
// channel split is an offset, so pass 2 builds both from texture reads instead of re-evaluating the field — this keeps
// the shaders small (Windows compiles WebGL through Direct3D, which unrolls every loop and inlines every call) and the
// per-pixel cost flat. Shaders compile in the background where KHR_parallel_shader_compile exists, and the buffer
// scale drops if frames run slow.

import { themas, type ShapeSet } from '../../portfolio/themes';

const FIGURES = { squares: 0, globe: 1, dotsphere: 2, pentagram: 3, hypercube: 4, overlap: 5, scatter: 6 } as const;
type FigureName = keyof typeof FIGURES;

const PLAYLISTS: Record<ShapeSet, FigureName[]> = {
	// the big figures in a fixed order, with the two compositions in between
	geo: ['globe', 'overlap', 'hypercube', 'scatter', 'squares', 'overlap', 'dotsphere', 'scatter', 'pentagram', 'overlap'],
	space: ['globe', 'overlap', 'hypercube', 'scatter', 'squares', 'overlap', 'dotsphere', 'scatter', 'pentagram', 'overlap'],
	candy: ['globe', 'overlap', 'hypercube', 'scatter', 'squares', 'overlap', 'dotsphere', 'scatter', 'pentagram', 'overlap'],
	pixel: ['globe', 'overlap', 'hypercube', 'scatter', 'squares', 'overlap', 'dotsphere', 'scatter', 'pentagram', 'overlap'],
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
uniform vec2 uCompC;      // px, centre of the compositions (stretch pivot)
uniform vec4 uRegion;     // px (x0, y0, x1, y1): the free area right of the menu, where compositions may go
uniform vec2 uStage;      // px, canvas size
uniform float uU;         // px per composition unit
uniform vec2 uVel;        // px, stretch
uniform float uPx;        // buffer px per CSS px
uniform float uPixel;     // >1: pixelated (8-bit)
uniform float uMenuX;     // px: nothing is drawn left of this (the menu)
uniform vec4 uEdges[32];  // hypercube edges, projected on the CPU (figure units)

// distance to the pieces drawn in the accent colour (a few lines / figures per scene); each figure / composition
// writes it in its own units and scene() scales it like the ink distance
float gAcc;
float gSlot; // 0 while evaluating scene A, 1 for scene B (B is the next appearance)
#define CYCLE ${(HOLD + MORPH).toFixed(3)}

// ---- line figures: distance to the ink in figure units (radius ≈ 1), <= 0 on the ink ----
float sdBox(vec2 p, vec2 b) { vec2 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
// distance to an ellipse outline (first-order: |f| / |grad f|), good enough for hairlines
float ellipse(vec2 p, vec2 ab) {
	ab = max(ab, vec2(0.002));
	float k0 = length(p / ab);
	float k1 = length(p / (ab * ab));
	return abs(k0 * (k0 - 1.0) / max(k1, 0.0001));
}
float sdPentagon(vec2 p, float r) {
	const vec3 k = vec3(0.809016994, 0.587785252, 0.726542528);
	p.x = abs(p.x);
	p -= 2.0 * min(dot(vec2(-k.x, k.y), p), 0.0) * vec2(-k.x, k.y);
	p -= 2.0 * min(dot(vec2(k.x, k.y), p), 0.0) * vec2(k.x, k.y);
	p -= vec2(clamp(p.x, -r * k.z, r * k.z), r);
	return length(p) * sign(p.y);
}
float seg(vec2 p, vec2 a, vec2 b) {
	vec2 pa = p - a, ba = b - a;
	return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

float figSquares(vec2 p) { // nested squares, each turned 8° and 8.5% smaller; the outer one starts turned ~20°
	float d = 1e3;
	float s = 0.8;
	for (int i = 0; i < 18; i++) {
		float k = abs(sdBox(rot(0.35 + float(i) * 0.14) * p, vec2(s)));
		d = min(d, k);
		if (i >= 15) gAcc = min(gAcc, k); // the innermost three
		s *= 0.915;
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
		float c = abs(cos(float(i) / 6.0 * 3.14159265 + uTime * 0.25));
		// a meridian seen edge-on collapses into the vertical line through the poles. The ellipse approximation breaks
		// down for very thin ellipses, so also take the horizontal distance to the curve (exact for thin ones, and the
		// pole point beyond the poles); the line then stays continuous all the way through instead of fading out
		float a = c * 0.95;
		float h = abs(p.y) <= 0.95
			? abs(abs(p.x) - a * sqrt(1.0 - p.y * p.y / 0.9025))
			: length(vec2(p.x, abs(p.y) - 0.95));
		float k = abs(p.y) <= 0.95 ? min(ellipse(p, vec2(a, 0.95)), h) : h;
		d = min(d, k);
		if (i == 2) gAcc = min(gAcc, k);
	}
	return d;
}
float figPentagram(vec2 p) { // a {10/3} star around four nested pentagon + pentagram levels that turn against each other
	float d = 1e3;
	float R = 0.98;
	for (int j = 0; j < 10; j++) {
		float a0 = float(j) * 0.62831853;
		float a1 = float(j + 3) * 0.62831853;
		d = min(d, seg(p, R * vec2(sin(a0), cos(a0)), R * vec2(sin(a1), cos(a1))));
	}
	R *= 0.82;
	for (int l = 0; l < 4; l++) {
		float fl = float(l);
		float turn = (mod(fl, 2.0) * 2.0 - 1.0) * uTime * 0.1 * (1.0 + fl * 0.35);
		vec2 q = rot(fl * 3.14159265 + turn) * p;
		float lv = abs(sdPentagon(q, R * 0.809016994));
		for (int j = 0; j < 5; j++) {
			float a0 = float(j) * 1.25663706;
			float a1 = float(j + 2) * 1.25663706;
			lv = min(lv, seg(q, R * vec2(sin(a0), cos(a0)), R * vec2(sin(a1), cos(a1))));
		}
		d = min(d, lv);
		if (l == 1) gAcc = min(gAcc, lv);
		R *= 0.381966;
	}
	return d;
}
float figHypercube(vec2 p) { // 32 edges of a rotating 4D cube, projected on the CPU
	float d = 1e3;
	for (int i = 0; i < 32; i++) {
		float k = seg(p, uEdges[i].xy, uEdges[i].zw);
		d = min(d, k);
		if (mod(float(i), 16.0) == 3.0) gAcc = min(gAcc, k);
	}
	return d;
}
float figDotSphere(vec2 p) { // dots on a tilted, spinning sphere: foreshortening near the rim sells the depth
	float R = 0.95;
	float r2 = dot(p, p) / (R * R);
	float rim = abs(length(p) - R);
	if (r2 >= 1.0) return rim;
	vec3 n = vec3(p / R, sqrt(1.0 - r2));
	n.yz = rot(-0.4) * n.yz;          // tilt the axis toward the viewer
	n.xz = rot(uTime * 0.35) * n.xz;  // spin
	float lat = asin(clamp(n.y, -1.0, 1.0));
	float lon = atan(n.x, n.z);
	float rows = 14.0;
	float row = floor((lat / 3.14159265 + 0.5) * rows);
	float latc = (row + 0.5) / rows * 3.14159265 - 1.5707963;
	float cols = max(1.0, floor(30.0 * cos(latc)));
	float col = floor((lon / 6.28318531 + 0.5) * cols);
	// the accent dot: the one under a fixed view point (upper right of the visible face) when this appearance began,
	// carried round by the spin from there — so it always starts in view and travels across it
	float j = floor(uTime / CYCLE) + gSlot;
	float t0 = j * CYCLE;
	vec2 s0 = rot(t0 * 0.05 + j * 0.6) * vec2(-0.35, 0.45) / R; // the figure's own turn (uRot) when it settled
	vec3 v0 = vec3(s0, sqrt(1.0 - dot(s0, s0)));
	v0.yz = rot(-0.4) * v0.yz;
	v0.xz = rot(t0 * 0.35) * v0.xz;
	float row0 = floor((asin(clamp(v0.y, -1.0, 1.0)) / 3.14159265 + 0.5) * rows);
	float cols0 = max(1.0, floor(30.0 * cos((row0 + 0.5) / rows * 3.14159265 - 1.5707963)));
	float col0 = floor((atan(v0.x, v0.z) / 6.28318531 + 0.5) * cols0);
	float lonc = (col + 0.5) / cols * 6.28318531 - 3.14159265;
	vec3 c = vec3(cos(latc) * sin(lonc), sin(latc), cos(latc) * cos(lonc));
	float ang = acos(clamp(dot(n, c), -1.0, 1.0));
	float dd = (ang - 0.055) * R;
	if (row == row0 && col == col0) gAcc = min(gAcc, dd);
	return min(dd, rim);
}
float figure(vec2 p, float id) {
	if (id < 0.5) return figSquares(p);
	if (id < 1.5) return figGlobe(p);
	if (id < 2.5) return figDotSphere(p);
	if (id < 3.5) return figPentagram(p);
	return figHypercube(p);
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
	vec4 k = vec4(hash(vec2(seed, 21.0)), hash(vec2(seed, 22.0)), hash(vec2(seed, 23.0)), hash(vec2(seed, 24.0)));
	p.y *= h > 0.5 ? -1.0 : 1.0;                     // flipped vertically on some appearances (never sideways,
	p = rot((h - 0.5) * 0.24) * p;                   // so the left end stays clear of the menu)
	// the planes change size and place every appearance
	vec2 c1 = vec2(-0.38 + 0.2 * (k.x - 0.5) + 0.07 * sin(t * 0.37), 0.18 + 0.25 * (k.y - 0.5));
	float r1 = sdBox(rot(0.1 + 0.3 * (k.z - 0.5) + 0.05 * sin(t * 0.29)) * (p - c1), vec2(0.64, 0.38) * mix(0.75, 1.15, k.w));
	vec2 c2 = vec2(0.3 + 0.2 * (k.z - 0.5), -0.06 + 0.25 * (k.x - 0.5) + 0.07 * cos(t * 0.33));
	float r2 = sdBox(rot(-0.24 + 0.3 * (k.y - 0.5)) * (p - c2), vec2(0.4, 0.62) * mix(0.8, 1.2, k.x));
	fill = 0.5 * inside(r1, soft) + 0.5 * inside(r2, soft); // overlap = two layers
	float d = min(abs(r1), abs(r2));
	vec2 cc = vec2(0.04 + 0.4 * (k.w - 0.5) + 0.09 * sin(t * 0.5), 0.3 + 0.2 * (k.y - 0.5));
	float cr = mix(0.14, 0.26, k.z);
	float ring = abs(length(p - cc) - cr);
	d = min(d, ring);
	gAcc = min(gAcc, ring);
	d = min(d, sdSeg(p, cc + vec2(cr, 0.0), vec2(1.05, cc.y)));
	d = min(d, sdSeg(p, vec2(1.05, cc.y), vec2(1.55, -0.28)));
	d = min(d, sdSeg(p, vec2(-1.0, -0.52 + 0.3 * (k.x - 0.5)), vec2(1.6, -0.74 + 0.3 * (k.w - 0.5) + 0.06 * sin(t * 0.6))));
	d = min(d, sdSeg(p, vec2(-0.25 + 0.3 * (k.z - 0.5), -0.95), vec2(0.45 + 0.3 * (k.y - 0.5), 1.05)));
	float arc = abs(length(p - vec2(0.25, -0.35)) - mix(1.0, 1.25, k.w));
	d = min(d, p.y > 0.5 ? arc : 1e3);                // only the upper stretch of the arc

	// smaller pieces, spread a little further out
	vec2 e = vec2(hash(vec2(seed, 41.0)), hash(vec2(seed, 42.0))) - 0.5;
	vec2 tq = rot(t * 0.2 + e.x * 3.0) * (p - vec2(1.3 + 0.15 * e.x, 0.74 + 0.15 * e.y));
	float tri = max(abs(tq.x) * 0.866 + tq.y * 0.5, -tq.y) - 0.13;                   // translucent triangle
	d = min(d, abs(tri));
	if (e.x > 0.0) gAcc = min(gAcc, abs(tri));
	vec2 dc = vec2(-0.72 + 0.2 * e.y, 0.8 + 0.1 * e.x);
	float dot0 = length(p - dc) - 0.075;                                               // translucent disc
	d = min(d, abs(dot0));
	fill = min(1.0, fill + 0.5 * inside(tri, soft) + 0.5 * inside(dot0, soft));
	float tsq = abs(sdBox(rot(-t * 0.25 + e.x * 2.0) * (p - vec2(1.0 + 0.2 * e.y, -1.0)), vec2(0.11))); // turning square
	d = min(d, tsq);
	if (e.x <= 0.0) gAcc = min(gAcc, tsq);
	// a short double line: its angle and place change every appearance, and it keeps drifting and turning
	vec2 lc = vec2(-0.38 + 0.35 * e.x + 0.08 * sin(t * 0.45 + e.y * 6.0), -1.0 + 0.05 * cos(t * 0.38 + e.x * 5.0));
	mat2 lr = rot((e.y - 0.5) * 0.6 + 0.15 * sin(t * 0.3 + e.x * 4.0));
	d = min(d, sdSeg(p, lc + lr * vec2(-0.4, 0.03), lc + lr * vec2(0.4, 0.03)));
	d = min(d, sdSeg(p, lc + lr * vec2(-0.36, -0.03), lc + lr * vec2(0.44, -0.03)));
	return d;
}

// four-point sparkle (the brand mark): two thin rhombi crossed, unit size
float ndot(vec2 a, vec2 b) { return a.x * b.x - a.y * b.y; }
float sdRhombus(vec2 p, vec2 b) {
	p = abs(p);
	float h = clamp(ndot(b - 2.0 * p, b) / dot(b, b), -1.0, 1.0);
	return length(p - 0.5 * b * vec2(1.0 - h, 1.0 + h)) * sign(p.x * b.y + p.y * b.x - b.x * b.y);
}
float sdSparkle(vec2 p) { return min(sdRhombus(p, vec2(1.0, 0.26)), sdRhombus(p, vec2(0.26, 1.0))); }

// one small figure (unit size), kind picked by a hash: circle, square, triangle, outlined plus, double ring or a
// translucent square (which also adds fill)
float smallFigure(vec2 q, float kind, float sz, inout float fill) {
	if (kind < 0.5) return abs(length(q) - 1.0);
	if (kind < 1.5) return abs(sdBox(q, vec2(0.85)));
	if (kind < 2.5) return abs(max(abs(q.x) * 0.866 + q.y * 0.5, -q.y) - 0.5);
	if (kind < 3.5) return abs(min(sdBox(q, vec2(1.0, 0.32)), sdBox(q, vec2(0.32, 1.0))));
	if (kind < 4.5) return min(abs(length(q) - 1.0), abs(length(q) - 0.55));
	float b = sdBox(q, vec2(0.8));
	fill = max(fill, inside(b * sz, 1.0));
	return abs(b);
}

// "paint spilled from the top": a fan of small figures hanging from the top edge (densest near the top, some cut
// off by it), three drips of shrinking figures running down from it, 3–5 "+" / sparkle marks around the rim and
// ~10 more spattered below it.
// Everything in px; the fan's anchor sits just above the top edge, right of the menu.
float compScatter(vec2 p, float seed, out float fill) {
	float t = uTime;
	float d = 1e5;
	fill = 0.0;
	float x0 = uRegion.x;
	float x1 = uRegion.z;
	float top = uStage.y;
	float Rb = min(uStage.y * 0.5, (x1 - x0) * 0.45);                     // fan radius
	float unit = uU;                                                       // figure size unit
	vec2 anchor = vec2(mix(x0, x1, mix(0.5, 0.66, hash(vec2(seed, 61.0)))), top + Rb * 0.06);

	// the fan
	for (int i = 0; i < 14; i++) {
		float fi = float(i);
		vec2 h = vec2(hash(vec2(fi, seed)), hash(vec2(fi * 1.7 + 3.0, seed)));
		float h2 = hash(vec2(fi * 2.3 + 9.0, seed));
		float ang = -1.5707963 + (h.x - 0.5) * 2.7;                        // around "straight down", ±77°
		float rad = Rb * (0.12 + 0.88 * sqrt(h.y));                        // denser near the top
		vec2 pos = anchor + vec2(cos(ang) * rad * 1.25, sin(ang) * rad)
			+ 5.0 * uPx * vec2(sin(t * 0.7 + fi), cos(t * 0.6 + fi * 1.3));
		pos.x = clamp(pos.x, x0 + unit * 0.2, x1 - unit * 0.2);
		float sz = unit * (0.06 + 0.08 * h2);
		vec2 q = rot(t * (h.x - 0.5) * 0.6 + fi) * (p - pos) / sz;
		float kind = floor(hash(vec2(fi * 3.1 + 1.0, seed)) * 6.0);
		float k = smallFigure(q, kind, sz, fill) * sz;
		d = min(d, k);
		if (hash(vec2(fi * 5.9 + 2.0, seed)) < 0.25) gAcc = min(gAcc, k);
	}
	// drips: three streams of figures that get smaller as they run down
	for (int j = 0; j < 3; j++) {
		float fj = float(j) + 20.0;
		float hx = hash(vec2(fj, seed));
		float x = clamp(anchor.x + (hx - 0.5) * Rb * 2.0, x0 + unit * 0.25, x1 - unit * 0.25);
		float y = top - Rb * mix(0.7, 0.95, hash(vec2(fj * 1.9, seed)));
		float len = mix(2.0, 3.0, step(0.5, hash(vec2(fj * 2.7, seed))));  // 2 or 3 drops
		for (int k = 0; k < 3; k++) {
			float fk = float(k);
			if (fk >= len) break;
			vec2 pos = vec2(x + 6.0 * uPx * sin(t * 0.5 + fj + fk), y - fk * Rb * 0.38 - 4.0 * uPx * sin(t * 0.8 + fk));
			float sz = unit * mix(0.09, 0.04, fk / 2.0);
			vec2 q = rot(t * 0.3 * (hx - 0.5) + fk + fj) * (p - pos) / sz;
			float kind = floor(hash(vec2(fj * 3.3 + fk, seed)) * 6.0);
			d = min(d, smallFigure(q, kind, sz, fill) * sz);
		}
	}
	// 3–5 marks — tiny solid "+" and twinkling sparkles — around the rim of the fan
	for (int i = 0; i < 5; i++) {
		float fi = float(i) + 40.0;
		if (i > 2 && hash(vec2(fi * 3.7, seed)) < 0.5) continue;           // the last two show up half the time
		vec2 h = vec2(hash(vec2(fi, seed)), hash(vec2(fi * 1.3 + 5.0, seed)));
		float ang = -1.5707963 + ((float(i) + 0.2 + 0.6 * h.x) / 5.0 - 0.5) * 2.9;
		vec2 pos = anchor + vec2(cos(ang) * 1.25, sin(ang)) * Rb * mix(1.02, 1.18, h.y)
			+ 0.02 * unit * vec2(sin(t * 0.8 + fi), cos(t * 0.7 + fi));
		pos.x = clamp(pos.x, x0 + unit * 0.1, x1 - unit * 0.1);
		float sz = unit * mix(0.03, 0.05, hash(vec2(fi * 2.9, seed)));
		vec2 q = (p - pos) / sz;
		float k;
		if (hash(vec2(fi * 4.1, seed)) < 0.5) k = min(sdBox(q, vec2(1.0, 0.2)), sdBox(q, vec2(0.2, 1.0))); // +
		else { float tw = 0.75 + 0.35 * sin(t * 2.2 + fi * 1.9); k = sdSparkle(q / tw) * tw; }              // sparkle
		d = min(d, k * sz);
		if (hash(vec2(fi * 6.7 + 4.0, seed)) < 0.2) gAcc = min(gAcc, k * sz);
	}
	// ~10 more marks spattered below the fan, down to the lower part of the screen: one per cell of a jittered 5×2
	// split (a few cells left empty), widening and thinning out as they fall
	float yHi = top - Rb * 1.05;
	float yLo = max(uRegion.y + unit * 0.15, top - Rb * 1.8);
	for (int i = 0; i < 10; i++) {
		float fi = float(i) + 60.0;
		if (hash(vec2(fi * 3.7, seed)) < 0.12) continue;
		vec2 h = vec2(hash(vec2(fi, seed)), hash(vec2(fi * 1.3 + 5.0, seed)));
		vec2 cell = vec2(mod(float(i), 5.0), floor(float(i) / 5.0));
		float v = (cell.y + 0.1 + 0.8 * h.y) / 2.0;                        // 0 = just below the fan, 1 = lowest
		float spread = Rb * 1.25 * mix(0.9, 1.3, v);
		vec2 pos = vec2(anchor.x + ((cell.x + 0.1 + 0.8 * h.x) / 5.0 - 0.5) * 2.0 * spread, mix(yHi, yLo, v))
			+ 0.02 * unit * vec2(sin(t * 0.8 + fi), cos(t * 0.7 + fi));
		pos.x = clamp(pos.x, x0 + unit * 0.1, x1 - unit * 0.1);
		float sz = unit * mix(0.025, 0.045, hash(vec2(fi * 2.9, seed))) * mix(1.0, 0.75, v);
		vec2 q = (p - pos) / sz;
		float k;
		if (hash(vec2(fi * 4.1, seed)) < 0.5) k = min(sdBox(q, vec2(1.0, 0.2)), sdBox(q, vec2(0.2, 1.0))); // +
		else { float tw = 0.75 + 0.35 * sin(t * 2.2 + fi * 1.9); k = sdSparkle(q / tw) * tw; }              // sparkle
		d = min(d, k * sz);
		if (hash(vec2(fi * 6.7 + 4.0, seed)) < 0.2) gAcc = min(gAcc, k * sz);
	}
	return d;
}

// fit a composition into the free region: ext = its reach from the centre in units (left, right, down, up);
// shrinks the scale if it cannot fit and pulls the centre in so nothing is cut off. Returns (centre, scale).
vec3 fitRegion(vec2 want, float u, vec4 ext) {
	vec2 lo = uRegion.xy;
	vec2 hi = uRegion.zw;
	u = min(u, min((hi.x - lo.x) / (ext.x + ext.y), (hi.y - lo.y) / (ext.z + ext.w)));
	vec2 c = clamp(want, lo + vec2(ext.x, ext.z) * u, hi - vec2(ext.y, ext.w) * u);
	return vec3(c, u);
}

// one scene: distance to the ink in px, plus a translucent fill (0..1)
float scene(float id, float seed, vec2 fc, out float fill, out float acc) {
	fill = 0.0;
	gAcc = 1e5;
	if (id < 4.5) {
		vec2 q = rot(uRot) * stretch(fc - uCenter) / uR;
		float d = figure(q, id) * uR;
		acc = gAcc * uR;
		return d;
	}
	if (id < 5.5) {
		// overlap: a different centre and size every appearance, within the area right of the menu
		vec2 h = vec2(hash(vec2(seed, 31.0)), hash(vec2(seed, 32.0)));
		vec2 want = mix(uRegion.xy, uRegion.zw, vec2(mix(0.42, 0.62, h.x), mix(0.35, 0.65, h.y)));
		vec3 f = fitRegion(want, uU * mix(0.75, 1.1, hash(vec2(seed, 33.0))), vec4(1.15, 1.72, 1.3, 1.3));
		float d = compOverlap(stretch(fc - f.xy) / f.z, seed, 1.0 / f.z, fill) * f.z;
		acc = gAcc * f.z;
		return d;
	}
	float d = compScatter(uCompC + stretch(fc - uCompC), seed, fill);
	acc = gAcc;
	return d;
}

// pass 1: r = ink, g = translucent fill, b = the part of the ink drawn in the accent colour
void main() {
	vec2 fc = gl_FragCoord.xy;
	bool pixel = uPixel > 1.5;
	if (pixel) fc = (floor(fc / uPixel) + 0.5) * uPixel;
	// 8-bit: every block the line passes through lights up, so lines stay one block thick and unbroken
	float hw = pixel ? 0.55 * uPixel : 0.6 * uPx;
	float aa = pixel ? 0.0 : 1.0;
	float fill, acc;
	gSlot = 0.0;
	float d = scene(uA, uSeedA, fc, fill, acc);
	if (uMix > 0.001) { // blending the two fields is the morph
		float fillB, accB;
		gSlot = 1.0;
		float dB = scene(uB, uSeedB, fc, fillB, accB);
		d = mix(d, dB, uMix);
		fill = mix(fill, fillB, uMix);
		float cap = 30.0 * uPx; // accent pieces without a partner fade out mid-morph instead of jumping
		acc = mix(min(acc, cap), min(accB, cap), uMix);
	}
	float keep = smoothstep(uMenuX, uMenuX + 80.0 * uPx, fc.x);
	float ink = lineAt(max(d, 0.0), hw, aa) * keep;
	gl_FragColor = vec4(ink, fill * keep, min(ink, lineAt(max(acc, 0.0), hw, aa) * keep), 1.0);
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
uniform float uMenuX;     // px: nothing is drawn left of this (the menu)
uniform vec3 uLine;       // figure + echoes
uniform vec3 uFill;       // translucent planes
uniform vec3 uAcc;        // the accent pieces
uniform vec3 uBg;         // page background under the canvas

#define ECHOES ${ECHOES}

// (ink, accent ink)
vec2 ink(vec2 fc) {
	vec2 uv = fc / uRes;
	if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec2(0.0);
	return texture2D(uFig, uv).rb;
}
// the figure plus its echo stack, seen from one sample point
vec2 stack(vec2 fc) {
	vec2 a = ink(fc);
	bool pixel = uPixel > 1.5;
	for (int i = 1; i < ECHOES; i++) {
		float fi = float(i);
		vec2 off = uDir * fi * uSpacing;
		if (pixel) off = floor(off / uPixel + 0.5) * uPixel; // whole blocks, so echoes stay on the grid
		a = max(a, ink(fc - off) * 0.8 * pow(1.0 - fi / float(ECHOES), 1.6));
	}
	return a;
}
// 4×4 ordered-dither threshold (0..1) for a block
float bayer4(vec2 c) {
	c = mod(c, 4.0);
	float b2 = mod(c.x, 2.0) * 2.0 + mod(c.y, 2.0) * 3.0 - 4.0 * mod(c.x, 2.0) * mod(c.y, 2.0);   // 0 2 3 1
	vec2 h = floor(c / 2.0);
	float b1 = h.x * 2.0 + h.y * 3.0 - 4.0 * h.x * h.y;
	return (b2 * 4.0 + b1 + 0.5) / 16.0;
}

void main() {
	vec2 fc = gl_FragCoord.xy;
	bool pixel = uPixel > 1.5;
	if (pixel) fc = (floor(fc / uPixel) + 0.5) * uPixel;

	// figure + echoes, channel-split by velocity (only paid for while something moves); per channel: (ink, accent)
	vec2 sG = stack(fc);
	vec2 sR = sG;
	vec2 sB = sG;
	if (!pixel && dot(uSplit, uSplit) > 0.25) {
		sR = stack(fc + uSplit);
		sB = stack(fc - uSplit);
	}
	vec3 lineA = vec3(sR.x, sG.x, sB.x);
	vec3 accA = vec3(sR.y, sG.y, sB.y);

	// translucent planes under the lines
	vec2 uv = fc / uRes;
	float fillA = texture2D(uFig, uv).g * 0.14;
	if (pixel) {
		// 8-bit: no partial alpha — fading echoes and planes become an ordered dither in the line colour
		float th = bayer4(floor(gl_FragCoord.xy / uPixel));
		lineA = vec3(step(th, sG.x * sG.x));
		accA = min(lineA, vec3(step(th, sG.y * sG.y)));
		fillA = step(th, fillA * 2.5) * 0.6;
	}

	// echoes can reach back past the menu edge: fade them there too
	float fade = smoothstep(uMenuX, uMenuX + 80.0 * uPx, fc.x);
	lineA *= fade;
	accA *= fade;

	// the colour each channel should end up with over the page background — planes, then lines, then accent pieces.
	// Mixing per channel keeps the split right on any background: on dark ones the channels add up (R/G/B fringes),
	// on light ones they subtract (C/M/Y fringes, like misregistered print) instead of turning into dark smears.
	vec3 target = mix(uBg, uFill, fillA);
	target = mix(target, uLine, lineA);
	target = mix(target, uAcc, accA);
	float alpha = max(fillA, max(max(lineA.r, lineA.g), lineA.b));
	// premultiplied output that lands on target once blended over uBg
	gl_FragColor = vec4(clamp(target - uBg * (1.0 - alpha), 0.0, alpha), alpha);
}
`;

interface Palette {
	line: number[];
	accent: number[];
	bg: number[];
	fill: number[];
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
		accent: v('--shape-2'),
		bg: v('--bg'),
		fill: v('--shape'),
		set: themas.find((t) => t.id === id)?.shapes ?? 'geo',
	};
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));


type Uniforms<T extends string> = Record<T, WebGLUniformLocation | null>;

/** The 32 edges of a 4D cube, turned in the XW and YZ planes and projected 4D → 3D → 2D (figure units). */
const edgeBuf = new Float32Array(32 * 4);
function hypercube(t: number) {
	const a = t * 0.45;
	const b = t * 0.3;
	const pts: number[][] = [];
	for (let i = 0; i < 16; i++) {
		let [x, y, z, w] = [i & 1, i & 2, i & 4, i & 8].map((v) => (v ? 1 : -1));
		[x, w] = [x * Math.cos(a) - w * Math.sin(a), x * Math.sin(a) + w * Math.cos(a)];
		[y, z] = [y * Math.cos(b) - z * Math.sin(b), y * Math.sin(b) + z * Math.cos(b)];
		const s4 = 1 / (2.6 - w);
		[x, y, z] = [x * s4, y * s4, z * s4];
		[x, z] = [x * Math.cos(0.6) - z * Math.sin(0.6), x * Math.sin(0.6) + z * Math.cos(0.6)];
		const s3 = 2.5 / (2.4 - z);
		pts.push([x * s3, y * s3]);
	}
	let e = 0;
	for (let i = 0; i < 16; i++)
		for (let bit = 1; bit < 16; bit <<= 1)
			if (!(i & bit)) {
				const j = i | bit;
				edgeBuf.set([pts[i][0], pts[i][1], pts[j][0], pts[j][1]], e * 4);
				e++;
			}
	return edgeBuf;
}

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

	const figNames = ['uTime', 'uCenter', 'uR', 'uRot', 'uA', 'uB', 'uMix', 'uSeedA', 'uSeedB', 'uCompC', 'uRegion', 'uStage', 'uU', 'uVel', 'uPx', 'uPixel', 'uMenuX', 'uEdges'] as const;
	const compNames = ['uFig', 'uRes', 'uTime', 'uSpacing', 'uDir', 'uSplit', 'uPx', 'uPixel', 'uMenuX', 'uLine', 'uFill', 'uAcc', 'uBg'] as const;
	let uf: Uniforms<(typeof figNames)[number]>;
	let uc: Uniforms<(typeof compNames)[number]>;
	const locate = <T extends string>(prog: WebGLProgram, names: readonly T[]) =>
		Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(prog, n)])) as Uniforms<T>;

	// offscreen target for pass 1
	const tex = gl.createTexture();
	const fbo = gl.createFramebuffer();

	const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
	// the menu's right edge (buffer px): figures fade out before reaching it
	const menu = document.querySelector<HTMLElement>('.menu');
	let menuX = 0;
	const measureMenu = () => {
		if (!menu) return;
		const c = canvas.getBoundingClientRect();
		const labels = [...menu.querySelectorAll<HTMLElement>('.label')];
		const right = Math.max(...(labels.length ? labels : [menu]).map((el) => el.getBoundingClientRect().right));
		menuX = Math.max(0, (right - c.left + 24) * dpr);
	};
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
		measureMenu();
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
		// free area right of the menu (on narrow screens the menu spans the width: fall back to the right 70%)
		const x0 = W - (menuX + 70 * dpr) < W * 0.35 ? W * 0.3 : menuX + 70 * dpr;
		gl.uniform4f(uf.uRegion, x0, 30 * dpr, W - 20 * dpr, H - 40 * dpr);
		gl.uniform2f(uf.uStage, W, H);
		gl.uniform1f(uf.uU, Math.min(W * 0.24, H * 0.42));
		gl.uniform1f(uf.uMenuX, menuX);
		gl.uniform4fv(uf.uEdges, hypercube(t));
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
		gl.uniform1f(uc.uSpacing, Math.max(pixelSize, (3 + bump * 10) * dpr));
		gl.uniform2f(uc.uDir, dir[0], dir[1]);
		gl.uniform2f(uc.uSplit, split[0], split[1]);
		gl.uniform1f(uc.uPx, dpr);
		gl.uniform1f(uc.uPixel, pixelSize);
		gl.uniform1f(uc.uMenuX, menuX);
		gl.uniform3fv(uc.uLine, palette.line);
		gl.uniform3fv(uc.uFill, palette.fill);
		gl.uniform3fv(uc.uAcc, palette.accent);
		gl.uniform3fv(uc.uBg, palette.bg);
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
		// the theme may have changed while the shaders compiled
		palette = readPalette(probe);
		playlist = PLAYLISTS[palette.set];
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
