import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// React DOM ships generic innerHTML branches (including dangerouslySetInnerHTML)
// that this extension does not use. Keep React in its own vendor chunk and only
// allow these known linter warnings there; all application warnings still fail CI.
const result = spawnSync(process.execPath, [
  'node_modules/web-ext/bin/web-ext.js', 'lint', '--source-dir', 'dist/firefox', '--output', 'json',
], { encoding: 'utf8', env: { ...process.env, NO_UPDATE_NOTIFIER: '1' } });
if (result.error) throw result.error;
assert.equal(result.status, 0, result.stderr || result.stdout);
const report = JSON.parse(result.stdout);
const unexpectedWarnings = report.warnings.filter(warning =>
  warning.code !== 'UNSAFE_VAR_ASSIGNMENT' || !/^assets\/vendor-react-[\w-]+\.js$/.test(warning.file)
);
console.log(JSON.stringify({ ...report.summary, knownReactWarnings: report.warnings.length - unexpectedWarnings.length }, null, 2));
assert.equal(report.errors.length, 0, JSON.stringify(report.errors));
assert.equal(unexpectedWarnings.length, 0, JSON.stringify(unexpectedWarnings));
