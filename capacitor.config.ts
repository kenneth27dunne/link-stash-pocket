import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.dunnewebsolutions.linkstash',
  appName: 'link-stash-pocket',
  webDir: 'dist',
  server: {
    cleartext: true
  },
  android: {
    // Enable AndroidXWebView for compatibility
    useLegacyBridge: false,
    webContentsDebuggingEnabled: true,
    allowMixedContent: true
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'linkstash',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: "Biometric login for LinkStash"
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: "Biometric login for LinkStash",
        biometricSubTitle: "Log in using your biometric"
      },
      electronIsEncryption: false,
      electronWindowsLocation: "C:\\ProgramData\\CapacitorDatabase",
      electronMacLocation: "/Volumes/Development_Lacie/Development/Databases",
      electronLinuxLocation: "Databases"
    },
    // Add App configuration to handle URL schemes
    App: {
      appUrlOpen: {
        android: {
          enabled: true,
        },
        ios: {
          enabled: true,
        }
      }
    }
  }
};

export default config;
