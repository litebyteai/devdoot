import { defineConfig } from 'tsup';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
    plugins: 'src/plugins/index.ts',
    logger: 'src/logger.ts',
    trace: 'src/trace.ts',
    reporter: 'src/reporter.ts',
    diagnostics: 'src/diagnostics.ts',
    formatter: 'src/formatter.ts',
    time: 'src/time.ts',
    caller: 'src/caller.ts',
    context: 'src/context.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  bundle: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  onSuccess: async () => {
    // Cross-platform copy of viewer HTML into dist output
    const srcPath = path.resolve('src/viewer/index.html');
    const destDir = path.resolve('dist/viewer');
    const destPath = path.join(destDir, 'index.html');

    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
});
