/** Real Firefox test. Selenium creates a fresh temporary profile, never the user's profile.
 * Run after build:firefox. Optional FIREFOX_BINARY / GECKODRIVER environment variables.
 * AI responses come from a local fixture server; no credentials or live AI are used.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const addonId = 'markmind@zeya-labs.github.io';
const uuid = 'c53c12de-15af-4a39-a516-4d847d621761';
const popupUrl = `moz-extension://${uuid}/src/popup.html`;
const output = resolve('test-results');
const requests = [];
let responseCount = 0;
let driver;
let responseDelay = 100;
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  if (req.url === '/v1/models') {
    res.end(JSON.stringify({ data: [{ id: 'fixture-model' }] })); return;
  }
  if (req.url !== '/v1/chat/completions') { res.writeHead(404).end('{}'); return; }
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw);
  requests.push(body);
  const prompt = body.messages.map(message => message.content).join('\n');
  const ids = [...prompt.matchAll(/\d+\. ID: ([^ |]+) \|/g)].map(match => match[1]);
  const answer = {
    folders: [{ path: '开发资料', description: '开发参考资料', isNew: true }],
    assignments: ids.map(bookmarkId => ({ bookmarkId, suggestedPath: '开发资料' })),
    summary: '已按主题整理，等待确认。',
  };
  setTimeout(() => {
    res.end(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(answer) } }] }));
    responseCount += 1;
  }, responseDelay);
});

const callExtension = (source, ...args) => driver.executeAsyncScript(`
  const done = arguments[arguments.length - 1];
  (async () => { ${source} })().then(result => done({ok: true, result}),
    error => done({ok: false, error: String(error)}));
`, ...args).then(value => {
  assert.equal(value.ok, true, value.error);
  return value.result;
});

const clickText = async text => {
  const button = await driver.wait(until.elementLocated(By.xpath(`//button[normalize-space(.)='${text}']`)), 10000);
  await driver.wait(until.elementIsEnabled(button), 10000);
  await button.click();
};
const waitText = text => driver.wait(async () =>
  (await driver.findElement(By.css('body')).getText()).includes(text), 15000, `Missing UI text: ${text}`);
const session = () => callExtension('return (await browser.storage.local.get("organizeSession")).organizeSession;');
const waitStatus = status => driver.wait(async () => (await session())?.status === status, 20000, `Expected ${status}`);
const screenshot = async name => writeFile(resolve(output, name), await driver.takeScreenshot(), 'base64');

await mkdir(output, { recursive: true });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/v1`;
try {
  const options = new firefox.Options().addArguments('-headless')
    .setPreference('intl.accept_languages', 'zh-CN,zh,en-US,en')
    .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: uuid }));
  if (process.env.FIREFOX_BINARY) options.setBinary(process.env.FIREFOX_BINARY);
  const service = new firefox.ServiceBuilder(process.env.GECKODRIVER).addArguments('--allow-system-access');
  const builder = new Builder().forBrowser('firefox').setFirefoxOptions(options).setFirefoxService(service);
  driver = await builder.build();
  await driver.manage().setTimeouts({ script: 15000 });
  await driver.manage().window().setRect({ width: 600, height: 900 });
  const installed = await driver.installAddon(resolve('dist/firefox'), true);
  assert.equal(installed, addonId);
  console.log('PASS temporary install in a fresh headless Firefox profile');

  // Grant only the local fixture origin in this disposable test profile.
  // The shipping extension requests custom origins from a user click in Settings.
  await driver.setContext(firefox.Context.CHROME);
  const granted = await driver.executeAsyncScript(`
    const done = arguments[arguments.length - 1];
    const { ExtensionPermissions } = ChromeUtils.importESModule('resource://gre/modules/ExtensionPermissions.sys.mjs');
    const extension = WebExtensionPolicy.getByID(arguments[0]).extension;
    ExtensionPermissions.add(arguments[0], { permissions: [], origins: ['http://127.0.0.1/*'] }, extension)
      .then(() => done(true), error => done(String(error)));
  `, addonId);
  assert.equal(granted, true);
  await driver.setContext(firefox.Context.CONTENT);
  await driver.get(popupUrl);
  await driver.wait(until.elementLocated(By.css('.language-selector select')), 10000);
  assert.equal(await driver.findElement(By.css('html')).getAttribute('lang'), 'zh-CN');
  await screenshot('firefox-onboarding-zh.png');
  console.log('PASS automatic Chinese language detection and initial onboarding');

  const fixtures = await callExtension(`
    const roots = (await browser.bookmarks.getTree())[0].children;
    for (const root of roots) {
      for (const child of root.children ?? []) await browser.bookmarks.removeTree(child.id);
    }
    const source = await browser.bookmarks.create({ parentId: 'menu________', title: '待整理/资料' });
    const destination = await browser.bookmarks.create({ parentId: 'toolbar_____', title: '工作资料' });
    const items = [];
    for (let i = 0; i < 3; i++) items.push(await browser.bookmarks.create({
      parentId: source.id, title: i === 2 ? '' : '开发书签 ' + i, url: 'https://example.org/item/' + i,
    }));
    await browser.bookmarks.create({ parentId: source.id, type: 'separator' });
    await browser.storage.local.set({
      onboardingComplete: true, onboardingTooltipsSeen: true,
      customBaseUrl: arguments[0], selectedService: 'custom', selectedModel: 'fixture-model',
      cachedModels_custom: { models: [{ id: 'fixture-model', name: 'Fixture model' }], timestamp: Date.now() },
    });
    return { source, destination, items };
  `, baseUrl);
  await driver.navigate().refresh();
  await clickText('整理');
  await clickText('扫描我的书签');
  await waitStatus('selecting');
  const scanned = await session();
  assert.equal(scanned.allBookmarks.length, 3, 'separator excluded; untitled bookmark included');
  assert.equal(scanned.defaultParentId, 'toolbar_____');
  assert(scanned.allBookmarks.every(item => item.currentFolderPath.includes('待整理\\/资料')));
  await driver.findElement(By.css('.organize-scan-destination .dropdown-trigger')).click();
  await driver.findElement(By.xpath('//button[contains(@class,"dropdown-option") and contains(.,"工作资料")]')).click();
  await driver.wait(async () => (await session()).destinationFolderId === fixtures.destination.id, 10000);
  await screenshot('firefox-scan-zh.png');
  console.log('PASS native bookmark scan, GUID roots, separator and blank title handling');

  // Close the popup while AI is in flight: the event page must finish the run.
  responseDelay = Number(process.env.FIREFOX_AI_DELAY_MS ?? 1200);
  await clickText('整理所选书签（3）');
  await driver.wait(() => requests.length > 0, 10000);
  await driver.get('about:blank');
  await driver.wait(() => responseCount > 0, responseDelay + 15000, 'Fixture AI did not respond');
  await driver.get(popupUrl);
  await clickText('整理');
  await waitStatus('reviewing_assignments');
  await waitText('执行 3 项移动');
  assert(requests[0].messages.some(message => /Simplified Chinese/.test(message.content)));
  const beforeApply = await callExtension('return await browser.bookmarks.get(arguments[0]);', fixtures.items.map(item => item.id));
  assert(beforeApply.every(item => item.parentId === fixtures.source.id), 'review must not move anything');
  await screenshot('firefox-review-zh.png');
  await clickText('执行 3 项移动');
  await waitStatus('completed');
  assert.equal((await session()).appliedCount, 3);
  const afterApply = await callExtension('return await browser.bookmarks.getSubTree(arguments[0]);', fixtures.destination.id);
  assert.equal(afterApply[0].children[0].title, '开发资料');
  assert.equal(afterApply[0].children[0].children.length, 3);
  assert.equal(afterApply[0].children[0].children.find(item => item.id === fixtures.items[2].id).title, '');
  await screenshot('firefox-complete-zh.png');
  console.log('PASS background AI, popup reopening, Chinese prompt, review-before-apply and scoped moves');

  await driver.findElement(By.css('.language-selector option[value="en"]')).click();
  await waitText('Home');
  assert.equal(await driver.findElement(By.css('html')).getAttribute('lang'), 'en');
  await driver.navigate().refresh();
  await waitText('Home');
  assert.equal(await driver.findElement(By.css('.language-selector select')).getAttribute('value'), 'en');
  await screenshot('firefox-home-en.png');
  const capabilities = await driver.getCapabilities();
  await writeFile(resolve(output, 'firefox-smoke.json'), JSON.stringify({
    passed: true, browserVersion: capabilities.get('browserVersion'),
    bookmarks: 3, aiRequests: requests.length, aiDelayMs: responseDelay,
    checks: ['temporary install', 'automatic Chinese', 'native bookmarks', 'destination selection',
      'background AI with popup closed', 'Chinese AI prompt', 'review before apply',
      'scoped moves', 'existing titles preserved', 'English switch and persistence'],
  }, null, 2));
  console.log('PASS English switch and persistence; Firefox smoke test complete');
} catch (error) {
  if (driver) {
    await screenshot('firefox-failure.png').catch(() => {});
    console.error(await driver.findElement(By.css('body')).getText().catch(() => 'No page text'));
  }
  throw error;
} finally {
  if (driver) await driver.quit();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
