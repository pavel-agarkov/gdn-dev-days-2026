import { describe, expect, it } from 'vitest';
import { getContributionTotal, getDuelWinner } from './duel';

describe('getContributionTotal', () => {
	it('reads the total contribution count from the GitHub payload', () => {
		expect(getContributionTotal({ total_contributions: 42 })).toBe(42);
	});

	it('rejects missing, negative, and non-numeric totals', () => {
		expect(() => getContributionTotal({})).toThrow(
			'Otrzymano nieprawidłowe dane o kontrybucjach.',
		);
		expect(() => getContributionTotal({ total_contributions: -1 })).toThrow(
			'Otrzymano nieprawidłową liczbę kontrybucji.',
		);
		expect(() => getContributionTotal({ total_contributions: '42' })).toThrow(
			'Otrzymano nieprawidłową liczbę kontrybucji.',
		);
	});
});

describe('getDuelWinner', () => {
	it('selects the player with more contributions', () => {
		expect(getDuelWinner(12, 7)).toBe('player1');
		expect(getDuelWinner(4, 9)).toBe('player2');
	});

	it('returns a draw for equal contribution totals', () => {
		expect(getDuelWinner(5, 5)).toBe('draw');
	});
});
