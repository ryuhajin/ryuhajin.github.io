// One-shot migration: Jekyll + Just the Docs notes (docs/**) -> Starlight (src/content/docs/notes/**)
//
// - front matter: keep title, nav_order -> sidebar.order (global pre-order so folders sort correctly)
// - callouts:     {: .new-title} + "> ❓ title" blockquote -> :::tip[❓ title]
// - math:         kramdown $$ (inline or display by context) -> remark-math ($x$ inline, $$ fenced block)
// - images:       ![](src){: width="60%"} -> <img src alt width>
// - fences:       ```c++ -> ```cpp
// - redirects:    old /docs/<path>.html URLs -> meta-refresh stubs in public/docs/**
//
// Already run once for the Astro migration (the Jekyll docs/ folder lives on in git history).
// Usage: node scripts/migrate-jekyll.mjs [--src docs] [--out src/content/docs/notes]

import fs from 'node:fs';
import path from 'node:path';
import GithubSlugger from 'github-slugger';

const args = Object.fromEntries(
	process.argv.slice(2).reduce((acc, cur, i, arr) => (cur.startsWith('--') ? [...acc, [cur.slice(2), arr[i + 1]]] : acc), [])
);
const ROOT = process.cwd();
const SRC = path.resolve(ROOT, args.src ?? 'docs');
const OUT = path.resolve(ROOT, args.out ?? 'src/content/docs/notes');
const REDIRECT_OUT = path.resolve(ROOT, 'public/docs');
const NOTES_BASE = '/notes';

const report = { files: 0, callouts: 0, mathInline: 0, mathBlock: 0, images: 0, ialRemoved: 0, fences: 0, redirects: 0, warnings: [] };

// ---------------------------------------------------------------- front matter

function splitFrontMatter(text) {
	const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!m) return { data: {}, body: text };
	const data = {};
	for (const line of m[1].split(/\r?\n/)) {
		const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
		if (kv) data[kv[1]] = kv[2].trim();
	}
	return { data, body: text.slice(m[0].length) };
}

function unquote(v = '') {
	return v.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
}

function yamlString(v) {
	return JSON.stringify(v); // JSON strings are valid YAML double-quoted strings
}

// ---------------------------------------------------------------- tree + ordering

function walk(dir) {
	const node = { dir, index: null, files: [], dirs: [] };
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, ent.name);
		if (ent.isDirectory()) node.dirs.push(walk(full));
		else if (ent.name.endsWith('.md')) {
			const parsed = splitFrontMatter(fs.readFileSync(full, 'utf8'));
			const entry = { full, ...parsed };
			if (ent.name === 'index.md') node.index = entry;
			else node.files.push(entry);
		}
	}
	return node;
}

const navOrder = (e) => Number(e?.data?.nav_order ?? Number.MAX_SAFE_INTEGER);
const titleOf = (e, fallback) => unquote(e?.data?.title) || fallback;

/** Assign a global pre-order counter so Starlight's "folder = min(child order)" rule reproduces JtD's nav. */
function assignOrder(node, counter = { n: 1 }) {
	if (node.index) node.index.order = counter.n++;
	const children = [
		...node.files.map((f) => ({ kind: 'file', key: navOrder(f), title: titleOf(f, path.basename(f.full)), f })),
		...node.dirs.map((d) => ({ kind: 'dir', key: navOrder(d.index), title: titleOf(d.index, path.basename(d.dir)), d })),
	].sort((a, b) => a.key - b.key || a.title.localeCompare(b.title));
	for (const c of children) {
		if (c.kind === 'file') c.f.order = counter.n++;
		else assignOrder(c.d, counter);
	}
}

function* entries(node) {
	if (node.index) yield node.index;
	yield* node.files;
	for (const d of node.dirs) yield* entries(d);
}

// ---------------------------------------------------------------- body transforms

/** Split body into code-fence and prose segments so transforms never touch code. */
function segments(body) {
	const out = [];
	const lines = body.split(/\r?\n/);
	let buf = [];
	let fence = null;
	for (const line of lines) {
		const m = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
		if (!fence && m) {
			if (buf.length) out.push({ code: false, text: buf.join('\n') });
			buf = [line];
			fence = m[2];
		} else if (fence && m && m[2].startsWith(fence[0]) && m[2].length >= fence.length && !m[3].trim()) {
			buf.push(line);
			out.push({ code: true, text: buf.join('\n') });
			buf = [];
			fence = null;
		} else buf.push(line);
	}
	if (buf.length) out.push({ code: !!fence, text: buf.join('\n') });
	return out;
}

