import { formatLocalTime, getLocalTime, toLocalTime } from './date-time.util';

describe('DateTimeUtil', () => {
    describe('formatBeijingTime', () => {
        it('should return Beijing time string with default format', () => {
            const date = new Date('2024-01-01T00:00:00Z'); // UTC time
            const result = formatLocalTime(date);

            // UTC+8, so it should be 08:00:00
            expect(result).toMatch(/2024-01-01 08:00:00\.\d{3}/);
        });

        it('should return time string with custom format', () => {
            const date = new Date('2024-06-15T12:30:45Z');
            const result = formatLocalTime(date, 'YYYY/MM/DD HH:mm');

            expect(result).toBe('2024/06/15 20:30'); // UTC+8
        });

        it('should return current Beijing time when no date is provided', () => {
            const result = formatLocalTime();

            expect(result).toMatch(
                /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/,
            );
        });

        it('should handle daylight saving time boundaries correctly (China has no DST)', () => {
            const winterDate = new Date('2024-01-01T00:00:00Z');
            const summerDate = new Date('2024-07-01T00:00:00Z');

            const winterResult = formatLocalTime(winterDate, 'HH');
            const summerResult = formatLocalTime(summerDate, 'HH');

            // Both should be UTC+8
            expect(winterResult).toBe('08');
            expect(summerResult).toBe('08');
        });

        it('should handle cross-day conversion correctly', () => {
            const date = new Date('2024-01-01T20:00:00Z'); // UTC 20:00
            const result = formatLocalTime(date, 'YYYY-MM-DD HH:mm');

            // UTC+8 = next day 04:00
            expect(result).toBe('2024-01-02 04:00');
        });
    });

    describe('getBeijingTime', () => {
        it('should return current Beijing time as Date object', () => {
            const result = getLocalTime();

            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBeGreaterThan(0);
        });

        it('should return time close to current time (within 1 second)', () => {
            const before = new Date();
            const result = getLocalTime();
            const after = new Date();

            // Allow 1 second margin
            expect(result.getTime()).toBeGreaterThanOrEqual(
                before.getTime() - 1000,
            );
            expect(result.getTime()).toBeLessThanOrEqual(
                after.getTime() + 1000,
            );
        });
    });

    describe('toBeijingTime', () => {
        it('should convert UTC time to Beijing time Date object', () => {
            const utcDate = new Date('2024-01-01T00:00:00Z');
            const result = toLocalTime(utcDate);

            expect(result).toBeInstanceOf(Date);
            // Timestamp should remain the same (Date stores UTC timestamp internally)
            expect(result.getTime()).toBe(utcDate.getTime());
        });

        it('should accept date string as input', () => {
            const dateString = '2024-06-15T12:30:45Z';
            const result = toLocalTime(dateString);

            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBe(new Date(dateString).getTime());
        });

        it('should handle local timezone string correctly', () => {
            const dateString = '2024-01-01 12:00:00';
            const result = toLocalTime(dateString);

            expect(result).toBeInstanceOf(Date);
            expect(isNaN(result.getTime())).toBe(false);
        });

        it('should handle ISO format string correctly', () => {
            const isoString = '2024-01-01T00:00:00.000Z';
            const result = toLocalTime(isoString);

            expect(result).toBeInstanceOf(Date);
            expect(result.getTime()).toBe(new Date(isoString).getTime());
        });
    });

    describe('Integration tests', () => {
        it('should work with formatBeijingTime and getBeijingTime together', () => {
            const beijingTime = getLocalTime();
            const formatted = formatLocalTime(beijingTime);

            expect(formatted).toMatch(
                /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}/,
            );
        });

        it('should work with toBeijingTime and formatBeijingTime together', () => {
            const utcDate = new Date('2024-01-01T16:00:00Z');
            const beijingDate = toLocalTime(utcDate);
            const formatted = formatLocalTime(beijingDate);

            // UTC 16:00 = Beijing time 00:00 (next day)
            expect(formatted).toMatch(/2024-01-02 00:00:00\.\d{3}/);
        });

        it('should maintain timezone conversion consistency', () => {
            const date = new Date('2024-06-15T00:00:00Z');

            // Direct formatting
            const direct = formatLocalTime(date);

            // Convert first, then format
            const converted = toLocalTime(date);
            const indirect = formatLocalTime(converted);

            // Both approaches should yield the same result
            expect(direct).toBe(indirect);
        });
    });
});
