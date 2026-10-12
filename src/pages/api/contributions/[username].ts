import type { APIRoute } from 'astro';
import {
	ContributionsProxyError,
	getContributions,
} from '../../../lib/contributions';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
	try {
		const payload = await getContributions(params.username ?? '');
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=3600, s-maxage=3600',
			},
		});
	} catch (error) {
		const proxyError =
			error instanceof ContributionsProxyError
				? error
				: new ContributionsProxyError('Unable to load contributions', 502);

		return new Response(JSON.stringify({ error: proxyError.message }), {
			status: proxyError.status,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'no-store',
			},
		});
	}
};
