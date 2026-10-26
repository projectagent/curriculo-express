import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = path.resolve(__dirname, '../../');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

describe('Tier 1: Static & Build Smoke Tests', () => {
  it('1.1 verifies npm.cmd run build exits with code 0 and creates dist directory', () => {
    // Run build smoke using the Windows command convention with sufficient timeout for Windows runner
    const buildCommand = process.platform === 'win32' ? 'npm.cmd run build' : 'npm run build';
    const output = execSync(buildCommand, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    expect(output).toBeDefined();
    expect(fs.existsSync(DIST_DIR)).toBe(true);
  }, 30000);

  it('1.2 verifies production index.html exists with required metadata and mount point', () => {
    const indexPath = path.join(DIST_DIR, 'index.html');
    expect(fs.existsSync(indexPath)).toBe(true);

    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('id="root"');
    expect(content).toContain('<meta charset="UTF-8"');
    expect(content).toContain('viewport');
    expect(content).toContain('Revisão Express');
  });

  it('1.3 verifies production bundle JS and CSS assets exist and are non-empty', () => {
    const assetsDir = path.join(DIST_DIR, 'assets');
    expect(fs.existsSync(assetsDir)).toBe(true);

    const assetFiles = fs.readdirSync(assetsDir);
    const jsFiles = assetFiles.filter((f) => f.endsWith('.js'));
    const cssFiles = assetFiles.filter((f) => f.endsWith('.css'));

    expect(jsFiles.length).toBeGreaterThanOrEqual(1);
    expect(cssFiles.length).toBeGreaterThanOrEqual(1);

    const mainJsSize = fs.statSync(path.join(assetsDir, jsFiles[0])).size;
    const mainCssSize = fs.statSync(path.join(assetsDir, cssFiles[0])).size;

    expect(mainJsSize).toBeGreaterThan(5000); // realistic bundle size
    expect(mainCssSize).toBeGreaterThan(1000);
  });

  it('1.4 verifies essential project configuration files exist with valid syntax', () => {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'tsconfig.node.json',
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.js',
      'index.html',
    ];

    for (const relFile of requiredFiles) {
      const fullPath = path.join(ROOT_DIR, relFile);
      expect(fs.existsSync(fullPath), `Expected file ${relFile} to exist`).toBe(true);
    }

    const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
    expect(pkgJson.name).toBe('revisao-express-mvp');
    expect(pkgJson.scripts).toHaveProperty('build');
    expect(pkgJson.scripts).toHaveProperty('dev');
    expect(pkgJson.scripts).toHaveProperty('test');
  });

  it('1.5 verifies TypeScript project references typecheck cleanly without emitting errors', () => {
    const tscCommand = process.platform === 'win32' ? 'npx.cmd tsc -b' : 'npx tsc -b';
    expect(() => {
      execSync(tscCommand, {
        cwd: ROOT_DIR,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    }).not.toThrow();
  }, 20000);
});