const KNOWN_LANGS = new Set(
	'c cpp hlsl glsl md markdown text txt bash sh shell json js ts python py cs csharp yaml ini html css xml diff'.split(' ')
);

function transformFence(text) {
	// normalize language case; non-language labels (```FText) become a titled plain-text block
	text = text.replace(/^(\s*(?:`{3,}|~{3,}))\s*([A-Za-z]+)\s*$/m, (_, f, lang) =>
		KNOWN_LANGS.has(lang.toLowerCase()) ? `${f}${lang.toLowerCase()}` : `${f}text title="${lang}"`
	);
	return text.replace(/^(\s*(?:`{3,}|~{3,}))\s*c\+\+\s*$/im, (_, f) => {
		report.fences++;
		return `${f}cpp`;
	});
}

function transformCallouts(text) {
	const lines = text.split('\n');
	const out = [];
	for (let i = 0; i < lines.length; i++) {
		const ial = lines[i].match(/^(\s*)\{:\s*\.([\w-]+)\s*\}\s*$/);
		if (ial && /^\s*>/.test(lines[i + 1] ?? '')) {
			const indent = ial[1];
			const quote = [];
			let j = i + 1;
			// kramdown lazy continuation: the quote runs until the first truly blank line
			while (j < lines.length && lines[j].trim()) {
				quote.push(/^\s*>/.test(lines[j]) ? lines[j].replace(/^\s*>\s?/, '') : lines[j].slice(indent.length));
				j++;
			}
			const title = quote.shift().trim();
			while (quote.length && !quote[0].trim()) quote.shift();
			const kind = ial[2].startsWith('warning') ? 'caution' : ial[2].startsWith('important') ? 'note' : 'tip';
			out.push(`${indent}:::${kind}[${title.replace(/[[\]]/g, '')}]`, ...quote.map((l) => (l ? indent + l : l)), `${indent}:::`);
			report.callouts++;
			i = j - 1;
			continue;
		}
		out.push(lines[i]);
	}
	return out.join('\n');
}

function transformImages(text) {
	return text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)\s*\{:\s*([^}]*)\}/g, (_, alt, src, attrs) => {
		report.images++;
		const width = attrs.match(/width\s*=\s*"([^"]+)"/)?.[1];
		const style = width ? ` style="width:${width}${/^\d+$/.test(width) ? 'px' : ''}"` : '';
		return `<img src="${src}" alt="${alt.replace(/"/g, '&quot;')}"${style} />`;
	});
}

function removeIal(text) {
	return text.replace(/^\s*\{:[^}]*\}\s*$/gm, () => {
		report.ialRemoved++;
		return '';
	});
}

/** kramdown: $$...$$ is display when it stands alone on its lines, otherwise inline. */
function transformMath(text, file) {
	let out = '';
	let i = 0;
	while (i < text.length) {
		const open = text.indexOf('$$', i);
		if (open === -1) {
			out += text.slice(i);
			break;
		}
		const close = text.indexOf('$$', open + 2);
		if (close === -1) {
			report.warnings.push(`${file}: unmatched $$`);
			out += text.slice(i);
			break;
		}
		const lineStart = text.lastIndexOf('\n', open - 1) + 1;
		const before = text.slice(lineStart, open);
		const lineEndIdx = text.indexOf('\n', close + 2);
		const after = text.slice(close + 2, lineEndIdx === -1 ? text.length : lineEndIdx);
		const inner = text.slice(open + 2, close);
		const standalone = /^[\s>]*$/.test(before) && !after.trim();

		if (standalone) {
			const prefix = before; // keeps list indentation / blockquote markers
			const body = inner
				.trim()
				.split('\n')
				.map((l) => l.replace(/^[\s>]*/, '').trimEnd())
				.filter((l) => l.length)
				.map((l) => prefix + l)
				.join('\n');
			const blank = prefix.replace(/\s+$/, '');
			out += text.slice(i, lineStart);
			if (out && !/\n\s*\n$/.test(out) && !/^\s*$/.test(out)) out += `${blank}\n`;
			out += `${prefix}$$\n${body}\n${prefix}$$\n`;
			// guarantee blank line after block
			const rest = text.slice(lineEndIdx === -1 ? text.length : lineEndIdx + 1);
			if (rest && !/^\s*\n/.test(rest) && rest.trim()) out += `${blank}\n`;
			i = lineEndIdx === -1 ? text.length : lineEndIdx + 1;
			report.mathBlock++;
		} else {
			if (inner.includes('\n')) report.warnings.push(`${file}: multi-line inline math near "${inner.slice(0, 40)}"`);
			out += text.slice(i, open) + '$' + inner.trim() + '$';
			i = close + 2;
			report.mathInline++;
		}
	}
	return out;
}

