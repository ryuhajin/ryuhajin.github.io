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
const WATER_CAP = 'C:/Users/da171/WaterShader/docs/features/ocean-hero/captures';
const CLOUD_E19 = 'C:/Users/da171/VolumetricCloud/build/captures/cloud-near-micro/21564-19674375';
const WATER = 'C:/Users/da171/WaterShader/docs/features/water-polish/captures';
// images pulled from the portfolio Figma file (image fills at source size + 3× frame renders for the diagram panels)
const FIG2 = process.env.FIG2 ?? 'C:/Users/da171/AppData/Local/Temp/claude/C--Users-da171-ryuhajin-github-io/71bdedfe-b71e-4e3c-b1ae-5e40ffc56f66/scratchpad/fig2/img';

const W = { hero: 1920, wide: 1600, gallery: 1200, tile: 640, thumb: 480 };

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
		clips: [
			// 1920 master → 1600×900 for the page
			{ out: 'goals.mp4', src: `${SHOTS}/cloud/hq/goals-altocumulus-sunset-building-400ms-16s.mp4`, cuts: [[0, 16]], crf: 24, height: 900 },
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
			// hero: the Basic final cut (camera slot 1), captured by the app at 2560×1440 (WaterShader docs/features/ocean-hero)
			{ out: 'cover.webp', src: `${WATER_CAP}/final_slot1/basic_slot1.png`, width: 2560, q: 88 },
			// before/after: the same fixed `sunward` shot from the 2026-05 build and the 2026-10 gallery run
			{ out: 'compare-before.webp', src: `${WATER}/before/tropical_sunward.jpg`, q: 90 },
			{ out: 'compare-after.webp', src: `${WATER_CAP}/gallery_212204/tropical_sunward.png`, width: W.wide, q: 90 },
			{ out: 'goals.webp', src: `${SHOTS}/water-hq/goals-basic-slot4-poster.png`, width: W.wide, q: 90 },
			// section shots: 2560×1440 Release renders from the ws-capture worktree (`--render-size`, `--debug`,
			// `--far-waves off --align-ripples off` for the "normal map only" far field)
			...[
				['waves', 'waves-sunset-slot3'],
				['waves-far-debug', 'waves-far-debug-tropical-aerial'],
				['waves-far-off', 'waves-far-off-tropical-aerial'],
				['waves-far-on', 'waves-far-on-tropical-aerial'],
				['ripples', 'ripples-sunset-slot4'],
				['ripples-normal', 'ripples-normal-sunset-slot4'],
				['lighting', 'lighting-tropical-slot2'],
				['tonemap-none', 'lighting-tonemap-none-basic-surface'],
				['tonemap-aces-hue', 'lighting-tonemap-aces-hue-basic-surface'],
			].map(([out, src]) => ({ out: `${out}.webp`, src: `${SHOTS}/water-hq/sections/${src}.png`, width: W.wide, q: 90 })),
			// reflection detail: a 4:1 strip of camera slot 3 — the bank and its reflection, nothing below
			{ out: 'reflect.webp', src: `${SHOTS}/water-hq/sections/reflect-basic-slot3.png`, crop: [0, 760, 2560, 640], width: W.wide, q: 90 },
			...['basic', 'sunset', 'tropical'].flatMap((p) => [
				{ out: `preset-${p}-hero.webp`, src: `${FIG2}/water-shader/${p}_ocean_hero.jpg`, width: W.gallery },
				{ out: `preset-${p}-surface.webp`, src: `${FIG2}/water-shader/${p}_ocean_surface.jpg`, width: W.gallery },
				{ out: `preset-${p}-top.webp`, src: `${FIG2}/water-shader/${p}_top.jpg`, width: W.gallery },
			]),
			...[0, 1, 2, 3, 4, 5].map((m) => ({ out: `dbg-${m}.webp`, src: `${FIG2}/water-shader/dbg_${m}.png`, width: W.gallery })),
		],
		// Goals loop: Basic, camera slot 4, rendered frame by frame at 2560×1440 (ws-capture worktree, water-hq/README.md),
		// 16 s with a 0.5 s fade; the page copy is a 1280-wide CRF 27 re-encode of the CRF 18 master
		clips: [{ out: 'goals.mp4', src: `${SHOTS}/water-hq/goals-web-1280-27.mp4`, cuts: [[0, 16]], crf: 30 }],
	},
	sdfs: {
		// renderer-direct captures from the sdfs-capture worktree (test-only capture mode: --card --time --size --hide-ui
		// --out, --frames/--fps/--shifts for sequences); card faces are the centre card cropped from a 5120×2880 render,
		// except the thin-line cards 03 and 11, which are 1x crops (a 2x downsample fades their one-pixel lines)
		images: [
			{ out: 'cover.webp', src: `${SHOTS}/sdf-hq/final/cover.png`, width: 2560, q: 88 },
			{ out: 'goals.webp', src: `${SHOTS}/sdf-hq/final/goals-deck-poster.png`, width: W.wide, q: 90 },
			...['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13-xyz'].map((n) => ({
				out: `card-${n}.webp`,
				src: `${SHOTS}/sdf-hq/final/card-${n}.png`,
				q: 90,
			})),
		],
		clips: [
			// the deck sliding 08 → 09 → 10 → 11 (6.7 s rendered, last 0.6 s faded into the first), master 1920 → 720p
			{ out: 'goals.mp4', src: `${SHOTS}/sdf-hq/goals-deck-08-11-master.mp4`, cuts: [[0, 6.0667]], crf: 24 },
		],
	},
	// renderer-direct captures from the toon-capture worktree (5120×2880, see shots/toon-hq): hero and loop are 16:9
	// crops around the sphere, the step and preset tiles square crops — all 2× of the published size
	'toon-shader': {
		images: [
			{ out: 'cover.webp', src: `${SHOTS}/toon-hq/raw5k/final-rim-on.png`, crop: [960, 540, 3200, 1800], width: W.hero, q: 90 },
			{ out: 'overview.webp', src: `${SHOTS}/toon-hq/seq5k/f_0000.png`, crop: [960, 540, 3200, 1800], width: W.wide, q: 90 },
			...[
				['step-outline', 'step-1-outline'],
				['step-lambert', 'step-2-lambert'],
				['step-bands', 'step-4-bands-gradient'],
				['step-specular', 'step-5-specular'],
				['step-rim', 'step-6-rim'],
				['preset-exp1', 'experiment-1'],
				['preset-exp2', 'experiment-2'],
				['preset-exp3', 'experiment-3'],
				['preset-exp4', 'experiment-4'],
			].map(([out, src]) => ({ out: `${out}.webp`, src: `${SHOTS}/toon-hq/raw5k/${src}.png`, crop: [1780, 650, 1580, 1580], width: 790, q: 90 })),
			// the ImGui panels drawn at 2× density into a 2560×1440 back buffer
			{ out: 'ui.webp', src: `${SHOTS}/toon-hq/raw5k/ui-2x.png`, q: 90 },
		],
		// light swinging ±50° around the preset direction, 8 s, ends on its first frame
		copies: [{ out: 'overview.mp4', src: `${SHOTS}/toon-hq/light-swing-master.mp4` }],
	},
	// minilibx-linux capture port (WSL), 3840×2160, heights ×3 in the capture build (see shots/fdf-hq/README.md)
	fdf: {
		images: [
			{ out: 'cover.webp', src: `${SHOTS}/fdf-hq/raw/map-t1.png`, width: W.hero, q: 90 },
			// overview poster and loop: sparse maps only, trimmed and padded to 16:9 so their lines stay readable at 1280
			{ out: 'overview.webp', src: `${SHOTS}/fdf-hq/raw/map-elem.png`, frame: true, width: W.wide, q: 90 },
			{ out: 'step-text.webp', src: `${SHOTS}/fdf-hq/raw/step-42-a-text-dimzero.png`, q: 90 },
			// the same 1920×1080 window region around 42.fdf for the points and the wireframe
			{ out: 'step-points.webp', src: `${SHOTS}/fdf-hq/raw/step-42-b-points.png`, crop: [960, 477, 1920, 1080], width: W.gallery, q: 90 },
			{ out: 'step-wire.webp', src: `${SHOTS}/fdf-hq/raw/step-42-c-wire.png`, crop: [960, 477, 1920, 1080], width: W.gallery, q: 90 },
			{ out: 'fit-42-julia.webp', src: `${SHOTS}/fdf-hq/fit-pair-42-julia.png`, width: W.wide, q: 90 },
		],
		slides: [
			{
				out: 'overview.mp4',
				frames: ['elem', 'pyramide', 'pyra', 't2', 'basictest'].map((m) => `${SHOTS}/fdf-hq/raw/map-${m}.png`),
				hold: 1.4,
				fade: 0.4,
				bg: '#000',
				frame: true,
			},
		],
	},
	// minilibx-linux capture port (WSL), 2560×1920 build of the team's final code, capture map shots/cub3d-hq/meta
	cub3d: {
		images: [
			{ out: 'cover.webp', src: `${SHOTS}/cub3d-hq/raw/H2.png`, width: W.hero, q: 88 },
			// 16:9 centre crops (the game renders 4:3) so the side column stays level with the text
			{ out: 'overview.webp', src: `${SHOTS}/cub3d-hq/orbit-f0.png`, crop: [0, 120, 1280, 720], q: 88 },
			{ out: 'ray-corridor.webp', src: `${SHOTS}/cub3d-hq/raw/R1.png`, width: 1280, q: 88 },
			{ out: 'ray-map.webp', src: `${SHOTS}/cub3d-hq/raw/R4-map.png`, crop: [600, 0, 1960, 1604], width: 1280, q: 90 },
			{ out: 'tex-corner-1.webp', src: `${SHOTS}/cub3d-hq/raw/T1.png`, crop: [0, 240, 2560, 1440], width: 1280, q: 88 },
			{ out: 'tex-corner-2.webp', src: `${SHOTS}/cub3d-hq/raw/T2.png`, crop: [0, 240, 2560, 1440], width: 1280, q: 88 },
			{ out: 'color-cub.webp', src: `${SHOTS}/cub3d-hq/raw/T4.png`, crop: [0, 240, 2560, 1440], width: 1280, q: 88 },
			{ out: 'color-subject.webp', src: `${SHOTS}/cub3d-hq/raw/T5.png`, crop: [0, 240, 2560, 1440], width: 1280, q: 88 },
		],
		// one lap around the centre pillar (6 s, seamless), already 1280×960 from 2× frames
		clips: [{ out: 'overview.mp4', src: `${SHOTS}/cub3d-hq/orbit-loop-2x.mp4`, cuts: [[0, 6]], crop: 'crop=1280:720:0:120', crf: 30, height: 720 }],
	},
	// list / grid hover previews: the same footage as each page's Goals (or Overview) clip, re-encoded light at 540p
	'water-shader#hover': { clips: [{ out: 'cover.mp4', src: `${SHOTS}/water-hq/goals-web-1280-27.mp4`, cuts: [[0, 6]], crf: 28, height: 540 }] },
	'sdfs#hover': { clips: [{ out: 'cover.mp4', src: `${SHOTS}/sdf-hq/goals-deck-08-11-master.mp4`, cuts: [[0, 6.0667]], crf: 28, height: 540 }] },
	'toon-shader#hover': { clips: [{ out: 'cover.mp4', src: `${SHOTS}/toon-hq/light-swing-master.mp4`, cuts: [[0, 8]], crf: 28, height: 540 }] },
	'fdf#hover': { clips: [{ out: 'cover.mp4', src: 'public/projects/fdf/overview.mp4', cuts: [[0, 7.4]], crf: 30, height: 540 }] },
	'cub3d#hover': { clips: [{ out: 'cover.mp4', src: `${SHOTS}/cub3d-hq/orbit-loop-2x.mp4`, cuts: [[0, 6]], crop: 'crop=1280:720:0:120', crf: 34, height: 540 }] },
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
