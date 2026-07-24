# 🚀 Devdoot

### *The Intelligent, High-Performance Developer Diagnostics & Tracing Engine for Node.js*

[![NPM Version](https://img.shields.io/npm/v/devdoot.svg?style=flat-square)](https://www.npmjs.com/package/devdoot)
[![License](https://img.shields.io/npm/l/devdoot.svg?style=flat-square)](https://github.com/litebyteai/devdoot/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/litebyteai/devdoot/test.yml?branch=main)](https://github.com/litebyteai/devdoot/actions)

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

## 🚀 Quick Start & Integration Guides

`devdoot` can be integrated from a basic zero-config setup up to advanced deep-diagnostics configurations. Here are the three main integration paths:

### 1️⃣ Level 1: Out-of-the-Box (Zero-Config)
By default, `devdoot` runs completely in-memory and outputs straight to the terminal. It writes **zero files to disk** and does **zero environment variable lookups** automatically—giving you maximum security and performance.

```typescript
import devdoot, { runTraced } from 'devdoot';

// Start using immediately!
devdoot.info('Hello from devdoot!');

// Use groups to filter/organize logs dynamically
devdoot.group('BillingService').info('Invoice #1024 paid.');

// Create traces to track execution hierarchy and latencies
runTraced('MainJob', (trace) => {
  trace.info('Job started');
  
  // Sub-tasks automatically link to this parent trace!
  runTraced('SubTask', (subTrace) => {
    subTrace.info('Performing work');
  });
});
```

### 2️⃣ Level 2: Opt-In Local Logging (Files)
Enable filesystem log output and automated crash reporting. Under this setup, successful execution traces are written to disk, and process crashes are preserved as detailed `.txt` diagnostics.

```typescript
import devdoot from 'devdoot';

// 1. Enable local trace saving to files
devdoot.configure({
  saveTraces: true // Writes completed traces to storage/devdoot/traces/*.txt
});

// 2. Register process-level event monitoring
// Saves detailed reports to storage/devdoot/reports/ on exit, SIGINT, or crash.
devdoot.register();
```

### 3️⃣ Level 3: Deep Debugging & Secure Opt-In Env loading
For large production environments or active debug sessions, you can enable deep debugging, filter by specific logging groups, and securely opt-in to loading configs from environment variables.

```typescript
import devdoot from 'devdoot';

devdoot.configure({
  level: 'trace',
  deepDebugging: true,
  deepDebugGroups: ['AuthSystem', 'DatabaseQuery'],
  outputDir: 'var/logs/devdoot',
  
  // SECURE OPT-IN:
  // Allow Devdoot to securely look up environment configs from process['env'].
  // If false (default), environment lookups are disabled for maximum security.
  allowEnv: true
});
```

---

## 🛠️ Complete Configuration Reference

`devdoot` properties can be configured programmatically or securely loaded from environment variables (when `allowEnv: true` is configured).

### Configuration Options & Env Variables

| Programmatic Option | Env Variable | Default | Benefit & Security Context |
| :--- | :--- | :--- | :--- |
| **`allowEnv`** | *N/A* | `false` | **Security Toggle.** If `false`, `devdoot` never accesses `process['env']`, preventing env scanning. |
| **`saveTraces`** | `DEVDOOT_SAVE_TRACES` | `false` | Writes successful traces to `.txt` files. Keeps production clean when disabled. |
| **`enabled`** | `DEVDOOT_ENABLED` | `true` | Quickly turn off all logger formatting and telemetry hooks. |
| **`level`** | `DEVDOOT_LEVEL` | `'info'` | Filters log statements (`trace`, `debug`, `info`, `warn`, `error`). |
| **`format`** | `DEVDOOT_FORMAT` | `'console'` | Outputs log files as human-friendly `'console'` terminal lines or raw `'json'`. |
| **`deepDebugging`** | `DEVDOOT_DEEP_DEBUGGING` | `false` | Performance bypass. When `false`, calling `devdoot.debug()` returns a frozen `NOOP` instance (running at **60M+ ops/sec**). |
| **`deepDebugGroups`** | `DEVDOOT_DEEP_DEBUG_GROUPS` | `All` | Filters debug logs to only show specific group logs. |
| **`outputDir`** | `DEVDOOT_OUTPUT_DIR` | `'storage/devdoot'` | Destination folder for local traces and crash reports. |

---

## 🚨 Process Exit & Crash Monitoring (`devdoot.register()`)

To automatically catch and log production crashes (`uncaughtException`, `unhandledRejection`, `SIGINT`, etc.) and output structured diagnostics, call `register()` once at the root entry point of your application (e.g. `index.js` or `server.js`).

```typescript
import devdoot from 'devdoot';

// Hook process listeners
devdoot.register({
  uncaughtException: true, // Generate diagnosis report and exit on uncaught errors
  unhandledRejection: true, // Handle unhandled promise rejections
  beforeExit: true,        // Save summary report upon clean process termination
  exit: true,              // Save summary report on standard process exit
  sigint: true,            // Save report on Ctrl+C (SIGINT), then exit
  sigterm: true,           // Save report on termination signal (SIGTERM), then exit
  exitOnError: true        // Terminate process when fatal exceptions are caught
});
```

> [!NOTE]
> **Global Deduplication Protection:** `register()` is completely idempotent. If called in multiple places (or in separate dependency installations), it uses a global `Symbol` to register each handler exactly once, preventing duplicate event hooks or memory leaks.

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
