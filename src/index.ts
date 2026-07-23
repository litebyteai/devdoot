import devdoot from './logger.js';
import type { RegisterOptions } from './reporter.js';
export { devdoot as default, devdoot, devdoot as logger };
export { DevdootLogger as Devdoot, DevdootLogger, NOOP_LOGGER } from './logger.js';
export { globalConfig, DevdootConfig, LogLevel } from './config.js';
export { runTraced, TraceNode, NOOP_TRACE, completedRootTraces } from './trace.js';
export { getActiveTraceContext, runInTraceContext } from './context.js';
export { getDiagnosticsSnapshot } from './diagnostics.js';
export { initCrashReporter, generateReport, writeReport } from './reporter.js';
export type { RegisterOptions } from './reporter.js';

export function register(options?: RegisterOptions): void {
  devdoot.register(options);
}

export { renderTraceNodeToText, formatReportToText } from './formatter.js';

