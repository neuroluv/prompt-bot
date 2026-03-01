import type { MailingButton } from 'lib/types/mailing';

export const buildInlineKeyboard = (buttons: MailingButton[]) => {
	const sorted = [...buttons].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
	const rows: any[] = [];

	for (let i = 0; i < sorted.length; i += 2) {
		const a = sorted[i];
		const b = sorted[i + 1];
		const row: any[] = [];

		if (a?.url) row.push({ text: a.text, url: a.url });
		if (b?.url) row.push({ text: b.text, url: b.url });
		if (row.length) rows.push(row);
	}

	return rows.length ? { inline_keyboard: rows } : undefined;
};
