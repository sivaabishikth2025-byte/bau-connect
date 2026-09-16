import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.baustudentconnect.app",
  appName: "BAU Connect",
  webDir: "www",
  server: {
    // Live site — no redesign; native shell loads production
    url: "https://baustudentconnect.com",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "baustudentconnect.com",
      "*.baustudentconnect.com",
      "*.googleapis.com",
      "*.gstatic.com",
      "*.google.com",
      "*.firebaseapp.com",
      "*.firebaseio.com",
      "*.cloudinary.com",
      "accounts.google.com",
    ],
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#1C2D5A",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#1C2D5A",
      showSpinner: false,
      launchAutoHide: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1C2D5A",
    },
  },
};

export default config;
