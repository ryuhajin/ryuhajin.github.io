// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
	site: 'https://ryuhajin.github.io',
	markdown: {
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [[rehypeKatex, { strict: false, throwOnError: false }]],
		}),
	},
	integrations: [
		starlight({
			title: "RyuHaJin's Notes",
			description: '그래픽스 · 엔진 · 수학 공부 기록',
			favicon: '/favicon.svg',
			head: [
				{ tag: 'link', attrs: { rel: 'icon', href: '/favicon-32.png', type: 'image/png', sizes: '32x32' } },
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
				{ tag: 'link', attrs: { rel: 'preload', href: '/fonts/pretendard-subset.woff2', as: 'font', type: 'font/woff2', crossorigin: '' } },
			],
			locales: { root: { label: '한국어', lang: 'ko' } },
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ryuhajin' }],
			sidebar: [{ autogenerate: { directory: 'notes', collapsed: true } }],
			customCss: [
				'katex/dist/katex.min.css',
				'./src/styles/fonts.css',
				'@fontsource-variable/jetbrains-mono',
				'./src/styles/page-transitions.css',
				'./src/styles/glitch.css',
				'./src/styles/notes/palettes.css',
				'./src/styles/notes/base.css',
			],
			components: {
				ThemeProvider: './src/components/notes/ThemeProvider.astro',
				Header: './src/components/notes/Header.astro',
				Sidebar: './src/components/notes/Sidebar.astro',
				MobileMenuFooter: './src/components/notes/MobileMenuFooter.astro',
			},
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
			lastUpdated: false,
			pagination: true,
		}),
	],
});
