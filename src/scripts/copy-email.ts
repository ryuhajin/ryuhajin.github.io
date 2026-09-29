// Email buttons ([data-copy-email="address"]): a click copies the address and flags the button with .copied for a
// moment (the button's own CSS shows the confirmation). If nothing can be copied it opens a mailto: instead.
export function initCopyEmail() {
	document.querySelectorAll<HTMLElement>('[data-copy-email]').forEach((el) => {
		if (el.dataset.copyBound) return;
		el.dataset.copyBound = '1';
		let timer = 0;
		el.addEventListener('click', async () => {
			const address = el.dataset.copyEmail!;
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
