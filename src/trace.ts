import fs from 'node:fs';
import path from 'node:path';
import { getActiveTraceContext, runInTraceContext, TraceContext } from './context.js';
import { getCachedTimestamp, getRelativeMs } from './time.js';
import { getCallerInfo, CallerInfo } from './caller.js';
import { globalConfig, LogLevel } from './config.js';
import { getDiagnosticsSnapshot } from './diagnostics.js';
import { renderTraceNodeToText } from './formatter.js';
import devdoot from './logger.js';

export class TraceNode {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  timestamp: string;
  relativeTime: number;
  duration?: number;
  logs: any[] = [];
  children: TraceNode[] = [];
  metadata: Record<string, any> = {};
  errorDetails?: { message: string; stack?: string };
  caller: string | null = null;

  constructor(name: string, parentContext?: TraceContext) {
    const now = new Date();
    const pad = (num: number, size = 2) => String(num).padStart(size, '0');
    const timestampStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-${pad(now.getMilliseconds(), 3)}`;
    const suffix = Math.random().toString(36).substring(2, 6);
    this.id = `${timestampStr}-${suffix}`;

    this.name = name;
    this.timestamp = getCachedTimestamp();
    this.relativeTime = getRelativeMs();
    
    if (globalConfig.captureCaller) {
      const callerInfo = getCallerInfo();
      this.caller = callerInfo ? callerInfo.callerLocation : null;
    }

    if (parentContext) {
      this.traceId = parentContext.traceId;
      this.parentId = parentContext.spanId;
      parentContext.node.children.push(this);
    } else {
      this.traceId = this.id;
    }
  }

  info(msg: string, meta?: any): void {
    const absTime = getCachedTimestamp();
    const duration = getRelativeMs() - this.relativeTime;
    this.logs.push({ level: 'INFO', time: absTime, relativeMs: Math.round(duration), message: msg, metadata: meta });
    devdoot.info(msg, meta);
  }

  warn(msg: string, meta?: any): void {
    const absTime = getCachedTimestamp();
    const duration = getRelativeMs() - this.relativeTime;
    this.logs.push({ level: 'WARN', time: absTime, relativeMs: Math.round(duration), message: msg, metadata: meta });
    devdoot.warn(msg, meta);
  }

  error(err: any, meta?: any): void {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    const absTime = getCachedTimestamp();
    const duration = getRelativeMs() - this.relativeTime;
    
    this.errorDetails = { message: errorMsg, stack: errorStack };
    this.logs.push({ 
      level: 'ERROR', 
      time: absTime, 
      relativeMs: Math.round(duration), 
      message: errorMsg, 
      metadata: meta, 
      stack: errorStack 
    });
    
    devdoot.error(err, meta);
  }

  end(): void {
    if (this.duration !== undefined) return; // Prevent double ending
    this.duration = getRelativeMs() - this.relativeTime;
    
    // Print end summary if in console mode
    if (globalConfig.enabled && globalConfig.format === 'console' && globalConfig.level <= LogLevel.INFO) {
      const relTime = getRelativeMs();
      const statusIcon = this.errorDetails ? '✗' : '✓';
      const statusText = this.errorDetails ? 'failed' : 'completed';
      const color = this.errorDetails ? '\x1b[31m' : '\x1b[32m';
      const durationText = `${Math.round(this.duration)}ms`;
      
      const absTime = getCachedTimestamp();
      const timeStr = `\x1b[90m${absTime}\x1b[0m`;
      const relTimeStr = `\x1b[90m[+${Math.round(relTime)}ms]\x1b[0m`;
      
      const output = `${timeStr} ${relTimeStr} ${color}${statusIcon} ${this.name} ${statusText} (Duration: ${durationText})\x1b[0m\n`;
      if (typeof process !== 'undefined') {
        process.stdout.write(output);
      } else {
        console.log(output.trim());
      }
    }

    // Keep memory bound by storing root traces up to limit
    if (!this.parentId) {
      completedRootTraces.push(this);
      if (completedRootTraces.length > 1000) {
        completedRootTraces.shift();
      }

      // Automatically save completed root trace to storage/devdoot/traces/trace-<id>.txt
      if (globalConfig.enabled && globalConfig.saveTraces) {
        const dir = path.resolve(globalConfig.outputDir, 'traces');
        const filePath = path.join(dir, `trace-${this.id}.txt`);
        const textContent = renderTraceNodeToText(this);

        fs.mkdir(dir, { recursive: true }, (err) => {
          if (!err) {
            fs.writeFile(filePath, textContent, 'utf8', () => {
              // silent callback
            });
          }
        });
      }
    }
  }
}

// Frozen NOOP TraceNode to completely bypass allocations
export const NOOP_TRACE = {
  id: '',
  traceId: '',
  parentId: undefined,
  name: '',
  timestamp: '',
  relativeTime: 0,
  duration: 0,
  logs: [],
  children: [],
  metadata: {},
  caller: null,
  info() {},
  warn() {},
  error() {},
  end() {},
} as unknown as TraceNode;
Object.freeze(NOOP_TRACE);

// Bounded list of completed root traces
export const completedRootTraces: TraceNode[] = [];

/**
 * Execute synchronous or asynchronous code blocks within a structured Trace span.
 */
export function runTraced<T>(name: string, fn: (trace: TraceNode) => T): T {
  // Production bypass when deep debugging is disabled
  if (!globalConfig.enabled || (globalConfig.inProd && !globalConfig.deepDebugging)) {
    return fn(NOOP_TRACE);
  }

  const parent = getActiveTraceContext();
  const trace = new TraceNode(name, parent);
  
  // Log start summary if console is active
  if (globalConfig.format === 'console' && globalConfig.level <= LogLevel.INFO) {
    const absTime = getCachedTimestamp();
    const timeStr = `\x1b[90m${absTime}\x1b[0m`;
    const relTimeStr = `\x1b[90m[+${Math.round(getRelativeMs())}ms]\x1b[0m`;
    const output = `${timeStr} ${relTimeStr} \x1b[36m${name}()\x1b[0m\n`;
    if (typeof process !== 'undefined') {
      process.stdout.write(output);
    } else {
      console.log(output.trim());
    }
  }

  const context: TraceContext = {
    traceId: trace.traceId,
    spanId: trace.id,
    node: trace
  };

  try {
    const result = runInTraceContext(context, () => fn(trace));
    if (result instanceof Promise) {
      return result
        .then((val) => {
          trace.end();
          return val;
        })
        .catch((err) => {
          trace.error(err);
          trace.end();
          throw err;
        }) as any;
    }
    trace.end();
    return result;
  } catch (err) {
    trace.error(err);
    trace.end();
    throw err;
  }
}
