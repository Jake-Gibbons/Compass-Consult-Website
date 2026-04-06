import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, '..');
const docsDir = join(rootDir, 'assets', 'downloads', 'docs');

let timer = null;
let activeProcess = null;
let rerunRequested = false;

function runSync() {
  if (activeProcess) {
    rerunRequested = true;
    return;
  }

  console.log('[watch:resources] Running resource sync...');

  activeProcess = spawn(process.execPath, [join(scriptDir, 'sync-resources.mjs')], {
    cwd: rootDir,
    stdio: 'inherit'
  });

  activeProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('[watch:resources] Resource sync complete.');
    } else {
      console.error(`[watch:resources] Resource sync failed with exit code ${code}.`);
    }

    activeProcess = null;

    if (rerunRequested) {
      rerunRequested = false;
      runSync();
    }
  });
}

function scheduleSync(eventType, filename) {
  const label = filename ? `${eventType}: ${filename}` : eventType;
  console.log(`[watch:resources] Change detected (${label}).`);

  clearTimeout(timer);
  timer = setTimeout(runSync, 250);
}

console.log(`[watch:resources] Watching ${docsDir}`);
runSync();

watch(docsDir, (eventType, filename) => {
  scheduleSync(eventType, filename);
});