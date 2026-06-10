/**
 * Unit tests for tool helpers
 */

import { describe, it, expect } from 'vitest';
import { truncateList, torontoDateString, errorResult } from '@/tools/helpers.js';
import { NorthScoreApiClientError } from '@/services/index.js';

describe('truncateList', () => {
  it('returns small lists untouched', () => {
    const items = [{ a: 1 }, { a: 2 }];
    const { items: result, info } = truncateList(items);
    expect(result).toEqual(items);
    expect(info.truncated).toBe(false);
  });

  it('truncates oversized lists and reports it', () => {
    const items = Array.from({ length: 2000 }, (_, i) => ({
      id: i,
      padding: 'x'.repeat(100),
    }));
    const { items: result, info } = truncateList(items);
    expect(result.length).toBeLessThan(items.length);
    expect(info.truncated).toBe(true);
    expect(info.truncation_message).toContain(String(items.length));
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(25000);
  });
});

describe('torontoDateString', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(torontoDateString(new Date('2026-06-09T18:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('uses the Toronto calendar day, not UTC', () => {
    // 03:00 UTC is still the previous day in Toronto (UTC-4 in June)
    expect(torontoDateString(new Date('2026-06-10T03:00:00Z'))).toBe('2026-06-09');
  });
});

describe('errorResult', () => {
  it('marks results as errors with structured content', () => {
    const result = errorResult(new Error('boom'));
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ success: false, error: 'boom' });
  });

  it('adds team-name guidance on 404s', () => {
    const error = new NorthScoreApiClientError('Not found', 404, 'NOT_FOUND', {});
    const result = errorResult(error);
    expect((result.structuredContent as { error: string }).error).toContain('team name');
    expect((result.structuredContent as { status_code: number }).status_code).toBe(404);
  });
});
