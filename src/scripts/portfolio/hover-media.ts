// Dennis Snellenberg–style hover media:
//  - [data-follow]      : a floating preview that trails the cursor (lerp) while hovering [data-media-src] rows
//  - [data-cursor-label]: a small label ("View") that follows the cursor inside cards
//  - video[data-hover-play] inside cards: loaded lazily and played only while hovered

const LERP = 0.2;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

let cleanups: (() => void)[] = [];

function follower(el: HTMLElement) {
	let raf = 0;
	const pos = { x: innerWidth / 2, y: innerHeight / 2 };
	const target = { ...pos };
	const loop = () => {
		const dx = target.x - pos.x;
		pos.x += dx * LERP;
		pos.y += (target.y - pos.y) * LERP;
		const tilt = Math.max(-8, Math.min(8, dx * 0.05));
		el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) rotate(${tilt}deg)`;
		raf = requestAnimationFrame(loop);
	};
	return {
		move(x: number, y: number, jump = false) {
			target.x = x;
			target.y = y;
			if (jump) Object.assign(pos, target);
		},
		start() {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(loop);
		},
		stop() {
			cancelAnimationFrame(raf);
		},
	};
}

function playOnHover(card: HTMLElement) {
	const video = card.querySelector<HTMLVideoElement>('video[data-hover-play]');
	if (!video) return () => {};
	const enter = () => {
		if (!video.src && video.dataset.src) video.src = video.dataset.src;
		video.play().catch(() => {});
	};
	const leave = () => video.pause();
	card.addEventListener('pointerenter', enter);
	card.addEventListener('pointerleave', leave);
	card.addEventListener('focusin', enter);
	card.addEventListener('focusout', leave);
	return () => {
		card.removeEventListener('pointerenter', enter);
		card.removeEventListener('pointerleave', leave);
		card.removeEventListener('focusin', enter);
		card.removeEventListener('focusout', leave);
	};
}

export function initHoverMedia() {
	cleanups.forEach((fn) => fn());
	cleanups = [];

	document.querySelectorAll<HTMLElement>('[data-hover-card]').forEach((card) => cleanups.push(playOnHover(card)));
	if (!finePointer()) return;

	// floating preview for list rows
	const preview = document.querySelector<HTMLElement>('[data-follow]');
	if (preview) {
		const f = follower(preview);
		cleanups.push(() => f.stop());
		const img = preview.querySelector('img')!;
		const video = preview.querySelector('video')!;
		let active = false;
		let idle = 0;
		document.querySelectorAll<HTMLElement>('[data-media-src]').forEach((row) => {
			const enter = (e: PointerEvent) => {
				clearTimeout(idle);
				const { mediaSrc = '', mediaVideo } = row.dataset;
				img.src = mediaSrc;
				if (mediaVideo) {
					video.src = mediaVideo;
					video.hidden = false;
					video.play().catch(() => {});
				} else {
					video.hidden = true;
					video.pause();
					video.removeAttribute('src');
					video.load(); // drop the previous clip's last frame
				}
				preview.style.setProperty('--accent', row.dataset.accent ?? '');
				f.move(e.clientX, e.clientY, !active);
				active = true;
				preview.classList.add('show');
				f.start();
			};
			const move = (e: PointerEvent) => f.move(e.clientX, e.clientY);
			// keep gliding between adjacent rows; park the loop once the preview has faded out
			const leave = () => {
				preview.classList.remove('show');
				idle = window.setTimeout(() => {
					active = false;
					f.stop();
				}, 300);
			};
			row.addEventListener('pointerenter', enter);
			row.addEventListener('pointermove', move);
			row.addEventListener('pointerleave', leave);
			cleanups.push(() => {
				row.removeEventListener('pointerenter', enter);
				row.removeEventListener('pointermove', move);
				row.removeEventListener('pointerleave', leave);
			});
		});
	}

	// cursor label inside cards
	const label = document.querySelector<HTMLElement>('[data-cursor-label]');
	if (label) {
		const f = follower(label);
		cleanups.push(() => f.stop());
		let idle = 0;
		document.querySelectorAll<HTMLElement>('[data-hover-card]').forEach((card) => {
			const enter = (e: PointerEvent) => {
				clearTimeout(idle);
				f.move(e.clientX, e.clientY, !label.classList.contains('show'));
				label.classList.add('show');
				f.start();
			};
			const move = (e: PointerEvent) => f.move(e.clientX, e.clientY);
			const leave = () => {
				label.classList.remove('show');
				idle = window.setTimeout(() => f.stop(), 300);
			};
			card.addEventListener('pointerenter', enter);
			card.addEventListener('pointermove', move);
			card.addEventListener('pointerleave', leave);
			cleanups.push(() => {
				card.removeEventListener('pointerenter', enter);
				card.removeEventListener('pointermove', move);
				card.removeEventListener('pointerleave', leave);
			});
		});
	}
}
