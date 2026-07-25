# 🚀 Devdoot — The Developer's Doot

### *High-Performance Developer Logger with AI Diagnostics, Tracing & Notification for Node.js.*

[![NPM Version](https://img.shields.io/npm/v/devdoot.svg?style=flat-square)](https://www.npmjs.com/package/devdoot)
[![License](https://img.shields.io/npm/l/devdoot.svg?style=flat-square)](https://github.com/litebyteai/devdoot/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/litebyteai/devdoot/test.yml?branch=main)](https://github.com/litebyteai/devdoot/actions)
---


## ⚡ See Devdoot in Action
Replace your existing `console.log()` with Devdoot and instantly get structured logs, source locations, execution timing, groups, and optional deep debugging.

```ts id="t86jhd"
import devdoot from 'devdoot';

devdoot.log('Application started');

const database = devdoot.group('Database');
const apiResponse = devdoot.group('ApiResponse');

database.log('Fetching users...');
database.info('100 records fetched', { count: 100 });

apiResponse.success('GET /api/users', { status: 200 });

// Only shown when deep debugging is enabled
database.debug().warn('Fetched user data', users);

database.error('Database connection failed', error);
```

Output:

```text id="e5jrku"
[LOG] Application started [src/index.ts:8:1] [+0ms]

[LOG] [Database] Fetching users... [src/database.ts:12:5] [+2ms]

[INFO] [Database] 100 records fetched { count: 100 } [src/database.ts:18:5] [+5ms]

[SUCCESS] [ApiResponse] GET /api/users { status: 200 } [src/api.ts:34:9] [+8ms]

[WARN] [Database] Fetched user data [..json] [src/database.ts:22:5] [+10ms]

[ERROR] [Database] Database connection failed Error: Connection refused [src/database.ts:52:5] [+15ms]
```

That's it.

No configuration.

No setup.

No boilerplate.

Replace `console.log()` with Devdoot and get structured logs, execution time, clickable source locations, groups, and optional deep debugging.


---


Devdoot brings **developer-friendly logging, execution tracing, diagnostics, runtime monitoring, report generation, and AI-assisted analysis** together in a single lightweight library. It helps developers understand **what happened, where it happened, when it happened, and why it failed**—while keeping runtime overhead as low as possible.


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

## Why Devdoot?

**Devdoot** is the **Developer's Doot**—a high-performance developer logger with intelligent diagnostics and tracing for Node.js.

Most Node.js developers use `console.log()`, `console.warn()`, and `console.error()` while developing and debugging. It works well for small projects, but as projects grow, developers often forget **why a log was added**, **where it was added**, or **whether it is still needed**. Before deploying to production, they have to search for and remove or comment out debug logs. When another bug appears, they repeat the same process by adding temporary logs again.

Devdoot was built to solve these common development problems. Instead of simple console logs, it provides developer-friendly logs with rich information, including:

* 📍 Exact source location (file, line, and column) with one-click **Go to Source** support in supported terminals and IDEs.
* ⏱️ Execution time for every log, trace, function, or module to quickly identify slow code.
* 🏷️ Log groups, tracing, and deep debugging to organize large applications.
* ⚙️ Enable or disable debugging with a single configuration change—no need to remove or comment out logs.
* 📄 Save logs and traces to files for later debugging and sharing.
* 📊 Generate detailed execution reports with errors, warnings, execution time, CPU usage, memory usage, process information, and runtime statistics.
* 📈 Compare reports from different runs to understand performance changes, new warnings, regressions, and optimizations.
* 🤖 AI-powered analysis to detect possible bugs, explain errors, recommend optimizations, and identify future risks.
* 🚨 Monitor production applications by automatically capturing unhandled exceptions, promise rejections, warnings, and other runtime events, then store reports and send notifications through email, webhooks, or other integrations.

I started building Devdoot more than **2 years ago** because I was spending too much time debugging my own Node.js projects. At first, it was only for my personal use, but after seeing how much time it saved, I decided to make it open source so every Node.js developer could benefit from it.

Devdoot is still growing. I have many more features planned, and I'm committed to continuously improving it by adding new capabilities, fixing issues, and making it one of the most useful developer tools for the Node.js ecosystem.

I recommend trying Devdoot once. I hope it helps you debug faster, better understand your application, and spend more time building features instead of chasing bugs.
 

## ✨ Why Developers Use Devdoot

### 1. Never Lose the Purpose of Your Logs *(🟢 Available)*

Most developers use `console.log()`, `console.warn()`, or `console.error()` while debugging.

After a few weeks or months, they often forget:

* Why was this log added?
* Is it still needed?
* Can I remove it?
* Did I leave debug logs in production?

In large projects, finding and cleaning old logs takes a lot of time.

Devdoot gives every log more useful information like the file name, line number, execution time, log level, module name, and trace details. In supported terminals and IDEs, you can click the file path to open the exact source code.

You can also turn deep debugging on or off with one configuration change instead of removing or commenting logs.

---

### 2. Know Which Code Takes Time *(🟢 Available)*

Sometimes an application feels slow, but it's hard to know which function or module is causing it.

Devdoot automatically shows how much time each log or operation takes.

Example:

```text
[INFO] [DatabaseFetch] Fetched 100 rows successfully [D:\Projects\nodejs\my-project\examples\demo.ts:67:13] [+5ms]
```

This helps you quickly find:

* Slow functions
* Slow modules
* Performance bottlenecks
* Whether your optimization really helped

No need to add timers everywhere.

---

### 3. Save Logs for Later *(🟢 Available)*

Terminal logs disappear after your application stops.

If you need to debug the same problem later, those logs are gone.

Devdoot can save logs and traces to files, so you can:

* Check old executions
* Investigate production issues
* Compare old logs
* Share logs with teammates

---

### 4. Show Logs Only for the Module You're Working On *(🟢 Available)*

Large applications can print thousands of logs.

Most of the time, you're working on only one module like `Database`, `Auth`, or `Payment`.

Devdoot lets you organize logs by **groups (modules)**.

By default, all logs work normally. If you're debugging only one module, you can show deep debugging logs only for that module.

```env
DEVDOOT_DEEP_DEBUG_GROUPS=Database
```

Now you'll only see deep debugging logs from the **Database** module.

Your terminal stays clean and you can focus on the code you're working on.

---

### 5. Detect Hidden Production Problems *(🟡 Partially Available)*

Some production errors happen silently.

For example:

* Uncaught Exceptions
* Unhandled Promise Rejections
* Process Warnings
* Process Exit Events

Developers may never know these problems happened.

Devdoot can automatically capture these events and save detailed reports to help you find the root cause.

Notifications like Email, Webhooks, Slack, and Discord are coming soon.

---

### 6. Generate Runtime Reports *(🚧 Under Development)*

Reading thousands of log lines is difficult.

Devdoot will generate simple reports that show:

* Errors
* Warnings
* Execution time
* CPU usage
* Memory usage
* Runtime information
* Module statistics

Instead of reading every log, you'll get a quick summary of what happened.

---

### 7. Compare Multiple Runs *(🚧 Under Development)*

Want to know if your latest update improved the application?

Devdoot will compare two or more reports and show things like:

* Performance changes
* Memory changes
* New warnings
* New errors
* Slower modules

This will make optimization much easier.

---

### 8. AI-Powered Log Analysis *(🚧 Under Development)*

Reading thousands of logs takes time.

Devdoot will use AI to:

* Find bugs
* Explain errors
* Suggest fixes
* Find slow code
* Recommend optimizations
* Summarize reports
* Predict possible future issues

This will help developers understand problems much faster.

---

### 🚀 More Features Are Coming

Devdoot started as my personal debugging tool.

I'm continuously adding new features based on real development problems.

The goal is simple:

**Spend less time debugging and more time building.**



## 📖 Documentation

The documentation is still a work in progress, but it already covers everything you need to get started with Devdoot.

As new features are added, we'll continue improving the documentation with better explanations, examples, and guides. We also try to keep the documentation structure and API usage consistent, so you won't need to relearn everything when new features are released.

Our goal is to make Devdoot easy to learn, easy to use, and easy to maintain.



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
## 💻 Command Line Interface (CLI) *(🚧 Beta)*

The current Devdoot CLI is in **beta**. It works and is ready to use, but we know it isn't the CLI experience we ultimately want.

The current version was built as the **first step** toward a much more modern, interactive, and developer-friendly CLI. We already have many improvements and new commands planned, but they will take time to build.

```bash
# Verify system health and configuration
npx devdoot doctor

# List generated crash reports
npx devdoot report

# List all discovered log groups
npx devdoot groups

# Open a saved report or trace
npx devdoot open storage/devdoot/reports/report-20260722-233008-466.txt
```

## 🌐 Web & API Report Panel *(🚧 Planned Add-on)*

The Web & API Report Panel is **not available yet**.

It is planned as an **optional add-on** for Devdoot, not a required part of the library. The core Devdoot package will remain lightweight and work independently without any web services.

In the future, developers will be able to decide whether they want to use the Web & API Report Panel or continue using Devdoot as a standalone library.

The planned add-on will provide features such as:

* Modern web-based report viewer
* Report comparison
* AI-powered log analysis
* Live log and trace viewer
* Search and filtering
* Performance analytics
* Team collaboration
* Remote monitoring
* REST APIs for automation and integrations

Our goal is to keep the core library simple, fast, and lightweight while offering a powerful optional platform for developers who need advanced reporting and observability features.

**Use only what you need.** If the core library is enough for your project, you never need to install or run the Web & API Report Panel.


## ⚡ Built to Stay Fast & Simple

One of the main goals of Devdoot is to keep the **core library as fast, lightweight, and simple as possible**.

We don't want the core package to become large or complex by including features that many developers may never use.

Instead, Devdoot is designed to support **optional add-ons**.

In the future, we'll release many add-ons to solve more advanced and complex development problems, such as AI analysis, web dashboards, remote monitoring, team collaboration, cloud reporting, and other powerful tools.

You only install the add-ons you need for your project. If you don't need a feature, you don't have to install it.

This keeps the core library small, fast, and stable for everyone.

We are committed to keeping the core API backward compatible. New features will mostly be added through optional add-ons, so upgrading Devdoot should not require changes to your existing project or break your current integration.



## ❤️ Open Source First

Devdoot started as a small tool for our own Node.js projects. We built it because we were spending too much time debugging, understanding old code, and solving the same development problems again and again.

Today, Devdoot is used in our own projects every day, and we'll continue improving it because it helps us build better software. Every new feature starts by solving a real problem we face ourselves before it becomes part of Devdoot.

Devdoot is being built by **Litebyte Innovations**, founded by **Ranjeet Kisaan**, an innovation startup based in **Bihar, India**.

Our goal is simple:

> **Build modern developer tools that solve real-world development problems while staying fast, lightweight, and open for everyone.**

We believe the **core library** should always remain lightweight, fast, and easy to use. As Devdoot grows, many advanced features will be released as **optional add-ons**, so you only install what your project actually needs. This keeps the core stable without affecting existing projects.

Some future add-ons may integrate with AI models or third-party services. When that time comes, developers will be free to choose how they use them—for example, with a local AI model or their own API keys. The core library will remain independent.

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

### Our Open Source Promise

* ✅ Open Source First
* ✅ Free Core Library
* ✅ Community Driven
* ✅ Developer First
* ✅ Lightweight & Fast
* ✅ Optional Add-ons
* ✅ Built to Solve Real Development Problems

Although Devdoot was started by us, **we don't consider it "our project" anymore.**

It belongs to the open-source community.

Our responsibility is to maintain it, improve it, review contributions, and guide its direction. But its real strength comes from the developers who use it, report bugs, suggest ideas, improve the documentation, and contribute code.

In other words, **we are the maintainers—but you are the owners of the community.**

Whether you contribute code, report an issue, suggest a feature, improve the documentation, or simply use Devdoot in your projects, you're helping shape its future.

Thank you for being part of this journey.

**Built by developers, with the community, for the community. ❤️**


---




## 🎯 Our Vision *(Long-Term)*

Devdoot started as a simple debugging library, but our long-term vision is much bigger.

We want to build an open-source ecosystem that helps developers understand, debug, monitor, and improve their applications more easily.

These ideas are **not promises or release commitments**. They are part of our long-term vision. Since Devdoot is developed in our free time, progress depends on available time and community contributions.

Some ideas we're exploring include:

* 🤖 AI-powered log and report analysis
* 📊 Modern web-based report dashboard
* 🔍 Advanced tracing and observability
* 🎫 Automatic issue and bug report generation
* 🚨 Production monitoring and smart alerts
* 🔌 More integrations with Node.js libraries and frameworks
* 🌐 OpenTelemetry compatibility
* 📡 Remote log and trace collection
* 🧠 AI-assisted debugging and optimization
* 👥 Team collaboration features

Some of these ideas may change, be replaced, or never be implemented. As the project grows, we'll prioritize features based on community feedback and real-world developer needs.

Our goal isn't to build the biggest logging library—it's to build one of the most helpful developer tools for Node.js.

---

## 🗺️ Roadmap

The roadmap is a list of features we're interested in building.

There is **no fixed timeline**. Features will be developed when we have time, when they're needed in our own projects, or when the open-source community contributes to them.

Current roadmap ideas include:

* 🚨 Real-time production crash alerts
* 🤖 AI-powered diagnostics
* 🎫 Automatic issue creation
* 📺 Modern interactive CLI
* 🌐 Web & API Report Panel
* 📡 Remote monitoring
* 🔌 More framework and database integrations
* 📊 Performance analytics
* 🧵 Worker Thread and multi-process tracing
* 🧠 AI-powered optimization suggestions

If you're interested in any of these features, we'd love your help.

---

## 🤝 Contributing

Devdoot is an open-source community project, and every contribution matters.

You can help by:

* 🐛 Reporting bugs
* 💡 Suggesting new features
* 📝 Improving documentation
* 🔧 Fixing bugs
* ✨ Building new features
* 🔌 Creating integrations and add-ons
* 💬 Joining discussions and sharing feedback

Even if you don't write code, your feedback helps make Devdoot better.

Devdoot is developed in our free time, so community contributions can make a huge difference. If you'd like to help shape the future of the project, we'd love to have you involved.

**Let's build something amazing together. ❤️**


## 📄 License

Devdoot is licensed under the **MIT License**.

You are free to use, modify, distribute, and contribute to the project under the terms of the MIT License.

Our goal is to build Devdoot as an **open-source, community-driven project**. Whether you use it in personal projects, commercial applications, or contribute improvements, you're always welcome.

If you find Devdoot useful, please consider:

* ⭐ Starring the project on GitHub
* 🐛 Reporting bugs
* 💡 Suggesting new ideas
* 🔧 Contributing code or documentation
* ❤️ Sharing it with other developers

Every contribution, no matter how small, helps make Devdoot better for the entire community.

**Copyright © 2026 Litebyte Innovations. All rights reserved under the MIT License.**
