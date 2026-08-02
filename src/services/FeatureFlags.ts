/* FeatureFlags.ts */
import { Logger } from './Logger';

type FeatureFlag = 
  | 'voice-entry'
  | 'ocr-scanner'
  | 'whatsapp-sharing'
  | 'barcode-scanning'
  | 'offline-sync'
  | 'analytics-reports';

class FeatureFlagsService {
  private defaultFlags: Record<FeatureFlag, boolean> = {
    'voice-entry': true,
    'ocr-scanner': true,
    'whatsapp-sharing': true,
    'barcode-scanning': true,
    'offline-sync': true,
    'analytics-reports': true,
  };

  isEnabled(flag: FeatureFlag): boolean {
    // Allow local storage overrides for development/testing
    const localOverride = localStorage.getItem(`ff:${flag}`);
    if (localOverride !== null) {
      return localOverride === 'true';
    }

    const isEnabled = this.defaultFlags[flag] ?? false;
    return isEnabled;
  }

  setOverride(flag: FeatureFlag, value: boolean): void {
    localStorage.setItem(`ff:${flag}`, String(value));
    Logger.info(`FeatureFlags: Override set for "${flag}" = ${value}`);
  }

  clearOverride(flag: FeatureFlag): void {
    localStorage.removeItem(`ff:${flag}`);
    Logger.info(`FeatureFlags: Override cleared for "${flag}"`);
  }
}

export const FeatureFlags = new FeatureFlagsService();
