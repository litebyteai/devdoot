import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

describe('NPM Build & Package Resolution Test', () => {
  it('should build, package as a tarball, and run successfully in clean JS and TS projects', () => {
    const rootDir = path.resolve(__dirname, '..');
    
    // 1. Pack the project (generates devdoot-0.0.8.tgz)
    const packOutput = execSync('npm pack', { cwd: rootDir, encoding: 'utf8' }).trim();
    const tarballName = packOutput.split('\n').pop() || '';
    const tarballPath = path.resolve(rootDir, tarballName);
    
    expect(fs.existsSync(tarballPath)).toBe(true);

    try {
      // 2. Test in the JS client project
      const jsClientDir = path.resolve(rootDir, 'uses-example', 'npm-test', 'node-js');
      
      // Install the packed tarball locally in the CJS/ESM JS project
      execSync(`npm install ${tarballPath}`, { cwd: jsClientDir });
      
      // Run the client demo script and capture output
      const runJsOutput = execSync('npm run demo', { cwd: jsClientDir, encoding: 'utf8' });
      expect(runJsOutput).toContain('=== Running Devdoot JS from NPM Registry ===');
      expect(runJsOutput).toContain('JS App started successfully.');
      expect(runJsOutput).toContain('Connected to JS DB Instance.');

      // 3. Test in the TS client project
      const tsClientDir = path.resolve(rootDir, 'uses-example', 'npm-test', 'typescript');
      
      // Install the packed tarball locally in the TS project
      execSync(`npm install ${tarballPath}`, { cwd: tsClientDir });
      
      // Run the client demo script and capture output
      const runTsOutput = execSync('npm run demo', { cwd: tsClientDir, encoding: 'utf8' });
      expect(runTsOutput).toContain('=== Running Devdoot TS from NPM Registry ===');
      expect(runTsOutput).toContain('TS App started successfully.');
      expect(runTsOutput).toContain('Connected to TS DB Instance.');

    } finally {
      // 4. Cleanup generated tarball
      if (fs.existsSync(tarballPath)) {
        fs.unlinkSync(tarballPath);
      }
    }
  }, 30000);
});
