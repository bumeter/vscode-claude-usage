// Many `data_changed` events in a row become one read now and at most one more per interval.

/** Wraps a fetch; `apply` runs on its result only if no later call started meanwhile, so an older
 * fetch that resolves after a newer one can't overwrite it. */
export function latest<T>(fn: () => Promise<T>, apply: (v: T) => void): () => Promise<void> {
  let seq = 0;
  return async () => {
    const n = ++seq;
    const v = await fn();
    if (n === seq) apply(v);
  };
}

export function coalesce(fn: () => Promise<void>, ms: number): () => void {
  let last = -Infinity;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    timer = undefined;
    last = Date.now();
    void fn();
  };
  return () => {
    if (timer) return;
    const wait = last + ms - Date.now();
    if (wait <= 0) run();
    else timer = setTimeout(run, wait);
  };
}
