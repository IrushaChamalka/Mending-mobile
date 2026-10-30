import Constants from 'expo-constants';

export interface AppInfo {
  /** Display name from app.config.ts. */
  readonly name: string;
  /**
   * Marketing version from app.config.ts, for example "1.0.0". The native build number would need
   * expo-application, which is not installed.
   */
  readonly version: string;
}

export const appInfo: AppInfo = {
  name: Constants.expoConfig?.name ?? 'StitchFlow',
  version: Constants.expoConfig?.version ?? '0.0.0',
};
