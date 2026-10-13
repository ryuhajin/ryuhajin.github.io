import type { StarlightRouteData } from '@astrojs/starlight/route-data';

export type SidebarEntry = StarlightRouteData['sidebar'][number];
export type SidebarGroup = Extract<SidebarEntry, { type: 'group' }>;
export type SidebarLink = Extract<SidebarEntry, { type: 'link' }>;

const links = (entries: SidebarEntry[]): SidebarLink[] =>
	entries.flatMap((e) => (e.type === 'link' ? [e] : links(e.entries)));

/**
 * A folder's own page (its index.md): the group's first link, when every other page in the
 * folder lives under its URL. The tree uses it as the folder title's link.
 */
export function indexLinkOf(group: SidebarGroup): SidebarLink | undefined {
	const [first] = group.entries;
	if (first?.type !== 'link') return undefined;
	return links(group.entries).every((l) => l.href.startsWith(first.href)) ? first : undefined;
}

export function hasCurrent(group: SidebarGroup): boolean {
	return links(group.entries).some((l) => l.isCurrent);
}

export interface Crumb {
	label: string;
	href?: string;
}

/** Folders leading to the current page (Notes / Math / linear algebra); empty on the Notes home. */
export function crumbsFor(sidebar: SidebarEntry[]): Crumb[] {
	const path: SidebarGroup[] = [];
	const walk = (entries: SidebarEntry[]): boolean =>
		entries.some((e) => {
			if (e.type === 'link') return e.isCurrent;
			path.push(e);
			if (walk(e.entries)) return true;
			path.pop();
			return false;
		});
	if (!walk(sidebar) || path.length === 0) return [];
	// on a folder's own page the folder is the page title, so stop at its parent
	if (indexLinkOf(path[path.length - 1])?.isCurrent) path.pop();
	return [{ label: 'Notes', href: '/notes/' }, ...path.map((g) => ({ label: g.label, href: indexLinkOf(g)?.href }))];
}
