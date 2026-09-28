// Portfolio identity — edit freely.
export const site = {
	name: 'Ryu HaJin',
	handle: 'ryuhajin',
	role: 'Software Developer',
	focus: 'Graphics · Real-time Rendering · Engine Tools',
	intro: '실시간 렌더링과 엔진 툴을 만드는 개발자입니다. 화면 뒤에서 무슨 일이 일어나는지 이해하고, 그걸 도구로 만드는 일을 좋아합니다.',
	location: 'Seoul, KR',
	github: 'https://github.com/ryuhajin',
	email: '',
};

export type NavId = 'projects' | 'notes' | 'about';

export const nav: { id: NavId; label: string; href: string; hint: string }[] = [
	{ id: 'projects', label: 'Projects', href: '/projects/', hint: 'selected work' },
	{ id: 'notes', label: 'Notes', href: '/notes/', hint: 'study log · 270+ docs' },
	{ id: 'about', label: 'About', href: '/about/', hint: 'profile & contact' },
];
