import { describe, expect, it } from 'vitest';
import { resolveInitialServiceId } from './initialService';

describe('initial AI provider selection', () => {
  it('defaults to DeepSeek when configuration was skipped', () => {
    expect(resolveInitialServiceId({})).toBe('deepseek');
  });

  it('preserves an existing selection instead of forcing the default', () => {
    expect(resolveInitialServiceId({ selectedService: 'openai', openaiApiKey: 'existing-key' })).toBe('openai');
    expect(resolveInitialServiceId({ selectedService: 'custom', customBaseUrl: 'http://localhost:11434/v1' })).toBe('custom');
    expect(resolveInitialServiceId({ selectedService: 'google' })).toBe('google');
  });

  it('recovers existing credentials when an old install has no valid selection', () => {
    expect(resolveInitialServiceId({ selectedService: 'removed-provider', anthropicApiKey: 'existing-key' })).toBe('anthropic');
    expect(resolveInitialServiceId({ customBaseUrl: 'http://localhost:11434/v1' })).toBe('custom');
  });
});
