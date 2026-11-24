/**
 * MIIS Native Android (Capacitor) <-> Web PWA Hardware Bridge
 * ============================================================
 * Automatically uses native Android GNSS, Camera, and Network plugins when
 * packaged via Capacitor into a standalone harbour APK, while seamlessly
 * falling back to standard browser/PWA APIs with zero extra bundle dependencies.
 */

export function isNativeCapacitorApp() {
  return Boolean(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.());
}

export function getRuntimePlatformInfo() {
  if (isNativeCapacitorApp()) {
    return {
      platform: window.Capacitor.getPlatform?.() || 'android',
      mode: 'Native APK (Capacitor)',
      supportsBackgroundGnss: true,
      supportsDirectSmsIntent: true,
    };
  }
  return {
    platform: 'web-pwa',
    mode: 'Offline-First PWA',
    supportsBackgroundGnss: false,
    supportsDirectSmsIntent: true,
  };
}

/**
 * Request explicit native Android fine-location runtime permission before
 * initiating hardware satellite acquisition on Android 12–15 devices.
 */
export async function ensureNativeGnssPermissions() {
  if (!isNativeCapacitorApp()) return { granted: true, source: 'browser' };
  const geoPlugin = window.Capacitor?.Plugins?.Geolocation;
  if (!geoPlugin) return { granted: true, source: 'webview-fallback' };
  const status = await geoPlugin.checkPermissions();
  if (status.location === 'granted') return { granted: true, source: 'capacitor-native' };
  const req = await geoPlugin.requestPermissions();
  return { granted: req.location === 'granted', source: 'capacitor-native' };
}

/**
 * Launch native Android SMS composer pre-populated with the <130-char MIIS1
 * compact beacon packet (works offline with zero mobile data).
 */
export function openOffshoreSmsComposer(smsUri) {
  if (typeof window === 'undefined') return;
  window.location.href = smsUri;
}
