import { afterEach, describe, expect, it, vi } from 'vitest';
import { coalesce, latest } from '../src/coalesce';

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

describe('latest', () => {
  it('drops a slow first call resolved after a fast second one', async () => {
    const applied: string[] = [];
    let resolveFirst!: (v: string) => void;
    const fn = vi.fn(() => new Promise<string>((resolve) => { resolveFirst = resolve; }));
    const run = latest(fn, (v: string) => applied.push(v));
    const first = run();
    fn.mockReturnValueOnce(Promise.resolve('second'));
    const second = run();
    await second;
    resolveFirst('first');
    await first;
    expect(applied).toEqual(['second']);
  });
});
