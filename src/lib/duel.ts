export type DuelWinner = 'player1' | 'player2' | 'draw';

export function getContributionTotal(payload: unknown): number {
	if (
		typeof payload !== 'object' ||
		payload === null ||
		!('total_contributions' in payload)
	) {
		throw new Error('Otrzymano nieprawidłowe dane o kontrybucjach.');
	}

	const total = payload.total_contributions;
	if (typeof total !== 'number' || !Number.isSafeInteger(total) || total < 0) {
		throw new Error('Otrzymano nieprawidłową liczbę kontrybucji.');
	}

	return total;
}

export function getDuelWinner(score1: number, score2: number): DuelWinner {
	if (score1 === score2) return 'draw';
	return score1 > score2 ? 'player1' : 'player2';
}
