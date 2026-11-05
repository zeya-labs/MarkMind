/** Verify a signed XPI using Firefox's own signature checks in a fresh profile.
 * Usage: node tools/verify-firefox-signature.mjs /path/to/addon.xpi [expected-version]
 * Optional FIREFOX_BINARY and GECKODRIVER environment variables.
 */
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

assert(process.argv[2], 'Provide the signed XPI path');
const xpi = resolve(process.argv[2]);
const expectedVersion = process.argv[3]
  ?? JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version;
const addonId = 'markmind@zeya-labs.github.io';
const output = resolve('test-results');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(resolve(output, 'signed-profile-'));
let driver;

async function start() {
  const options = new firefox.Options().addArguments('-headless', '-profile', profile)
    .setPreference('xpinstall.signatures.required', true);
  if (process.env.FIREFOX_BINARY) options.setBinary(process.env.FIREFOX_BINARY);
  const service = new firefox.ServiceBuilder(process.env.GECKODRIVER).addArguments('--allow-system-access');
  driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(service).build();
  await driver.manage().setTimeouts({ script: 15000 });
}

async function inspect() {
  await driver.setContext(firefox.Context.CHROME);
  const result = await driver.executeAsyncScript(`
    const id = arguments[0];
    const done = arguments[arguments.length - 1];
    const { AddonManager } = ChromeUtils.importESModule('resource://gre/modules/AddonManager.sys.mjs');
    AddonManager.getAddonByID(id).then(addon => done(addon ? {
      id: addon.id, version: addon.version, signedState: addon.signedState,
      expectedSignedState: AddonManager.SIGNEDSTATE_SIGNED,
      isActive: addon.isActive, appDisabled: addon.appDisabled,
      userDisabled: addon.userDisabled, temporarilyInstalled: addon.temporarilyInstalled,
      signaturesRequired: Services.prefs.getBoolPref('xpinstall.signatures.required'),
    } : null), error => done({ error: String(error) }));
  `, addonId);
  assert(result, 'Extension is missing');
  assert.equal(result.error, undefined);
  assert.equal(result.id, addonId);
  assert.equal(result.version, expectedVersion);
  assert.equal(result.signaturesRequired, true);
  assert.equal(result.signedState, result.expectedSignedState, 'Firefox must report SIGNEDSTATE_SIGNED');
  assert.equal(result.temporarilyInstalled, false);
  assert.equal(result.appDisabled, false);
  assert.equal(result.userDisabled, false);
  assert.equal(result.isActive, true);
  return result;
}

try {
  await start();
  assert.equal(await driver.installAddon(xpi, false), addonId);
  const initial = await inspect();
  console.log('PASS Mozilla signature and permanent installation', JSON.stringify(initial));
  await driver.quit();
  driver = undefined;

  // Reuse only the dedicated profile created above. No reinstall on this start.
  await start();
  const afterRestart = await inspect();
  console.log('PASS extension remains signed and active after Firefox restart');
  await writeFile(resolve(output, 'firefox-signature.json'), JSON.stringify({
    passed: true, browserVersion: (await driver.getCapabilities()).get('browserVersion'),
    initial, afterRestart,
  }, null, 2));
} finally {
  if (driver) await driver.quit();
}
