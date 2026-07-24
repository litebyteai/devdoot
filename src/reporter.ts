import fs from 'node:fs';
import path from 'node:path';
import { globalConfig } from './config.js';
import { getDiagnosticsSnapshot } from './diagnostics.js';
import { completedRootTraces } from './trace.js';
import { getActiveTraceContext } from './context.js';
import { formatReportToText } from './formatter.js';

export interface CrashReport {
  id: string;
  timestamp: string;
  error: {
    message: string;
    stack?: string;
  };
  diagnostics: any;
  completedTraces: any[];
  activeTrace?: any;
}

/**
 * Generate a complete JSON crash report with traces, error stack, and diagnostics.
 */
export function generateReport(error: Error): CrashReport {
  const activeContext = getActiveTraceContext();
  const diagnostics = getDiagnosticsSnapshot();
  const now = new Date();
  const pad = (num: number, size = 2) => String(num).padStart(size, '0');
  const id = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${pad(now.getMilliseconds(), 3)}`;
  
  return {
    id,
    timestamp: now.toISOString(),
    error: {
      message: error.message || String(error),
      stack: error.stack,
    },
    diagnostics,
    completedTraces: completedRootTraces,
    activeTrace: activeContext ? activeContext.node : undefined,
  };
}

/**
 * Write a report object to disk synchronously (necessary for crash handling).
 */
export function writeReport(report: CrashReport): string {
  if (!globalConfig.saveReports) {
    return '';
  }
  const dir = path.resolve(globalConfig.outputDir, 'reports');
  fs.mkdirSync(dir, { recursive: true });
  
  const filePath = path.join(dir, `report-${report.id}.txt`);
  fs.writeFileSync(filePath, formatReportToText(report), 'utf8');
  return filePath;
}

const GLOBAL_REGISTERED_KEY = Symbol.for('devdoot.process.registered');

export interface RegisterOptions {
  uncaughtException?: boolean;
  unhandledRejection?: boolean;
  beforeExit?: boolean;
  exit?: boolean;
  sigint?: boolean;
  sigterm?: boolean;
  multipleResolves?: boolean;
  exitOnError?: boolean;
}

interface RegisteredEvents {
  uncaughtException?: boolean;
  unhandledRejection?: boolean;
  beforeExit?: boolean;
  exit?: boolean;
  sigint?: boolean;
  sigterm?: boolean;
  multipleResolves?: boolean;
  hasWrittenReport?: boolean;
}

function getRegisteredMap(): RegisteredEvents {
  const globalAny = globalThis as any;
  if (!globalAny[GLOBAL_REGISTERED_KEY]) {
    globalAny[GLOBAL_REGISTERED_KEY] = {};
  }
  return globalAny[GLOBAL_REGISTERED_KEY];
}

/**
 * Hook global event listeners to capture uncaught errors, signals, and exits to generate crash/shutdown reports.
 */
export function initCrashReporter(options: RegisterOptions = {}): void {
  if (typeof process === 'undefined') return;

  const registered = getRegisteredMap();

type ProcessEventKey = 'uncaughtException' | 'unhandledRejection' | 'beforeExit' | 'exit' | 'sigint' | 'sigterm' | 'multipleResolves';

  const shouldRegister = (key: ProcessEventKey): boolean => {
    return options[key] !== false && !registered[key];
  };

  const setRegistered = (key: ProcessEventKey) => {
    registered[key] = true;
  };

  if (shouldRegister('uncaughtException')) {
    setRegistered('uncaughtException');
    process.on('uncaughtException', (error) => {
      const reg = getRegisteredMap();
      if (!reg.hasWrittenReport) {
        reg.hasWrittenReport = true;
        try {
          const report = generateReport(error);
          const filePath = writeReport(report);
          if (filePath) {
            process.stderr.write(`\n\x1b[31m\x1b[1m[Devdoot] Uncaught Exception Detected! Crash report written to: ${filePath}\x1b[0m\n`);
          } else {
            process.stderr.write(`\n\x1b[31m\x1b[1m[Devdoot] Uncaught Exception Detected!\x1b[0m\n`);
          }
        } catch (writeErr) {
          process.stderr.write(`\n\x1b[31m[Devdoot] Failed to write crash report: ${writeErr}\x1b[0m\n`);
        }
      }
      if (options.exitOnError !== false) {
        process.exit(1);
      }
    });
  }

  if (shouldRegister('unhandledRejection')) {
    setRegistered('unhandledRejection');
    process.on('unhandledRejection', (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      const reg = getRegisteredMap();
      if (!reg.hasWrittenReport) {
        reg.hasWrittenReport = true;
        try {
          const report = generateReport(error);
          const filePath = writeReport(report);
          if (filePath) {
            process.stderr.write(`\n\x1b[31m\x1b[1m[Devdoot] Unhandled Promise Rejection Detected! Crash report written to: ${filePath}\x1b[0m\n`);
          } else {
            process.stderr.write(`\n\x1b[31m\x1b[1m[Devdoot] Unhandled Promise Rejection Detected!\x1b[0m\n`);
          }
        } catch (writeErr) {
          process.stderr.write(`\n\x1b[31m[Devdoot] Failed to write crash report: ${writeErr}\x1b[0m\n`);
        }
      }
      if (options.exitOnError !== false) {
        process.exit(1);
      }
    });
  }

  if (shouldRegister('beforeExit')) {
    setRegistered('beforeExit');
    process.on('beforeExit', (code) => {
      const reg = getRegisteredMap();
      if (!reg.hasWrittenReport) {
        reg.hasWrittenReport = true;
        try {
          const report = generateReport(new Error(`Process beforeExit event triggered with code ${code}`));
          const filePath = writeReport(report);
          if (filePath) {
            process.stderr.write(`\n\x1b[33m[Devdoot] Process beforeExit event triggered with code ${code}. Report written to: ${filePath}\x1b[0m\n`);
          } else {
            process.stderr.write(`\n\x1b[33m[Devdoot] Process beforeExit event triggered with code ${code}\x1b[0m\n`);
          }
        } catch (writeErr) {
          process.stderr.write(`\n\x1b[31m[Devdoot] Failed to write beforeExit report: ${writeErr}\x1b[0m\n`);
        }
      } else {
        process.stderr.write(`\n\x1b[33m[Devdoot] Process beforeExit event triggered with code ${code}\x1b[0m\n`);
      }
    });
  }

  if (shouldRegister('exit')) {
    setRegistered('exit');
    process.on('exit', (code) => {
      const reg = getRegisteredMap();
      if (!reg.hasWrittenReport) {
        reg.hasWrittenReport = true;
        try {
          const report = generateReport(new Error(`Process exited with code ${code}`));
          const filePath = writeReport(report);
          if (filePath) {
            process.stderr.write(`\n\x1b[32m[Devdoot] Process exited with code: ${code}. Report written to: ${filePath}\x1b[0m\n`);
          } else {
            process.stderr.write(`\n\x1b[32m[Devdoot] Process exited with code: ${code}\x1b[0m\n`);
          }
        } catch (writeErr) {
          process.stderr.write(`\n\x1b[31m[Devdoot] Failed to write exit report: ${writeErr}\x1b[0m\n`);
        }
      } else {
        process.stderr.write(`\n\x1b[32m[Devdoot] Process exited with code: ${code}\x1b[0m\n`);
      }
    });
  }

  if (shouldRegister('sigint')) {
    setRegistered('sigint');
    process.on('SIGINT', () => {
      const reg = getRegisteredMap();
      if (!reg.hasWrittenReport) {
        reg.hasWrittenReport = true;
        try {
          const report = generateReport(new Error('Process received SIGINT (Ctrl+C)'));
          const filePath = writeReport(report);
          if (filePath) {
            process.stderr.write(`\n\x1b[33m[Devdoot] Received SIGINT. Shutdown report written to: ${filePath}\x1b[0m\n`);
          } else {
            process.stderr.write(`\n\x1b[33m[Devdoot] Received SIGINT. Terminating...\x1b[0m\n`);
          }
        } catch (writeErr) {
          process.stderr.write(`\n\x1b[31m[Devdoot] Failed to write shutdown report on SIGINT: ${writeErr}\x1b[0m\n`);
        }
      } else {
        process.stderr.write(`\n\x1b[33m[Devdoot] Received SIGINT. Terminating...\x1b[0m\n`);
      }
      process.exit(130);
    });
  }

  if (shouldRegister('sigterm')) {
    setRegistered('sigterm');
    process.on('SIGTERM', () => {
      const reg = getRegisteredMap();
      if (!reg.hasWrittenReport) {
        reg.hasWrittenReport = true;
        try {
          const report = generateReport(new Error('Process received SIGTERM'));
          const filePath = writeReport(report);
          if (filePath) {
            process.stderr.write(`\n\x1b[33m[Devdoot] Received SIGTERM. Shutdown report written to: ${filePath}\x1b[0m\n`);
          } else {
            process.stderr.write(`\n\x1b[33m[Devdoot] Received SIGTERM. Terminating...\x1b[0m\n`);
          }
        } catch (writeErr) {
          process.stderr.write(`\n\x1b[31m[Devdoot] Failed to write shutdown report on SIGTERM: ${writeErr}\x1b[0m\n`);
        }
      } else {
        process.stderr.write(`\n\x1b[33m[Devdoot] Received SIGTERM. Terminating...\x1b[0m\n`);
      }
      process.exit(143);
    });
  }

  if (shouldRegister('multipleResolves')) {
    setRegistered('multipleResolves');
    try {
      process.on('multipleResolves', (type, promise, value) => {
        const reg = getRegisteredMap();
        const error = new Error(`Promise multipleResolves: type=${type}, value=${String(value)}`);
        if (!reg.hasWrittenReport) {
          reg.hasWrittenReport = true;
          try {
            const report = generateReport(error);
            const filePath = writeReport(report);
            if (filePath) {
              process.stderr.write(`\n\x1b[33m[Devdoot] Promise multipleResolves detected! Report written to: ${filePath}\x1b[0m\n`);
            } else {
              process.stderr.write(`\n\x1b[33m[Devdoot] Promise multipleResolves detected: type=${type}, value=${String(value)}\x1b[0m\n`);
            }
          } catch (writeErr) {
            process.stderr.write(`\n\x1b[31m[Devdoot] Failed to write report on multipleResolves: ${writeErr}\x1b[0m\n`);
          }
        } else {
          process.stderr.write(`\n\x1b[33m[Devdoot] Promise multipleResolves detected: type=${type}, value=${String(value)}\x1b[0m\n`);
        }
      });
    } catch (e) {
      // Ignore if not supported by the environment (e.g. newer Node.js versions)
    }
  }
}
