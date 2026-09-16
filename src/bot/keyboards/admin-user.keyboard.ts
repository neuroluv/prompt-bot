import type { InlineKeyboardMarkup } from 'telegraf/types';

export type AdminUserAction = 'block' | 'status' | 'unblock';

export function adminUserKeyboard(input: {
	directusUrl: string;
	status: string;
	userId: string;
}): InlineKeyboardMarkup {
	const blocked = input.status === 'blocked';
	return {
		inline_keyboard: [
			[
				{
					text: blocked ? '↩️ Разблокировать' : '🚫 Заблокировать',
					callback_data: adminUserCallback(
						blocked ? 'unblock' : 'block',
						input.userId,
					),
				},
				{
					text: '🔎 Проверить',
					callback_data: adminUserCallback('status', input.userId),
				},
			],
			[{ text: '👤 Открыть в Directus', url: input.directusUrl }],
		],
	};
}

export function adminUserCallback(
	action: AdminUserAction,
	userId: string,
): string {
	return `admin_user:${action}:${userId}`;
}

export function directusUserUrl(cmsUrl: string, userId: string): string {
	const url = new URL(cmsUrl);
	url.pathname = `${url.pathname.replace(/\/+$/, '')}/admin/content/ai_users/${encodeURIComponent(userId)}`;
	url.search = '';
	url.hash = '';
	return url.toString();
}
