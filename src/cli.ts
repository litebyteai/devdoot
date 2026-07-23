#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import open from 'open';
import { getDiagnosticsSnapshot } from './diagnostics.js';

const program = new Command();

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

program
  .name('devdoot')
  .description('Devdoot Developer Diagnostics & Intelligence Platform CLI')
  .version('0.1.0');

program
  .command('doctor')
  .description('Verify system health and diagnostics configuration')
  .action(() => {
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
  });

program
  .command('report')
  .description('List and summarize generated crash reports')
  .option('-d, --dir <directory>', 'Reports directory', 'storage/devdoot/reports')
  .action((options) => {
    const reportsDir = path.resolve(options.dir);
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
  });

program
  .command('groups')
  .description('List all unique group names found in saved trace files')
  .option('-d, --dir <directory>', 'Traces directory', 'storage/devdoot/traces')
  .action((options) => {
    const tracesDir = path.resolve(options.dir);
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
  });

program
  .command('open <filePath>')
  .description('Open a diagnostic report file in the interactive Web Viewer')
  .option('-p, --port <number>', 'Port to run the viewer on', '3000')
  .action(async (filePath, options) => {
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

    const port = parseInt(options.port, 10);
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

    server.listen(port, async () => {
      const url = `http://localhost:${port}`;
      console.log(`\n\x1b[35m\x1b[1m[Devdoot Web Viewer]\x1b[0m`);
      console.log(`----------------------------------------`);
      console.log(`Server started: \x1b[36m${url}\x1b[0m`);
      console.log(`Report Loaded:  \x1b[32m${path.basename(absolutePath)}\x1b[0m`);
      console.log(`Status:         \x1b[35mPress Ctrl+C to terminate the server\x1b[0m`);
      console.log(`----------------------------------------\n`);

      try {
        await open(url);
      } catch (err) {
        console.log(`Failed to open browser automatically. Please open ${url} manually.`);
      }
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n\x1b[31mError: Port ${port} is in use. Run with a different port using -p option (e.g. devdoot open -p 3001 <file>)\x1b[0m\n`);
      } else {
        console.error(`\n\x1b[31mError: ${err.message}\x1b[0m\n`);
      }
      process.exit(1);
    });
  });

program.parse(process.argv);
export { program };
