import { DevdootConfig, LogLevel, LogLevelName, DevdootOptions, globalConfig } from './config.js';
import { getCachedTimestamp, getRelativeMs, formatRelativeTime } from './time.js';
import { getCallerInfo, CallerInfo } from './caller.js';
import { getActiveTraceContext } from './context.js';
import { initCrashReporter, RegisterOptions } from './reporter.js';

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

  group(name: string): this {
    if (this.isNoop) return this;
    this.currentGroup = name;
    return this;
  }

  create(options?: DevdootOptions): DevdootLogger {
    const newConfig = new DevdootConfig(options);
    return new DevdootLogger(newConfig);
  }

  configure(options: DevdootOptions): void {
    this.config.update(options);
  }

  register(options?: RegisterOptions): void {
    if (this.isNoop) return;
    initCrashReporter(options);
  }

  trace(message: any, meta?: any): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.TRACE) return;
    this.write(LogLevel.TRACE, 'TRACE', message, meta);
  }

  debug(): DevdootLogger;
  debug(message: any, meta?: any): void;
  debug(message?: any, meta?: any): void | DevdootLogger {
    if (this.isNoop || !this.config.enabled) {
      return message === undefined ? NOOP_LOGGER : undefined;
    }

    if (this.config.deepDebugGroups && this.config.deepDebugGroups.length > 0) {
      const activeContext = getActiveTraceContext();
      const activeGroup = (activeContext ? activeContext.node.name : '') || this.currentGroup || '';
      if (!this.config.deepDebugGroups.includes(activeGroup)) {
        return message === undefined ? NOOP_LOGGER : undefined;
      }
    }

    if (message === undefined) {
      if (!this.config.deepDebugging) {
        return NOOP_LOGGER;
      }
      return this;
    }
    if (this.config.level > LogLevel.DEBUG) return;
    this.write(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  info(message: any, meta?: any): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.INFO) return;
    this.write(LogLevel.INFO, 'INFO', message, meta);
  }

  log(message: any, meta?: any): void {
    this.info(message, meta); // Alias for info
  }

  warn(message: any, meta?: any): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.WARN) return;
    this.write(LogLevel.WARN, 'WARN', message, meta);
  }

  error(message: any, meta?: any): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.ERROR) return;
    this.write(LogLevel.ERROR, 'ERROR', message, meta);
  }

  status(message: any, meta?: any): void {
    if (this.isNoop || !this.config.enabled || this.config.level > LogLevel.INFO) return;
    this.write(LogLevel.INFO, 'STATUS', message, meta);
  }

  alert(message: any, meta?: any): void {
    if (this.isNoop || !this.config.enabled) return; // Alert always prints unless completely disabled
    this.write(LogLevel.ERROR, 'ALERT', message, meta);
  }



  private write(levelValue: number, levelName: string, rawMessage: any, meta?: any): void {
    // 1. Resolve lazy callback message
    let message = typeof rawMessage === 'function' ? rawMessage() : rawMessage;

    // 2. Resolve error instances
    let errorStack: string | undefined;
    if (message instanceof Error) {
      errorStack = message.stack;
      message = message.message;
    }

    // 3. Capture caller info (only if configured and not skipped)
    let caller: CallerInfo | null = null;
    if (this.config.captureCaller) {
      caller = getCallerInfo();
    }

    const relTime = getRelativeMs();
    const absTime = getCachedTimestamp();
    const activeContext = getActiveTraceContext();

    if (this.config.format === 'json') {
      const logObj: Record<string, any> = {
        time: absTime,
        relativeMs: Math.round(relTime),
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

      const relTimeStr = ` ${COLORS.cyan}[${formatRelativeTime(relTime)}]${COLORS.reset}`;

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
