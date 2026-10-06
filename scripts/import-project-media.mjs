// One-shot: convert project screenshots / clips from their working folders into web-sized files under
// public/projects/<slug>/. Only the outputs are committed; re-run when the source captures change.
//   node scripts/import-project-media.mjs [slug ...]
// A key like 'fdf#pdf' writes into public/projects/fdf/ and runs on its own, so a set whose captures are gone can
// still take new images; naming the slug runs all of its keys.
// Needs sharp (dependency) and ffmpeg on PATH (for the loop clips and slideshows).

import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, existsSync, statSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SHOTS = 'C:/Users/da171/OneDrive/Desktop/figma-bridge/shots';
const VIDEO = 'C:/Users/da171/OneDrive/Desktop/figma-bridge/video';
const CLOUD_OLD = 'C:/Users/da171/OneDrive/Desktop/9-14일-비교용 구름';
const CLOUD_E19 = 'C:/Users/da171/VolumetricCloud/build/captures/cloud-near-micro/21564-19674375';
const WATER = 'C:/Users/da171/WaterShader/docs/features/water-polish/captures';
const FIG = process.env.FIG_EXPORT ?? 'C:/Users/da171/AppData/Local/Temp/claude/fig-export';
const CAP = process.env.CAPTURES ?? 'C:/Users/da171/AppData/Local/Temp/claude/mlx-captures';
// images pulled from the portfolio Figma file (image fills at source size + 3× frame renders for the diagram panels)
const FIG2 = process.env.FIG2 ?? 'C:/Users/da171/AppData/Local/Temp/claude/C--Users-da171-ryuhajin-github-io/71bdedfe-b71e-4e3c-b1ae-5e40ffc56f66/scratchpad/fig2/img';

const W = { hero: 1920, wide: 1600, gallery: 1200, tile: 640, thumb: 480 };
// FDF test maps. Captured at 3840×2160 with heights ×3 (capture build only); dense maps (t1, mars, julia,
// elem-fract) with 1px lines, the sparse ones (42, pyra) with 3px lines so they survive the downscale.
const FDF_MAPS = ['t1', '42', 'pyra', 'mars', 'julia', 'elem-fract'];

/** @typedef {{ out: string, src: string, width?: number, crop?: [number, number, number, number], q?: number, frame?: boolean }} Img */
/** @typedef {{ out: string, src: string, frames: string[], size: number }} Sprite */
/** @typedef {{ out: string, src: string, cuts: [number, number][], crop?: string, crf?: number, height?: number, speed?: number, xfade?: number }} Clip */
/** @typedef {{ out: string, frames: string[], hold: number, fade: number, bg: string, frame?: boolean }} Slides */
/** @typedef {{ out: string, src: string }} Copy — already web-ready (e.g. a clip encoded straight from renderer frames) */

