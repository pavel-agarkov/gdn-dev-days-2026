import { describe, expect, it } from 'vitest';
import { getContributionData, getDuelWinner } from './duel';

describe('getContributionData', () => {
	it('reads totals and daily contribution data from the GitHub payload', () => {
		expect(
			getContributionData({
				total_contributions: 42,
				from: '2026-10-12',
				to: '2026-10-13',
				weeks: [
					{
						first_day: '2026-10-12',
						contribution_days: [
							{ weekday: 0, count: 3, level: 2 },
							{ weekday: 1, count: 0, level: 0 },
						],
					},
				],
			}),
		).toEqual({
			total_contributions: 42,
			from: '2026-10-12',
			to: '2026-10-13',
			contributions: [
				{ date: '2026-10-12', count: 3, level: 2 },
				{ date: '2026-10-13', count: 0, level: 0 },
			],
		});
	});

	it('rejects missing contribution data and invalid daily entries', () => {
		expect(() => getContributionData({})).toThrow(
			'Otrzymano nieprawidłowe dane o kontrybucjach.',
		);
		expect(() =>
			getContributionData({
				total_contributions: 42,
				from: '2026-10-12',
				to: '2026-10-12',
				weeks: [
					{
						first_day: '2026-10-12',
						contribution_days: [{ weekday: 0, count: 1, level: 5 }],
					},
				],
			}),
		).toThrow('Otrzymano nieprawidłowy dzień na wykresie kontrybucji.');
	});

	it('rejects missing, negative, and non-numeric totals', () => {
		expect(() =>
			getContributionData({ from: '2026-10-12', to: '2026-10-12', weeks: [] }),
		).toThrow('Otrzymano nieprawidłowe dane o kontrybucjach.');
		expect(() =>
			getContributionData({
				total_contributions: -1,
				from: '2026-10-12',
				to: '2026-10-12',
				weeks: [],
			}),
		).toThrow('Otrzymano nieprawidłową liczbę kontrybucji.');
		expect(() =>
			getContributionData({
				total_contributions: '42',
				from: '2026-10-12',
				to: '2026-10-12',
				weeks: [],
			}),
		).toThrow('Otrzymano nieprawidłową liczbę kontrybucji.');
		expect(() =>
			getContributionData({ total_contributions: 42 }),
		).toThrow('Otrzymano nieprawidłowe dane o kontrybucjach.');
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
