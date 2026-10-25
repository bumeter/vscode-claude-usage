import { afterEach, describe, expect, it, vi } from 'vitest';
import { coalesce } from '../src/coalesce';

afterEach(() => vi.useRealTimers());

describe('coalesce', () => {
  it('runs now, then at most once more per interval', async () => {
    vi.useFakeTimers();
    let runs = 0;
    const go = coalesce(async () => { runs++; }, 2_000);
    go(); go(); go();
    expect(runs).toBe(1);
    await vi.advanceTimersByTimeAsync(1_999);
    expect(runs).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(runs).toBe(2);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(runs).toBe(2);
    go();
    expect(runs).toBe(3);
  });
});
