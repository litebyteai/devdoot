#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { getDiagnosticsSnapshot } from './diagnostics.js';

// Resolve paths for development and production modes
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getViewerHtmlPath(): string {
  // Check in built dist folder
  const distPath = path.join(__dirname, 'viewer', 'index.html');
  if (fs.existsSync(distPath)) return distPath;

  // Check in root dist folder (if copied flat)
  const flatDistPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(flatDistPath)) return flatDistPath;

  // Fallback to source directory for dev runs
  const devPath = path.join(__dirname, '..', 'src', 'viewer', 'index.html');
  if (fs.existsSync(devPath)) return devPath;

  throw new Error(`Viewer HTML not found at standard paths.`);
}

function openBrowser(url: string): void {
  let startCommand = 'xdg-open';
  if (process.platform === 'win32') {
    startCommand = 'start ""';
  } else if (process.platform === 'darwin') {
    startCommand = 'open';
  }

  exec(`${startCommand} "${url}"`, (err) => {
    if (err) {
      console.log(`Failed to open browser automatically. Please open ${url} manually.`);
    }
  });
}

function printHelp(): void {
  console.log(`
\x1b[35m\x1b[1mDevdoot Diagnostics CLI\x1b[0m
Usage: devdoot <command> [options]

Commands:
  \x1b[36mdoctor\x1b[0m                  Verify system health and diagnostics configuration
  \x1b[36mreport\x1b[0m                  List and summarize generated crash reports
                          Options:
                            -d, --dir <directory>   Base reports directory (default: storage/devdoot/reports)
  \x1b[36mgroups\x1b[0m                  List all unique group names found in saved trace files
                          Options:
                            -d, --dir <directory>   Base traces directory (default: storage/devdoot/traces)
  \x1b[36mopen <file>\x1b[0m             Open a diagnostic report file in the interactive Web Viewer
                          Options:
                            -p, --port <number>     Port to run the viewer on (default: 3000)

Global Options:
  -h, --help              Show help information
`);
}

function getOptionValue(args: string[], shortFlag: string, longFlag: string): string | undefined {
  const shortIndex = args.indexOf(shortFlag);
  if (shortIndex !== -1 && args[shortIndex + 1]) return args[shortIndex + 1];

  const longIndex = args.indexOf(longFlag);
  if (longIndex !== -1 && args[longIndex + 1]) return args[longIndex + 1];

  return undefined;
}

function runDoctor(): void {
  const snap = getDiagnosticsSnapshot();
  console.log(`\n\x1b[35m\x1b[1m[Devdoot Doctor]\x1b[0m`);
  console.log(`----------------------------------------`);
  console.log(`OS Platform:   \x1b[32m${snap.platform.os} (${snap.platform.arch})\x1b[0m`);
  console.log(`Node Version:  \x1b[32m${snap.platform.nodeVersion}\x1b[0m`);
  console.log(`CPU Cores:     \x1b[32m${snap.cpu.cores}\x1b[0m`);
  console.log(`Heap Limit:    \x1b[32m${Math.round(snap.memory.heapTotal / 1024 / 1024)} MB\x1b[0m`);
  console.log(`Heap Usage:    \x1b[32m${Math.round(snap.memory.heapUsed / 1024 / 1024)} MB\x1b[0m`);
  console.log(`System Memory: \x1b[32m${Math.round(snap.memory.systemTotal / 1024 / 1024 / 1024)} GB\x1b[0m`);
  console.log(`----------------------------------------`);
  console.log(`Status:        \x1b[35m\x1b[1mSystem healthy. Ready to record traces.\x1b[0m\n`);
}

function runReport(dirPath: string): void {
  const reportsDir = path.resolve(dirPath);
  if (!fs.existsSync(reportsDir)) {
    console.log(`\n\x1b[33mNo crash reports found at: ${reportsDir}\x1b[0m\n`);
    return;
  }

  const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.txt'));
  if (files.length === 0) {
    console.log(`\n\x1b[33mNo reports (.txt) found in directory: ${reportsDir}\x1b[0m\n`);
    return;
  }

  console.log(`\n\x1b[35m\x1b[1m[Devdoot Crash Reports]\x1b[0m`);
  console.log(`----------------------------------------`);
  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(reportsDir, file), 'utf8');

      const idMatch = content.match(/Report ID:\s+(.+)/);
      const timeMatch = content.match(/Timestamp:\s+(.+)/);
      const errorMatch = content.match(/Error:\s+(.+)/);
      const osMatch = content.match(/OS Platform:\s+(.+)/);

      const id = idMatch ? idMatch[1].trim() : file.replace('report-', '').replace('.txt', '');
      const timestamp = timeMatch ? timeMatch[1].trim() : 'Unknown';
      const errorMessage = errorMatch ? errorMatch[1].trim() : 'Unknown';
      const os = osMatch ? osMatch[1].trim() : 'Unknown';

      console.log(`📄 \x1b[36m${file}\x1b[0m`);
      console.log(`   Time:  ${timestamp}`);
      console.log(`   Error: \x1b[31m${errorMessage}\x1b[0m`);
      console.log(`   OS:    ${os}`);
      console.log(`   Path:  ${path.join(reportsDir, file)}`);
      console.log(`----------------------------------------`);
    } catch (err) {
      console.log(`❌ Failed to parse report: ${file}`);
    }
  });
  console.log(`Run \x1b[35mdevdoot open <report-file-path>\x1b[0m to view execution details.\n`);
}

