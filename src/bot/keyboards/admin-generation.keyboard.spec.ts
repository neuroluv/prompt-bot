import {
	adminGenerationKeyboard,
	directusRunUrl,
} from './admin-generation.keyboard';

describe('adminGenerationKeyboard', () => {
	it('links to the Directus run and exposes the protected block callback', () => {
		const runId = 'e345b959-e917-4b00-9e6e-713b7cc58952';
		const userId = 'b9a69061-d5db-4c79-9496-e36fd3ef3060';
		const keyboard = adminGenerationKeyboard({
			directusUrl: 'https://admin.neuroluv.ru',
			runId,
			userId,
		});

		expect(keyboard.inline_keyboard[0]?.[0]).toEqual({
			text: '🧬 Открыть генерацию в Directus',
			url: `https://admin.neuroluv.ru/admin/content/ai_runs/${runId}`,
		});
		expect(keyboard.inline_keyboard[1]?.[0]).toEqual({
			text: '🚫 Заблокировать пользователя',
			callback_data: `admin_user:block:${userId}`,
		});
	});

	it('normalizes an existing Directus base path', () => {
		expect(
			directusRunUrl(
				'https://admin.neuroluv.ru/',
				'e345b959-e917-4b00-9e6e-713b7cc58952',
			),
		).toBe(
			'https://admin.neuroluv.ru/admin/content/ai_runs/e345b959-e917-4b00-9e6e-713b7cc58952',
		);
	});
});
