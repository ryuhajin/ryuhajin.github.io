// Intrinsic size of an image under public/, read once at build time so <img>/<video> can carry width/height
// (the browser reserves the box before the file arrives, so lazy images don't push the text down).
import sharp from 'sharp';
import { join } from 'node:path';

type Size = { width: number; height: number };
const cache = new Map<string, Promise<Size | undefined>>();

export function imageSize(src: string | undefined): Promise<Size | undefined> {
	if (!src?.startsWith('/')) return Promise.resolve(undefined);
	let size = cache.get(src);
	if (!size) {
		size = sharp(join(process.cwd(), 'public', decodeURI(src)))
			.metadata()
			.then((m) => (m.width && m.height ? { width: m.width, height: m.height } : undefined))
			.catch(() => undefined);
		cache.set(src, size);
	}
	return size;
}
