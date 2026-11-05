import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLanguage } from '../../i18n';
import ApiKeyPanel from './ApiKeyPanel';

afterEach(async () => {
  await setLanguage('auto');
  vi.unstubAllGlobals();
});

describe('optional AI setup', () => {
  it('provides a return-home control before any API key has been configured', async () => {
    await setLanguage('en');
    vi.stubGlobal('chrome', { runtime: { getManifest: () => ({ version: 'test' }) } });
    const markup = renderToStaticMarkup(createElement(ApiKeyPanel, {
      isOpen: true,
      showWelcomeMessage: true,
      canClose: true,
      onClose: vi.fn(),
    }));
    expect(markup).toContain('title="Back to Home"');
    expect(markup).toContain('You can configure AI later in Settings.');
  });
});
