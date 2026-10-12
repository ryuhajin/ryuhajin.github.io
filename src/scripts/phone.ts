// Phones / narrow screens (same breakpoint as the CSS): plain layout, no decorative motion.
export const PHONE_QUERY = '(max-width: 820px)';

export const isPhone = () => matchMedia(PHONE_QUERY).matches;
