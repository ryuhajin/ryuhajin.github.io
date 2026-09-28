// Expressive Code (Notes code blocks). One Shiki theme per palette, scoped by <html data-palette>.
import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import { palettes } from './src/notes/palettes.mjs';

export default defineEcConfig({
	themes: palettes.map((p) => p.codeTheme),
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
