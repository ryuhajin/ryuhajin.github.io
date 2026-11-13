// Phones / narrow screens (same breakpoint as the CSS): plain layout, no decorative motion.
export const PHONE_QUERY = '(max-width: 820px), (max-width: 1024px) and (max-height: 500px)';
export const HOVER_QUERY = '(hover: hover) and (pointer: fine)';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const isPhone = () => matchMedia(PHONE_QUERY).matches;

export const canAnimate = () => !isPhone() && matchMedia(HOVER_QUERY).matches && !matchMedia(REDUCED_MOTION_QUERY).matches;

/** Keep effects in sync with rotation, pointer changes, and accessibility preferences. */
export function onMotionChange(callback: (enabled: boolean) => void) {
	const queries = [PHONE_QUERY, HOVER_QUERY, REDUCED_MOTION_QUERY].map((query) => matchMedia(query));
	const update = () => callback(canAnimate());
	queries.forEach((query) => query.addEventListener('change', update));
	update();
	return () => queries.forEach((query) => query.removeEventListener('change', update));
}
