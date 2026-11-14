// Looping clips (article/Figure, devlog/story/Shot): load and play only near the viewport.
import { onMotionChange } from '../phone';
// Desktop clips autoplay in view. Compact/touch readers explicitly start each clip.
const clips = [...document.querySelectorAll<HTMLVideoElement>('video[data-lazy-clip]')];
const visible = new Set<HTMLVideoElement>();
let autoplayEnabled = false;
const update = (clip: HTMLVideoElement) => {
	if (document.hidden || !visible.has(clip)) {
		clip.pause();
		return;
	}
	// Once controls are shown, playback belongs to the reader: never undo a manual pause.
	if (autoplayEnabled && !clip.controls) {
		if (!clip.getAttribute('src')) clip.src = clip.dataset.src!;
		clip.play().catch(() => {});
	}
};
const io = new IntersectionObserver((entries) => {
	for (const { target, isIntersecting } of entries) {
		const clip = target as HTMLVideoElement;
		if (isIntersecting) visible.add(clip);
		else visible.delete(clip);
		update(clip);
	}
});
for (const clip of clips) {
	const button = clip.parentElement!.querySelector<HTMLButtonElement>('[data-clip-play]')!;
	button.addEventListener('click', async () => {
		if (!clip.getAttribute('src')) clip.src = clip.dataset.src!;
		clip.controls = true;
		button.hidden = true;
		clip.focus({ preventScroll: true });
		try { await clip.play(); } catch { button.hidden = false; }
	});
	clip.tabIndex = 0;
	io.observe(clip);
}
onMotionChange((enabled) => {
	autoplayEnabled = enabled;
	for (const clip of clips) {
		const button = clip.parentElement!.querySelector<HTMLButtonElement>('[data-clip-play]')!;
		clip.pause();
		button.hidden = enabled || clip.controls;
		update(clip);
	}
});
document.addEventListener('visibilitychange', () => clips.forEach(update));
addEventListener('pagehide', () => clips.forEach((clip) => clip.pause()));
addEventListener('pageshow', () => clips.forEach(update));
