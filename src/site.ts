// Portfolio identity — edit freely.
export const site = {
	name: 'Ryu HaJin',
	handle: 'ryuhajin',
	role: 'Technical Artist',
	focus: 'Shaders · Real-time Rendering · Tools',
	// \n = line break on the landing page and About (white-space: pre-line); collapses to a space in meta tags
	intro: '궁금한 장면이 생기면 직접 만들어 보고, 그 과정을 글로 남깁니다.\n이 사이트는 그 기록의 전시장입니다.',
	location: 'Seoul, KR',
	github: 'https://github.com/ryuhajin',
	email: 'edmbuffer@gmail.com',
};

// The address never appears whole in the HTML (address harvesters): pages carry it reversed + base64 in data-mail and
// src/scripts/copy-email.ts puts it back together in the browser.
export const mailData = btoa([...site.email].reverse().join(''));

export type NavId = 'projects' | 'notes' | 'about';

export const nav: { id: NavId; label: string; href: string; hint: string }[] = [
	{ id: 'projects', label: 'Projects', href: '/projects/', hint: 'selected work' },
	{ id: 'notes', label: 'Notes', href: '/notes/', hint: 'study log · 270+ docs' },
	{ id: 'about', label: 'About', href: '/about/', hint: 'profile & contact' },
];
