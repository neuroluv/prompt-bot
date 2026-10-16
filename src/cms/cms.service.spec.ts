import type { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { CmsService } from './cms.service';

describe('CMS authenticated downloads', () => {
	function fixture() {
		const config = {
			getOrThrow: (key: string) =>
				({
					CMS_URL: 'https://admin.neuroluv.test/',
					CMS_TOKEN: 'test-service-token',
				})[key],
		} as unknown as ConfigService;
		const service = new CmsService(config, { error: jest.fn() } as never);
		const get = jest.spyOn(service.http, 'get');
		return { service, get };
	}
	it('reads published file metadata through the authenticated CMS client', async () => {
		const { service, get } = fixture();
		const file = {
			id: 1,
			title: 'Сборник',
			file: { id: 'file-id', filename_download: 'Сборник.pdf' },
		};
		get.mockResolvedValue({ data: { data: [file] } });
		expect(await service.getPromptFileByName('prompts50')).toEqual(file);
		expect(service.http.defaults.baseURL).toBe('https://admin.neuroluv.test');
		expect(service.http.defaults.headers.Authorization).toBe(
			'Bearer test-service-token',
		);
		expect(get).toHaveBeenCalledWith('/items/prompt_files', {
			params: {
				filter: {
					system_name: { _eq: 'prompts50' },
					status: { _eq: 'published' },
				},
				fields: ['id', 'title', 'file.id', 'file.filename_download'],
				limit: 1,
			},
		});
	});
	it('rejects an absent or unlinked file before attempting delivery', async () => {
		for (const data of [[], [{ id: 1, file: null }]]) {
			const { service, get } = fixture();
			get.mockResolvedValue({ data: { data } });
			await expect(service.getPromptFileByName('missing')).rejects.toThrow(
				'Файл для скачивания не найден',
			);
		}
	});
	it('streams an original by ID rather than using filename_disk or a public URL', async () => {
		const { service, get } = fixture();
		const stream = Readable.from(['private PDF']);
		get.mockResolvedValue({ data: stream });
		expect(await service.getDirectusFileStream('file-id')).toBe(stream);
		expect(get).toHaveBeenCalledWith('/assets/file-id', {
			responseType: 'stream',
			params: { download: 1 },
			timeout: 60000,
		});
		stream.destroy();
	});
	it('does not fall back to an anonymous request on access or network errors', async () => {
		const { service, get } = fixture();
		get.mockRejectedValue(new Error('upstream unavailable'));
		await expect(service.getDirectusFileStream('file-id')).rejects.toThrow(
			'upstream unavailable',
		);
		expect(get).toHaveBeenCalledTimes(1);
	});
});
