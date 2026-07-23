const IN_PROD = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
const DEEP_DEBUGGING = typeof process !== 'undefined' && process.env.DEEP_DEBUGGING === 'true';

/**
 * Ultra-light NOOP audit used in production when debugging is OFF
 * No Proxy
 * No stack trace
 * No allocations
 */
const NOOP_AUDIT = {
  log() {},
  info() {},
  warn() {},
  error(...args: any[]) {
    console.error(...args); // still allow errors
  },
  status() {},
  alert(...args: any[]) {
    console.error(...args);
  },
  debug() {
    return this;
  },
  setLogging() {},
  setDeepDebugging() {},
} as unknown as Audit;

export class Audit {
  enableLogging: boolean;
  enableDeepDebugging: boolean;

  constructor(enableLogging: boolean, enableDeepDebugging: boolean) {
    this.enableLogging = enableLogging;
    this.enableDeepDebugging = enableDeepDebugging;
  }

  /**
   * EXPENSIVE — DEV ONLY
   */
  private getCallerInfo(): string {
    const error = new Error();
    const stack = error.stack?.split("\n");

    if (!stack) return "unknown";

    for (let i = 2; i < stack.length; i++) {
      const line = stack[i].trim();
      if (!line.includes("Audit.")) {
        const match = line.match(/\((.*):(\d+):(\d+)\)/);
        if (match) {
          const [, filePath, lineNo, colNo] = match;
          const file = filePath.split("/").pop();
          return `${file}:${lineNo}:${colNo}`;
        }
      }
    }
    return "unknown";
  }

  /**
   * FAST PATH
   */
  private formatMessage(args: any[]): any[] {
    // 🔥 ZERO overhead in production
    if (IN_PROD || !this.enableDeepDebugging) return args;

    const caller = this.getCallerInfo();
    return [...args, `[${caller}]`];
  }

  /**
   * 🔥 CRITICAL METHOD
   * This is called everywhere
   */
  debug(): Audit {
    // Production OR deep debugging disabled → NOOP
    if (IN_PROD || !this.enableDeepDebugging) {
      return NOOP_AUDIT;
    }
    return this;
  }

  log(...args: any[]): void {
    if (!this.enableLogging) return;
    console.log(...this.formatMessage(args));
  }

  info(...args: any[]): void {
    if (!this.enableLogging) return;
    console.info(...this.formatMessage(args));
  }

  warn(...args: any[]): void {
    if (!this.enableLogging) return;
    console.warn(...this.formatMessage(args));
  }

  error(...args: any[]): void {
    // Errors always printed
    if (IN_PROD) {
      console.error(...args); // 🔥 no stack trace
    } else {
      console.error(...this.formatMessage(args));
    }
  }

  alert(...args: any[]): void {
    console.error(...this.formatMessage(args));
  }

  status(...args: any[]): void {
    if (!this.enableLogging) return;
    console.log(...this.formatMessage(["STATUS:", ...args]));
  }

  setLogging(enabled: boolean): void {
    this.enableLogging = enabled;
  }

  setDeepDebugging(enabled: boolean): void {
    this.enableDeepDebugging = enabled;
  }
}

/**
 * SINGLE INSTANCE
 */
const audit = new Audit(!IN_PROD, DEEP_DEBUGGING);

export default audit;