/** h1 is reserved for the page title in Starlight: when a note uses "# " for sections, shift every heading down one level. */
function demoteHeadings(segs) {
	const hasH1 = segs.some((s) => !s.code && /^#\s/m.test(s.text));
	if (!hasH1) return segs;
	report.demoted = (report.demoted ?? 0) + 1;
	return segs.map((s) => (s.code ? s : { ...s, text: s.text.replace(/^(#{1,5})(\s)/gm, '#$1$2') }));
}

function transformBody(body, file) {
	return demoteHeadings(segments(body))
		.map((seg) => {
			if (seg.code) return transformFence(seg.text);
			let t = seg.text;
			t = transformCallouts(t);
			t = transformImages(t);
			t = removeIal(t);
			t = transformMath(t, file);
			return t;
		})
		.join('\n');
}

// ---------------------------------------------------------------- urls

function newSlug(relPath) {
	const noExt = relPath.replace(/\.md$/, '');
	return noExt
		.split('/')
		.map((seg) => new GithubSlugger().slug(seg))
		.join('/')
		.replace(/\/?index$/, '');
}

function redirectHtml(to) {
	return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${to}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${to}"></head><body><a href="${to}">${to}</a><script>location.replace(${JSON.stringify(to)}+location.hash)</script></body></html>\n`;
}

// ---------------------------------------------------------------- main

const tree = walk(SRC);
assignOrder(tree);
const redirectMap = {};

for (const entry of entries(tree)) {
	const rel = path.relative(SRC, entry.full).split(path.sep).join('/');
	const isIndex = path.basename(rel) === 'index.md';
	const title = titleOf(entry, path.basename(rel, '.md'));

	const fm = ['---', `title: ${yamlString(title)}`, 'sidebar:', `  order: ${entry.order}`];
	if (isIndex) fm.push('  label: Overview');
	fm.push('---', '');

	// Starlight renders the title itself; drop a leading "# <title>" that would duplicate it.
	const norm = (s) => s.replace(/["'`*_]/g, '').trim().toLowerCase();
	const stripped = entry.body.replace(/^\s*#\s+(.+?)\s*\r?\n/, (m, h) => (norm(h) === norm(title) ? '' : m));
	const body = transformBody(stripped, rel);
	const target = path.join(OUT, rel);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, fm.join('\n') + body.replace(/^\s*\n/, '\n'));
	report.files++;

	// redirects: /docs/<rel>.html (and folder index) -> /notes/<slug>/
	const slug = newSlug(rel);
	const to = `${NOTES_BASE}/${slug}${slug ? '/' : ''}`;
	const oldHtml = `docs/${rel.replace(/\.md$/, '.html')}`;
	redirectMap[`/${oldHtml}`] = to;
	const stub = path.join(REDIRECT_OUT, rel.replace(/\.md$/, '.html'));
	fs.mkdirSync(path.dirname(stub), { recursive: true });
	fs.writeFileSync(stub, redirectHtml(to));
	report.redirects++;
}

fs.writeFileSync(path.join(ROOT, 'scripts/redirect-map.json'), JSON.stringify(redirectMap, null, 2) + '\n');

console.log(
	`migrated ${report.files} files | callouts ${report.callouts} | math inline ${report.mathInline} block ${report.mathBlock} | images ${report.images} | ial removed ${report.ialRemoved} | c++ fences ${report.fences} | redirects ${report.redirects} | heading-demoted files ${report.demoted ?? 0}`
);
if (report.warnings.length) console.log('warnings:\n  ' + report.warnings.join('\n  '));

