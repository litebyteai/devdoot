import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import devdoot, { 
  runTraced, 
  globalConfig, 
  DevdootConfig,
  Devdoot,
  NOOP_LOGGER,
  getDiagnosticsSnapshot, 
  writeReport, 
  completedRootTraces 
} from '../src/index.js';
import { expressTrace, axiosTrace, playwrightTrace } from '../src/plugins/index.js';

describe('Logger', () => {
  it('should support logging levels', () => {
    const consoleSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    
    globalConfig.update({ level: 'info', format: 'console', enabled: true });
    
    devdoot.info('Test Info Message');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockClear();
    devdoot.debug('Test Debug Message'); // Should not log since level is info
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe('Tracing & Context', () => {
  it('should create tracing tree with parent-child relationships', async () => {
    globalConfig.update({ level: 'info', format: 'json', enabled: true });
    
    await runTraced('RootOperation', async (root) => {
      root.info('Inside root');
      
      await runTraced('ChildOperation', async (child) => {
        child.info('Inside child');
      });
    });

    // Root operation should have completed
    const rootTrace = completedRootTraces.find(t => t.name === 'RootOperation');
    expect(rootTrace).toBeDefined();
    expect(rootTrace?.children.length).toBe(1);
    expect(rootTrace?.children[0].name).toBe('ChildOperation');
    expect(rootTrace?.logs.length).toBe(1);
    expect(rootTrace?.children[0].logs.length).toBe(1);
  });

  it('should store caller as string in the format filePath:line:column', async () => {
    globalConfig.update({ level: 'info', format: 'json', enabled: true, captureCaller: true });
    
    await runTraced('CallerTest', async (trace) => {
      expect(trace.caller).toBeTypeOf('string');
      expect(trace.caller).toMatch(/:\d+:\d+$/);
    });
  });
});

describe('Diagnostics', () => {
  it('should collect active system stats', () => {
    const snap = getDiagnosticsSnapshot();
    expect(snap.platform).toBeDefined();
    expect(snap.platform.nodeVersion).toBe(process.version);
    expect(snap.memory).toBeDefined();
    expect(snap.memory.heapUsed).toBeGreaterThan(0);
    expect(snap.cpu).toBeDefined();
  });
});

describe('Crash Reports', () => {
  it('should write reports to disk', () => {
    const mockReport = {
      id: 'test-uuid-1234',
      timestamp: new Date().toISOString(),
      error: { message: 'Mock crash error' },
      diagnostics: getDiagnosticsSnapshot(),
      completedTraces: []
    };

    const filePath = writeReport(mockReport);
    expect(fs.existsSync(filePath)).toBe(true);
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    expect(fileContent).toContain('Report ID:   test-uuid-1234');
    expect(fileContent).toContain('Error:       Mock crash error');
    
    // Cleanup
    fs.unlinkSync(filePath);
  });
});

describe('Plugins', () => {
  it('should support express middleware hook', () => {
    const middleware = expressTrace();
    let nextCalled = false;
    
    const mockReq = {
      method: 'GET',
      path: '/test-route',
      originalUrl: '/test-route?query=1',
      ip: '127.0.0.1',
      get: () => 'Mozilla'
    };
    
    const mockRes = {
      statusCode: 200,
      on: vi.fn()
    };
    
    middleware(mockReq as any, mockRes as any, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect((mockRes as any)._devdootTrace).toBeDefined();
    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should support axios interceptors tracing', () => {
    const mockInterceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    };
    
    const mockAxios = {
      interceptors: mockInterceptors
    };

    axiosTrace(mockAxios);
    expect(mockInterceptors.request.use).toHaveBeenCalled();
    expect(mockInterceptors.response.use).toHaveBeenCalled();
  });

  it('should support playwright actions', async () => {
    let actionRun = false;
    await playwrightTrace('MockAction', async (trace) => {
      actionRun = true;
      expect(trace.name).toBe('Playwright: MockAction');
    });
    expect(actionRun).toBe(true);
  });
});

describe('Configuration Options', () => {
  it('should load properties from environment variables', () => {
    process.env.DEVDOOT_LOG_LEVEL = 'warn';
    process.env.DEVDOOT_FORMAT = 'json';
    process.env.DEVDOOT_ENABLED = 'false';

    const config = new DevdootConfig({ allowEnv: true });
    
    expect(config.levelName).toBe('warn');
    expect(config.format).toBe('json');
    expect(config.enabled).toBe(false);

    // Clean up
    delete process.env.DEVDOOT_LOG_LEVEL;
    delete process.env.DEVDOOT_FORMAT;
    delete process.env.DEVDOOT_ENABLED;
  });

  it('should support programmatic configuration via configure API', () => {
    devdoot.configure({ level: 'trace', format: 'json' });
    expect(globalConfig.levelName).toBe('trace');
    expect(globalConfig.format).toBe('json');
  });

  it('should support overloaded debug() chaining and deepDebugging bypass', () => {
    // 1. When deepDebugging is disabled
    devdoot.configure({ deepDebugging: false, format: 'console' });
    const consoleSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    
    const noopResult = devdoot.debug();
    expect(noopResult).toBe(NOOP_LOGGER);
    
    noopResult.log('This should not log');
    expect(consoleSpy).not.toHaveBeenCalled();

    // 2. When deepDebugging is enabled
    devdoot.configure({ deepDebugging: true, level: 'trace' });
    const activeResult = devdoot.debug();
    expect(activeResult).toBe(devdoot);
    
    activeResult.log('This should log');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should support non-invasive group() naming', () => {
    devdoot.configure({ level: 'trace', format: 'console' });
    const consoleSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    
    devdoot.group('GroupA');
    expect(devdoot.currentGroup).toBe('GroupA');
    devdoot.info('Test Info');
    
    devdoot.group('GroupB').warn('Test Warning');
    
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    devdoot.group('');
    consoleSpy.mockRestore();
  });

  it('should support custom instances and isolation via Devdoot class and create()', () => {
    const logger2 = devdoot.create({ level: 'warn' });
    expect(logger2.config.levelName).toBe('warn');
    
    const logger3 = new Devdoot({ level: 'error' });
    expect(logger3.config.levelName).toBe('error');

    devdoot.configure({ level: 'trace' });
    expect(devdoot.config.levelName).toBe('trace');
    expect(logger2.config.levelName).toBe('warn');
    expect(logger3.config.levelName).toBe('error');
  });

  it('should support selective deep debugging group filters via config and env', () => {
    process.env.DEVDOOT_DEEP_DEBUG_GROUPS = 'Auth, Database ';
    const config = new DevdootConfig({ allowEnv: true });
    expect(config.deepDebugGroups).toEqual(['Auth', 'Database']);
    delete process.env.DEVDOOT_DEEP_DEBUG_GROUPS;

    devdoot.configure({ deepDebugging: true, deepDebugGroups: ['Database'], level: 'trace', format: 'console' });
    const consoleSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const resultAuth = devdoot.group('Auth').debug();
    expect(resultAuth).toBe(NOOP_LOGGER);
    resultAuth.log('Auth debug message');
    expect(consoleSpy).not.toHaveBeenCalled();

    const resultDb = devdoot.group('Database').debug();
    expect(resultDb).toBe(devdoot);
    resultDb.log('Database debug message');
    expect(consoleSpy).toHaveBeenCalled();

    devdoot.group('');
    devdoot.configure({ deepDebugGroups: undefined });
    consoleSpy.mockRestore();
  });

  it('should support saveTraces configuration and env variable toggling', async () => {
    process.env.DEVDOOT_SAVE_TRACES = 'true';
    const config = new DevdootConfig({ allowEnv: true });
    expect(config.saveTraces).toBe(true);
    delete process.env.DEVDOOT_SAVE_TRACES;

    devdoot.configure({ enabled: true, saveTraces: false, outputDir: 'storage/devdoot_test' });
    const tracesDir = path.resolve('storage/devdoot_test/traces');
    
    if (fs.existsSync(tracesDir)) {
      fs.readdirSync(tracesDir).forEach(f => fs.unlinkSync(path.join(tracesDir, f)));
    }

    await runTraced('NoSaveTrace', async (trace) => {
      trace.info('No save info');
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    const filesNoSave = fs.existsSync(tracesDir) ? fs.readdirSync(tracesDir) : [];
    expect(filesNoSave.length).toBe(0);

    devdoot.configure({ saveTraces: true });
    await runTraced('SaveTrace', async (trace) => {
      trace.info('Save info');
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    const filesSave = fs.existsSync(tracesDir) ? fs.readdirSync(tracesDir) : [];
    expect(filesSave.length).toBeGreaterThan(0);

    if (fs.existsSync(tracesDir)) {
      fs.readdirSync(tracesDir).forEach(f => fs.unlinkSync(path.join(tracesDir, f)));
      fs.rmdirSync(tracesDir);
      fs.rmdirSync(path.resolve('storage/devdoot_test'));
    }
    devdoot.configure({ saveTraces: false, outputDir: 'storage/devdoot' });
  });
});

describe('Global Process Registry', () => {
  let onHandlers: { [key: string]: Function[] } = {};

  beforeEach(() => {
    onHandlers = {};

    vi.spyOn(process, 'on').mockImplementation((event: string, handler: any) => {
      if (!onHandlers[event]) {
        onHandlers[event] = [];
      }
      onHandlers[event].push(handler);
      return process;
    });

    vi.spyOn(process, 'exit').mockImplementation((_code?: string | number | null | undefined): never => {
      return undefined as never;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up the global registered symbol to allow re-registration in other tests
    const key = Symbol.for('devdoot.process.registered');
    delete (globalThis as any)[key];
  });

  it('should register all 7 default event handlers', () => {
    devdoot.register();

    expect(process.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('beforeExit', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('exit', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    expect(process.on).toHaveBeenCalledWith('multipleResolves', expect.any(Function));
  });

  it('should be idempotent and not register handlers twice', () => {
    devdoot.register();
    const callCountFirst = vi.mocked(process.on).mock.calls.length;

    // Call again, should not add new listeners
    devdoot.register();
    const callCountSecond = vi.mocked(process.on).mock.calls.length;

    expect(callCountFirst).toBe(callCountSecond);
  });

  it('should allow disabling specific event handlers', () => {
    devdoot.register({
      sigint: false,
      multipleResolves: false,
    });

    expect(process.on).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    expect(process.on).not.toHaveBeenCalledWith('SIGINT', expect.any(Function));
    expect(process.on).not.toHaveBeenCalledWith('multipleResolves', expect.any(Function));
  });

  it('should generate a crash report and exit on uncaughtException', () => {
    const errDir = path.resolve('storage/devdoot/reports');
    if (fs.existsSync(errDir)) {
      fs.readdirSync(errDir).forEach(f => {
        try {
          fs.unlinkSync(path.join(errDir, f));
        } catch (e) {}
      });
    }

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    devdoot.register();
    const handler = onHandlers['uncaughtException']?.[0];
    expect(handler).toBeDefined();

    const dummyError = new Error('Test Uncaught Exception');
    handler(dummyError);

    expect(process.exit).toHaveBeenCalledWith(1);
    expect(stderrSpy).toHaveBeenCalled();

    // Verify report was written
    const files = fs.readdirSync(errDir);
    expect(files.length).toBe(1);
    const content = fs.readFileSync(path.join(errDir, files[0]), 'utf8');
    expect(content).toContain('Error:       Test Uncaught Exception');

    // Clean up
    fs.unlinkSync(path.join(errDir, files[0]));
    stderrSpy.mockRestore();
  });

  it('should generate a crash report and NOT exit on uncaughtException if exitOnError is false', () => {
    const errDir = path.resolve('storage/devdoot/reports');
    if (fs.existsSync(errDir)) {
      fs.readdirSync(errDir).forEach(f => {
        try {
          fs.unlinkSync(path.join(errDir, f));
        } catch (e) {}
      });
    }

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    devdoot.register({ exitOnError: false });
    const handler = onHandlers['uncaughtException']?.[0];
    expect(handler).toBeDefined();

    handler(new Error('Test Uncaught No Exit'));

    expect(process.exit).not.toHaveBeenCalled();

    // Clean up
    const files = fs.readdirSync(errDir);
    if (files.length > 0) {
      fs.unlinkSync(path.join(errDir, files[0]));
    }
    stderrSpy.mockRestore();
  });

  it('should generate a shutdown report on SIGINT', () => {
    const errDir = path.resolve('storage/devdoot/reports');
    if (fs.existsSync(errDir)) {
      fs.readdirSync(errDir).forEach(f => {
        try {
          fs.unlinkSync(path.join(errDir, f));
        } catch (e) {}
      });
    }

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    devdoot.register();
    const handler = onHandlers['SIGINT']?.[0];
    expect(handler).toBeDefined();

    handler();

    expect(process.exit).toHaveBeenCalledWith(130);
    expect(stderrSpy).toHaveBeenCalled();

    // Clean up
    const files = fs.readdirSync(errDir);
    if (files.length > 0) {
      fs.unlinkSync(path.join(errDir, files[0]));
    }
    stderrSpy.mockRestore();
  });
});

