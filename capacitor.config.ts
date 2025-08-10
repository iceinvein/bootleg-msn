import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.bootlegmsn.messenger',
  appName: 'Bootleg MSN Messenger',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0078d4',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true,
    },
    StatusBar: {
      style: 'LIGHT_CONTENT',
      backgroundColor: '#0078d4',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#0078d4',
      sound: 'beep.wav',
    },
    App: {
      launchUrl: '',
    },
    Haptics: {},
    Device: {},
    Filesystem: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      androidDatabaseLocation: 'default'
    },
    Share: {},
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0078d4',
    allowsLinkPreview: false,
    handleApplicationNotifications: false,
    preferredContentMode: 'mobile',
  },
  android: {
    backgroundColor: '#0078d4',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    minWebViewVersion: 60,
    appendUserAgent: 'BootlegMSNMessenger',
    overrideUserAgent: '',
    loggingBehavior: 'none',
    useLegacyBridge: false,
  },
};

export default config;
