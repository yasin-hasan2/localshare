export interface DeviceProfile {
  name: string;
  type: 'mobile' | 'tablet' | 'desktop';
  platform: 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'other';
  browser: string;
}

export function detectDevice(): DeviceProfile {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let platform: DeviceProfile['platform'] = 'other';
  let type: DeviceProfile['type'] = 'desktop';
  let browser = 'Browser';

  // Platform detection
  if (/iPad|iPhone|iPod/.test(ua)) {
    platform = 'ios';
    type = /iPad/.test(ua) ? 'tablet' : 'mobile';
  } else if (/Android/.test(ua)) {
    platform = 'android';
    type = /Mobile/.test(ua) ? 'mobile' : 'tablet';
  } else if (/Windows/.test(ua)) {
    platform = 'windows';
    type = 'desktop';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    platform = 'mac';
    type = 'desktop';
  } else if (/Linux/.test(ua)) {
    platform = 'linux';
    type = 'desktop';
  }

  // Browser detection
  if (/CriOS|Chrome/.test(ua) && !/Edg/.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox|FxiOS/.test(ua)) {
    browser = 'Firefox';
  } else if (/Edg/.test(ua)) {
    browser = 'Edge';
  }

  // Friendly name
  let name = 'Device';
  if (platform === 'ios') {
    name = type === 'tablet' ? 'iPad (Safari)' : 'iPhone (Safari)';
  } else if (platform === 'android') {
    name = `Android (${browser})`;
  } else if (platform === 'windows') {
    name = `Windows PC (${browser})`;
  } else if (platform === 'mac') {
    name = `Mac (${browser})`;
  } else {
    name = `${browser} Device`;
  }

  return { name, type, platform, browser };
}
