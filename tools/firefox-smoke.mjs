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

  await clickText('暂时跳过');
  await waitText('尚未配置 AI');
  assert.equal(await driver.findElements(By.css('.api-key-panel.active')).then(items => items.length), 0);
  let stored = await callExtension('return await browser.storage.local.get(null);');
  assert.equal(stored.onboardingComplete, true);
  assert.equal(stored.deepseekApiKey, undefined);
  await driver.navigate().refresh();
  await waitText('尚未配置 AI');
  await screenshot('firefox-skipped-home-zh.png');
  await driver.findElement(By.css('button[title="设置"]')).click();
  await waitText('DeepSeek API 密钥');
  await driver.findElement(By.css('button[title="返回首页"]')).click();
  await waitText('尚未配置 AI');
  assert.equal(await driver.findElements(By.css('.api-key-panel.active')).then(items => items.length), 0);
  assert.equal(requests.length, 0, 'Skipping and opening settings must not call AI');
  console.log('PASS skip persists, unconfigured home is usable, default DeepSeek settings can close');

  // Model validation is mocked only in this disposable popup. No live API key
  // or shipping code interception; provider request/JSON contracts have unit tests.
  await callExtension('await browser.storage.local.clear();');
  await driver.navigate().refresh();
  await clickText('开始使用');
  await waitText('DeepSeek');
  await clickText('查看设置步骤');
  await waitText('连接 DeepSeek');
  await screenshot('firefox-deepseek-guide-zh.png');
  await driver.executeScript(`
    const originalFetch = window.fetch.bind(window);
    window.deepseekModelRequests = [];
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.startsWith('https://api.deepseek.com/')) {
        window.deepseekModelRequests.push({ url, authorization: init?.headers?.Authorization });
        if (url !== 'https://api.deepseek.com/models') throw new Error('Unexpected live AI request');
        return Promise.resolve(new Response(JSON.stringify({ data: [
          { id: 'deepseek-fixture-flash', name: 'DeepSeek fixture' }
        ] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return originalFetch(input, init);
    };
  `);
  const fakeKey = 'sk-fixture-deepseek-not-a-real-key';
  await driver.findElement(By.css('.onboarding-input-section input')).sendKeys(fakeKey);
  await clickText('连接 DeepSeek');
  await waitText('设置完成！');
  stored = await callExtension('return await browser.storage.local.get(null);');
  assert.equal(stored.selectedService, 'deepseek');
  assert.equal(stored.selectedModel, 'deepseek-fixture-flash');
  assert.equal(stored.deepseekApiKey, fakeKey);
  assert.deepEqual(await driver.executeScript('return window.deepseekModelRequests;'), [
    { url: 'https://api.deepseek.com/models', authorization: `Bearer ${fakeKey}` },
  ]);
  await clickText('开始整理');
  await waitText('首页');
  assert(!(await driver.findElement(By.css('body')).getText()).includes('尚未配置 AI'));
  console.log('PASS DeepSeek onboarding validates models and persists provider/key/model');

  const fixtures = await callExtension(`
    await browser.storage.local.clear();
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

  await clickText('整理所选书签（3）');
  await waitText('DeepSeek API 密钥');
  assert.equal(requests.length, 0, 'Unconfigured bulk action should open Settings');
  await driver.findElement(By.css('button[title="返回首页"]')).click();
  await waitText('整理所选书签（3）');
  assert.equal((await session()).destinationFolderId, fixtures.destination.id);
  assert.equal((await session()).status, 'selecting');
  console.log('PASS scan works without a key; settings round-trip preserves selection/destination');

  await callExtension(`
    await browser.storage.local.set({
      customBaseUrl: arguments[0], selectedService: 'custom', selectedModel: 'fixture-model',
      selectedModel_custom: 'fixture-model',
      cachedModels_custom: { models: [{ id: 'fixture-model', name: 'Fixture model' }], fetchedAt: Date.now() },
    });
  `, baseUrl);
  await driver.findElement(By.css('button[title="设置"]')).click();
  await waitText('自定义');
  await driver.findElement(By.css('button[title="返回"]')).click();
  await waitText('整理所选书签（3）');
  stored = await callExtension('return await browser.storage.local.get(["selectedService", "selectedModel"]);');
  assert.equal(stored.selectedService, 'custom', 'Existing provider must not be overwritten by new default');
  assert.equal(stored.selectedModel, 'fixture-model');

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
      'skip onboarding and persistence', 'unconfigured home and closable settings', 'DeepSeek default provider',
      'DeepSeek key and model validation', 'unconfigured scan', 'selection survives settings', 'existing provider preserved',
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
