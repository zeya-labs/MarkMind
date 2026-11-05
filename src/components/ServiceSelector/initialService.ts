import { DEFAULT_SERVICE_ID, SELECTED_SERVICE_STORAGE_KEY, SERVICES, isServiceConfigured } from '../../config/services';

export const resolveInitialServiceId = (stored: Record<string, unknown>): string => {
  const selected = stored[SELECTED_SERVICE_STORAGE_KEY];
  if (typeof selected === 'string' && Object.prototype.hasOwnProperty.call(SERVICES, selected)) {
    return selected;
  }
  // Older installs can have saved credentials without a selected provider.
  // Keep those usable rather than replacing them with the new default.
  return Object.values(SERVICES).find(service => isServiceConfigured(service, stored))?.id ?? DEFAULT_SERVICE_ID;
};
