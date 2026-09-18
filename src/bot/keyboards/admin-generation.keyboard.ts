import type { InlineKeyboardMarkup } from 'telegraf/types';
import { adminUserCallback } from './admin-user.keyboard';

export function adminGenerationKeyboard(input: {
	directusUrl: string;
	runId: string;
	userId: string;
}): InlineKeyboardMarkup {
	return {
		inline_keyboard: [
			[
				{
					text: '🧬 Открыть генерацию в Directus',
					url: directusRunUrl(input.directusUrl, input.runId),
				},
			],
			[
				{
					text: '🚫 Заблокировать пользователя',
					callback_data: adminUserCallback('block', input.userId),
				},
			],
		],
	};
}

export function directusRunUrl(baseUrl: string, runId: string): string {
	const url = new URL(baseUrl);
	url.pathname = `${url.pathname.replace(/\/+$/, '')}/admin/content/ai_runs/${encodeURIComponent(runId)}`;
	url.search = '';
	url.hash = '';
	return url.toString();
}
