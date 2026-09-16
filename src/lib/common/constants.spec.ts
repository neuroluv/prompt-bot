import { parseTelegramAdminIds } from './constants';

describe('parseTelegramAdminIds', () => {
	it('parses, trims and deduplicates comma-separated administrator IDs', () => {
		expect(parseTelegramAdminIds(' 785206267,613433290,785206267 ')).toEqual([
			785206267, 613433290,
		]);
	});

	it('rejects usernames and malformed IDs', () => {
		expect(() => parseTelegramAdminIds('785206267,@admin')).toThrow(
			'TELEGRAM_ADMIN_IDS',
		);
	});
});