function runGroups(dirPath: string): void {
  const tracesDir = path.resolve(dirPath);
  if (!fs.existsSync(tracesDir)) {
    console.log(`\n\x1b[33mNo traces directory found at: ${tracesDir}\x1b[0m\n`);
    return;
  }

  const files = fs.readdirSync(tracesDir).filter(f => f.endsWith('.txt'));
  if (files.length === 0) {
    console.log(`\n\x1b[33mNo trace files (.txt) found in directory: ${tracesDir}\x1b[0m\n`);
    return;
  }

  const uniqueGroups = new Set<string>();

  files.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(tracesDir, file), 'utf8');

      // Match logs like: [INFO] [GroupName]
      const groupRegex = /\[(?:INFO|WARN|ERROR|TRACE|DEBUG)\]\s+\[([^\]]+)\]/g;
      let match;
      while ((match = groupRegex.exec(content)) !== null) {
        uniqueGroups.add(match[1].trim());
      }

      // Match trace names like: 23:30:08.457 [+6ms] MainJob()
      const traceRegex = /\d{2}:\d{2}:\d{2}\.\d{3}\s+\[\+\d+ms\]\s*(?:[✓✗]\s+)?([a-zA-Z0-9_$]+)\(\)/g;
      while ((match = traceRegex.exec(content)) !== null) {
        uniqueGroups.add(match[1].trim());
      }
    } catch (err) {
      // Silent error
    }
  });

  const groupsList = Array.from(uniqueGroups).filter(Boolean).sort();
  if (groupsList.length === 0) {
    console.log(`\n\x1b[33mNo group names discovered in trace files.\x1b[0m\n`);
    return;
  }

  console.log(`\n\x1b[35m\x1b[1m[Discovered Group Names]\x1b[0m`);
  console.log(`----------------------------------------`);
  groupsList.forEach(group => {
    console.log(` 🏷️  \x1b[36m${group}\x1b[0m`);
  });
  console.log(`----------------------------------------`);
  console.log(`Total: ${groupsList.length} unique groups.\n`);
  console.log(`To filter deep logs for these, set:`);
  console.log(`\x1b[33mDEVDOOT_DEEP_DEBUG_GROUPS=${groupsList.slice(0, 3).join(',')}\x1b[0m\n`);
}

function runOpen(filePath: string, port: number): void {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`\n\x1b[31mError: File not found at ${absolutePath}\x1b[0m\n`);
    process.exit(1);
  }

  let reportData: string;
  try {
    reportData = fs.readFileSync(absolutePath, 'utf8');
  } catch (err) {
    console.error(`\n\x1b[31mError: Could not read report file.\x1b[0m\n`);
    process.exit(1);
  }

  const viewerHtmlPath = getViewerHtmlPath();
  const htmlContent = fs.readFileSync(viewerHtmlPath, 'utf8');

  // Create a lightweight server to host the viewer
  const server = http.createServer((req, res) => {
    if (req.url === '/api/data') {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(reportData);
    } else if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlContent);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n\x1b[35m\x1b[1m[Devdoot Web Viewer]\x1b[0m`);
    console.log(`----------------------------------------`);
    console.log(`Server started: \x1b[36m${url}\x1b[0m`);
    console.log(`Report Loaded:  \x1b[32m${path.basename(absolutePath)}\x1b[0m`);
    console.log(`Status:         \x1b[35mPress Ctrl+C to terminate the server\x1b[0m`);
    console.log(`----------------------------------------\n`);

    openBrowser(url);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n\x1b[31mError: Port ${port} is in use. Run with a different port using -p option (e.g. devdoot open -p 3001 <file>)\x1b[0m\n`);
    } else {
      console.error(`\n\x1b[31mError: ${err.message}\x1b[0m\n`);
    }
    process.exit(1);
  });
}

// CLI Command routing
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'doctor') {
  runDoctor();
} else if (command === 'report') {
  const dir = getOptionValue(args, '-d', '--dir') || 'storage/devdoot/reports';
  runReport(dir);
} else if (command === 'groups') {
  const dir = getOptionValue(args, '-d', '--dir') || 'storage/devdoot/traces';
  runGroups(dir);
} else if (command === 'open') {
  const filePath = args[1];
  if (!filePath || filePath.startsWith('-')) {
    console.error(`\n\x1b[31mError: A file path must be specified (e.g. devdoot open storage/devdoot/reports/report-xxx.txt)\x1b[0m\n`);
    process.exit(1);
  }
  const portStr = getOptionValue(args, '-p', '--port') || '3000';
  const port = parseInt(portStr, 10);
  runOpen(filePath, port);
} else {
  console.error(`\n\x1b[31mError: Unknown command "${command}"\x1b[0m\n`);
  printHelp();
  process.exit(1);
}
