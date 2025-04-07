
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b7ecf88020bd46fc8a5dc2f12a72e483',
  appName: 'link-stash-pocket',
  webDir: 'dist',
  server: {
    url: "https://b7ecf880-20bd-46fc-8a5d-c2f12a72e483.lovableproject.com?forceHideBadge=true",
    cleartext: true
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
      }
    }
  }
};

export default config;
