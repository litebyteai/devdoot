# Devdoot Uses Example Project

This is a self-contained sub-project that demonstrates how to install, configure, and use `devdoot` in your Node.js/TypeScript applications.

It uses a local `file:..` reference to import the parent project directly, allowing you to run and inspect latest updates instantly without fetching from the npm registry.

---

## 📦 Setup & Installation

From this directory (`uses-example/`), install the dependencies:

```bash
npm install
```

---

## 🚀 Running Examples

We have provided three runnable demo scripts in `package.json`:

### 1. Basic Diagnostics & Tracing Demo
Demonstrates logging levels, non-invasive groupings (`.group()`), nested timing tracing (`runTraced`), and global exception diagnostics:
```bash
npm run demo
```

### 2. Express Server Middleware Tracing Demo
Demonstrates how `devdoot` automatically traces incoming HTTP request scopes and links route errors to crash reports:
```bash
npm run express
```

### 3. Axios Interceptor Network Propagation Demo
Demonstrates how `devdoot` intercepts outbound HTTP calls and propagates context headers (`x-trace-id`, `x-span-id`) across network boundaries for distributed systems tracing:
```bash
npm run axios
```

---

## 📂 Inspection
When you run these examples, `devdoot` automatically writes telemetry files to the `storage/` directory inside this sub-project:
* Completed traces will write to `storage/devdoot/traces/` as `.txt` files.
* Uncaught crash/shutdown reports will write to `storage/devdoot/reports/` as `.txt` files.

You can inspect any of these files directly or open them in the browser using the Devdoot Web Viewer:
```bash
npx devdoot open storage/devdoot/reports/report-<timestamp>.txt
```
