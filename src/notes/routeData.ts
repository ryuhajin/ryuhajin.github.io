import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

// The site root is the portfolio; the Notes title should lead back to the Notes home.
export const onRequest = defineRouteMiddleware((context) => {
	context.locals.starlightRoute.siteTitleHref = '/notes/';
});
