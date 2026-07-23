import { AsyncLocalStorage } from 'node:async_hooks';

export interface TraceContext {
  traceId: string;
  spanId: string;
  node: any; // points to TraceNode instance
}

/**
 * Global AsyncLocalStorage instance to propagate tracing contexts across asynchronous ticks.
 */
export const traceStorage = new AsyncLocalStorage<TraceContext>();

/**
 * Retrieve the active trace context if currently within a traced execution block.
 */
export function getActiveTraceContext(): TraceContext | undefined {
  return traceStorage.getStore();
}

/**
 * Execute a callback within a specific trace context.
 */
export function runInTraceContext<T>(context: TraceContext, fn: () => T): T {
  return traceStorage.run(context, fn);
}
