// Devlog lookups. An entry points at its project (`project` in frontmatter); project → entries is derived here at
// build time, so the relation is stored once.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Devlog = CollectionEntry<'devlog'>;
export type Project = CollectionEntry<'projects'>;

export const pad = (n: number) => String(n).padStart(2, '0');

/** URL slug of an entry = its file name (`water-shader/08-shadow-mapping` → `08-shadow-mapping`). */
export const entrySlug = (e: Devlog) => e.id.split('/').pop()!;
export const entryUrl = (e: Devlog) => `/devlog/${e.data.project.id}/${entrySlug(e)}/`;
/** The project's block on the Devlog page. */
export const blockUrl = (projectId: string) => `/devlog/#${projectId}`;

/** "2026.11.14" — dates are plain days, so read them in UTC. */
export const fmtDate = (d: Date) => d.toISOString().slice(0, 10).replaceAll('-', '.');

async function load(): Promise<Devlog[]> {
	const all = (await getCollection('devlog')).filter((e) => import.meta.env.DEV || !e.data.draft);
	const seen = new Map<string, string>();
	for (const e of all) {
		const key = `${e.data.project.id}#${e.data.part}`;
		if (seen.has(key)) throw new Error(`devlog: part ${e.data.part} of "${e.data.project.id}" is used by ${seen.get(key)} and ${e.id}`);
		seen.set(key, e.id);
	}
	return all;
}

// cached for the build only: the dev server must pick up entries as they are written
let cache: Promise<Devlog[]> | undefined;

/** All entries; drafts only under `npm run dev`. */
export function getDevlogs(): Promise<Devlog[]> {
	if (import.meta.env.DEV) return load();
	return (cache ??= load());
}

/** One project's entries, newest part first. */
export async function seriesOf(projectId: string): Promise<Devlog[]> {
	return (await getDevlogs()).filter((e) => e.data.project.id === projectId).sort((a, b) => b.data.part - a.data.part);
}

/** Previous / next entry inside the same series (never across projects). */
export async function neighbors(entry: Devlog): Promise<{ prev?: Devlog; next?: Devlog }> {
	const series = (await seriesOf(entry.data.project.id)).reverse();
	const i = series.findIndex((e) => e.id === entry.id);
	return { prev: series[i - 1], next: series[i + 1] };
}

/** Devlog page blocks: in-progress projects (even with no entries yet) and complete ones that have entries. */
export async function devlogBlocks() {
	const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
	const blocks = await Promise.all(projects.map(async (project) => ({ project, entries: await seriesOf(project.id) })));
	const newest = (b: (typeof blocks)[number]) => b.entries[0]?.data.date.getTime() ?? 0;
	return {
		inProgress: blocks.filter((b) => b.project.data.stage === 'in-progress').sort((a, b) => newest(b) - newest(a)),
		complete: blocks.filter((b) => b.project.data.stage === 'complete' && b.entries.length).sort((a, b) => newest(b) - newest(a)),
	};
}
