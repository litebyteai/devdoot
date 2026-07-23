const startPerfTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

let lastSecond = -1;
let cachedTimeString = '';

/**
 * Returns a formatted absolute timestamp: HH:MM:SS.mmm
 * This implementation caches the HH:MM:SS formatting and only computes it once per second,
 * drastically reducing Date object allocations and parsing overhead.
 */
export function getCachedTimestamp(): string {
  const now = Date.now();
  const second = Math.floor(now / 1000);
  
  if (second !== lastSecond) {
    lastSecond = second;
    const date = new Date(now);
    const hrs = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    const secs = String(date.getSeconds()).padStart(2, '0');
    cachedTimeString = `${hrs}:${mins}:${secs}`;
  }
  
  const ms = String(now % 1000).padStart(3, '0');
  return `${cachedTimeString}.${ms}`;
}

/**
 * Returns high-resolution relative milliseconds since the application started.
 */
export function getRelativeMs(): number {
  if (typeof performance !== 'undefined') {
    return performance.now() - startPerfTime;
  }
  return Date.now() - startPerfTime;
}

/**
 * Formats high-precision milliseconds to +Xms string
 */
export function formatRelativeTime(ms: number): string {
  return `+${Math.round(ms)}ms`;
}
