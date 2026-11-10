import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('resource library cache busting', () => {
  it('points the resources page at fingerprinted library assets', () => {
    const html = readFileSync(path.join(rootDir, 'pages', 'resources.html'), 'utf8');
    expect(html).toMatch(/\/js\/resources\.[a-f0-9]{8}\.js/);
    expect(html).toMatch(/\/js\/resource-extras\.[a-f0-9]{8}\.js/);
    expect(html).toMatch(/\/css\/resource-extras\.[a-f0-9]{8}\.css/);
    expect(html).not.toContain('src="/js/resources.js"');

    const script = html.match(/\/js\/resources\.[a-f0-9]{8}\.js/)[0];
    const source = readFileSync(path.join(rootDir, script.slice(1)), 'utf8');
    expect(source).toMatch(/\.\/resource-library-model\.[a-f0-9]{8}\.mjs/);
    expect(source).toContain("fetch('/data/resource-library.json'");
  });

  it('reloads once when a newer service worker takes control and bypasses stale unhashed scripts', () => {
    const main = readFileSync(path.join(rootDir, 'js', 'main.js'), 'utf8');
    expect(main).toContain('const hadController = Boolean(navigator.serviceWorker.controller)');
    expect(main).toContain('controllerchange');
    expect(main).toContain('if (!hadController || refreshing)');

    const worker = readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
    expect(worker).toContain("const CACHE_VERSION = 'compass-static-v12'");
    expect(worker).toContain("cache: 'reload'");
    expect(worker).toContain('caches.match(\'/offline.html\')');
    expect(worker).toContain("requestUrl.pathname.startsWith('/assets/resources/')");
    const shell = worker.slice(0, worker.indexOf('function isContentHashed'));
    expect(shell).not.toContain('/js/resources');
    expect(shell).not.toContain('/assets/resources/');
  });
});
