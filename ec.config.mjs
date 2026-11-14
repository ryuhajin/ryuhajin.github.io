// Expressive Code (Notes code blocks). One Shiki theme per palette, scoped by <html data-palette>.
// Devlog entries use their own theme, scoped by data-code-theme on the story (src/pages/devlog/[project]/[entry].astro).
import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import houston from '@shikijs/themes/houston';
import { palettes } from './src/notes/palettes.mjs';

// Houston (Astro's theme) leaves function calls plain in HLSL (scope support.function); colour them in Houston's
// own function cyan, as it already does for Rust.
const houstonDevlog = {
	...houston,
	name: 'houston-devlog',
	tokenColors: [
		...houston.tokenColors,
		{ scope: ['support.function', 'entity.name.function', 'meta.function-call.generic'], settings: { foreground: '#00DAEF' } },
	],
};

export default defineEcConfig({
	themes: [...palettes.map((p) => p.codeTheme), houstonDevlog],
	useStarlightDarkModeSwitch: false,
	useStarlightUiThemeColors: false,
	themeCssSelector: (theme) => {
		const ids = palettes.filter((p) => p.codeTheme === theme.name).map((p) => `[data-palette='${p.id}']`);
		return ids.join(', ') || `[data-code-theme='${theme.name}']`;
	},
	styleOverrides: {
		borderRadius: '0.5rem',
		borderWidth: '1px',
		borderColor: 'var(--notes-code-border)',
		codeBackground: 'var(--notes-code-bg)',
		codeFontFamily: "'JetBrains Mono Variable', 'Cascadia Code', ui-monospace, monospace",
		codeFontSize: '0.8125rem',
		codeLineHeight: '1.65',
		codePaddingBlock: '0.9rem',
		codePaddingInline: '1.1rem',
		uiFontFamily: 'var(--__sl-font)',
		uiFontSize: '0.75rem',
		frames: {
			shadowColor: 'transparent',
			frameBoxShadowCssValue: 'none',
			editorTabBarBackground: 'var(--notes-code-chrome)',
			editorActiveTabBackground: 'var(--notes-code-bg)',
			editorActiveTabIndicatorTopColor: 'var(--sl-color-accent)',
			editorActiveTabIndicatorBottomColor: 'transparent',
			terminalTitlebarBackground: 'var(--notes-code-chrome)',
			terminalBackground: 'var(--notes-code-bg)',
			inlineButtonBorder: 'var(--notes-code-border)',
			inlineButtonBackgroundIdleOpacity: '0',
			inlineButtonBackgroundHoverOrFocusOpacity: '0.15',
			tooltipSuccessBackground: 'var(--sl-color-accent)',
		},
	},
	defaultProps: {
		wrap: false,
	},
});
