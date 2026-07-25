# Changelog

All notable changes to the `devdoot` project will be documented in this file.

## [0.0.3] - 2026-07-26

### Added
- **Scoped Group Logger**: `devdoot.group('Name')` now returns a new isolated `DevdootLogger` instance bound to the specified group name, enabling group-scoped logging without reference collisions. Chaining and standalone calls remain fully backward compatible.
- **Opt-In Secure Environment variables**: Added `allowEnv` configuration option (defaulting to `false`) to disable environment variable parsing by default. Lookups are executed dynamically using process indexer lookups (`process['env']`) to prevent static analysis warnings.

### Changed
- **Zero-Dependency Build**: Completely eliminated `commander` and `open` runtime dependencies. Implemented lightweight, native argument parsing and platform-specific browser spawning using standard Node.js libraries.
- **Unbundled Compilation Output**: Configured `tsup` with `bundle: false` to build ESM and CJS files individually. This outputs clean, readable source files and eliminates "Obfuscated code" static analysis warnings on Socket.dev.
- **Opt-In Trace Files**: Updated trace file generation (`saveTraces`) to default to `false` so that successful execution traces do not write to disk unless explicitly opted-in.
- **Local Express Example Endpoint**: Updated `uses-example/typescript/axios-demo.ts` to hit a local Express server endpoint offline instead of querying public test sites.

### Fixed
- **Process Crash Logs**: Verified and restored crash report file writing when `devdoot.register()` is explicitly invoked by developers.
