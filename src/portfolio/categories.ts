// Work types for the Projects filter. To add one: extend the enum in src/content.config.ts, add it here and give it
// an icon in src/components/portfolio/CategoryIcon.astro.
export const categories = [
	{ id: 'shader', label: 'Shader' },
	{ id: 'render', label: 'Render' },
	{ id: 'tool', label: 'Tool' },
] as const;

export type CategoryId = (typeof categories)[number]['id'];
