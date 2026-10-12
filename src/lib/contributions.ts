const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const UPSTREAM_TIMEOUT_MS = 10_000;
const GITHUB_USERNAME_PATTERN =
	/^(?!.*--)[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

type CacheEntry = {
	value: unknown;
	expiresAt: number;
};

type ContributionsServiceOptions = {
	fetcher?: typeof fetch;
	now?: () => number;
	ttlMs?: number;
	maxEntries?: number;
};

export class ContributionsProxyError extends Error {
	constructor(
		message: string,
		readonly status: 400 | 404 | 502 | 504,
	) {
		super(message);
		this.name = 'ContributionsProxyError';
	}
}

export function isValidGitHubUsername(username: string): boolean {
	return username.length <= 39 && GITHUB_USERNAME_PATTERN.test(username);
}

function isTimeoutError(error: unknown): boolean {
	return (
		error instanceof Error &&
		(error.name === 'TimeoutError' || error.name === 'AbortError')
	);
}

export function createContributionsService(options: ContributionsServiceOptions = {}) {
	const cache = new Map<string, CacheEntry>();
	const fetcher = options.fetcher ?? ((input, init) => fetch(input, init));
	const now = options.now ?? Date.now;
	const ttlMs = options.ttlMs ?? CACHE_TTL_MS;
	const maxEntries = options.maxEntries ?? CACHE_MAX_ENTRIES;

	return async function getContributions(username: string): Promise<unknown> {
		if (!isValidGitHubUsername(username)) {
			throw new ContributionsProxyError('Invalid GitHub username', 400);
		}

		const cacheKey = username.toLowerCase();
		const currentTime = now();

		for (const [key, entry] of cache) {
			if (entry.expiresAt <= currentTime) {
				cache.delete(key);
			}
		}

		const cached = cache.get(cacheKey);
		if (cached) {
			cache.delete(cacheKey);
			cache.set(cacheKey, cached);
			return cached.value;
		}

		let response: Response;
		try {
			response = await fetcher(
				`https://github.com/${encodeURIComponent(username)}.contribs`,
				{ signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) },
			);
		} catch (error) {
			if (isTimeoutError(error)) {
				throw new ContributionsProxyError('GitHub request timed out', 504);
			}
			throw new ContributionsProxyError('Unable to reach GitHub', 502);
		}

		if (response.status === 404) {
			throw new ContributionsProxyError('GitHub user not found', 404);
		}
		if (!response.ok) {
			throw new ContributionsProxyError('GitHub returned an error', 502);
		}

		let value: unknown;
		try {
			value = await response.json();
		} catch (error) {
			if (isTimeoutError(error)) {
				throw new ContributionsProxyError('GitHub request timed out', 504);
			}
			throw new ContributionsProxyError('GitHub returned invalid JSON', 502);
		}

		cache.set(cacheKey, { value, expiresAt: now() + ttlMs });
		while (cache.size > maxEntries) {
			const oldestKey = cache.keys().next().value;
			if (oldestKey === undefined) break;
			cache.delete(oldestKey);
		}

		return value;
	};
}

export const getContributions = createContributionsService();