/** @type {Record<string, { images?: Img[], sprites?: Sprite[], clips?: Clip[], slides?: Slides[], copies?: Copy[] }>} */
const manifest = {
	'volumetric-cloud': {
		images: [
			// hero: renderer-direct capture (shots/cloud/hq/README.md) — Cumulus, Autumn, F8 above the layer, 16:10 so the
			// parallax has headroom; rendered at 2x and Lanczos-downsampled
			{ out: 'cover.webp', src: `${SHOTS}/cloud/hq/hero-08-2560x1600.png`, width: 2560, q: 88 },
			{ out: 'goals.webp', src: `${SHOTS}/cloud/hq/goals-altocumulus-sunset-building-400ms-16s-poster.png`, q: 90 },
			{ out: 'sunset.webp', src: `${SHOTS}/cloud/f6-sunset/run2/sunset_180858.png`, width: W.wide },
			// gallery shots open in the lightbox at up to 1600px, so they are stored at that width; q 90 because soft
			// cloud gradients band at the default quality
			...['stratus', 'cumulus', 'altocumulus', 'custom'].flatMap((t, i) => [
				{
					out: `type-${t}-f6.webp`,
					src: t === 'altocumulus' ? `${SHOTS}/cloud/31-type-altocumulus-F6-hq.png` : `${SHOTS}/cloud/${String(3 + i * 2).padStart(2, '0')}-type-${t}-F6.png`,
					width: W.wide,
					q: 90,
				},
				{ out: `type-${t}-f8.webp`, src: `${SHOTS}/cloud/${String(4 + i * 2).padStart(2, '0')}-type-${t}-F8.png`, width: W.wide, q: 90 },
			]),
			...[1, 2, 3, 4].map((n) => ({ out: `light-${n}.webp`, src: `${SHOTS}/cloud/${10 + n}-light-${n}-F8.png`, width: W.wide, q: 90 })),
			...['weather', 'base', 'detail', 'final', 'direct', 'composite'].map((d, i) => ({
				out: `dbg-${d}.webp`,
				src: `${SHOTS}/cloud/${15 + i}-dbg-${d}.png`,
				width: W.wide,
				q: 90,
			})),
			{ out: 'ui-f1.webp', src: `${SHOTS}/cloud/23-ui-f1.png`, width: W.wide },
			{ out: 'perf-panel.webp', src: `${SHOTS}/cloud/24-perf-panel.png` },
			// progress: same camera (F5, building) — the 09-04 raw window capture cropped around the building to the size
			// of progress-now, clear of the ImGui panel (the later captures have a wider panel that a crop this size would catch)
			{ out: 'progress-0904.webp', src: `${CLOUD_OLD}/2026-09-04-cpu-weahtermap.png`, crop: [277, 234, 1355, 762], q: 90 },
			// the user's tuned Cumulus + Autumn, level camera refit to the 09-04 view (0,7.89,93.5), cropped to the same
			// region as progress-0904 (hq/README.md)
			{ out: 'progress-now.webp', src: `${SHOTS}/cloud/hq/now-user-cumulus-autumn-level-crop.png`, q: 90 },
			// the textures themselves (Weather Map R, a Base and a Detail slice), rebuilt at native size by
			// shots/cloud/textures/gen-textures.cjs from the project's generator shaders; display-256.cjs brings them to 256²
			...['weather-coverage-256', 'base-128', 'detail-64'].map((t) => ({
				out: `tex-${t.split('-')[0]}.webp`,
				src: `${SHOTS}/cloud/textures/${t}-display.png`,
				q: 90,
			})),
			// Near Deep Shadow Cache (512²×80 τ), dumped from the GPU and cut through the middle on each axis by
			// shots/cloud/shadow-cache/slices.cjs; shown as transmittance exp(-τ), the vertical cuts stretched 2× in height
			{ out: 'shadow-xy.webp', src: `${SHOTS}/cloud/shadow-cache/slice-xy-mid.png`, q: 90 },
			...['xz', 'yz'].map((a) => ({ out: `shadow-${a}.webp`, src: `${SHOTS}/cloud/shadow-cache/slice-${a}-mid-x2.png`, q: 90 })),
			// near micro detail off / on, from the E19 experiment run (Cumulus, close-up camera, strength 0.5)
			{ out: 'near-micro-off.webp', src: `${CLOUD_E19}/Near75-c0-Composite.png`, width: W.wide, q: 90 },
			{ out: 'near-micro-on.webp', src: `${CLOUD_E19}/Near75-c1-Composite.png`, width: W.wide, q: 90 },
			// ray marching, from the vc-shadow-dump worktree harness (shots/cloud/raymarch/README.md): Stratus from above
			// with the view-sample jitter off / on (native 960×540 crops — the rings are faint), and per-pixel march
			// counters for the Cumulus horizon frame read back from the HDR target
			...['off', 'on'].map((s) => ({ out: `rings-${s}.webp`, src: `${SHOTS}/cloud/raymarch/rings-${s}-crop.png`, q: 95 })),
			{ out: 'march-samples.webp', src: `${SHOTS}/cloud/raymarch/cumulus-F6-full-samples-heatmap.png`, width: W.wide, q: 90 },
			{ out: 'march-early-exit.webp', src: `${SHOTS}/cloud/raymarch/cumulus-F6-early-exit.png`, width: W.wide, q: 90 },
		],
		// Goals loop: Altocumulus at sunset from F5, wind 400 m/s in real time, 16 s with a 0.5 s loop fade, rendered frame by frame at 2x and
		// encoded at CRF 18 (hq/README.md)
		copies: [{ out: 'goals.mp4', src: `${SHOTS}/cloud/hq/goals-altocumulus-sunset-building-400ms-16s.mp4` }],
		clips: [
			{
				out: 'cover.mp4',
				src: `${VIDEO}/Volumetric_Cloud.mp4`,
				// noon F6 → lavender F6, both continuous shots, joined by a cross-fade
				cuts: [
					[36.3, 38.6],
					[41.3, 43.6],
				],
				xfade: 0.8,
				// clouds read better slightly slowed down, and the loop gets long enough to settle
				speed: 0.75,
				// trims the small section label in the top-right corner
				crop: 'crop=1728:972:96:108',
			},
		],
	},
	'water-shader': {
		images: [
			{ out: 'cover.webp', src: `${FIG2}/water-shader/hero_full.png`, width: W.hero },
			...['basic', 'sunset', 'tropical'].flatMap((p) => [
				{ out: `preset-${p}-hero.webp`, src: `${FIG2}/water-shader/${p}_ocean_hero.jpg`, width: W.gallery },
				{ out: `preset-${p}-surface.webp`, src: `${FIG2}/water-shader/${p}_ocean_surface.jpg`, width: W.gallery },
				{ out: `preset-${p}-top.webp`, src: `${FIG2}/water-shader/${p}_top.jpg`, width: W.gallery },
			]),
			{ out: 'before.webp', src: `${FIG2}/water-shader/before.png`, width: W.wide },
			{ out: 'after.webp', src: `${FIG2}/water-shader/after.png`, width: W.wide },
			...[0, 1, 2, 3, 4, 5].map((m) => ({ out: `dbg-${m}.webp`, src: `${FIG2}/water-shader/dbg_${m}.png`, width: W.gallery })),
		],
	},
	sdfs: {
		images: [
			{ out: 'cover.webp', src: `${SHOTS}/sdf/carousel-wide.png`, width: W.hero },
			{ out: 'carousel.webp', src: `${SHOTS}/sdf/carousel-wide-v2.png` },
			...Array.from({ length: 13 }, (_, i) => {
				const n = String(i + 1).padStart(2, '0');
				return { out: `card-${n}.webp`, src: `${SHOTS}/sdf/card-${n}.png`, width: W.thumb, crop: /** @type {[number,number,number,number]} */ ([1, 0, 572, 572]) };
			}),
			{ out: 'ui-panel.webp', src: `${SHOTS}/sdf/ui-panel-card05.png`, width: W.wide },
			{ out: 'card11-terrain.webp', src: `${SHOTS}/sdf/card11-terrain-preview.png`, width: W.gallery },
		],
		sprites: [
			{ out: 'motion-smoothmin.webp', src: `${SHOTS}/sdf`, frames: range('card05-smoothmin-seq', 8), size: 320 },
			{ out: 'motion-volume.webp', src: `${SHOTS}/sdf`, frames: range('card12-volume-seq', 8), size: 320 },
			{ out: 'motion-dotgrid.webp', src: `${SHOTS}/sdf`, frames: range('card02-dotgrid-seq', 8), size: 320 },
		],
		clips: [
			{
				out: 'cover.mp4',
				src: `${VIDEO}/SDFs_Deck.mp4`,
				cuts: [[9, 45]],
				speed: 2.25,
			},
		],
	},
	'toon-shader': {
		images: [
			{ out: 'cover.webp', src: `${SHOTS}/toon/toon-final-norim-wide.png` },
			{ out: 'final-rim.webp', src: `${SHOTS}/toon/toon-final-wide.png` },
			{ out: 'step-1.webp', src: `${SHOTS}/toon/toon_s1_outline.png` },
			{ out: 'step-2.webp', src: `${SHOTS}/toon/toon_s2_lambert.png` },
			{ out: 'step-3.webp', src: `${SHOTS}/toon/toon_s3_cel.png` },
			{ out: 'step-4.webp', src: `${SHOTS}/toon/toon_s6_spec_norim.png` },
			{ out: 'step-5.webp', src: `${SHOTS}/toon/toon_s5_final.png` },
			...[1, 2, 3, 4, 5].map((n) => ({ out: `exp-${n}.webp`, src: `${FIG}/toon-exp${n}.png` })),
		],
		// hover preview: final look, then Lambert → cel bands → two colour experiments
		slides: [
			{
				out: 'cover.mp4',
				frames: [
					`${SHOTS}/toon/toon-final-norim-wide.png`,
					`${SHOTS}/toon/toon_s2_lambert.png`,
					`${SHOTS}/toon/toon_s3_cel.png`,
					`${FIG}/toon-exp3.png`,
					`${FIG}/toon-exp4.png`,
				],
				hold: 1.1,
				fade: 0.35,
				bg: '#7f7f7f',
				// trim the grey around each sphere so every slide shows it at the same size
				frame: true,
			},
		],
	},
	fdf: {
		images: FDF_MAPS.map((m, i) => ({
			out: i === 0 ? 'cover.webp' : `map-${m}.webp`,
			src: `${CAP}/fdf-final/${m}.png`,
			width: W.hero,
			frame: true,
		})),
		slides: [{ out: 'cover.mp4', frames: FDF_MAPS.map((m) => `${CAP}/fdf-final/${m}.png`), hold: 1.1, fade: 0.4, bg: '#000', frame: true }],
	},
	// the INPUT · 42.fdf panel, cut from a 3× render of the PDF page
	'fdf#pdf': {
		images: [{ out: 'input-42.webp', src: `${FIG2}/frames/FDF@3x.png`, crop: [300, 2400, 780, 576], width: W.gallery }],
	},
	// PDF hero still and the four panels .cub → 2D map → screen columns → render (cut from a 3× render of the page)
	'cub3d#pdf': {
		images: [
			{ out: 'hero-pdf.webp', src: `${FIG2}/cub3d/hero.png`, width: W.hero },
			{ out: 'flow-1-input.webp', src: `${FIG2}/frames/CUB3D@3x.png`, crop: [300, 2400, 1140, 576], width: W.gallery },
			{ out: 'flow-2-map.webp', src: `${FIG2}/frames/CUB3D@3x.png`, crop: [1560, 2400, 1188, 576], width: W.gallery },
			{ out: 'flow-3-screen.webp', src: `${FIG2}/frames/CUB3D@3x.png`, crop: [2868, 2400, 1188, 576], width: W.gallery },
			{ out: 'flow-4-render.webp', src: `${FIG2}/frames/CUB3D@3x.png`, crop: [4179, 2400, 1101, 576], width: W.gallery },
		],
	},
	cub3d: {
		images: [
			{ out: 'cover.webp', src: `${CAP}/cub3d/still-1.png`, width: W.hero },
			{ out: 'still-2.webp', src: `${CAP}/cub3d/still-2.png`, width: W.gallery },
			{ out: 'still-3.webp', src: `${CAP}/cub3d/still-3.png`, width: W.gallery },
		],
		// 1280×960 capture → 16:9 center crop
		clips: [{ out: 'cover.mp4', src: `${CAP}/cub3d/walk.mp4`, cuts: [[3, 8]], crop: 'crop=1280:720:0:120', crf: 30, height: 540 }],
	},
};

