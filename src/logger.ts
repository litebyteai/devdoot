import { DevdootConfig, LogLevel, LogLevelName, DevdootOptions, globalConfig } from './config.js';
import { getCachedTimestamp, getRelativeMs, formatRelativeTime, getTimingInfo } from './time.js';
import { getCallerInfo, CallerInfo } from './caller.js';
import { getActiveTraceContext } from './context.js';
import { initCrashReporter, RegisterOptions } from './reporter.js';
import { format } from 'node:util';

function isPlainObject(val: any): boolean {
  if (val === null || typeof val !== 'object') return false;
  const proto = Object.getPrototypeOf(val);
  return proto === null || proto === Object.prototype;
}

// Pre-define ANSI colors for console styling
const COLORS = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Map levels to console colors
const LEVEL_COLORS: Record<string, string> = {
  TRACE: COLORS.gray,
  DEBUG: COLORS.blue,
  INFO: COLORS.green,
  WARN: COLORS.yellow,
  ERROR: COLORS.red,
  STATUS: COLORS.magenta,
  ALERT: COLORS.cyan,
};

export class DevdootLogger {
  config: DevdootConfig;
  currentGroup: string | null = null;
  private isNoop: boolean;

  constructor(configOrOptions: DevdootConfig | DevdootOptions = globalConfig, isNoop = false) {
    if (configOrOptions instanceof DevdootConfig) {
      this.config = configOrOptions;
    } else {
      this.config = new DevdootConfig(configOrOptions);
    }
    this.isNoop = isNoop;
  }

  group(name: string): DevdootLogger {
    if (this.isNoop) return this;
    this.currentGroup = name;
    return this;
  }

  newGroup(name: string, options?: DevdootOptions): DevdootLogger {
    if (this.isNoop) return this;
    const newConfig = options ? new DevdootConfig(options) : this.config;
    const groupedLogger = new DevdootLogger(newConfig);
    groupedLogger.currentGroup = name;
    return groupedLogger;
  }

  create(options?: DevdootOptions): DevdootLogger {
    const newConfig = new DevdootConfig(options);
    return new DevdootLogger(newConfig);
  }

  configure(options: DevdootOptions): void {
    this.config.update(options);
  }

  startGlobalTracking(options?: RegisterOptions): void {
    if (this.isNoop) return;
    initCrashReporter(options);
  }

  register(options?: RegisterOptions): void {
    this.startGlobalTracking(options);
  }

