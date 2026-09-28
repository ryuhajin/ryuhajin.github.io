// Builds public/fonts/pretendard-subset.woff2: one Pretendard Variable file instead of ~90 unicode-range
// chunks, so every page uses the same (cached) font and text never re-flows while chunks arrive.
//
// Glyphs kept: printable ASCII + common punctuation/symbols, the 2,350 KS X 1001 Hangul syllables,
// Hangul jamo, and every character that appears in the site content. Rare characters outside the set
// fall back to the system font.
//
// Run after adding lots of new text with unusual characters:  node scripts/build-fonts.mjs

import fs from 'node:fs';
import path from 'node:path';
import subsetFont from 'subset-font';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2');
const OUT = path.join(ROOT, 'public/fonts/pretendard-subset.woff2');

const chars = new Set();
const addRange = (a, b) => {
	for (let c = a; c <= b; c++) chars.add(String.fromCodePoint(c));
};

addRange(0x20, 0x7e); // ASCII
addRange(0xa0, 0xff); // Latin-1 supplement
addRange(0x2010, 0x2027); // dashes, quotes, bullets, ellipsis
addRange(0x2030, 0x203a);
addRange(0x2190, 0x2199); // arrows
addRange(0x3131, 0x318e); // Hangul compatibility jamo
'·×÷±≤≥≠≈∞°√∑∏∫∂∇←→↑↓↔⇒⇔…※★☆○●◎◇◆□■△▲▽▼'.split('').forEach((c) => chars.add(c));

// KS X 1001 Hangul: EUC-KR rows B0–C8, cells A1–FE
const euckr = new TextDecoder('euc-kr');
for (let hi = 0xb0; hi <= 0xc8; hi++)
	for (let lo = 0xa1; lo <= 0xfe; lo++) {
		const ch = euckr.decode(new Uint8Array([hi, lo]));
		if (ch && ch !== '�') chars.add(ch);
	}

// everything the site actually uses
function* walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const f = path.join(dir, e.name);
		if (e.isDirectory()) yield* walk(f);
		else if (/\.(md|mdx|astro|ts|mjs)$/.test(e.name)) yield f;
	}
}
for (const f of walk(path.join(ROOT, 'src'))) for (const ch of fs.readFileSync(f, 'utf8')) if (ch.codePointAt(0) > 0x7f) chars.add(ch);

const text = [...chars].join('');
const out = await subsetFont(fs.readFileSync(SRC), text, { targetFormat: 'woff2', preserveNameIds: [1, 2, 3, 4, 5, 6] });
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(`${chars.size} characters -> ${path.relative(ROOT, OUT)} (${Math.round(out.length / 1024)} KB)`);
