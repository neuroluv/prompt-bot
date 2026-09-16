import { ConfigService } from '@nestjs/config';
import { StudioAdminUsersService } from './admin-users.service';

describe('StudioAdminUsersService', () => {
	afterEach(() => jest.restoreAllMocks());

	it('calls the protected Neuroluv block endpoint with the acting Telegram admin', async () => {
		const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
			new Response(
				JSON.stringify({
					id: 'aad6cb91-05e7-436a-bf39-0de194ac9606',
					status: 'blocked',
					changed: true,
					revokedSessions: 2,
				}),
				{ status: 200, headers: { 'content-type': 'application/json' } },
			),
		);
		const service = new StudioAdminUsersService(
			config({
				NEUROLUV_API_URL: 'https://api.neuroluv.test/v1/',
				PROMPT_BOT_INTERNAL_TOKEN: 's'.repeat(32),
			}),
		);

		const result = await service.block(
			'aad6cb91-05e7-436a-bf39-0de194ac9606',
			785206267,
		);

		expect(result).toMatchObject({ status: 'blocked', revokedSessions: 2 });
		const [url, request] = fetchMock.mock.calls[0];
		expect((url as URL).href).toBe(
			'https://api.neuroluv.test/v1/internal/prompt-bot/users/aad6cb91-05e7-436a-bf39-0de194ac9606/block',
		);
		expect(request).toMatchObject({
			method: 'POST',
			body: JSON.stringify({ adminTelegramId: '785206267' }),
		});
		expect(new Headers(request.headers).get('authorization')).toBe(
			`Bearer ${'s'.repeat(32)}`,
		);
	});
});

function config(values: Record<string, string>): ConfigService {
	return {
		get: (key: string) => values[key],
	} as ConfigService;
}
