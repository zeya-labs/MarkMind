import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SERVICES } from '../../config/services';
import { setLanguage } from '../../i18n';
import SetupGuide from './SetupGuide';

afterEach(async () => { await setLanguage('auto'); });

describe('provider-neutral setup guide', () => {
  it('explains the DeepSeek default while showing the selected provider', async () => {
    await setLanguage('en');
    const markup = renderToStaticMarkup(createElement(SetupGuide, {
      provider: SERVICES.openai, onClose: vi.fn(), onOpenProvider: vi.fn(),
    }));
    expect(markup).toContain('DeepSeek is selected by default');
    expect(markup).toContain('Open OpenAI');
    expect(markup).not.toContain('Open Google AI Studio');
    expect(markup).toContain('You can configure AI later in Settings.');
  });

  it('does not require an API key or a cloud account for local providers', async () => {
    await setLanguage('zh-CN');
    const markup = renderToStaticMarkup(createElement(SetupGuide, {
      provider: SERVICES.custom, onClose: vi.fn(), onOpenProvider: vi.fn(),
    }));
    expect(markup).toContain('连接本地或自定义服务商');
    expect(markup).toContain('仅在服务要求时填写 API 密钥');
    expect(markup).not.toContain('注册账号或登录');
  });
});