function range(prefix, n) {
	return Array.from({ length: n }, (_, i) => `${prefix}${i}.png`);
}

const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`;

/** Trim the flat background around a drawing, then pad it back out to 16:9 with some breathing room. */
async function framed(src, bg) {
	// flatten first: sharp trims before it composites, so transparent corners would stop the trim
	const flat = await sharp(src).flatten({ background: bg }).png().toBuffer();
	const { data, info } = await sharp(flat).trim({ background: bg, threshold: 12 }).toBuffer({ resolveWithObject: true });
	const pad = 1.25;
	let w = Math.round(info.width * pad);
	let h = Math.round(info.height * pad);
	if (w / h > 16 / 9) h = Math.round((w * 9) / 16);
	else w = Math.round((h * 16) / 9);
	const left = Math.floor((w - info.width) / 2);
	const top = Math.floor((h - info.height) / 2);
	return sharp(data).extend({ left, top, right: w - info.width - left, bottom: h - info.height - top, background: bg });
}

async function image(dir, { out, src, width, crop, q = 80, frame = false }) {
	let img = frame ? await framed(src, '#000') : sharp(src);
	if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] });
	if (width) img = img.resize({ width, withoutEnlargement: true });
	const dest = join(dir, out);
	// smartSubsample keeps colour edges (cloud rims against the sky) from smearing under 4:2:0 chroma
	await img.webp({ quality: q, effort: 5, smartSubsample: true }).toFile(dest);
	console.log('  ', out.padEnd(28), kb(dest));
}

async function sprite(dir, { out, src, frames, size }) {
	const tiles = await Promise.all(
		frames.map((f) => sharp(join(src, f)).resize(size, size, { fit: 'cover' }).toBuffer())
	);
	const dest = join(dir, out);
	await sharp({ create: { width: size * frames.length, height: size, channels: 3, background: '#000' } })
		.composite(tiles.map((input, i) => ({ input, left: i * size, top: 0 })))
		.webp({ quality: 82 })
		.toFile(dest);
	console.log('  ', out.padEnd(28), kb(dest), `(${frames.length} frames)`);
}

const encode = (crf) => ['-an', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high', '-movflags', '+faststart'];

/** Chain [v0][v1]… with cross-fades into [out]; input i lasts lens[i] seconds. */
function xfadeChain(lens, fade) {
	const steps = [];
	let acc = lens[0];
	let prev = 'v0';
	for (let i = 1; i < lens.length; i++) {
		const next = i === lens.length - 1 ? 'out' : `x${i}`;
		steps.push(`[${prev}][v${i}]xfade=transition=fade:duration=${fade}:offset=${(acc - fade).toFixed(3)}[${next}]`);
		acc += lens[i] - fade;
		prev = next;
	}
	return steps;
}

function clip(dir, { out, src, cuts, crop, crf = 26, height = 720, speed = 1, xfade = 0 }) {
	const dest = join(dir, out);
	const scale = `${crop ? crop + ',' : ''}scale=-2:${height}:flags=lanczos,fps=30,format=yuv420p`;
	const parts = cuts.map(([a, b], i) => `[0:v]trim=${a}:${b},setpts=(PTS-STARTPTS)/${speed},${scale}[v${i}]`);
	const joined =
		cuts.length === 1
			? ['[v0]null[out]']
			: xfade
				? xfadeChain(cuts.map(([a, b]) => (b - a) / speed), xfade)
				: [`${cuts.map((_, i) => `[v${i}]`).join('')}concat=n=${cuts.length}:v=1:a=0[out]`];
	execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', src, '-filter_complex', [...parts, ...joined].join(';'), '-map', '[out]', ...encode(crf), dest], {
		stdio: 'inherit',
	});
	console.log('  ', out.padEnd(28), kb(dest));
}

/** Still images → a cross-fading 1280×720 loop, for projects without footage. */
async function slides(dir, { out, frames, hold, fade, bg, frame = false }) {
	const tmp = mkdtempSync(join(tmpdir(), 'slides-'));
	try {
		const pngs = [];
		for (const [i, f] of frames.entries()) {
			const base = frame ? await framed(f, bg) : sharp(f).flatten({ background: bg });
			const png = join(tmp, `${i}.png`);
			await sharp(await base.png().toBuffer())
				.resize(1280, 720, { fit: 'contain', background: bg, kernel: 'lanczos3' })
				.flatten({ background: bg })
				.png()
				.toFile(png);
			pngs.push(png);
		}
		const len = hold + fade;
		const inputs = pngs.flatMap((p) => ['-loop', '1', '-t', String(len), '-framerate', '30', '-i', p]);
		const parts = pngs.map((_, i) => `[${i}:v]format=yuv420p,setsar=1[v${i}]`);
		const dest = join(dir, out);
		execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', [...parts, ...xfadeChain(pngs.map(() => len), fade)].join(';'), '-map', '[out]', ...encode(28), dest], {
			stdio: 'inherit',
		});
		console.log('  ', out.padEnd(28), kb(dest), `(${frames.length} slides)`);
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

const only = process.argv.slice(2);
for (const [slug, m] of Object.entries(manifest)) {
	const base = slug.split('#')[0];
	if (only.length && !only.includes(slug) && !only.includes(base)) continue;
	const dir = join('public/projects', base);
	mkdirSync(dir, { recursive: true });
	console.log(slug);
	const missing = [...(m.images ?? []).map((i) => i.src), ...(m.clips ?? []).map((c) => c.src), ...(m.slides ?? []).flatMap((sl) => sl.frames), ...(m.copies ?? []).map((c) => c.src)].filter(
		(f) => !existsSync(f)
	);
	if (missing.length) {
		console.warn('   skipped — missing sources:\n    ' + missing.join('\n    '));
		continue;
	}
	for (const i of m.images ?? []) await image(dir, i);
	for (const s of m.sprites ?? []) await sprite(dir, s);
	for (const c of m.clips ?? []) clip(dir, c);
	for (const sl of m.slides ?? []) await slides(dir, sl);
	for (const c of m.copies ?? []) {
		copyFileSync(c.src, join(dir, c.out));
		console.log(`   ${c.out.padEnd(28)} ${kb(join(dir, c.out))}`);
	}
}
