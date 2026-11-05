import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHandleOnboardingSkip } from './handleOnboardingSkip';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('skipping onboarding', () => {
  it('persists completion without an API key and then opens the app', async () => {
    const onComplete = vi.fn();
    const setErrorMessage = vi.fn();
    let finishSave: () => void = () => {};
    const save = vi.fn().mockReturnValue(new Promise<void>(resolve => { finishSave = resolve; }));
    vi.stubGlobal('chrome', { storage: { local: { set: save } } });
    const skipping = createHandleOnboardingSkip({ onComplete, setErrorMessage })();
    expect(save).toHaveBeenCalledWith({ onboardingComplete: true, showOnboardingTooltips: false });
    expect(onComplete).not.toHaveBeenCalled();
    finishSave();
    await skipping;
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('keeps the onboarding open and reports an error when saving fails', async () => {
    const onComplete = vi.fn();
    const setErrorMessage = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('chrome', { storage: { local: { set: vi.fn().mockRejectedValue(new Error('Disk full')) } } });
    await createHandleOnboardingSkip({ onComplete, setErrorMessage })();
    expect(onComplete).not.toHaveBeenCalled();
    expect(setErrorMessage).toHaveBeenLastCalledWith('Could not save setup progress. Please try again.');
  });
});