  trace(...args: any[]): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.TRACE) return;
    this.writeLog('TRACE', args);
  }

  debug(): DevdootLogger;
  debug(...args: any[]): void;
  debug(...args: any[]): void | DevdootLogger {
    if (this.isNoop || !this.config.enabled) {
      return args.length === 0 ? NOOP_LOGGER : undefined;
    }

    if (this.config.deepDebugGroups && this.config.deepDebugGroups.length > 0) {
      const activeContext = getActiveTraceContext();
      const activeGroup = (activeContext ? activeContext.node.name : '') || this.currentGroup || '';
      if (!this.config.deepDebugGroups.includes(activeGroup)) {
        return args.length === 0 ? NOOP_LOGGER : undefined;
      }
    }

    if (args.length === 0) {
      if (!this.config.deepDebugging) {
        return NOOP_LOGGER;
      }
      return this;
    }
    if (this.config.level > LogLevel.DEBUG) return;
    this.writeLog('DEBUG', args);
  }

  info(...args: any[]): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.INFO) return;
    this.writeLog('INFO', args);
  }

  log(...args: any[]): void {
    this.info(...args); // Alias for info
  }

  warn(...args: any[]): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.WARN) return;
    this.writeLog('WARN', args);
  }

  error(...args: any[]): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.ERROR) return;
    this.writeLog('ERROR', args);
  }

  status(...args: any[]): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.INFO) return;
    this.writeLog('STATUS', args);
  }

  alert(...args: any[]): void {
    if (this.isNoop || !this.config.enabled) return; // Alert always prints unless completely disabled
    this.writeLog('ALERT', args);
  }

  private writeLog(levelName: string, args: any[]): void {
    if (args.length === 0) return;

    let rawMessage: any;
    let meta: any;

    if (this.config.format === 'json') {
      if (args.length > 1 && isPlainObject(args[args.length - 1])) {
        meta = args[args.length - 1];
        const formatArgs = args.slice(0, -1);
        rawMessage = formatArgs.length === 1 ? formatArgs[0] : format(formatArgs[0], ...formatArgs.slice(1));
      } else {
        rawMessage = args.length === 1 ? args[0] : format(args[0], ...args.slice(1));
      }
    } else {
      // Console mode: format all arguments exactly like console.log
      rawMessage = args.length === 1 ? args[0] : format(args[0], ...args.slice(1));
    }

    // 1. Resolve lazy callback message
    let message = typeof rawMessage === 'function' ? rawMessage() : rawMessage;

    // 2. Resolve error instances
    let errorStack: string | undefined;
    if (message instanceof Error) {
      errorStack = message.stack;
      message = message.message;
    } else if (typeof message !== 'string') {
      message = format(message);
    }

    // 3. Capture caller info (only if configured and not skipped)
    let caller: CallerInfo | null = null;
    if (this.config.captureCaller) {
      caller = getCallerInfo();
    }

    const { relativeMs, diffMs } = getTimingInfo();
    const absTime = getCachedTimestamp();
    const activeContext = getActiveTraceContext();

    if (this.config.format === 'json') {
      const logObj: Record<string, any> = {
        time: absTime,
        relativeMs: Math.round(relativeMs),
        level: levelName,
        message,
      };

      const groupName = (activeContext ? activeContext.node.name : undefined) || this.currentGroup;
      if (groupName) logObj.group = groupName;
      if (meta) logObj.metadata = meta;
      if (errorStack) logObj.stack = errorStack;
      if (caller) {
        logObj.caller = caller.callerLocation;
      }

      const output = JSON.stringify(logObj) + '\n';
      this.outputWrite(levelName === 'ERROR' || levelName === 'ALERT', output);
    } else {
      // Console formatting with ANSI colors (high-density layout)
      const color = LEVEL_COLORS[levelName] || COLORS.reset;
      const levelStr = `${color}${COLORS.bold}[${levelName}]${COLORS.reset} `;
      const activeGroup = (activeContext ? activeContext.node.name : '') || this.currentGroup || '';
      const groupStr = activeGroup ? `${color}[${activeGroup}]${COLORS.reset} ` : '';
      
      let callerStr = '';
      if (caller) {
        callerStr = `  ${COLORS.gray}[${caller.callerLocation}]${COLORS.reset}`;
      }

      const relTimeStr = ` ${COLORS.cyan}[+${Math.round(diffMs)} = ${Math.round(relativeMs)}ms]${COLORS.reset}`;

      let metaStr = '';
      if (meta) {
        metaStr = `\n${COLORS.gray}${JSON.stringify(meta, null, 2)}${COLORS.reset}`;
      }

      if (errorStack) {
        metaStr += `\n${COLORS.red}${errorStack}${COLORS.reset}`;
      }

      const output = `${levelStr}${groupStr}${message}${callerStr}${relTimeStr}${metaStr}\n`;
      this.outputWrite(levelName === 'ERROR' || levelName === 'ALERT', output);
    }
  }

  private outputWrite(isError: boolean, output: string): void {
    if (typeof process !== 'undefined') {
      if (isError) {
        process.stderr.write(output);
      } else {
        process.stdout.write(output);
      }
    } else {
      if (isError) {
        console.error(output.trim());
      } else {
        console.log(output.trim());
      }
    }
  }
}

// Pre-allocated frozen NOOP logger to guarantee zero-overhead on bypassed logs
export const NOOP_LOGGER = new DevdootLogger(globalConfig, true);
Object.freeze(NOOP_LOGGER);

const devdoot = new DevdootLogger(globalConfig);
export default devdoot;
