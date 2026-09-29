// Email buttons ([data-mail]): the address arrives reversed + base64 (see mailData in src/site.ts) so it never sits
// whole in the HTML. Here it is decoded into the button's [data-mail-text] and aria-label; a click copies it and flags
// the button with .copied for a moment (the button's own CSS shows the confirmation). If nothing can be copied it
// opens a mailto: instead.
export function initCopyEmail() {
	document.querySelectorAll<HTMLElement>('[data-mail]').forEach((el) => {
		if (el.dataset.mailBound) return;
		el.dataset.mailBound = '1';
		const address = [...atob(el.dataset.mail!)].reverse().join('');
		el.querySelectorAll('[data-mail-text]').forEach((t) => (t.textContent = address));
		el.setAttribute('aria-label', `이메일 주소 복사: ${address}`);
		let timer = 0;
		el.addEventListener('click', async () => {
			if (!(await copy(address))) {
				location.href = `mailto:${address}`;
				return;
			}
			el.classList.add('copied');
			clearTimeout(timer);
			timer = window.setTimeout(() => el.classList.remove('copied'), 1800);
		});
	});
}

// Clipboard API first; the older execCommand path covers browsers / embeds where it is blocked
async function copy(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const area = document.createElement('textarea');
		area.value = text;
		area.setAttribute('readonly', '');
		area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
		document.body.append(area);
		area.select();
		let ok = false;
		try {
			ok = document.execCommand('copy');
		} catch {
			ok = false;
		}
		area.remove();
		return ok;
	}
}
