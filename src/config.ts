export const LogLevel = {
  TRACE: 10,
  DEBUG: 20,
  INFO: 30,
  WARN: 40,
  ERROR: 50,
} as const;

export type LogLevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'console' | 'json';

export interface DevdootOptions {
  level?: LogLevelName;
  format?: LogFormat;
  enabled?: boolean;
  deepDebugging?: boolean;
  captureCaller?: boolean;
  inProd?: boolean;
  outputDir?: string;
  deepDebugGroups?: string[];
  saveTraces?: boolean;
  saveReports?: boolean;
  allowEnv?: boolean;
}

export class DevdootConfig {
  level: number;
  levelName: LogLevelName;
  format: LogFormat;
  enabled: boolean;
  deepDebugging: boolean;
  captureCaller: boolean;
  inProd: boolean;
  outputDir: string;
  deepDebugGroups?: string[];
  saveTraces: boolean;
  saveReports: boolean;
  allowEnv: boolean;

  constructor(options: DevdootOptions = {}) {
    this.allowEnv = options.allowEnv ?? false;

    const getEnv = (key: string): string | undefined => {
      if (!this.allowEnv) return undefined;
      const processObj = typeof process !== 'undefined' ? process : undefined;
      return processObj && processObj['env'] ? processObj['env'][key] : undefined;
    };

    const parseBoolEnv = (val: string | undefined, defaultVal: boolean): boolean => {
      if (val === undefined) return defaultVal;
      return val.toLowerCase() === 'true';
    };

    const isProductionEnv = getEnv('DEVDOOT_IN_PROD') || getEnv('NODE_ENV');
    const isProduction = isProductionEnv ? (isProductionEnv === 'production' || isProductionEnv === 'true') : false;

    this.inProd = options.inProd ?? isProduction;

    const envLevel = getEnv('DEVDOOT_LEVEL') || getEnv('DEVDOOT_LOG_LEVEL');
    this.levelName = options.level ?? (envLevel as LogLevelName) ?? (this.inProd ? 'error' : 'info');
    this.level = this.parseLevel(this.levelName);

    const envFormat = getEnv('DEVDOOT_FORMAT') || getEnv('DEVDOOT_LOG_FORMAT');
    this.format = options.format ?? (envFormat as LogFormat) ?? (this.inProd ? 'json' : 'console');

    const envEnabled = getEnv('DEVDOOT_ENABLED');
    this.enabled = options.enabled ?? parseBoolEnv(envEnabled, true);

    const envDeep = getEnv('DEVDOOT_DEEP_DEBUGGING');
    this.deepDebugging = options.deepDebugging ?? parseBoolEnv(envDeep, false);

    const envCapture = getEnv('DEVDOOT_CAPTURE_CALLER');
    this.captureCaller = options.captureCaller ?? (envCapture !== undefined ? envCapture === 'true' : !this.inProd);

    const envOutputDir = getEnv('DEVDOOT_OUTPUT_DIR');
    this.outputDir = options.outputDir ?? envOutputDir ?? 'storage/devdoot';

    const envGroups = getEnv('DEVDOOT_DEEP_DEBUG_GROUPS') || getEnv('DEVDOOT_DEBUG_GROUPS');
    this.deepDebugGroups = options.deepDebugGroups ?? (envGroups ? envGroups.split(',').map(s => s.trim()) : undefined);

    const envSaveTraces = getEnv('DEVDOOT_SAVE_TRACES') || getEnv('DEVDOOT_WRITE_TRACES');
    this.saveTraces = options.saveTraces ?? parseBoolEnv(envSaveTraces, false);

    const envSaveReports = getEnv('DEVDOOT_SAVE_REPORTS') || getEnv('DEVDOOT_WRITE_REPORTS');
    this.saveReports = options.saveReports ?? parseBoolEnv(envSaveReports, false);
  }

  update(options: DevdootOptions): void {
    if (options.allowEnv !== undefined) this.allowEnv = options.allowEnv;
    if (options.saveReports !== undefined) this.saveReports = options.saveReports;
    if (options.inProd !== undefined) this.inProd = options.inProd;
    if (options.level !== undefined) {
      this.levelName = options.level;
      this.level = this.parseLevel(options.level);
    }
    if (options.format !== undefined) this.format = options.format;
    if (options.enabled !== undefined) this.enabled = options.enabled;
    if (options.deepDebugging !== undefined) this.deepDebugging = options.deepDebugging;
    if (options.captureCaller !== undefined) this.captureCaller = options.captureCaller;
    if (options.outputDir !== undefined) this.outputDir = options.outputDir;
    if (options.deepDebugGroups !== undefined) this.deepDebugGroups = options.deepDebugGroups;
    if (options.saveTraces !== undefined) this.saveTraces = options.saveTraces;
  }

  private parseLevel(name: LogLevelName): number {
    switch (name) {
      case 'trace': return LogLevel.TRACE;
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }
}

export const globalConfig = new DevdootConfig();
