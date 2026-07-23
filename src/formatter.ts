import type { CrashReport } from './reporter.js';

export function renderTraceNodeToText(node: any, indent = ''): string {
  const durationText = node.duration !== undefined ? `${Math.round(node.duration)}ms` : 'running';
  const hasError = !!(node.errorDetails || (node.error && typeof node.error !== 'function'));
  const statusIcon = hasError ? '✗' : '✓';
  const statusText = hasError ? 'failed' : 'completed';
  
  const lines: string[] = [];
  lines.push(`${indent}${node.timestamp} [+${Math.round(node.relativeTime || 0)}ms] ${statusIcon} ${node.name}() - ${statusText} (Duration: ${durationText})`);
  
  // Combine logs and children, sort by time (relativeTime/offset)
  const items: { time: number; text: string }[] = [];
  
  if (node.logs && Array.isArray(node.logs)) {
    for (const log of node.logs) {
      const levelStr = `[${log.level}]`;
      const groupStr = log.group ? `[${log.group}] ` : '';
      const callerStr = log.caller ? `  [${log.caller}]` : '';
      const relTimeStr = ` [+${log.relativeMs}ms]`;
      let metaStr = '';
      if (log.metadata && Object.keys(log.metadata).length > 0) {
        metaStr = `\n${indent}    Metadata: ${JSON.stringify(log.metadata)}`;
      }
      if (log.stack) {
        metaStr += `\n${indent}    Stack: ${log.stack}`;
      }
      items.push({
        time: (log.relativeMs || 0) + (node.relativeTime || 0),
        text: `${indent}  ${levelStr} ${groupStr}${log.message}${callerStr}${relTimeStr}${metaStr}`
      });
    }
  }
  
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      items.push({
        time: child.relativeTime || 0,
        text: renderTraceNodeToText(child, indent + '  ')
      });
    }
  }
  
  items.sort((a, b) => a.time - b.time);
  for (const item of items) {
    lines.push(item.text);
  }
  
  return lines.join('\n');
}

export function formatReportToText(report: CrashReport): string {
  const lines: string[] = [];
  lines.push(`======================================================================`);
  lines.push(`                      DEVDOOT DIAGNOSTIC REPORT                      `);
  lines.push(`======================================================================`);
  lines.push(`Report ID:   ${report.id}`);
  lines.push(`Timestamp:   ${report.timestamp}`);
  lines.push(`Error:       ${report.error.message}`);
  if (report.error.stack) {
    lines.push(`\nStack Trace:\n${report.error.stack}`);
  }
  lines.push(`\n============================= DIAGNOSTICS ============================`);
  if (report.diagnostics) {
    const diag = report.diagnostics;
    if (diag.platform) {
      lines.push(`OS Platform:   ${diag.platform.os} (${diag.platform.arch})`);
      lines.push(`Node Version:  ${diag.platform.nodeVersion}`);
      lines.push(`PID:           ${diag.platform.pid}`);
      lines.push(`Uptime:        ${Math.round(diag.platform.uptime)}s`);
    }
    if (diag.cpu) {
      lines.push(`CPU Model:     ${diag.cpu.model}`);
      lines.push(`CPU Cores:     ${diag.cpu.cores}`);
    }
    if (diag.memory) {
      const toMB = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;
      lines.push(`Memory - RSS:        ${toMB(diag.memory.rss)}`);
      lines.push(`Memory - Heap Total: ${toMB(diag.memory.heapTotal)}`);
      lines.push(`Memory - Heap Used:  ${toMB(diag.memory.heapUsed)}`);
      lines.push(`Memory - External:   ${toMB(diag.memory.external)}`);
      lines.push(`Memory - System:     ${Math.round(diag.memory.systemFree / 1024 / 1024 / 1024)} GB free / ${Math.round(diag.memory.systemTotal / 1024 / 1024 / 1024)} GB total`);
    }
  }

  if (report.activeTrace) {
    lines.push(`\n============================ ACTIVE TRACE ============================`);
    lines.push(renderTraceNodeToText(report.activeTrace));
  }

  if (report.completedTraces && report.completedTraces.length > 0) {
    lines.push(`\n========================== COMPLETED TRACES ==========================`);
    report.completedTraces.forEach((trace, idx) => {
      lines.push(`\n--- Trace #${idx + 1} ---`);
      lines.push(renderTraceNodeToText(trace));
    });
  }

  lines.push(`======================================================================`);
  return lines.join('\n');
}
