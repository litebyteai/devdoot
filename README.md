# 🚀 Devdoot

### *The Intelligent, High-Performance Developer Diagnostics & Tracing Engine for Node.js*

[![NPM Version](https://img.shields.io/npm/v/devdoot.svg?style=flat-square)](https://www.npmjs.com/package/devdoot)
[![License](https://img.shields.io/npm/l/devdoot.svg?style=flat-square)](https://github.com/your-username/devdoot/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/your-username/devdoot/test.yml?branch=main)](https://github.com/your-username/devdoot/actions)

**Devdoot** is a lightweight, zero-overhead developer diagnostics and distributed tracing platform for Node.js applications. It isn't just another logger—it is a comprehensive runtime observer designed to help you instantly understand *what happened*, *when it happened*, *where it happened*, and *why it failed*, without polluting your codebase with manual logging statements.

---

## 🌟 Key Features

*   **⚡ High-Performance Zero-Allocation Logs**: When `deepDebugging` is disabled or groups are filtered, calling `devdoot.debug()` immediately returns a frozen, pre-allocated `NOOP` logger. This prevents heavy heap allocations, string formatting, and CPU overhead in hot paths (capable of over **60+ million ops/sec**).
*   **🌲 Automatic Context Propagation**: Leverages `AsyncLocalStorage` to automatically link logs and child-spans to their parent traces. No need to pass logger or trace objects down the call stack!
*   **🔍 High-Density, Color-Coded Console Logging**: Structured output detailing `[LEVEL] [Group] Message [File:Line:Col] [+RelativeTime]` for instantaneous debugging at a glance.
*   **🏷️ Non-Invasive Grouping & Filtering**: Organize logs using `.group('name')` or env filters (`DEVDOOT_DEEP_DEBUG_GROUPS`) to only display logs for the modules you are currently debugging.
*   **📂 Organized Storage**: All telemetry data, traces, and crash reports are stored neatly in `storage/devdoot/` instead of cluttering your root directory.
*   **🚨 Automated Crash Reports**: Intercepts unhandled rejections and uncaught exceptions to automatically generate a rich JSON diagnosis dump including full execution traces, memory, CPU, OS, and package details.
*   **🔌 Built-in Integration Plugins**: Drop-in middleware/interceptors for Express, Axios (with distributed trace headers), and Playwright.
*   **🖥️ Interactive Web Viewer**: Inspect, filter, and trace the lifecycle of execution dumps in a beautiful tree-structured interactive dashboard.
*   **🛠️ Developer-First CLI**: Analyze crash reports, run diagnostic system checks (`doctor`), and extract active logging groups via the terminal.

---

## ⚖️ Winston vs. Devdoot

If you are wondering how `devdoot` compares to classic Node.js logging libraries like Winston, here is a quick breakdown of why you would choose `devdoot`:

| Feature | Winston (winston) | Devdoot |
| :--- | :--- | :--- |
| **Main Focus** | Multi-transport flat logging (Files, Database, Console). | Developer diagnostics, nested tracing, and crash reporting. |
| **Hierarchical Tracing** | ❌ **No.** Only logs flat, independent lines. | 🌲 **Yes.** Supports nested spans (`runTraced`) showing parent-child relationships. |
| **Context Propagation** | ❌ **No.** Requires manual parameter passing. | 🔗 **Automatic.** Uses `AsyncLocalStorage` to auto-propagate groups/traces. |
| **Production Overhead** | ⚠️ **Medium.** Logger calls execute formatting and transport layers. | ⚡ **Near-Zero.** Bypasses calls entirely via a frozen `NOOP` instance when disabled. |
| **Global Crash Handling** | ⚠️ **Basic.** Hard to configure correctly across multiple dependencies. | 🚨 **Advanced.** Deduplicated globally via process-level `Symbol` tracking. |
| **Interactive Viewer** | ❌ **No.** Requires setting up external ELK stacks or APMs. | 💻 **Yes.** Open `.txt` trace logs in a beautiful terminal viewer via CLI. |
| **Modern Integrations** | ❌ **No.** Requires writing custom wrapper libraries. | 🔌 **Yes.** Drop-in plugins for **Express**, **Axios**, and **Playwright**. |

---

## 📦 Installation

Install `devdoot` using your preferred package manager:

```bash
npm install devdoot
# or
yarn add devdoot
# or
pnpm add devdoot
```

---

## 📂 Examples Sub-Projects

For fully-configured, runnable projects showing how to integrate `devdoot` in real-world scenarios, check out the [uses-example](file:///d:/Projects/nodejs/automation/devdoot/uses-example) folder. It contains two isolated sub-folders:

### 1. [JavaScript Node.js Example](file:///d:/Projects/nodejs/automation/devdoot/uses-example/node-js)
Contains pure ES Module JavaScript examples:
- **`demo.js`**: Logging levels, groups, nested traces, and crash reporting.
- **`express-demo.js`**: HTTP middleware tracing.

### 2. [TypeScript Example](file:///d:/Projects/nodejs/automation/devdoot/uses-example/typescript)
Contains standard TypeScript examples utilizing type definitions and a compiler config (`tsconfig.json`):
- **`demo.ts`**: Logging levels, nested traces, and crash reporting.
- **`express-demo.ts`**: HTTP middleware tracing.
- **`axios-demo.ts`**: Cross-network trace header propagation.

To run any of the examples, navigate to the folder, install the NPM package, and start the demo:
```bash
cd uses-example/node-js # or cd uses-example/typescript
npm install
npm run demo
```

---

## 🚀 Quick Start

Here is a quick example showing how easily you can instrument your Node.js/TypeScript application:

```typescript
import devdoot, { runTraced, Devdoot } from 'devdoot';

// 1. Configure the logger
devdoot.configure({
  level: 'trace',
  saveTraces: true, // Write successful traces to storage/devdoot/traces/
  deepDebugging: true
});

// 2. Set an active group for the logger
devdoot.group('DatabaseModule');
devdoot.info('Connecting to the database...'); 
// Output: [INFO] [DatabaseModule] Connecting to the database... [examples/demo.ts:13:10] [+3ms]

// 3. Create nested execution traces with automatic context propagation
runTraced('MainJob', async (trace) => {
  trace.info('Starting MainJob process');
  
  // Call internal functions; they automatically inherit the parent trace and group!
  await performSubtask();
  
  trace.info('MainJob completed successfully');
});

async function performSubtask() {
  // Uses active context 'MainJob' automatically!
  devdoot.info('Performing nested database query'); 
}
```

See [examples/demo.ts](file:///D:/Projects/nodejs/automation/devdoot/examples/demo.ts) for a complete working showcase.

---

## 🚨 Global Process Event & Error Tracking (Recommended)

In production or large-scale environments, capturing unhandled exceptions, unhandled rejections, and system termination events is critical. `devdoot` provides a unified `register()` method to automatically hook into these process-level events.

When any of these events are triggered, `devdoot` automatically generates and writes a detailed JSON diagnostic report (including the error stack, active tracing contexts, and current system/process diagnostics) to the `storage/devdoot/reports/` directory.

> [!IMPORTANT]
> **Project-Level Usage:** This method should be called once at the root entry point of your application (e.g. `index.ts` or `server.ts`). Avoid calling this within library code.
>
> **Multi-Installation / Dependency Protection:** If `devdoot` is installed across multiple sub-dependencies, calling `register()` is completely idempotent and safe. It utilizes a global process-level `Symbol` to guarantee that each event handler is registered at most once, preventing duplicate logs/handlers.

```typescript
import devdoot from 'devdoot';

// Register all handlers at your app's entry point
devdoot.register({
  // Optionally customize what gets registered
  uncaughtException: true,
  unhandledRejection: true,
  beforeExit: true,        // Writes a report to disk upon process finish
  exit: true,              // Writes a report to disk upon process exit (if not already written)
  sigint: true,            // Writes a report to disk on Ctrl+C, then exits
  sigterm: true,           // Writes a report to disk on termination signal, then exits
  multipleResolves: true,  // Writes a report to disk on multiple promise resolves/rejections
  exitOnError: true        // when true, terminates the process on uncaughtException/unhandledRejection (default: true)
});
```

---

## 🛠️ Configuration

`devdoot` can be configured both **programmatically** and via **environment variables**.

### Programmatic Configuration

Configure the global logger or instantiate multiple isolated logger instances:

```typescript
import devdoot, { Devdoot } from 'devdoot';

// Configure the global instance
devdoot.configure({
  level: 'debug',
  format: 'json',
  deepDebugging: false,
  saveTraces: false
});

// Create an isolated logger instance with distinct settings
const customLogger = new Devdoot({
  level: 'error',
  format: 'json',
  outputDir: 'storage/custom-logs'
});
```

### Environment Variables

Environment variables take precedence and are automatically parsed:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DEVDOOT_ENABLED` | Enable or disable all logging (`true`/`false`). | `true` |
| `DEVDOOT_LEVEL` / `DEVDOOT_LOG_LEVEL` | Log levels (`trace`, `debug`, `info`, `warn`, `error`). | `info` (or `error` in prod) |
| `DEVDOOT_FORMAT` / `DEVDOOT_LOG_FORMAT` | Output format (`console`, `json`). | `console` (or `json` in prod) |
| `DEVDOOT_DEEP_DEBUGGING` | Enable deep debugging mode (`true`/`false`). | `false` |
| `DEVDOOT_DEEP_DEBUG_GROUPS` | Comma-separated list of group names to show in deep debugging. | All |
| `DEVDOOT_SAVE_TRACES` / `DEVDOOT_WRITE_TRACES` | Write successful traces as plain-text `.txt` files to `storage/devdoot/traces/` (`true`/`false`). | `false` |
| `DEVDOOT_IN_PROD` / `NODE_ENV` | Detects production environment. | `false` |
| `DEVDOOT_OUTPUT_DIR` | Base directory to save traces and crash reports. | `storage/devdoot` |

---

## 🔌 Integrations & Plugins

`devdoot` provides first-class, drop-in integration modules in `devdoot/plugins`. For implementation details, see [src/plugins/index.ts](file:///D:/Projects/nodejs/automation/devdoot/src/plugins/index.ts).

### Express Middleware
Automatically traces incoming HTTP requests, records routes, method, and attaches a response-finished logger hook.

```typescript
import express from 'express';
import { expressTrace } from 'devdoot/plugins';

const app = express();
app.use(expressTrace());
```

### Axios Interceptor
Propagates trace and span headers (`x-trace-id`, `x-span-id`) across network boundaries for distributed microservices tracing.

```typescript
import axios from 'axios';
import { axiosTrace } from 'devdoot/plugins';

const client = axios.create();
axiosTrace(client); // Automatically traces outbound calls and handles request/response
```

### Playwright Wrapper
Wraps automated browser actions inside trace spans to easily debug E2E testing workflows.

```typescript
import { playwrightTrace } from 'devdoot/plugins';

await playwrightTrace('SubmitLoginForm', async (trace) => {
  await page.fill('#username', 'devdoot');
  await page.click('#submit');
  trace.info('Login submitted');
});
```

---

## 💻 Command Line Interface (CLI)

`devdoot` includes a robust CLI to interact with diagnostic outputs and runtime performance.

```bash
# Verify system health and configuration
npx devdoot doctor

# List and summarize generated crash reports in the storage directory
npx devdoot report

# Scan saved trace files and list all unique discovered group names
npx devdoot groups

# Launch the interactive Web Viewer to inspect a specific trace or crash report
npx devdoot open storage/devdoot/reports/report-20260722-233008-466.txt
```

---

## 📂 Architecture

For the internal architectural details of context propagation, caller resolution, and file structures, see:
*   [src/config.ts](file:///D:/Projects/nodejs/automation/devdoot/src/config.ts): Handles options merging, default values, and environment variable parsing.
*   [src/logger.ts](file:///D:/Projects/nodejs/automation/devdoot/src/logger.ts): Implements log formatters, the high-performance `NOOP_LOGGER`, and the core `DevdootLogger` class (aliased to `Devdoot`).
*   [src/trace.ts](file:///D:/Projects/nodejs/automation/devdoot/src/trace.ts): Manages trace node trees, durations, and serialization to JSON.
*   [src/caller.ts](file:///D:/Projects/nodejs/automation/devdoot/src/caller.ts): Leverages stack traces to capture caller files and lines efficiently.

### System Diagnostics & Lifecycle Flow

```text
Application Starts
        │
        ▼
   Trace Created
        │
        ▼
   Context Created (AsyncLocalStorage)
        │
        ▼
   Operation Starts
        │
        ├──> Logs Recorded (with accurate File:Line and +ms delta)
        └──> Deep Debugging filter check
        │
        ▼
   Operation Ends (Calculates duration)
        │
        ▼
   Trace Completed (Saves plain text .txt if `saveTraces` is enabled)
        │
        ▼
   [Optional] Crash Report (auto-generated on uncaught exceptions/rejections)
```

---

## 🧪 Running Tests & Benchmarks

Run the test suite using `vitest`:

```bash
# Run unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

Running the benchmark test demonstrates the high efficiency of our zero-overhead design:

```bash
# Run the benchmark tests
npx vitest run tests/benchmark.test.ts
```

*Results:*
*   **1,000,000 disabled logs** completed in `~15ms` (~64,000,000 ops/sec).
*   **1,000,000 lazy callback checks** completed in `~16ms` (~61,000,000 ops/sec).

---

## 🎯 The Vision: Observability for the AI Era

Beyond being a lightweight, low-overhead Node.js library, `devdoot` is the foundation of a **broader open-source ecosystem** designed for modern AI-assisted engineering teams. We are actively developing a unified self-hosted platform written in Node.js to provide:

*   **Deep Observability for AI Systems**: A single dashboard to deeply track complex nested execution states, agent decisions, and hidden runtime errors in real-time.
*   **AI-Routed Issue Resolution**: Leveraging LLM intelligence to automatically analyze logs, determine which developer or team agent has the best defined "AI Skills" for a specific bug, and auto-route/create resolved issues/tickets accordingly.
*   **Agentic Framework Compatibility**: Native integrations with **OpenClaw** and other leading LLM agent frameworks to capture step-by-step thinking, tool usage, and prompt latencies.
*   **High Performance & Ultra-Low Footprint**: Standardized to consume minimal CPU and memory resources, keeping diagnostic overhead practically non-existent.

Our ultimate goal is to build the most helpful, performant logging, diagnostics, and analytics ecosystem for the next generation of software engineers and AI developers.

---

## 🗺️ Roadmap & Upcoming Features

`devdoot` is actively maintained and evolved. We are planning and adding new features day by day:

*   **🚨 Real-Time Production Crash Alerts**: Instant integration handlers to dispatch push alerts (via Webhooks, Slack, Discord, or Email) as soon as an `uncaughtException` or `unhandledRejection` is caught in production.
*   **🤖 AI-Powered Crash Diagnostics & Analytics**: Automatically process telemetry logs and error traces with local or remote AI models to pinpoint root causes, explain runtime contexts, and generate recommended fixes.
*   **🎫 Automated Issue & Ticket Creation**: Autogenerate bug issues and support tickets directly in your project management tools (**GitHub Issues**, **GitLab**, **Jira**, **Linear**) using configured APIs/webhooks whenever a fatal error is written.
*   **📺 Live CLI Log Tailer (`devdoot tail`)**: A terminal-based real-time log-streaming tailer with interactive key navigations, level filtering, and expandable nested tree views directly in the shell.
*   **📡 WebSockets/HTTP Telemetry Streaming**: Stream local `.txt` traces and crash reports dynamically to a remote central logging server or Web UI dashboard.
*   **🔌 Expanded ORM & Database Wrappers**: Out-of-the-box drop-in tracing plugins for popular database clients: **Prisma**, **Mongoose/MongoDB**, **redis**, and **pg** (PostgreSQL) to automatically capture SQL query performance, payload details, and error states.
*   **🌐 OpenTelemetry & W3C Compliance**: Exporters to format and send traces into standard collector formats (Jaeger, Zipkin, Honeycomb) so `devdoot` can plug into any existing enterprise observability pipeline.
*   **🧬 CPU/Memory Profile Dumps**: Dynamically attach a 5-second CPU Flamegraph or memory heap snapshot to crash reports to easily identify infinite loops or memory leaks on crash.
*   **🧵 Multi-Thread Propagation**: Fully support trace context propagation across Node.js `Worker Threads` and child processes.

---

## 🤝 Contributing

We are building a community around next-generation developer diagnostics and observability. If you want to contribute, **you are most welcome!** 

Whether it's writing new plugin integrations, optimizing trace collection performance, adding viewer enhancements, or correcting documentation, your pull requests and issues are highly appreciated. Feel free to open a PR or start a discussion!

---

## 📄 License

ISC License. Copyright (c) 2026.
