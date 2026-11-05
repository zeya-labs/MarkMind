import { describe, it, expect } from 'vitest';
import { DEFAULT_SERVICE_ID, SERVICES, getService, getServiceCredentialKeys, isServiceConfigured } from './services';

describe('DeepSeek service configuration', () => {
  it('defaults new or unknown selections to DeepSeek while keeping valid existing providers', () => {
    expect(DEFAULT_SERVICE_ID).toBe('deepseek');
    expect(getService('')).toBe(SERVICES.deepseek);
    expect(getService('google')).toBe(SERVICES.google);
    expect(getService('openai')).toBe(SERVICES.openai);
    expect(getService('custom')).toBe(SERVICES.custom);
  });

  it('keeps its credentials separate and requires a cloud API key', () => {
    expect(getServiceCredentialKeys(SERVICES.deepseek)).toEqual(['deepseekApiKey']);
    expect(SERVICES.deepseek.helpLink).toBe('https://platform.deepseek.com/api_keys');
    expect(SERVICES.deepseek.validateKey('')).toBe(false);
    expect(isServiceConfigured(SERVICES.deepseek, { deepseekApiKey: 'sk-test-1234567890abcdef' })).toBe(true);
    expect(isServiceConfigured(SERVICES.deepseek, { geminiApiKey: 'another-provider-key' })).toBe(false);
  });
});

describe('isServiceConfigured', () => {
  it('treats Custom with a base URL and no key as configured (Ollama, LM Studio)', () => {
    expect(isServiceConfigured(SERVICES.custom, {
      customApiKey: '',
      customBaseUrl: 'http://127.0.0.1:11434/v1',
    })).toBe(true);
  });

  it('treats Custom without a base URL as not configured', () => {
    expect(isServiceConfigured(SERVICES.custom, { customApiKey: 'sk-something' })).toBe(false);
  });

  it('still requires a key for cloud providers', () => {
    expect(isServiceConfigured(SERVICES.openai, { openaiApiKey: '' })).toBe(false);
    expect(isServiceConfigured(SERVICES.openai, { openaiApiKey: 'sk-1234567890abcdefghij' })).toBe(true);
  });

  it('reads the base URL key only for providers that have one', () => {
    expect(getServiceCredentialKeys(SERVICES.custom)).toEqual(['customApiKey', 'customBaseUrl']);
    expect(getServiceCredentialKeys(SERVICES.google)).toEqual(['geminiApiKey']);
  });
});
