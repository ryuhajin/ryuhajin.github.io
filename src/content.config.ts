import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const media = z.object({
	/** Static poster / fallback (png, jpg, webp, svg). */
	poster: z.string(),
	/** Motion preview shown on hover and in the hero (webm/mp4 preferred, gif/svg also work). */
	video: z.string().optional(),
	alt: z.string().default(''),
});

const shot = z.object({ src: z.string(), label: z.string().optional(), note: z.string().optional() });

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		tagline: z.string(),
		order: z.number(),
		/** Marks placeholder content that should be replaced with real material. */
		sample: z.boolean().default(false),
		group: z.enum(['Computer Graphics', '42 Seoul']).default('Computer Graphics'),
		/** Short work-in-progress note shown in the hero (e.g. "Quality pass in progress"). */
		status: z.string().optional(),
		year: z.string(),
		role: z.string(),
		team: z.string().optional(),
		stack: z.array(z.string()),
		accent: z.string().default('#7c9cff'),
		cover: media,
		/** PROJECT GOAL */
		overview: z.string(),
		highlights: z.array(z.string()).default([]),
		specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
		/** YouTube video id — the player is loaded only after a click (youtube-nocookie). */
		video: z.object({ youtube: z.string(), poster: z.string().optional(), title: z.string().optional() }).optional(),
		techniques: z
			.array(z.object({ title: z.string(), sub: z.string().optional(), body: z.string(), formula: z.string().optional() }))
			.default([]),
		galleries: z
			.array(
				z.object({
					title: z.string(),
					kicker: z.string().optional(),
					caption: z.string().optional(),
					cols: z.number().default(3),
					/** thumbnail box: 'wide' (16:9), 'square', or 'auto' (natural ratio) */
					ratio: z.enum(['wide', 'square', 'auto']).default('wide'),
					items: z.array(shot),
				})
			)
			.default([]),
		/** Flipbooks: a horizontal sprite of `frames` equal square frames. */
		motion: z
			.array(z.object({ title: z.string(), sprite: z.string(), frames: z.number(), body: z.string(), formula: z.string().optional() }))
			.default([]),
		/** Progress viewer: `slider` for pixel-aligned before/after (first vs chosen step), otherwise step tabs. */
		compare: z
			.object({
				title: z.string(),
				kicker: z.string().optional(),
				caption: z.string().optional(),
				slider: z.boolean().default(false),
				steps: z.array(shot).min(2),
			})
			.optional(),
		architecture: z
			.object({
				image: z.string().optional(),
				caption: z.string().optional(),
				points: z.array(z.string()),
			})
			.optional(),
		problems: z
			.array(
				z.object({
					title: z.string(),
					problem: z.string(),
					approach: z.string(),
					result: z.string(),
				})
			)
			.default([]),
		decisions: z
			.array(
				z.object({
					choice: z.string(),
					why: z.string(),
					tradeoff: z.string().optional(),
				})
			)
			.default([]),
		limitations: z.array(z.string()).default([]),
		links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	projects,
};
