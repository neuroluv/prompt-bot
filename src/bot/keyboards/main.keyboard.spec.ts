import { mainKeyboard } from './main.keyboard';

describe('mainKeyboard', () => {
	it('opens Neuroluv Studio as the first Mini App button', () => {
		const keyboard = mainKeyboard('https://neuroluv.ru/ai');
		const first = keyboard[0]?.[0] as {
			text?: string;
			url?: string;
			web_app?: { url: string };
		};

		expect(first.text).toBe('Нейролюб Studio');
		expect(first.web_app).toEqual({ url: 'https://neuroluv.ru/ai' });
		expect(first.url).toBeUndefined();
	});
});
