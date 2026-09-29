// One-shot: convert project screenshots / clips from their working folders into web-sized files under
// public/projects/<slug>/. Only the outputs are committed; re-run when the source captures change.
//   node scripts/import-project-media.mjs [slug ...]
// Needs sharp (dependency) and ffmpeg on PATH (for the loop clips).

import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SHOTS = 'C:/Users/da171/OneDrive/Desktop/figma-bridge/shots';
const VIDEO = 'C:/Users/da171/OneDrive/Desktop/figma-bridge/video';
const CLOUD_OLD = 'C:/Users/da171/OneDrive/Desktop/9-14일-비교용 구름';
const WATER = 'C:/Users/da171/WaterShader/docs/features/water-polish/captures';
const FIG = process.env.FIG_EXPORT ?? 'C:/Users/da171/AppData/Local/Temp/claude/fig-export';
const CAP = process.env.CAPTURES ?? 'C:/Users/da171/AppData/Local/Temp/claude/mlx-captures';

const W = { hero: 1920, wide: 1600, gallery: 1200, tile: 640, thumb: 480 };

/** @typedef {{ out: string, src: string, width?: number, crop?: [number, number, number, number], q?: number }} Img */
/** @typedef {{ out: string, src: string, frames: string[], size: number }} Sprite */
/** @typedef {{ out: string, src: string, cuts: [number, number][], crop?: string, crf?: number, height?: number }} Clip */

/** @type {Record<string, { images?: Img[], sprites?: Sprite[], clips?: Clip[] }>} */
const manifest = {
	'volumetric-cloud': {
		images: [
			{ out: 'cover.webp', src: `${SHOTS}/cloud/f6-lavender/run3/lavender_182019.png`, width: W.hero },
			{ out: 'sunset.webp', src: `${SHOTS}/cloud/f6-sunset/run2/sunset_180858.png`, width: W.wide },
			...['stratus', 'cumulus', 'altocumulus', 'custom'].flatMap((t, i) => [
				{
					out: `type-${t}-f6.webp`,
					src: t === 'altocumulus' ? `${SHOTS}/cloud/31-type-altocumulus-F6-hq.png` : `${SHOTS}/cloud/${String(3 + i * 2).padStart(2, '0')}-type-${t}-F6.png`,
					width: W.gallery,
				},
				{ out: `type-${t}-f8.webp`, src: `${SHOTS}/cloud/${String(4 + i * 2).padStart(2, '0')}-type-${t}-F8.png`, width: W.gallery },
			]),
			...[1, 2, 3, 4].map((n) => ({ out: `light-${n}.webp`, src: `${SHOTS}/cloud/${10 + n}-light-${n}-F8.png`, width: W.gallery })),
			...['weather', 'base', 'detail', 'final', 'direct', 'composite'].map((d, i) => ({
				out: `dbg-${d}.webp`,
				src: `${SHOTS}/cloud/${15 + i}-dbg-${d}.png`,
				width: W.tile,
			})),
			{ out: 'ui-f1.webp', src: `${SHOTS}/cloud/23-ui-f1.png`, width: W.wide },
			{ out: 'perf-panel.webp', src: `${SHOTS}/cloud/24-perf-panel.png` },
			// progress: same camera (F5, building) — raw window captures cropped around the building, clear of the ImGui panel
			{ out: 'progress-0904.webp', src: `${CLOUD_OLD}/2026-09-04-cpu-weahtermap.png`, crop: [500, 360, 908, 511] },
			{ out: 'progress-0908.webp', src: `${CLOUD_OLD}/260908-20.45-Urban.png`, crop: [500, 364, 908, 511] },
			{ out: 'progress-0914.webp', src: `${CLOUD_OLD}/user-initial-result.png`, crop: [508, 366, 908, 511] },
			{ out: 'progress-now.webp', src: `${SHOTS}/cloud/33-after-light1-hq.png` },
		],
		clips: [
			{
				out: 'cover.mp4',
				src: `${VIDEO}/Volumetric_Cloud.mp4`,
				cuts: [
					[36.2, 38.9],
					[41.1, 43.9],
				],
				// trims the small section label in the top-right corner
				crop: 'crop=1728:972:96:108',
			},
		],
	},
	'water-shader': {
		images: [
			{ out: 'cover.webp', src: `${WATER}/final_breakdown/mode0_tropical_ocean_wide.jpg` },
			...['before', 'step1_bugfix', 'step2_sun_glint', 'step3_ripple_detail', 'step4_water_body', 'step5_gerstner', 'step6_ocean_grid'].map(
				(s, i) => ({ out: `step-${i}.webp`, src: `${WATER}/${s}/tropical_sunward.jpg` })
			),
			...['basic', 'sunset', 'tropical'].map((p) => ({ out: `preset-${p}.webp`, src: `${WATER}/step6_ocean_grid/${p}_ocean_wide.jpg` })),
			...['basic', 'sunset', 'tropical'].map((p) => ({ out: `v1-${p}.webp`, src: `${SHOTS}/water/hq-${p}-reflect.png`, width: W.gallery })),
			...[0, 1, 2, 3, 5].map((m) => ({ out: `debug-${m}.webp`, src: `${WATER}/final_breakdown/mode${m}_tropical_oblique.jpg`, width: W.tile })),
			{ out: 'ui-panel.webp', src: `${SHOTS}/water/ui-panel-tropical.png`, width: W.wide },
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
				cuts: [[27, 35]],
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
	},
	fdf: {
		images: ['t1', '42', 'pyra', 'mars', 'julia', 'elem-fract'].map((m, i) => ({
			out: i === 0 ? 'cover.webp' : `map-${m}.webp`,
			src: `${CAP}/fdf/${m}.png`,
			width: W.hero,
		})),
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

async function image(dir, { out, src, width, crop, q = 80 }) {
	let img = sharp(src);
	if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] });
	if (width) img = img.resize({ width, withoutEnlargement: true });
	const dest = join(dir, out);
	await img.webp({ quality: q, effort: 5 }).toFile(dest);
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

function clip(dir, { out, src, cuts, crop, crf = 26, height = 720 }) {
	const dest = join(dir, out);
	const scale = `${crop ? crop + ',' : ''}scale=-2:${height}:flags=lanczos,fps=30,format=yuv420p`;
	const parts = cuts.map(([a, b], i) => `[0:v]trim=${a}:${b},setpts=PTS-STARTPTS,${scale}[v${i}]`);
	const concat = `${cuts.map((_, i) => `[v${i}]`).join('')}concat=n=${cuts.length}:v=1:a=0[out]`;
	execFileSync(
		'ffmpeg',
		['-v', 'error', '-y', '-i', src, '-filter_complex', [...parts, concat].join(';'), '-map', '[out]', '-an',
			'-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high', '-movflags', '+faststart', dest],
		{ stdio: 'inherit' }
	);
	console.log('  ', out.padEnd(28), kb(dest));
}

const only = process.argv.slice(2);
for (const [slug, m] of Object.entries(manifest)) {
	if (only.length && !only.includes(slug)) continue;
	const dir = join('public/projects', slug);
	mkdirSync(dir, { recursive: true });
	console.log(slug);
	const missing = [...(m.images ?? []).map((i) => i.src), ...(m.clips ?? []).map((c) => c.src)].filter((s) => !existsSync(s));
	if (missing.length) {
		console.warn('   skipped — missing sources:\n    ' + missing.join('\n    '));
		continue;
	}
	for (const i of m.images ?? []) await image(dir, i);
	for (const s of m.sprites ?? []) await sprite(dir, s);
	for (const c of m.clips ?? []) clip(dir, c);
}
