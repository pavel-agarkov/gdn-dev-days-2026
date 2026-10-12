import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../pages/api/contributions/[username]';
import {
	ContributionsProxyError,
	createContributionsService,
} from './contributions';

const jsonResponse = (value: unknown, status = 200) =>
	new Response(JSON.stringify(value), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('createContributionsService', () => {
	it('fetches and returns the upstream JSON', async () => {
		const payload = { total: 12 };
		const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(payload));
		const getContributions = createContributionsService({ fetcher });

		await expect(getContributions('octocat')).resolves.toEqual(payload);
		expect(fetcher).toHaveBeenCalledWith(
			'https://github.com/octocat.contribs',
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);
	});

	it('rejects invalid usernames without contacting GitHub', async () => {
		const fetcher = vi.fn<typeof fetch>();
		const getContributions = createContributionsService({ fetcher });

		await expect(getContributions('../octocat')).rejects.toMatchObject({
			status: 400,
		});
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('maps upstream 404 and other HTTP errors', async () => {
		const notFound = createContributionsService({
			fetcher: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 404 })),
		});
		const failed = createContributionsService({
			fetcher: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 503 })),
		});

		await expect(notFound('missing-user')).rejects.toMatchObject({ status: 404 });
		await expect(failed('upstream-failure')).rejects.toMatchObject({ status: 502 });
	});

	it('maps timeouts, network failures, and invalid JSON explicitly', async () => {
		const timeout = new Error('timed out');
		timeout.name = 'TimeoutError';
		const timedOut = createContributionsService({
			fetcher: vi.fn<typeof fetch>().mockRejectedValue(timeout),
		});
		const unreachable = createContributionsService({
			fetcher: vi.fn<typeof fetch>().mockRejectedValue(new Error('offline')),
		});
		const invalidJson = createContributionsService({
			fetcher: vi.fn<typeof fetch>().mockResolvedValue(
				new Response('not json', { status: 200 }),
			),
		});

		await expect(timedOut('slow-user')).rejects.toMatchObject({ status: 504 });
		await expect(unreachable('offline-user')).rejects.toMatchObject({ status: 502 });
		await expect(invalidJson('invalid-json-user')).rejects.toMatchObject({ status: 502 });
	});

	it('caches successes case-insensitively for one hour and expires them', async () => {
		let currentTime = 0;
		const fetcher = vi
			.fn<typeof fetch>()
			.mockImplementation(async () => jsonResponse({ total: 7 }));
		const getContributions = createContributionsService({
			fetcher,
			now: () => currentTime,
		});

		await getContributions('OctoCat');
		await getContributions('octocat');
		expect(fetcher).toHaveBeenCalledTimes(1);

		currentTime = 60 * 60 * 1000;
		await getContributions('octocat');
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('evicts the least recently used entry when the bounded cache is full', async () => {
		const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url) =>
			jsonResponse({ url: String(url) }),
		);
		const getContributions = createContributionsService({
			fetcher,
			maxEntries: 2,
		});

		await getContributions('user-a');
		await getContributions('user-b');
		await getContributions('user-a');
		await getContributions('user-c');
		await getContributions('user-b');

		expect(fetcher).toHaveBeenCalledTimes(4);
	});

	it('does not cache failures', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response(null, { status: 404 }))
			.mockResolvedValueOnce(jsonResponse({ total: 1 }));
		const getContributions = createContributionsService({ fetcher });

		await expect(getContributions('retry-user')).rejects.toBeInstanceOf(
			ContributionsProxyError,
		);
		await expect(getContributions('retry-user')).resolves.toEqual({ total: 1 });
		expect(fetcher).toHaveBeenCalledTimes(2);
	});
});

describe('GET /api/contributions/[username]', () => {
	it('returns upstream JSON with downstream cache headers', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ contributions: [] })),
		);

		const response = await GET({
			params: { username: 'route-test-user' },
		} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('application/json');
		expect(response.headers.get('cache-control')).toBe(
			'public, max-age=3600, s-maxage=3600',
		);
		await expect(response.json()).resolves.toEqual({ contributions: [] });
	});

	it('returns explicit JSON errors and disables caching', async () => {
		const response = await GET({
			params: { username: '../invalid' },
		} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(400);
		expect(response.headers.get('cache-control')).toBe('no-store');
		await expect(response.json()).resolves.toEqual({
			error: 'Invalid GitHub username',
		});
	});
});
