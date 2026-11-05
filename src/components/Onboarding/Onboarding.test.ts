import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLanguage } from '../../i18n';
import { type OnboardingStep } from '../../types/onboarding';
import Onboarding from './Onboarding';

const renderStep = (startAtStep: OnboardingStep): string => renderToStaticMarkup(createElement(Onboarding, {
  isOpen: true,
  onComplete: vi.fn(),
  onEscapeToApiKeyPanel: vi.fn(),
  theme: 'light',
  onToggleTheme: vi.fn(),
  startAtStep,
}));

afterEach(async () => { await setLanguage('en'); });

describe('onboarding provider and skip controls', () => {
  it.each<OnboardingStep>(['welcome', 'explain', 'guide'])('offers skipping and another provider on %s', async (step) => {
    await setLanguage('en');
    const markup = renderStep(step);
    expect(markup).toContain('Skip for now');
    expect(markup).toContain('Use another AI provider');
  });

  it('explains separate DeepSeek billing and balance requirements', async () => {
    await setLanguage('en');
    const markup = renderStep('explain');
    expect(markup).toContain('DeepSeek API usage is billed separately.');
    expect(markup).toContain('Check your account balance');
    expect(markup).not.toContain('free tier');
  });

  it('guides DeepSeek setup in Chinese and keeps a later setup option', async () => {
    await setLanguage('zh-CN');
    const markup = renderStep('guide');
    expect(markup).toContain('打开 DeepSeek 开放平台');
    expect(markup).toContain('登录并创建 DeepSeek API 密钥');
    expect(markup).toContain('连接 DeepSeek');
    expect(markup).toContain('暂时跳过');
    expect(markup).toContain('稍后在设置中配置 AI');
    expect(markup).not.toContain('Google AI Studio');
  });

  it('finishes with the success action instead of a skip action', async () => {
    await setLanguage('en');
    const markup = renderStep('success');
    expect(markup).toContain('Start organizing');
    expect(markup).not.toContain('Skip for now');
  });
});
