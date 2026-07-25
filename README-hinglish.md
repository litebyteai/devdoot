# Devdoot 🚀

High-performance developer diagnostics, execution tracing, aur global crash reporting engine Node.js ke liye.

---

📖 **Dusri languages me padhein:** 
- [🇬🇧 English](file:///d:/Projects/nodejs/automation/devdoot/README.md)

---

## Devdoot Kyun? 🤔

Hum sab development aur debugging ke waqt `console.log()`, `console.warn()`, aur `console.error()` use karte hain. Chote projects me ye theek chalta hai, par jaise hi project bada hota hai, hum ye bhool jaate hain ki:
* **Ye log humne add kyun kiya tha?**
* **Kis file me aur kis line par hai?**
* **Kya abhi bhi iski zaroorat hai?**

Production me code bhejne se pehle hum saare debug logs dhoondh-dhoondh kar remove karte hain. Phir jab naya bug aata hai, hum wahi process repeat karte hain.

**Devdoot** isi problem ko solve karne ke liye banaya gaya hai. Ye simple console logs ko replace karke developer-friendly diagnostics aur insights deta hai:

* 📍 **Exact Source Location:** Log ke saath file path, line number aur column dikhata hai. Supported terminals me ek click par seedhe source code me jump karo!
* ⏱️ **Execution Time Tracking:** Har log aur process ka time track karo taaki slow functions aur bottlenecks ka turant pata chale.
* 🏷️ **Log Groups & Tracing:** Apne logs ko modules aur categories me organize karo.
* ⚙️ **Performance Bypass:** Deep debugging disable hone par call fast return hoti hai (**60M+ ops/sec**), bina compile time cost ke code production me chalao.
* 📄 **Default Safe / Zero-Dependency:** Koi external dependencies nahi, by default **zero disk writes** aur **zero environment variable scanning**—taaki developer safe feel karein.

---

## 🚀 Quick Start & Integration Guides

Devdoot ko basic zero-config se lekar advanced deep-debugging tak 3 levels me use kiya jaa sakta hai:

### 1️⃣ Level 1: Out-of-the-Box (Zero-Config)
By default, Devdoot in-memory chalta hai aur seedhe console pe print karta hai. Ye **na toh koi file save karta hai** aur **na hi automatic environment variables scan karta hai**—perfect for high security & speed.

```typescript
import devdoot, { runTraced } from 'devdoot';

// Direct use karein!
devdoot.info('Hello from devdoot!');

// Scoped logging groups use karein
const billingLogger = devdoot.group('BillingService');
billingLogger.info('Invoice #1024 paid successfully.');

// Execution hierarchy track karne ke liye traces banayein
runTraced('MainJob', (trace) => {
  trace.info('Job start ho gaya');
  
  // Nested sub-tasks automatically parent trace se link ho jayenge
  runTraced('SubTask', (subTrace) => {
    subTrace.info('Database query chal rahi hai');
  });
});
```

### 2️⃣ Level 2: Opt-In Local Logging (Files aur Crash Reports)
Agar aap chahte hain ki success traces local file me save hon aur system crashes automatically capture ho kar files me store hon:

```typescript
import devdoot from 'devdoot';

// 1. Trace files save karne ke liye configure karein
devdoot.configure({
  saveTraces: true // Traces save honge storage/devdoot/traces/*.txt me
});

// 2. Global process listeners hook karein
// Uncaught Exceptions aur SIGINT/Exits par reports save karega
devdoot.register();
```

### 3️⃣ Level 3: Deep Debugging & Secure Env Scanning
Production ya heavy debugging sessions ke liye specific groups filter karein, deep debugging enable karein, aur securely environment variables load karne ka permission dein:

```typescript
import devdoot from 'devdoot';

devdoot.configure({
  level: 'trace',
  deepDebugging: true,
  deepDebugGroups: ['AuthSystem', 'DatabaseQuery'],
  outputDir: 'var/logs/devdoot',
  
  // SECURE OPT-IN:
  // process['env'] scan karne ki permission dein. 
  // Agar ye false (default) hai, toh koi environment variables read nahi honge.
  allowEnv: true
});
```

---

## 🛠️ Complete Configuration Reference

Devdoot ko programmatically configure kiya jaa sakta hai, ya environment variables se settings load ki jaa sakti hain (sirf tab jab `allowEnv: true` ho).

| Option | Env Variable | Default | Faida aur Security Context |
| :--- | :--- | :--- | :--- |
| **`allowEnv`** | *N/A* | `false` | **Security Toggle.** `false` hone par Devdoot `process['env']` ko touch bhi nahi karega. |
| **`saveTraces`** | `DEVDOOT_SAVE_TRACES` | `false` | Successful traces ko `.txt` file me write karta hai. |
| **`enabled`** | `DEVDOOT_ENABLED` | `true` | Devdoot logging aur diagnostic engine ko fully on/off karne ke liye. |
| **`level`** | `DEVDOOT_LEVEL` | `'info'` | Log filtering levels (`trace`, `debug`, `info`, `warn`, `error`). |
| **`format`** | `DEVDOOT_FORMAT` | `'console'` | Output format: human-readable `'console'` lines ya raw `'json'`. |
| **`deepDebugging`** | `DEVDOOT_DEEP_DEBUGGING` | `false` | `false` hone par `devdoot.debug()` seedhe ek `NOOP` freeze logger return karega jo **60M+ ops/sec** par chalta hai. |
| **`deepDebugGroups`** | `DEVDOOT_DEEP_DEBUG_GROUPS` | `All` | Sirf specific groups ke debug logs print karne ke liye. |
| **`outputDir`** | `DEVDOOT_OUTPUT_DIR` | `'storage/devdoot'` | Traces aur Crash Reports save karne ka root directory folder. |

---

## 🚨 Process Exit & Crash Monitoring (`devdoot.register()`)

Unhandled exceptions aur SIGINT (Ctrl+C) jaise events ko automatically handle aur log karne ke liye apne application ke entry point (e.g. `index.js` ya `server.js`) me isse ek baar call karein:

```typescript
import devdoot from 'devdoot';

devdoot.register({
  uncaughtException: true, // Fatal errors par report save karega aur exit karega
  unhandledRejection: true, // Promises ke unhandled rejections catch karega
  beforeExit: true,        // Application cleanly exit hone par report save karega
  exit: true,              // Process exit par report save karega
  sigint: true,            // Ctrl+C dabane par logs save karke safely exit karega
  sigterm: true,           // Server shutdown signal milne par log save karke exit karega
  exitOnError: true        // Exception aane par process ko exit karna hai ya nahi
});
```

> [!NOTE]
> **Deduplication Protection:** `register()` fully idempotent hai. Agar multiple sub-dependencies me alag-alag calls bhi ho jati hain, tab bhi global `Symbol` protection se har event handler sirf **ek hi baar** register hoga, preventing duplicate hooks.
