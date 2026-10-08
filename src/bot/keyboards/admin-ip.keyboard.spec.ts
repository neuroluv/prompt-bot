import {
	registrationIpCallback,
	registrationIpConfirmKeyboard,
	registrationIpDurationKeyboard,
} from './admin-ip.keyboard';

const userId = 'aad6cb91-05e7-436a-bf39-0de194ac9606';
describe('registration IP keyboard', () => {
	it('offers days and forever, and respects Telegram callback size', () => {
		const keyboard = registrationIpDurationKeyboard(userId, true);
		expect(keyboard.inline_keyboard.flat()).toContainEqual({
			text: 'Навсегда',
			callback_data: registrationIpCallback('choose', userId, null),
		});
		for (const row of keyboard.inline_keyboard)
			for (const item of row) {
				expect(item.text).not.toContain(userId);
				if ('callback_data' in item)
					expect(Buffer.byteLength(item.callback_data)).toBeLessThanOrEqual(64);
			}
	});
	it('requires a separate confirmation before a block or unblock', () => {
		expect(
			registrationIpConfirmKeyboard(userId, 7).inline_keyboard[0]?.[0],
		).toMatchObject({
			callback_data: registrationIpCallback('block', userId, 7),
		});
		expect(
			registrationIpConfirmKeyboard(userId, undefined).inline_keyboard[0]?.[0],
		).toMatchObject({
			callback_data: registrationIpCallback('confirm_unblock', userId),
		});
	});
});
