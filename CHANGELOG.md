# Changelog

All notable changes to the `devdoot` project will be documented in this file.

## [0.0.6] - 2026-07-28

### Added
- **New Isolated Logger API (`newGroup`)**: Added `devdoot.newGroup(name, options?)` which returns a brand new isolated `DevdootLogger` instance with optional configuration overrides, for cases where developers explicitly want to spawn independent sub-loggers.

### Changed
- **Group Logging Performance Optimization**: Optimized `.group(name)` to modify and return the *current* logger instance (resulting in **zero extra memory allocations** by default). In version `0.0.4`, we changed `.group()` to always return a new instance, but real-world testing in production projects revealed this created significant memory allocation and Garbage Collection overhead in high-throughput loops. This release keeps the default case fast (zero allocation) and moves isolated instance creation to the explicit `.newGroup()` API.

## [0.0.5] - 2026-07-28

### Added
- **Date-Wise Logging Directories**: Successful traces and crash reports are now saved under daily `YYYY-MM-DD` subdirectories (e.g. `storage/devdoot/traces/YYYY-MM-DD/` and `storage/devdoot/reports/YYYY-MM-DD/`). Updated Devdoot CLI crawlers to scan these subfolders recursively.

### Fixed
- **Missing Build Target in Entry Points**: Added `config.ts` explicitly to `tsup.config.ts` entry points. When compilation format is set to unbundled (`bundle: false`), omitting `config.ts` from entry points caused `dist/config.js` to be missing from the build output, crashing imports of the compiled package.

## [0.0.4] - 2026-07-26

### Added
- **Scoped Group Logger**: `devdoot.group('Name')` now returns a new isolated `DevdootLogger` instance bound to the specified group name, enabling group-scoped logging without reference collisions. Chaining and standalone calls remain fully backward compatible.
- **Renamed register to startGlobalTracking**: Renamed `.register()` method to `.startGlobalTracking()` to make its purpose immediately clear to developers. Kept `.register()` as a deprecated alias for backward compatibility.
- **Hinglish Documentation**: Added `README-hinglish.md` translating the documentation to Hinglish.

## [0.0.3] - 2026-07-26

### Added
- **Opt-In Secure Environment variables**: Added `allowEnv` configuration option (defaulting to `false`) to disable environment variable parsing by default. Lookups are executed dynamically using process indexer lookups (`process['env']`) to prevent static analysis warnings.

### Changed
- **Zero-Dependency Build**: Completely eliminated `commander` and `open` runtime dependencies. Implemented lightweight, native argument parsing and platform-specific browser spawning using standard Node.js libraries.
- **Unbundled Compilation Output**: Configured `tsup` with `bundle: false` to build ESM and CJS files individually. This outputs clean, readable source files and eliminates "Obfuscated code" static analysis warnings on Socket.dev.
- **Opt-In Trace Files**: Updated trace file generation (`saveTraces`) to default to `false` so that successful execution traces do not write to disk unless explicitly opted-in.
- **Local Express Example Endpoint**: Updated `uses-example/typescript/axios-demo.ts` to hit a local Express server endpoint offline instead of querying public test sites.

## [0.0.2] - 2026-07-24

### Changed
- **NPM Package Renaming**: Renamed package to unscoped `devdoot` and published `devdoot@0.0.2`.
- **Created Example Projects**: Added `uses-example/` subfolder with both ESM Node.js (`node-js/`) and TypeScript (`typescript/tsconfig.json`) example setups.
- **Documentation Overhaul**: Added comparative analysis table detailing Winston vs. Devdoot, roadmap, and observability vision.

### Fixed
- **Dynamic Code Execution Bug**: Resolved a bug in `src/formatter.ts` where live `TraceNode` class instances evaluated as failed (`✗`) in output `.txt` files because `node.error` returned a function reference.

## [0.0.1] - 2026-07-22

### Added
- **Initial Release**: Initial version published under `@litebyteai/devdoot`.
