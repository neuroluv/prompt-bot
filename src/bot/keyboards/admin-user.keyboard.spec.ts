import {
	adminUserCallback,
	adminUserKeyboard,
	directusUserUrl,
} from './admin-user.keyboard';

const userId = 'aad6cb91-05e7-436a-bf39-0de194ac9606';

describe('adminUserKeyboard', () => {
	it('builds block/status controls without displaying the user ID', () => {
		const keyboard = adminUserKeyboard({
			directusUrl: directusUserUrl('https://admin.neuroluv.ru', userId),
			status: 'active',
			userId,
		});

		expect(keyboard.inline_keyboard[0]?.[0]).toEqual({
			text: '🚫 Заблокировать',
			callback_data: adminUserCallback('block', userId),
		});
		expect(
			JSON.stringify(
				keyboard.inline_keyboard.map((row) => row.map((item) => item.text)),
			),
		).not.toContain(userId);
		expect(keyboard.inline_keyboard[1]?.[0]).toEqual({
			text: '👤 Открыть в Directus',
			url: `https://admin.neuroluv.ru/admin/content/ai_users/${userId}`,
		});
	});

	it('switches the primary action to unblock for a blocked account', () => {
		const keyboard = adminUserKeyboard({
			directusUrl: directusUserUrl('https://admin.neuroluv.ru', userId),
			status: 'blocked',
			userId,
		});

		expect(keyboard.inline_keyboard[0]?.[0]).toEqual({
			text: '↩️ Разблокировать',
			callback_data: adminUserCallback('unblock', userId),
		});
	});
});
