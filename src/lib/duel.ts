export type DuelWinner = 'player1' | 'player2' | 'draw';

export interface DailyContribution {
	date: string;
	count: number;
	level: number;
}

export interface ContributionData {
	from: string;
	to: string;
	total_contributions: number;
	contributions: DailyContribution[];
}

export function getContributionData(payload: unknown): ContributionData {
	if (
		typeof payload !== 'object' ||
		payload === null ||
		!('total_contributions' in payload) ||
		!('from' in payload) ||
		!('to' in payload) ||
		!('weeks' in payload)
	) {
		throw new Error('Otrzymano nieprawidłowe dane o kontrybucjach.');
	}

	const total = payload.total_contributions;
	if (typeof total !== 'number' || !Number.isSafeInteger(total) || total < 0) {
		throw new Error('Otrzymano nieprawidłową liczbę kontrybucji.');
	}

	if (
		typeof payload.from !== 'string' ||
		!isValidContributionDate(payload.from) ||
		typeof payload.to !== 'string' ||
		!isValidContributionDate(payload.to) ||
		payload.from > payload.to ||
		!Array.isArray(payload.weeks)
	) {
		throw new Error('Otrzymano nieprawidłowy wykres kontrybucji.');
	}

	const dailyContributions: DailyContribution[] = [];
	for (const week of payload.weeks) {
		if (
			typeof week !== 'object' ||
			week === null ||
			!('first_day' in week) ||
			!('contribution_days' in week) ||
			typeof week.first_day !== 'string' ||
			!isValidContributionDate(week.first_day) ||
			!Array.isArray(week.contribution_days)
		) {
			throw new Error('Otrzymano nieprawidłowy wykres kontrybucji.');
		}

		for (const day of week.contribution_days) {
			if (
				typeof day !== 'object' ||
				day === null ||
				!('weekday' in day) ||
				!('count' in day) ||
				!('level' in day) ||
				typeof day.weekday !== 'number' ||
				!Number.isInteger(day.weekday) ||
				day.weekday < 0 ||
				day.weekday > 6 ||
				typeof day.count !== 'number' ||
				!Number.isSafeInteger(day.count) ||
				day.count < 0 ||
				typeof day.level !== 'number' ||
				!Number.isInteger(day.level) ||
				day.level < 0 ||
				day.level > 4
			) {
				throw new Error(
					'Otrzymano nieprawidłowy dzień na wykresie kontrybucji.',
				);
			}

			const date = new Date(`${week.first_day}T00:00:00.000Z`);
			date.setUTCDate(date.getUTCDate() + day.weekday);
			const dayDate = date.toISOString().slice(0, 10);
			if (dayDate >= payload.from && dayDate <= payload.to) {
				dailyContributions.push({
					date: dayDate,
					count: day.count,
					level: day.level,
				});
			}
		}
	}

	return {
		from: payload.from,
		to: payload.to,
		total_contributions: total,
		contributions: dailyContributions,
	};
}

function isValidContributionDate(date: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

	const parsedDate = new Date(`${date}T00:00:00.000Z`);
	return (
		!Number.isNaN(parsedDate.getTime()) &&
		parsedDate.toISOString().slice(0, 10) === date
	);
}

export function getDuelWinner(score1: number, score2: number): DuelWinner {
	if (score1 === score2) return 'draw';
	return score1 > score2 ? 'player1' : 'player2';
}
