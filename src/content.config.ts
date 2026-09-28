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

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		tagline: z.string(),
		order: z.number(),
		/** Marks placeholder content that should be replaced with real material. */
		sample: z.boolean().default(false),
		year: z.string(),
		role: z.string(),
		team: z.string().optional(),
		stack: z.array(z.string()),
		accent: z.string().default('#7c9cff'),
		cover: media,
		overview: z.string(),
		highlights: z.array(z.string()).default([]),
		architecture: z.object({
			image: z.string().optional(),
			caption: z.string().optional(),
			points: z.array(z.string()),
		}),
		problems: z.array(
			z.object({
				title: z.string(),
				problem: z.string(),
				approach: z.string(),
				result: z.string(),
			})
		),
		decisions: z.array(
			z.object({
				choice: z.string(),
				why: z.string(),
				tradeoff: z.string().optional(),
			})
		),
		links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
	}),
});

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	projects,
};
