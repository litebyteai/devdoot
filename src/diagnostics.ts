import os from 'node:os';

export interface DiagnosticsSnapshot {
  timestamp: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
    systemTotal: number;
    systemFree: number;
  };
  cpu: {
    user: number;
    system: number;
    loadAverage: number[];
    cores: number;
    model: string;
  };
  platform: {
    os: string;
    release: string;
    arch: string;
    nodeVersion: string;
    uptime: number;
    pid: number;
  };
}

/**
 * Capture a complete snapshot of CPU, memory, platform, and process status.
 * Optimized to run only when reports are created to avoid runtime tracing overhead.
 */
export function getDiagnosticsSnapshot(): DiagnosticsSnapshot {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();
  const cpus = os.cpus();
  
  return {
    timestamp: new Date().toISOString(),
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers || 0,
      systemTotal: os.totalmem(),
      systemFree: os.freemem(),
    },
    cpu: {
      user: cpu.user,
      system: cpu.system,
      loadAverage: os.loadavg(),
      cores: cpus.length || 1,
      model: cpus[0]?.model || 'Unknown',
    },
    platform: {
      os: os.platform(),
      release: os.release(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      pid: process.pid,
    }
  };
}
