// Many `data_changed` events in a row become one read now and at most one more per interval.
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
